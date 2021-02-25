import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import * as PIXI from "pixi.js";
import * as topojson from "topojson-client";
import { Viewport } from "pixi-viewport";
import axios from "axios";

var usMap = require('../deleteLater/simplifiedUsTopoJson.json');
var usOutline = require('../deleteLater/usOutline.json');







const Map = () => {

    const width = 975;
    const height = 610;

    const userWindowWidth = window.innerWidth;
    const userWindowHeight = window.innerHeight;

    const [radarFrames, setRadarFrames] = useState(null);

    const renderCanvas = useRef(null);
    const pixiRenderer = useRef(null);
    const pixiViewport = useRef(null);
    const pixiTicker = useRef(new PIXI.Ticker());
    const stage = useRef(new PIXI.Container());
    const currentFrame = useRef(0);
    const graphics = useRef(new PIXI.Graphics());
    const path = useRef(null);
    const projPath = useRef(null);

    var projection = d3.geoAlbersUsa().scale(1300).translate([487.5, 305]);
    //var projection = d3.geoAlbersUsa().scale(1300).translate([userWindowWidth/2, userWindowHeight/2]);
    //var projection = d3.geoAlbersUsa().scale(1300).translate([1000, 500]);



    useEffect(() => {


        axios.get('http://192.168.0.5:8000')
            .then(function (response) {

                setRadarFrames(response.data);
                console.log(response.data);


            });


        //setup renderer with canvas
        pixiRenderer.current = new PIXI.Renderer({ width: userWindowWidth, height: userWindowHeight, backgroundColor: 0x7d7d7d, antialias: true, view: renderCanvas.current });

        //create viewport and add to stage
        const viewport = new Viewport({
            screenWidth: userWindowWidth,
            screenHeight: userWindowHeight,
            worldWidth: 2000,
            worldHeight: 2000,
            interaction: pixiRenderer.current.plugins.interaction
        });
        stage.current.addChild(viewport);

        viewport
            .drag()
            .pinch()
            .wheel()
            .decelerate()
            .clamp({ left: 480, right: 800, bottom: 350, top: 50 })
            .clampZoom({ minScale: 4.5, maxScale: 20 })
            .moveCenter(665,210)




        path.current = d3.geoPath(null, graphics.current);
        projPath.current = d3.geoPath(projection, graphics.current);


        viewport.addChild(graphics.current);


        pixiRenderer.current.render(stage.current);



        pixiViewport.current = viewport;





    }, []);

    //console.log(JSON.stringify(topojson.mesh(usMap, usMap.objects.states, (a, b) => a !== b)));
    
   
    var colorMap = {
        10: 0x66f4f4,
        15: 0x7dc4fa,
        20: 0x8666f9,
        25: 0x66ff73,
        30: 0x66df6f,
        35: 0x66bd6b,
        40: 0xfdff71,
        7.8: 0xefdb6b,
        8.8: 0xfebe66
    };

    useEffect(() => {
        //console.dir(loop);

        function loop() {

            graphics.current.clear();



           
            graphics.current.lineStyle(1 / pixiViewport.current.transform.scale.x, 0x000000, 1);

           


            if (radarFrames !== null) {


                var frameToDraw = radarFrames[currentFrame.current];


                //has to be a geometry collection to work
                var why = {
                    type: 'GeometryCollection',
                    geometries: []
                };

                why.geometries = frameToDraw.features;

                //draw radar frame
                for (let i = 0; i < why.geometries.length; i++) {
                    graphics.current.beginFill(colorMap[why.geometries[i].value], 0.5);

                    path.current(why.geometries[i]);
                    graphics.current.endFill();


                }
            }

           



           //draw states and US outline
            path.current(usMap);
            path.current(usOutline);
            
            



            pixiRenderer.current.render(stage.current);
            currentFrame.current = (currentFrame.current + 1) % 6;




        }

        // setup ticker
        //pixiTicker.current.maxFps = 60;
        pixiTicker.current.destroy();
        pixiTicker.current = new PIXI.Ticker();
        pixiTicker.current.add(loop, PIXI.UPDATE_PRIORITY.LOW);
        pixiTicker.current.start();



        //console.log("ticker added")
    }, [radarFrames]);







    return (


        <canvas ref={renderCanvas}>

        </canvas>



    )
}

export default Map;












