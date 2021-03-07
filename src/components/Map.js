import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import * as PIXI from "pixi.js";
import { Viewport } from "pixi-viewport";
import axios from "axios";
import styled from "styled-components";
import { createTextMesh, updateText } from "./textRendering";
import { Grid } from "@material-ui/core"
import noUiSlider from 'nouislider';
import 'nouislider/distribute/nouislider.css';

import bitmapFont from '../deleteLater/sdf.fnt';
import rightArrowButtonImage from '../deleteLater/right-arrow.svg'
import leftArrowButtonImage from '../deleteLater/left-arrow.svg'
import playButtonImage from '../deleteLater/playButton.svg'
import pauseButtonImage from '../deleteLater/pauseButton.svg'


export var citiesList = [];
export var projectedCitiesLocations = [];

const loadFont = require('load-bmfont');
const usMap = require('../deleteLater/simplifiedUsTopoJson.json');
const usOutline = require('../deleteLater/usOutline.json');



//Total width of the three buttons should be 30% of screen
const ControlButton = styled.button`
 
 /* Small devices (landscape phones, 576px and up)*/
@media (min-width: 375px) { 
    width: ${props => (props.userWindowWidth * 1 / 2) / 3}px;
    height: ${props => (props.userWindowWidth * 1 / 2) / 3}px;


}

/* Medium devices (tablets, 768px and up)*/
@media (min-width: 768px) {
    width: ${props => (props.userWindowWidth * 1 / 2) / 3}px;
    height: ${props => (props.userWindowWidth * 1 / 2) / 3}px;
}

/* Large devices (desktops, 992px and up)*/
@media (min-width: 992px) {
    width: ${props => (props.userWindowWidth * 1 / 6) / 3}px;
    height: ${props => (props.userWindowWidth * 1 / 6) / 3}px;
}

/* Extra large devices (large desktops, 1200px and up)*/
@media (min-width: 1200px) {
    width: ${props => (props.userWindowWidth * 1 / 6) / 3}px;
    height: ${props => (props.userWindowWidth * 1 / 6) / 3}px;
}




 
  
`
//Control buttons are positioned 80% from top of screen, and in the middle
const ControlButtonsContainer = styled.div`
position: absolute;


/* Small devices (landscape phones, 576px and up) */
@media (min-width: 375px) {
    
    top: ${props => props.userWindowHeight * 4 / 5}px;
    left: ${props => props.userWindowWidth / 2 - (1 / 4 * props.userWindowWidth)}px;
 }

/* Medium devices (tablets, 768px and up) */
@media (min-width: 768px) {
    top: ${props => props.userWindowHeight * 4 / 5}px;
    left: ${props => props.userWindowWidth / 2 - (1 / 4 * props.userWindowWidth)}px;
}

/* Large devices (desktops, 992px and up) */
@media (min-width: 992px) {
    
    top: ${props => props.userWindowHeight * 4 / 5}px;
    left: ${props => props.userWindowWidth / 2 - (1 / 12 * props.userWindowWidth)}px;
}

/*Extra large devices (large desktops, 1200px and up)*/
@media (min-width: 1200px) {
    top: ${props => props.userWindowHeight * 4 / 5}px;
    left: ${props => props.userWindowWidth / 2 - (1 / 12 * props.userWindowWidth)}px;
}



`

const citiesAndLocations = {
    "Chicago": [-87.6298, 41.8781],
    "Detroit": [-83.0458, 42.3314],
    "Grand Rapids": [-85.6681, 42.9634],
    "Indianapolis": [-86.1581, 39.7684],
    "Cedar Rapids": [-91.6656, 41.9779],
    "Cincinnati": [-84.512, 39.1031],
    "Columbus": [-82.9988, 39.9612],
    "St. Louis": [-90.1994, 38.627],
    "Munising": [-86.6479, 46.4111],
    "Madison": [-89.4012, 43.0731],
    "Milwaukee": [-87.9065, 43.0389],
    "Springfield": [-89.6501, 39.7817],
    "Cleveland": [-81.6944, 41.4993],
    "Pittsburgh": [-79.9959, 40.4406],
    "Louisville": [-85.7585, 38.2527],
    "Green Bay": [-88.0133, 44.5133],
    "Minneapolis": [-93.2650, 44.9778],
    "Duluth": [-92.1005, 46.7867],
    "Traverse City": [-85.6206, 44.7631]
}


var projection = d3.geoAlbersUsa().scale(1300).translate([487.5, 305]);
for (const city in citiesAndLocations) {
    citiesList.push(city);
    projectedCitiesLocations.push(projection(citiesAndLocations[city]));
}


