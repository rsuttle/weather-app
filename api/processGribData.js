const {spawn} = require("child_process");
const util = require("util");
const fs = require('fs');
const d3contour = require("d3-contour");
const d3 = require("d3-geo")
const rewindGeojson = require("@mapbox/geojson-rewind");
const readFileContent = util.promisify(fs.readFile);
var simplify = require("simplify-geojson");

const {insertToDatabase,deleteFromDatabase,replaceInDatabase} = require("./database");
const { start } = require("repl");

var globalHeight = 49;
var globalWidth = 61;

/**
 * Processes the data.
 */
const processGribData = () =>{
    extractDataFromFiles();
}

/**
 * Spawns python script to extract the temperature data from the grib files. 
 */
const extractDataFromFiles = () => {
  
    //Executes python script
    var python = spawn('/home/ryan/miniconda3/envs/weatherApp/bin/python3.8', ['./gribProcessing/gribscript.py'], {silent:true});
  
    python.stderr.on('data', (d) => {
      console.log("python stderr: " + d);
    })
  
    python.stdout.on('data', (d) => {
      console.log("python stdout: " + d);
    })
  
    python.stdin.on('data', (d) => {
      console.log("python stdin: " + d);
    })
  
    python.stdin.on('error', (d) => {
      console.log("python error: " + d);
    })
  
    python.on('exit', (code) => {
      console.log(`child process close all stdio with code ${code}`);
      processData();
    });
  
}


/**
 * Reads in file of 2d data arrays, then sends them through processing pipeline.
 */
const processData = async () => {
  
  const NUM_INTERPOLATED_FRAMES = 15;

  var finalDataList = [];
  var startTime = null;

  //Determine start time based on when the function runs (EDT)
  var currentHour = new Date().getHours();
  if(currentHour>=0 && currentHour<2){
    //Use yesterday's 12z run, which begins yesterday at 8am ET
    startTime = new Date().setHours(8,0,0,0);
    startTime.setDate(startTime.getDate()-1);
  }else if (currentHour>=2 && currentHour<=14){
    //Use today's 0z run, which begins yesterday at 8pm ET
    startTime = new Date().setHours(20,0,0,0);
    startTime.setDate(startTime.getDate()-1);
  } else {
    //Use today's 12z run, which begins today at 8am ET
    startTime = new Date().setHours(8,0,0,0);
  }
  
  try{
    var temperatureData = await readFileContent("../temperatureData.json","utf8")
  }catch(err){
    console.log(err)
  }
  
  temperatureData = JSON.parse(temperatureData);
  
  //Convert each row of 2d array into Fahrenheit, and flip to correct orientation
  for(let i = 0; i < temperatureData.length; i++){
    temperatureData[i] = convertKelvinToFahrenheit(temperatureData[i]);
    temperatureData[i] = flipDataVertically(temperatureData[i]);
  }

  var dataList = [];
  for(let i = 0; i < temperatureData.length-1; i++){
    var interpolatedData = interpolateX(temperatureData[i],temperatureData[i+1],NUM_INTERPOLATED_FRAMES)
    for(let j = 0; j < interpolatedData.length; j++){
      dataList.push(interpolatedData[j]);
    }
    
  }
  dataList.push(temperatureData[temperatureData.length-1]);
  

  
  for(let i = 0; i < dataList.length; i++){
    var blurredTemperatureData = gaussianBlur(dataList[i]);
    var convertedTemperatureData = convertPixelstoGeoJson(blurredTemperatureData);
    var fixedWindingOrder = rewindGeojson(convertedTemperatureData, true);
    var simplified = simplify(fixedWindingOrder, .005);
    var projected = projectGeojsonToPlanar(simplified);
    var truncated = truncateGeojsonCoordinates(projected);
    
    finalDataList.push(truncated);
  }
  
  var output = {};
  output["dataFrames"] = finalDataList;
  output["startTime"] = startTime;
  output["numInterpolatedFrames"] = NUM_INTERPOLATED_FRAMES;

  try{
    await replaceInDatabase({},output);
  }catch (err){
    console.log("Database insert/delete error: ", err);
  }finally{
    finalDataList = [];
  }
  
  
}

/**
 * Applies a Gaussian blur to 2d array of numbers, and returns a 1d blurred array.
 * @param {object} image A 2d array of numbers.
 * @returns The inputted array, blurred and flattened to 1d.
 */
