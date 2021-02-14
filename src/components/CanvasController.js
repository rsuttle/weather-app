import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import Canvas from "./Canvas";
const axios = require('axios');



const CanvasController = () => {
    const [radarFrames, setRadarFrames] = useState([]);
    const [currentFrame, setCurrentFrame] = useState(0);
    const [transformState, setTransformState] = useState({
        translatex: 0,
        translatey: 0,
        scale: 0,
        lineWidth: 0
    });

    

    const width = 975;
    const height = 610;

    function animation() {
        

        setCurrentFrame(prevFrame => (prevFrame + 1)%6);
        requestAnimationFrame(animation);

    }

    function zoomed(transform) {
        console.log("zoom")
        setTransformState({
            translatex: transform.x,
            translatey: transform.y,
            scale: transform.k,
            lineWidth: 1 / transform.k
        })

       
    }




    useEffect(() => {
        
        
        axios.get('http://192.168.0.5:8000')
            .then(function (response) {
                setRadarFrames(response.data);
                console.log(radarFrames);
            })
            .catch(function (error) {
                // handle error
                console.log(error);
            })
            .then(function () {
                zoomed(d3.zoomIdentity);
                requestAnimationFrame(animation);
               
            });

            

       
            
    }, []);

    return (


        <div>
            <Canvas zoomFunction={zoomed} frameToDraw={radarFrames[currentFrame]} transform={transformState} />
        </div>



    )
}

export default CanvasController;