const Map = () => {

    const width = 975;
    const height = 610;

    const userWindowWidth = window.innerWidth;
    const userWindowHeight = window.innerHeight;

    const [radarFrames, setRadarFrames] = useState(null);
    const [isAnimating, setIsAnimating] = useState(false);
    

    const renderCanvas = useRef(null);
    const pixiRenderer = useRef(null);
    const pixiViewport = useRef(null);
    const pixiTicker = useRef(new PIXI.Ticker());
    const stage = useRef(new PIXI.Container());
    const currentFrame = useRef(0);
    const graphics = useRef(new PIXI.Graphics());
    const textMesh = useRef(null);
    const path = useRef(null);
    const projPath = useRef(null);
    const loadedFont = useRef(false);
    const sliderRef = useRef(null);






    useEffect(() => {

        noUiSlider.create(sliderRef.current, {
            start: [0],
            animate: false,
            connect: true,
            step: 1,
            range: {
                'min': 0,
                'max': 5
            }
        });

        sliderRef.current.noUiSlider.on("slide", onSliderChange);

        //Retrieve initial data
        axios.get('http://192.168.0.5:8000')
            .then(function (response) {

                setRadarFrames(response.data);
                


            })
            .catch((err) => {
                console.log(err);
            });






        //pixiViewport.current.addChild(textMesh.current);


        //setup renderer with canvas
        pixiRenderer.current = new PIXI.Renderer({ width: userWindowWidth, height: userWindowHeight, backgroundColor: 0x0a0a0a, antialias: true, view: renderCanvas.current, resolution: 2, autoDensity: true });
        //0x343332
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
            //.clamp({ left: 0, top: 0, right: 2000, bottom: 2000 })
            .clampZoom({ minScale: 4.5, maxScale: 20 })
            .moveCenter(665, 210)




        path.current = d3.geoPath(null, graphics.current);
        projPath.current = d3.geoPath(projection, graphics.current);

        viewport.addChild(graphics.current);

        pixiRenderer.current.render(stage.current);

        pixiViewport.current = viewport;



        textMesh.current = createTextMesh();
        textMesh.current.cacheAsBitmap = false;



        loadFont(bitmapFont, (error, font) => {
            loadedFont.current = true;
            updateText(font, textMesh.current.geometry);
        });

        

    }, []);




    useEffect(() => {

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

        function loop() {


            graphics.current.clear();


            //draw states and US outline
            graphics.current.lineStyle(2.0 / pixiViewport.current.transform.scale.x, 0x696969, 1);
            path.current(usMap);
            path.current(usOutline);


            graphics.current.lineStyle(0 / pixiViewport.current.transform.scale.x, 0x191a1a, 1);
            //can refactor this block easily, pull everything out except the currentframe update (maybe?)
            if (radarFrames !== null) {

                if (isAnimating) {
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
                    
                    incrementCurrentFrame();
                }
                else {
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




                if (loadedFont.current !== false) {
                    //Updating text
                    
                    textMesh.current.material.uniforms.drawUV = false;
                    textMesh.current.material.uniforms.drawDistance = false;
                    textMesh.current.material.uniforms.smoothing = 0.05 / pixiViewport.current.transform.scale.x;
                    textMesh.current.material.uniforms.buffer = .27;
                    textMesh.current.material.uniforms.outlineSize = .25;
                    textMesh.current.material.uniforms.uScale = 0.4 / pixiViewport.current.transform.scale.x;
                    

                }





            }



            pixiRenderer.current.render(stage.current);

        }

        textMesh.current.material.uniforms.drawUV = false;
        textMesh.current.material.uniforms.drawDistance = false;
        textMesh.current.material.uniforms.smoothing = 0.05 / pixiViewport.current.transform.scale.x;
        textMesh.current.material.uniforms.buffer = .27;
        textMesh.current.material.uniforms.outlineSize = .25;
        textMesh.current.material.uniforms.uScale = 0.4 / pixiViewport.current.transform.scale.x;
        pixiViewport.current.addChild(textMesh.current);

        //setup ticker/animation loop
        pixiTicker.current.destroy();

        pixiTicker.current = new PIXI.Ticker();
        pixiTicker.current.add(loop, PIXI.UPDATE_PRIORITY.LOW);

        pixiTicker.current.start();

    }, [radarFrames, isAnimating]);


    const incrementCurrentFrame = () => {
        currentFrame.current = (currentFrame.current + 1) % 6;
        sliderRef.current.noUiSlider.set(currentFrame.current)
        
    }

    const decrementCurrentFrame = () => {
        currentFrame.current = (currentFrame.current - 1 + 6) % 6;
        sliderRef.current.noUiSlider.set(currentFrame.current)
    }


    const onStartStopButtonClick = () => {
        setIsAnimating(prev => !prev);
    }

    const onRightArrowButtonClick = () => {
        incrementCurrentFrame();
    }

    const onLeftArrowButtonClick = () => {

        decrementCurrentFrame();
    }

    const onSliderChange = (value) => {

        currentFrame.current = parseInt(value[0],10);



    }

   


    

    
    return (

        <div style={{ position: 'relative' }}>

            <canvas style={{ position: 'absolute', width: userWindowWidth, height: userWindowHeight }} ref={renderCanvas}>

            </canvas>



            <ControlButtonsContainer userWindowHeight={userWindowHeight} userWindowWidth={userWindowWidth}>
                <Grid direction="column" container>
                    <Grid item>
                      
                        <div style={{margin: 3}} ref={sliderRef}>

                        </div>

                    </Grid>
                    <Grid container>
                        <ControlButton userWindowHeight={userWindowHeight} userWindowWidth={userWindowWidth} onClick={onLeftArrowButtonClick} ><img alt="left arrow" src={leftArrowButtonImage}></img></ControlButton>
                        <ControlButton userWindowHeight={userWindowHeight} userWindowWidth={userWindowWidth} onClick={onStartStopButtonClick} ><img alt="start/pause button" src={isAnimating ? pauseButtonImage : playButtonImage}></img></ControlButton>
                        <ControlButton userWindowHeight={userWindowHeight} userWindowWidth={userWindowWidth} onClick={onRightArrowButtonClick} ><img alt="right arrow" src={rightArrowButtonImage}></img></ControlButton>
                    </Grid>
                </Grid>

            </ControlButtonsContainer>




        </div>






    )
}

export default Map;












