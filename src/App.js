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
import blurredTestImage from "./images/croppedTestRadar1.png"
import { clearStorage } from 'mapbox-gl';
var Color = require("color");
const proj4 = require("proj4");


const convertPixelstoGeoJson = (pixelVals) => {
  let w = 154;
  let h = 137;

  var thresholdArray = [];
  for (let i = 0; i <= 9; i += 0.2) {
    thresholdArray.push(i);
  }
  //creates geoJSON contour generator, results in geojson with bounds of inputted size
  var polygons = contours().size([154, 137]).smooth(false).thresholds([0.2,1.2,2.2,3.2,4.2,5.2])

  //var density = contourDensity().size([600, 629]).thresholds([0,1,2,3,4,5,6,7,8,9]);




  console.log("creating geojson");

  let pls = polygons(pixelVals);

  console.log(pls);

  let resultgeojson = {
    type: 'FeatureCollection',
    features: []
  };


  pls.forEach((multipolygon) => {
    

    multipolygon.coordinates.forEach((actualPolygon) => {
      resultgeojson.features.push({
        type: 'Feature',
        properties: {
          value: multipolygon.value,
          idx: 0
        },
        geometry: {
          type: 'Polygon',
          coordinates: actualPolygon
        }
      });
    })


  });

  console.log(JSON.stringify(resultgeojson));

  



}

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
    imgCanvas.width = 154;
    imgCanvas.height = 137;


    var radarImg = new Image();

    radarImg.addEventListener('load', function () {
      
      ctx.setTransform(1,0,0,-1,0,imgCanvas.height);
      ctx.drawImage(radarImg, 0, 0);

      var myImageData = ctx.getImageData(0, 0, 154, 137);

      ctx.setTransform(1,0,0,1,0,0);
      ctx.drawImage(radarImg, 0, 0);

      console.log(myImageData);


      var imageConvertedToValues = convertRGBAToPixels(myImageData.data);
      console.log(imageConvertedToValues)
      convertPixelstoGeoJson(imageConvertedToValues);

    }, false);
    radarImg.src = blurredTestImage;




    //The GeoJSON data that you feed into Tippecanoe should be in EPSG:4326
    // let pixel_position = [10, 20];
    // let geo_position = proj4('EPSG:3857', 'EPSG:4326',[
    //     minLng + (maxLng - minLng) * (p[0] / w),
    //     maxLat - (maxLat - minLat) * (p[1] / h)
    // ]);
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
              {/* <MapComponent/> */}
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
