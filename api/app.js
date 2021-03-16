const express = require('express');
const { spawn } = require("child_process");
const fs = require('fs');
const d3contour = require("d3-contour");
const d3 = require("d3-geo")
const rewindGeojson = require("@mapbox/geojson-rewind");
const cors = require('cors');
var simplify = require("simplify-geojson");
const { default: axios } = require('axios');
const downloadGribData = require('./downloadGribData');
const util = require('util');
const readFileContent = util.promisify(fs.readFile) 

const app = express();
const port = 8000;

app.use(cors());

var globalHeight = 49;
var globalWidth = 61;

downloadGribData()
.then(() => {
  
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
    //grab data from stdio
    processGribData();
  });


  
  
})


//Applies a Gaussian blur to 2d array of numbers, and returns a 1d blurred array.
const gaussianBlur = (image) => {
  //st dev = 4, kernel size = 5
  const filter = [0.187691, 0.206038, 0.212543, 0.206038, 0.187691];

  //horizontal blur
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

  //vertical blur
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

  //rotate image back to original orientation
  var blurredImageFinal = [];
  for (let col = 0; col < blurredImageTwo[0].length; col++) {

    for (let row = 0; row < blurredImageTwo.length; row++) {

      blurredImageFinal.push(blurredImageTwo[row][col]);

    }


  }

  return blurredImageFinal;

}

//Converts an array (1D) of planar coordinates to their latitude/longitude equivalent.
const convertCoordinatesToLatLong = (oldCoordinates, minLng, maxLng, minLat, maxLat, width, height) => {

  let newCoordinates = [];

  //The GeoJSON data that you feed into Tippecanoe should be in EPSG:4326
  oldCoordinates.forEach((oldCoord) => {

    // let newCoord = proj4('EPSG:3857', 'EPSG:4326', [
    //   minLng + (maxLng - minLng) * (oldCoord[0] / width),
    //   minLat + (maxLat - minLat) * (oldCoord[1] / height)
    // ]);



    let newCoord = [minLng + (maxLng - minLng) * (oldCoord[0] / width),
    maxLat - (maxLat - minLat) * (oldCoord[1] / height)];





    newCoordinates.push(newCoord);
  });

  return newCoordinates;

}

//Accepts 2D array of Kelvin temperature data, returns same data converted to Fahrenheit
const convertKelvinToFahrenheit = (dataArray) => {
  for(let i = 0; i < dataArray.length;i++){
    for(let j = 0; j < dataArray[0].length;j++){
        dataArray[i][j]=dataArray[i][j]*(9/5)-459.67;
        
    }
  }
  return dataArray;
}


//Takes in 1D array of pixel values, feeds it to the contour generator, and then returns the generated
//geoJson data.
const convertPixelstoGeoJson = (pixelVals) => {

  


  //creates geoJSON contour generator, results in geojson with bounds of inputted size
  var polygons = d3contour.contours().size([globalWidth, globalHeight]).smooth(true).thresholds([7,10,13,16,19,22,25,28,31,34,40,43,46,47,49,52,55,58,61,64,67]);

  //.thresholds([1,2,3,4,5,6,7,8,9])

  var pls = polygons(pixelVals);







  let resultgeojson = {
    type: 'FeatureCollection',
    features: []
  };


  pls.forEach((multipolygon) => {

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



  // console.log("geojson:");
  // console.log(JSON.stringify(resultgeojson));

  return resultgeojson;



}

//Accepts 2 2D arrays, creates X interpolated frames between them, and returns all frames (2+X total) as 2D array
const interpolateX = (frame1, frame2, X) => {
  var result = [];
  result.push(frame1);
  

  //pushing empty 2d arrays into result array to hold interpolated frames
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
  //result.push(frame2);
  
  return result;
}




//Takes a geoJson object and truncates all coordinates to 4 decimal places, then returns the geoJson object
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

const flipDataVertically = (dataArray) => {
  var flippedData = [];
  for (var row = dataArray.length - 1; row >= 0; row--) {
    flippedData.push(dataArray[row]);
  }

  return flippedData;
}


var finalDataList = [];
const processGribData = () => {
  //Read in file of 2d data arrays, then send them through processing pipeline

  //promisified fs.readFile
  readFileContent("../temperatureData.json","utf8")
  .then((temperatureData) => {
      temperatureData = JSON.parse(temperatureData);
      console.log("size", temperatureData.length)

      for(let i = 0; i < temperatureData.length; i++){
        temperatureData[i] = convertKelvinToFahrenheit(temperatureData[i]);
        temperatureData[i] = flipDataVertically(temperatureData[i]);
      }

      var dataList = [];
      for(let i = 0; i < temperatureData.length-1; i++){
        var interpolatedData = interpolateX(temperatureData[i],temperatureData[i+1],15)
        for(let j = 0; j < interpolatedData.length; j++){
          dataList.push(interpolatedData[j]);
        }
        
      }
      dataList.push(temperatureData[temperatureData.length-1]);

      
      for(let i = 0; i < dataList.length; i++){
        //apparently bRD is actually a 2d array, with the 1st row containing everything
        //hmmmm
        var blurredTemperatureData = gaussianBlur(dataList[i]);
        var convertedTemperatureData = convertPixelstoGeoJson(blurredTemperatureData);
        var fixedWindingOrder = rewindGeojson(convertedTemperatureData, true);
        var simplified = simplify(fixedWindingOrder, .005);
        var projected = projectGeojsonToPlanar(simplified);
        var truncated = truncateGeojsonCoordinates(projected);
        
        finalDataList.push(truncated);
      }
    })
    .catch((err) => {
      console.log(err);
    })
  
  
}




var output = finalDataList;




//maybe use streams to speed this up?
//fs.writeFileSync("./interpolatedJsonTest.geojson", JSON.stringify(output[2]))

app.get('/', (req, res) => {
  res.send(output);
});

app.get('/testfile', (req, res) => {

  res.send("done");
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});