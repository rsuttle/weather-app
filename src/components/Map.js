import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import { zoom } from "d3-zoom";
import rewind from "@mapbox/geojson-rewind"
var usMap = require('../images/testgeo.json');
var radarJson = require('../images/radar.json');


var thresholds = [0.8, 1.8, 2.8, 3.8, 4.8, 5.8, 6.8, 7.8, 8.8];
var colorMap = {
    0.8: "rgb(102,243,244)",
    1.8: "rgb(125,196,250)",
    2.8: "rgb(134,102,249)",
    3.8: "rgb(102, 255, 115)",
    4.8: "rgb(102, 223, 111)",
    5.8: "rgb(102, 189, 107)",
    6.8: "rgb(253, 255, 113)",
    7.8: "rgb(239, 219, 107)",
    8.8: "rgb(254, 190, 102)"
};
const getContourColor = (contour) => {
    return colorMap[contour.value]
}

const Map = () => {
    const s = useRef(null);

    useEffect(() => {

        const width = 960;
        const height = 500;
        var svg = d3.select(s.current)
            .append("svg")
            .attr("width", width)
            .attr("height", height);

        var projection = d3.geoMercator();
        projection.fitSize([width, height], usMap);

        var path = d3.geoPath().projection(projection);

        //draw US map
        var mapGroup =  svg.append("path")
            .attr("fill", "none")
            .attr("stroke", "black")
            .attr("stroke-linejoin", "round")
            .attr("viewBox", [0, 0, width, height])
            .attr("d", path(usMap));


        //Fix geoJson winding order
        var blahRewind = rewind(radarJson, true);
        console.log("proper winding order: ");
        console.log(JSON.stringify(blahRewind));

        //draw contours
        var g = svg.append("g")
            .attr("fill", "none")
            .attr("stroke", "black")
            .attr("stroke-opacity", 0.5)
            .attr("stroke-width", 0.2)
        
        
        g.selectAll("path")
            .data(blahRewind.features)
            .join("path")
            .attr("fill", d => getContourColor(d))
            .attr("fill-opacity", 0.5)
            .attr("d", d3.geoPath().projection(projection))


        const zooming = zoom().scaleExtent([1,8]).on("zoom", e => {
            var transform = e.transform;
            
            g.attr("transform", e.transform);
            console.log("e",e);
            console.log("etransform",e.transform);
            g.style("stroke-width", 1 / Math.sqrt(transform.k));
            // mapGroup.attr("transform", e.transform);
            // mapGroup.style("stroke-width", 1 / Math.sqrt(transform.k));
            
        });

        svg.call(zooming).call(zooming.transform,d3.zoomIdentity);





        // d3.json(usMap, function (err, geojson) {

        //      projection.fitSize([width, height], geojson);

        //      svg.append("path").attr("d", path(geojson));
        //      console.log("ran");

        //  })

    });

    return (


        <div ref={s}>

        </div>



    )
}

export default Map;












