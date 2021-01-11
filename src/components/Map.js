import React from "react";
import ReactDOM from 'react-dom';
import mapboxgl from "mapbox-gl";


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
            style: 'mapbox://styles/2spooky/ckjp42ua808bc18qcob08avji',
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
            
            
            map.addSource('radar-data', {
                type: 'vector',
                url: 'mapbox://2spooky.31ut72v9'
            });
    
            map.addLayer({
                "id": "radarpolygon",
                "type": "fill",
                "source": "radar-data",
                "source-layer":"testingsize",
                'paint': {
                    'fill-opacity': 0.4,
                    'fill-color': [
                        "interpolate",
                        ["linear"],
                        ["get", "value"],
                        0.8,
                        "hsl(180, 100%, 82%)",
                        8.8,
                        "hsl(0, 99%, 49%)"
                      ]
                }
                
                
                
                
            }, );
    
           


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