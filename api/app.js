const express = require('express');
const { spawn } = require("child_process");
const fs = require('fs');
const d3contour = require("d3-contour");
const d3 = require("d3-geo")
const rewindGeojson = require("@mapbox/geojson-rewind");
const cors = require('cors');
var simplify = require("simplify-geojson");

const app = express();
const port = 8000;

app.use(cors());

var globalHeight = 401;
var globalWidth = 401;

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



//Takes in 1D array of pixel values, feeds it to the contour generator, and then returns the generated
//geoJson data.
const convertPixelstoGeoJson = (pixelVals) => {




  //creates geoJSON contour generator, results in geojson with bounds of inputted size
  var polygons = d3contour.contours().size([globalWidth, globalHeight]).smooth(true).thresholds([10, 15, 20, 25, 30, 35, 40]);

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
        var convertedCoords = convertCoordinatesToLatLong(ring, -88, -81, 37, 42, globalWidth, globalHeight);
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
  console.log(frame2.length);

  //pushing empty 2d arrays into result array to hold interpolated frames
  for (let i = 0; i < X; i++) {
    var empty2DArray = [];
    //empty2DArray.push([]);
    result.push(empty2DArray);
  }

  // console.log(result);
  // result[2][0].push(5);
  // console.log(result[2]);
  var between = 1 / (X + 1);
  for (let i = 0; i < frame1.length; i++) {
    for (let j = 0; j < frame2.length; j++) {

      for (let k = 1; k <= X; k++) {
        if (result[k][i] === undefined) result[k].push([]);
        result[k][i].push(frame1[i][j] + k * between * (frame2[i][j] - frame1[i][j]));
      }

    }

  }
  result.push(frame2);
  console.log(result[5].length);
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
// //Gets and returns radar data array from file, flattens it from 2d to 1d
// async function getRadarData() {

//   try{
//     var data = await fs.readFile('./compositeReflectivity.json', 'utf8');
//     var radarData = JSON.parse(data).flat();
//     return radarData;
//   }
//   catch(err){
//     console.log(err);
//   }





// }
//var testing = getRadarData().then(console.log(testing)).catch((err) => console.log(err));

//Executes python script, which gets data and stores it in compositeReflectivity.json
// const python = spawn('python', ['./script.py']);
// python.on('exit', (code) => {
//   console.log(`child process close all stdio with code ${code}`);
//   var testing = fs.readFileSync("./compositeReflectivity.json", "utf8");
//   var radarData = JSON.parse(testing).flat();
//   console.log(radarData);
// });

var refData1 = fs.readFileSync("./compositeReflectivity.json", "utf8");
var refData2 = fs.readFileSync("./compositeReflectivity2.json", "utf8");

var radarData1 = JSON.parse(refData1);
var radarData2 = JSON.parse(refData2);

var flippedRadarData1 = [];
for (var row = radarData1.length - 1; row >= 0; row--) {
  flippedRadarData1.push(radarData1[row]);
}

var flippedRadarData2 = [];
for (var row = radarData2.length - 1; row >= 0; row--) {
  flippedRadarData2.push(radarData2[row]);
}


var radarDataList = interpolateX(flippedRadarData1, flippedRadarData2, 4);

var finalRadarDataList = [];
for (let i = 0; i < radarDataList.length; i++) {
  var blurredRadarData = gaussianBlur(radarDataList[i]);
  var convertedRadarData = convertPixelstoGeoJson(blurredRadarData);
  var fixedWindingOrder = rewindGeojson(convertedRadarData, true);
  
  var simplified = simplify(fixedWindingOrder, .005);
  
  var projected = projectGeojsonToPlanar(simplified);
  
  var truncated = truncateGeojsonCoordinates(projected);
  
  

  finalRadarDataList.push(truncated);
}















var output = finalRadarDataList;



//maybe use streams to speed this up?
fs.writeFileSync("./interpolatedJsonTest", JSON.stringify(output), function (err) {
  if (err) {
    return console.log(err);
  }
  console.log("The file was saved!");
});







app.get('/', (req, res) => {
  res.send(output);
});

app.get('/testfile', (req, res) => {

  res.send("done");
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});