const gaussianBlur = (image) => {
    //st dev = 4, kernel size = 5
    const filter = [0.187691, 0.206038, 0.212543, 0.206038, 0.187691];
  
    //Horizontal blur
    var blurredImage = [];
    for (let row = 0; row < image.length; row++) {
      let blurredRow = [];
      for (let col = 0; col < image[row].length; col++) {
        let newVal = 0;
        for (let offset = -2; offset <= 2; offset++) {
          if (col + offset > 0 && col + offset < image[row].length) {  //in bounds
            newVal += image[row][col + offset] * filter[offset + 2];
          }
        }
        blurredRow.push(newVal);
        newVal = 0;
      }
      blurredImage.push(blurredRow);
      blurredRow = [];
    }
  
    //Vertical blur
    var blurredImageTwo = [];
    for (let col = 0; col < blurredImage[0].length; col++) {
      let blurredCol = [];
      for (let row = 0; row < blurredImage.length; row++) {
        let newVal = 0;
        for (let offset = -2; offset <= 2; offset++) {
          if (row + offset > 0 && row + offset < blurredImage.length) {  //in bounds
            newVal += blurredImage[row + offset][col] * filter[offset + 2];
          }
        }
        blurredCol.push(newVal);
        newVal = 0;
      }
      blurredImageTwo.push(blurredCol);
      blurredCol = [];
    }
  
    //Rotate image back to original orientation
    var blurredImageFinal = [];
    for (let col = 0; col < blurredImageTwo[0].length; col++) {
  
      for (let row = 0; row < blurredImageTwo.length; row++) {
  
        blurredImageFinal.push(blurredImageTwo[row][col]);
  
      }
  
  
    }
  
    return blurredImageFinal;
  
  
}

/**
 * Converts an array of planar coordinates to their latitude/longitude equivalent.
 * @param {object} oldCoordinates A 1d array of planar coordinates.
 * @param {number} minLng The minimum longitude.
 * @param {number} maxLng The maximum longitude.
 * @param {number} minLat The minimum latitude.
 * @param {number} maxLat The maximum latitude.
 * @param {number} width Width of original 2d array.
 * @param {number} height Height of original 2d array.
 * @returns The input array, converted to latitude/longitude coordinates.
 */
const convertCoordinatesToLatLong = (oldCoordinates, minLng, maxLng, minLat, maxLat, width, height) => {

  let newCoordinates = [];

  //The GeoJSON data that you feed into Tippecanoe should be in EPSG:4326
  oldCoordinates.forEach((oldCoord) => {
    
    let newCoord = [minLng + (maxLng - minLng) * (oldCoord[0] / width),
    maxLat - (maxLat - minLat) * (oldCoord[1] / height)];

    newCoordinates.push(newCoord);
  });

  return newCoordinates;

}

/**
 * Converts an array of temperature data in Kelvin, and converts it to Fahrenheit.
 * @param {object} dataArray A 2d array of temperature data, in Kelvin.
 * @returns The input array, converted to Fahrenheit.
 */
const convertKelvinToFahrenheit = (dataArray) => {
  for(let i = 0; i < dataArray.length;i++){
    for(let j = 0; j < dataArray[0].length;j++){
        dataArray[i][j]=dataArray[i][j]*(9/5)-459.67;
    }
  }
  return dataArray;
}

/**
 * Feeds data to contour generator, and returns the generated geojson object.
 * @param {object} pixelVals A 1d array of all temperature values.
 * @returns The generated geojson contour data.
 */
const convertPixelstoGeoJson = (pixelVals) => {

  //Creates geoJSON contour generator, results in geojson with bounds of inputted size
  var polygons = d3contour.contours().size([globalWidth, globalHeight]).smooth(true).thresholds([7,10,13,16,19,22,25,28,31,34,40,43,46,47,49,52,55,58,61,64,67]);

  var generatedGeojsonContours = polygons(pixelVals);

  let resultgeojson = {
    type: 'FeatureCollection',
    features: []
  };

  generatedGeojsonContours.forEach((multipolygon) => {

    var newMultiPolygon = {
      type: 'MultiPolygon',
      value: multipolygon.value,
      coordinates: []
    }

    multipolygon.coordinates.forEach((polygon) => {
      var newPolygon = [];
      polygon.forEach((ring) => {
        var convertedCoords = convertCoordinatesToLatLong(ring, -94, -79, 37, 49, globalWidth, globalHeight);
        newPolygon.push(convertedCoords);
      })
      newMultiPolygon.coordinates.push(newPolygon);
    })

    resultgeojson.features.push(newMultiPolygon);
  });

  return resultgeojson;
}

