import './App.css';
import { useEffect, useRef } from "react"
import { contours, contourDensity } from "d3-contour"
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
  useRouteMatch,
  useParams
} from "react-router-dom";
import MapComponent from "./components/Map"
import testImage from "./images/testradar.PNG";
import blurredTestImage from "./images/testradar.PNG"
import proj4 from "proj4"
import { act } from 'react-dom/test-utils';
var Color = require("color");
//const proj4 = require("proj4");


//Applies a Gaussian blur to 2d array of numbers, and returns the blurred 2d array.
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

//Converts an array of planar coordinates to their latitude/longitude equivalent.
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
  let w = 600;
  let h = 629;



  //creates geoJSON contour generator, results in geojson with bounds of inputted size
  var polygons = contours().size([600, 629]).smooth(true).thresholds([0.8, 1.8, 2.8, 3.8, 4.8, 5.8, 6.8, 7.8, 8.8])

  //.thresholds([1,2,3,4,5,6,7,8,9])

  var pls = polygons(pixelVals);

  
  // let tempResultgeojson = {
  //   type: 'FeatureCollection',
  //   features: []
  // };
  // tempResultgeojson.features = pls;
  // console.log("Here it is: ", JSON.stringify(tempResultgeojson));


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
        var convertedCoords = convertCoordinatesToLatLong(ring, -94, -76, 31, 48, w, h);
        newPolygon.push(convertedCoords);
      })
      newMultiPolygon.coordinates.push(newPolygon);
    })

    resultgeojson.features.push(newMultiPolygon);
  });



  console.log("geojson:");
  console.log(JSON.stringify(resultgeojson));





}

//Takes in a radar image in RGBA format (from canvas) and converts it to a 1D array
//of values based on the color of each pixel. The array is then ready to pass to the contour generator.
const convertRGBAToPixels = (rgbaArray) => {


  var whiteBackground = Color.rgb([255, 255, 255]);

  var lightBlue = Color.rgb([102, 243, 244]);

  var medBlue = Color.rgb([125, 196, 250]);

  var darkBlue = Color.rgb([134, 102, 249]);

  var lightGreen = Color.rgb([102, 255, 115]);

  var medGreen = Color.rgb([102, 223, 111]);
  var darkGreen = Color.rgb([102, 189, 107]);
  var lightYellow = Color.rgb([253, 255, 113]);
  var medYellow = Color.rgb([239, 219, 107]);
  var darkYellow = Color.rgb([254, 190, 102]);

  var colors = new Map();
  console.log(colors);


  colors.set(whiteBackground.string(), 0);
  colors.set(lightBlue.string(), 1);
  colors.set(medBlue.string(), 2);
  colors.set(darkBlue.string(), 3);
  colors.set(lightGreen.string(), 4);
  colors.set(medGreen.string(), 5);
  colors.set(darkGreen.string(), 6);
  colors.set(lightYellow.string(), 7);
  colors.set(medYellow.string(), 8);
  colors.set(darkYellow.string(), 9);


  //var pixelCount = 0;       //ensuring we are using all of the pixels
  var convertedArray = [];

  for (let i = 0; i < rgbaArray.length; i += 4) {
    let r = rgbaArray[i];
    let g = rgbaArray[i + 1];
    let b = rgbaArray[i + 2];



    var pixelColor = Color([r, g, b]);



    //if(colors.has(pixelColor.string())) pixelCount++;

    convertedArray.push(colors.get(pixelColor.string()));






  }

  return convertedArray;
}

function App() {
  const canvasRef = useRef(null);

  useEffect(() => {



    var imgCanvas = canvasRef.current;
    var ctx = imgCanvas.getContext("2d");
    imgCanvas.width = 600;
    imgCanvas.height = 629;


    var radarImg = new Image();

    radarImg.addEventListener('load', function () {

      //flipping across x-axis
      //ctx.setTransform(1, 0, 0, -1, 0, imgCanvas.height);
      ctx.drawImage(radarImg, 0, 0);

      var myImageData = ctx.getImageData(0, 0, 600, 629);

      //flipping it back for viewing
      // ctx.setTransform(1, 0, 0, 1, 0, 0);
      // ctx.drawImage(radarImg, 0, 0);




      var imageConvertedToValues = convertRGBAToPixels(myImageData.data);
      console.log(imageConvertedToValues)
      //convertPixelstoGeoJson(imageConvertedToValues);

      //convert the pixel vals to a 2d array so they can be processed by the blurring function
      var imageConvertedToValuesBut2d = [];
      for (let count = 0; count < 629; count++) {
        var tempRow = [];
        for (let col = 0; col < 600; col++) {
          tempRow.push(imageConvertedToValues[count * 600 + col]);
        }
        imageConvertedToValuesBut2d.push(tempRow);
        tempRow = [];
      }

      var blurredImage = gaussianBlur(imageConvertedToValuesBut2d);
      console.log(blurredImage);
      convertPixelstoGeoJson(blurredImage);


    }, false);
    radarImg.src = blurredTestImage;





  }, [])

  return (
    <>
      <Router>
        <div>
          <nav>
            <ul>
              <li>
                <Link to="/">Home</Link>
              </li>
              <li>
                <Link to="/map">Map</Link>
              </li>
              <li>
                <Link to="/users">Users</Link>
              </li>
            </ul>
          </nav>


          <Switch>
            <Route path="/map">
              {<MapComponent />}
            </Route>
            <Route path="/users">
              <Users />
            </Route>
            <Route path="/">
              <Home />
            </Route>
          </Switch>
        </div>
      </Router>
      <canvas ref={canvasRef}></canvas>
    </>
  );
}

function Home() {
  return <h2>Home</h2>;
}

function About() {
  return <h2>About</h2>;
}

function Users() {
  return <h2>Users</h2>;
}

export default App;
