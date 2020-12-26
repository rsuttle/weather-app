import React from "react";
import ReactDOM from 'react-dom';
import mapboxgl from 'mapbox-gl';


mapboxgl.accessToken = 'pk.eyJ1IjoiMnNwb29reSIsImEiOiJja2FkN3g4NnAyMjlkMnFxdmFxejJkanNzIn0.hXzWHwjSZaBdn8MdW-xoRg';


export default class Map extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            lng: 5,
            lat: 34,
            zoom: 2
        };




    }


    componentDidMount() {

        const map = new mapboxgl.Map({
            container: this.mapContainer,
            style: 'mapbox://styles/2spooky/ckdyyg3ox0axe19pij1mo0eoq',
            center: [this.state.lng, this.state.lat],
            zoom: this.state.zoom,
            maxZoom: 7.85
        


        });



        map.on('move', () => {
            this.setState({
                lng: map.getCenter().lng.toFixed(4),
                lat: map.getCenter().lat.toFixed(4),
                zoom: map.getZoom().toFixed(2)
            });


        });

        map.on('load', () => {
            console.log("loading");
            map.addSource('country-boundaries', {
                "type": "vector",
                "url": "mapbox://mapbox.country-boundaries-v1"
            });
            map.addLayer({
                "id": "undisputed country boundary fill",
                "source": "country-boundaries",
                "source-layer": "country_boundaries",
                "type": "fill",
                "filter": [
                    "==",
                    [
                        "get",
                        "disputed"
                    ],
                    "false"
                ],
                "paint": {
                    "fill-color": "rgba(66,100,251, 0.3)",
                    "fill-outline-color": "#0000ff"
                }
            });

            map.addLayer({
                "id": "disputed area boundary fill",
                "source": "country-boundaries",
                "source-layer": "country_boundaries",
                "type": "fill",
                "filter": [
                    "==",
                    [
                        "get",
                        "disputed"
                    ],
                    "true"
                ],
                "paint": {
                    "fill-color": "rgba(200,100,251, 0.3)",
                    "fill-outline-color": "#ff0000"
                }
            });



            console.log("layer added");

        });


    }




    render() {
        return (
            <div>

                <div style={{ height: "500px", width: "500px" }} ref={el => this.mapContainer = el} className='mapContainer' >
                    <div className="sidebarStyle">
                        <div>Longitude: {this.state.lng} | Latitude: {this.state.lat} | Zoom: {this.state.zoom}</div>
                    </div>
                </div>


            </div>
        )
    }

}