/**
 * Interpolates X frames between two given frames.
 * @param {object} frame1 The starting frame (2d array).
 * @param {object} frame2 The ending frame (2d array).
 * @param {number} X The number of frames to interpolate between the starting and ending frames.
 * @returns An array of 2d arrays. frame1 will be the first frame, and the interpolated frames will follow.
 */
const interpolateX = (frame1, frame2, X) => {
  var result = [];
  result.push(frame1);
  
  //Pushing empty 2d arrays into result array to hold interpolated frames
  for (let i = 0; i < X; i++) {
    var empty2DArray = [];
    
    result.push(empty2DArray);
  }

  var between = 1 / (X + 1);
  for (let i = 0; i < frame1.length; i++) {
    for (let j = 0; j < frame2[0].length; j++) {

      for (let k = 1; k <= X; k++) {
        if (result[k][i] === undefined) result[k].push([]);
        result[k][i].push(frame1[i][j] + k * between * (frame2[i][j] - frame1[i][j]));
      }

    }

  }
  
  return result;
}

/**
 * Truncates the coordinate points of a geojson object to 4 decimal places.
 * @param {object} geojson The geojson object.
 * @returns The geojson object with truncated coordinates.
 */
const truncateGeojsonCoordinates = (geojson) => {

  var truncated = {
    type: 'FeatureCollection',
    features: []
  };

  geojson.features.forEach((multipolygon) => {
    var newMultiPolygon = {
      type: 'MultiPolygon',
      value: multipolygon.value,
      coordinates: []
    }

    multipolygon.coordinates.forEach((polygon) => {
      var newPolygon = [];
      polygon.forEach((ring) => {
        var truncatedCoords = [];
        ring.forEach((coord) => {
          truncatedCoords.push([Math.round(coord[0] * 10000) / 10000, Math.round(coord[1] * 10000) / 10000])
        })
        newPolygon.push(truncatedCoords);
      })
      newMultiPolygon.coordinates.push(newPolygon);
    })

    truncated.features.push(newMultiPolygon);
  });

  return truncated;

}

//Project generated geojson into planar coordinates, using geoAlbersUsa projection
/**
 * Projects the coordinates of a geojson object into planar coordinates, using the geoAlbersUsa projection.
 * @param {object} geojson The geojson object to project.
 * @returns The projected geojson object.
 */
const projectGeojsonToPlanar = (geojson) => {

  var projection = d3.geoAlbersUsa().scale(1300).translate([487.5, 305]);
  
  var projected = {
    type: 'FeatureCollection',
    features: []
  };

  geojson.features.forEach((multipolygon) => {

    var newMultiPolygon = {
      type: 'MultiPolygon',
      value: multipolygon.value,
      coordinates: []


    }
    multipolygon.coordinates.forEach((polygon) => {
      var newPolygon = [];
      polygon.forEach((ring) => {
        var projectedCoords = [];
        ring.forEach((coord) => {
          projectedCoords.push(projection(coord));
        })
        newPolygon.push(projectedCoords);
      })
      newMultiPolygon.coordinates.push(newPolygon);
    })

    projected.features.push(newMultiPolygon);
  });

  return projected;
}

/**
 * Flips a 2d array of data vertically. Given n rows, the first row is swapped with the nth row, the second row is swapped with the (n-1)th row, and so on.
 * @param {object} dataArray The 2d array to be flipped.
 * @returns The flipped 2d array.
 */
const flipDataVertically = (dataArray) => {
  var flippedData = [];
  for (var row = dataArray.length - 1; row >= 0; row--) {
    flippedData.push(dataArray[row]);
  }

  return flippedData;
}


const testables = {
  flipDataVertically: flipDataVertically,
  convertKelvinToFahrenheit: convertKelvinToFahrenheit,
}
module.exports = {processGribData,testables};
