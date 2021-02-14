import './App.css';
import { useEffect, useRef } from "react"
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
  useRouteMatch,
  useParams
} from "react-router-dom";
import CanvasController from "./components/CanvasController"


// //Takes in a radar image in RGBA format (from canvas) and converts it to a 1D array
// //of values based on the color of each pixel. The array is then ready to pass to the contour generator.
// const convertRGBAToPixels = (rgbaArray) => {


//   var whiteBackground = Color.rgb([255, 255, 255]);

//   var lightBlue = Color.rgb([102, 243, 244]);

//   var medBlue = Color.rgb([125, 196, 250]);

//   var darkBlue = Color.rgb([134, 102, 249]);

//   var lightGreen = Color.rgb([102, 255, 115]);

//   var medGreen = Color.rgb([102, 223, 111]);
//   var darkGreen = Color.rgb([102, 189, 107]);
//   var lightYellow = Color.rgb([253, 255, 113]);
//   var medYellow = Color.rgb([239, 219, 107]);
//   var darkYellow = Color.rgb([254, 190, 102]);

//   var colors = new Map();



//   colors.set(whiteBackground.string(), 0);
//   colors.set(lightBlue.string(), 1);
//   colors.set(medBlue.string(), 2);
//   colors.set(darkBlue.string(), 3);
//   colors.set(lightGreen.string(), 4);
//   colors.set(medGreen.string(), 5);
//   colors.set(darkGreen.string(), 6);
//   colors.set(lightYellow.string(), 7);
//   colors.set(medYellow.string(), 8);
//   colors.set(darkYellow.string(), 9);


//   //var pixelCount = 0;       //ensuring we are using all of the pixels
//   var convertedArray = [];

//   for (let i = 0; i < rgbaArray.length; i += 4) {
//     let r = rgbaArray[i];
//     let g = rgbaArray[i + 1];
//     let b = rgbaArray[i + 2];



//     var pixelColor = Color([r, g, b]);



//     //if(colors.has(pixelColor.string())) pixelCount++;

//     convertedArray.push(colors.get(pixelColor.string()));






//   }

//   return convertedArray;
// }

function App() {
  
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
              <CanvasController/>
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
