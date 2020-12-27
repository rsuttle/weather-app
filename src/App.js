import './App.css';
import {contours} from "d3-contour"
const proj4 = require("proj4");
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
  useRouteMatch,
  useParams
} from "react-router-dom";

import Map from "./components/Map"


let w = 6;
let h = 6;
let testArray = [
  [1,1,1,1,1,1],
  [1,1,2,2,2,1],
  [1,1,2,2,2,1],
  [1,2,2,3,2,1],
  [1,2,2,2,2,1],
  [1,1,1,1,1,1]
];

var polygons = contours().size([6, 6]); //creates geoJSON contour generator

let pls = polygons([
  1,1,1,1,1,1,
  1,1,2,2,2,1,
  1,1,2,2,2,1,
  1,2,2,3,2,1,
  1,2,2,2,2,1,
  1,1,1,1,1,1,
]);

let resultgeojson = {
  type: 'FeatureCollection',
  features: []
};

console.log(pls);
pls.forEach((polygon) => {
  
  resultgeojson.features.push({
      type: 'Feature',
      properties: {
          value: polygon.value,
          idx: 0
      },
      geometry: {
          type: 'Polygon',
          coordinates: polygon.coordinates[0]
      }
  });
});
  
console.log(JSON.stringify(resultgeojson));

//The GeoJSON data that you feed into Tippecanoe should be in EPSG:4326
let pixel_position = [10, 20];
let geo_position = proj4('EPSG:3857', 'EPSG:4326',[
    minLng + (maxLng - minLng) * (p[0] / w),
    maxLat - (maxLat - minLat) * (p[1] / h)
]);





function App() {
  return (
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
            {/* <Map/> */}
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
