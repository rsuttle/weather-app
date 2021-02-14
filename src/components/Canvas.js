import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { zoom, zoomIdentity } from "d3-zoom";
import rewind from "@mapbox/geojson-rewind";
import * as topojson from "topojson-client";
var usMap = require('../deleteLater/simplifiedUsTopoJson.json');
const axios = require('axios');




const Canvas = (props) => {
    const canvas = useRef(null);
    const context = useRef(null);
    const projPath = useRef(null);

    const path = useRef(null);

    var projection = d3.geoAlbersUsa().scale(1300).translate([487.5, 305]);

    const width = 975;
    const height = 610;

    var { frameToDraw, zoomFunction, transform } = props;

    //should only run once, despite dependency array
    useEffect(() => {

        console.log("ue called");
        context.current = canvas.current.getContext("2d");
        console.log("context:", context.current);

        context.current.canvas.style.maxWidth = "100%";
        context.current.lineJoin = "round";
        context.current.lineCap = "round";
        context.current.globalCompositeOperation = "source-over";
        context.current.strokeStyle = "#000";


        path.current = d3.geoPath(null, context.current);
        projPath.current = d3.geoPath(projection, context.current);



        d3.select(context.current.canvas).call(zoom()
            .scaleExtent([1, 12])
            .translateExtent([[0,0],[975,610]])
            .on("zoom", ({ transform }) => zoomFunction(transform)));


    },[]);


    //redraw on zoom or new frame
    useEffect(() => {
        context.current.save();

        context.current.translate(transform.translatex, transform.translatey);
        context.current.scale(transform.scale, transform.scale);
        context.current.lineWidth = transform.lineWidth;




        context.current.clearRect(0, 0, width, height);




        //draw US and state outlines
        context.current.beginPath();
        path.current(topojson.mesh(usMap, usMap.objects.states, (a, b) => a !== b));
        path.current(topojson.feature(usMap, usMap.objects.nation));
        context.current.stroke();



        var colorMap = {
            10: "rgb(102,243,244)",
            15: "rgb(125,196,250)",
            20: "rgb(134,102,249)",
            25: "rgb(102, 255, 115)",
            30: "rgb(102, 223, 111)",
            35: "rgb(102, 189, 107)",
            40: "rgb(253, 255, 113)",
            7.8: "rgb(239, 219, 107)",
            8.8: "rgb(254, 190, 102)"
        };

        if (frameToDraw !== undefined) {
            //has to be a geometry collection to work
            var why = {
                type: 'GeometryCollection',
                geometries: []
            };

            why.geometries = frameToDraw.features;

            //draw radar frame
            for (let i = 0; i < why.geometries.length; i++) {
                context.current.beginPath();
                projPath.current(why.geometries[i]);
                context.current.fillStyle = colorMap[why.geometries[i].value];
                context.current.fill();
            }
        }


        context.current.restore();

    }, [transform, frameToDraw]);

    return (


        <canvas style={{ position: "absolute", backgroundColor: "rgb(79,79,79)" }} width={975} height={610} ref={canvas}>

        </canvas>
    )
}

export default Canvas;












