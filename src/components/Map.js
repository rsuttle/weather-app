import React, { useEffect, useRef, useState } from "react";
import dotenv from "dotenv";
import * as d3 from "d3";
import * as PIXI from "pixi.js";
import { Viewport } from "pixi-viewport";
import axios from "axios";
import { createTextMesh, updateText } from "./textRendering";
import { Grid } from "@material-ui/core"
import noUiSlider from 'nouislider';
import 'nouislider/distribute/nouislider.css';

import bitmapFont from '../assets/sdf.fnt';
import rightArrowButtonImage from '../assets/right-arrow.svg'
import leftArrowButtonImage from '../assets/left-arrow.svg'
import playButtonImage from '../assets/playButton.svg'
import pauseButtonImage from '../assets/pauseButton.svg'
import smallColorLegend from "../assets/smallColorLegend.png"
import largeColorLegend from "../assets/colorLegend.png"

import ControlButton from "../styles/ControlButton";

import {citiesAndLocations} from "../constants/citiesAndLocations";

const loadFont = require('load-bmfont');
const usMap = require('../assets/simplifiedUsTopoJson.json');
const usOutline = require('../assets/usOutline.json');

export var citiesList = [];
export var projectedCitiesLocations = [];

dotenv.config();

var projection = d3.geoAlbersUsa().scale(1300).translate([487.5, 305]);
for (const city in citiesAndLocations) {
    citiesList.push(city);
    projectedCitiesLocations.push(projection(citiesAndLocations[city]));
}

const Map = () => {

    const userWindowWidth = window.innerWidth;
    const userWindowHeight = window.innerHeight;

    const [radarFrames, setRadarFrames] = useState(null);
    const [isAnimating, setIsAnimating] = useState(false);
    const [startTime, setStartTime] = useState(null);
    const [currentTime,setCurrentTime] = useState(null);
    const [minutesPerFrame,setMinutesPerFrame] = useState(0);
    
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
    const numberOfFrames = useRef(0);

    useEffect(() => {
        

        //Retrieve initial data
        axios.get('http://192.168.0.5:8000')
            .then((response) => {
                numberOfFrames.current = response.data.dataFrames.length;
                
                //"True" (non-interpolated) frames are 3 hours apart
                var minPerFrame = 3*60/(response.data.numInterpolatedFrames+1);
                minPerFrame = round(minPerFrame,5);
                
                setMinutesPerFrame(minPerFrame);
                setStartTime(new Date(response.data.startTime));
                setCurrentTime(new Date(response.data.startTime));
                setRadarFrames(response.data.dataFrames);
            })
            .catch((err) => {
                console.log(err);
            });

        //Set up renderer using canvas ref
        pixiRenderer.current = new PIXI.Renderer({ width: userWindowWidth, height: userWindowHeight, backgroundColor: 0x0a0a0a, antialias: true, view: renderCanvas.current, autoDensity: true, resolution: 2, autoResize: true});
        
        //Create viewport and add to stage
        const viewport = new Viewport({
            screenWidth: userWindowWidth,
            screenHeight: userWindowHeight,
            worldWidth: 2000,
            worldHeight: 2000,
            interaction: pixiRenderer.current.plugins.interaction
        });
        stage.current.addChild(viewport);

        //Initialize viewport settings
        viewport
            .drag()
            .pinch()
            .wheel()
            .decelerate()
            .clamp({ left: 550, right: 750, bottom: 315, top: 90 })
            // .clamp({ left: 480, right: 800, bottom: 350, top: 50 })
            //.clamp({ left: 0, top: 0, right: 2000, bottom: 2000 })
            .clampZoom({ minScale: 3.7, maxScale: 20 })
            .moveCenter(665, 210)


        path.current = d3.geoPath(null, graphics.current);
        projPath.current = d3.geoPath(projection, graphics.current);

        viewport.addChild(graphics.current);

        pixiRenderer.current.render(stage.current);

        pixiViewport.current = viewport;

        textMesh.current = createTextMesh();
        textMesh.current.cacheAsBitmap = false;

        loadFont(bitmapFont, (error, font) => {
            if(error) console.log(error);
            loadedFont.current = true;
            updateText(font, textMesh.current.geometry);
        });

    }, []);

    //Initialize slider
    useEffect(() => {
        
        if(sliderRef.current.noUiSlider == null){
            noUiSlider.create(sliderRef.current, {
                start: [0],
                animate: false,
                connect: true,
                step: 1,
                range: {
                    'min': 0,
                    'max': 256 //numberOfFrames.current-1
                }
            });
        }else{
            sliderRef.current.noUiSlider.on("slide", onSliderChange);
        }
    
    },[startTime])

    //For each array element, convert to a base16 string
    //Add zero if we get only one character. From https://stackoverflow.com/questions/13070054/convert-rgb-strings-to-hex-in-javascript
    function convertRGBStringToHex(rgb){
        var a = rgb.split("(")[1].split(")")[0];
        a = a.split(",");
        var b = a.map(function(x){             
            x = parseInt(x).toString(16);      
            return (x.length===1) ? "0"+x : x;  
        });

        b = "0x"+b.join("")
        return b;
    }

    function drawCurrentFrame(frameToDraw){
        var color = d3.scaleLinear().domain([0,10,30,40,50,60,80]).range(['#CCCFED','#432d69','#5ef4ff','#34BD4B','#54B82B','#EDF877','#D02D04']);

        frameToDraw.features.forEach((multipolygon) => {
            multipolygon.coordinates.forEach((polygon) => {
                var isFirst = true;
                polygon.forEach((ring) => {
                    if(isFirst){
                        graphics.current.beginFill(convertRGBStringToHex(color(multipolygon.value)),1.0);
                        graphics.current.moveTo(ring[0][0],ring[0][1]);
                        ring.forEach((coord) => {
                            graphics.current.lineTo(coord[0],coord[1]);
                        });
                        graphics.current.endFill();
                        isFirst=false;
                    }
                    else{
                        //Draw hole
                        graphics.current.beginHole();
                        graphics.current.moveTo(ring[0][0],ring[0][1]);
                        ring.forEach((coord) => {
                            graphics.current.lineTo(coord[0],coord[1]);
                        });
                        graphics.current.endHole();

                    }
                })
            })
        })
    }

    useEffect(() => {
        
        function loop() {
            
            graphics.current.clear();
            graphics.current.lineStyle(0 / pixiViewport.current.transform.scale.x, 0x191a1a, 1);

            if(radarFrames === null){
                pixiRenderer.current.render(stage.current);
                return;
            }

            var frameToDraw = radarFrames[currentFrame.current];
            drawCurrentFrame(frameToDraw);

            if (isAnimating) incrementCurrentFrame();

            //Draw states and US outline
            graphics.current.lineStyle(2.0 / pixiViewport.current.transform.scale.x, 0x111222, 1);
            path.current(usMap);
            path.current(usOutline);

            //If text has loaded, update uniforms for text shader
            if (loadedFont.current !== false) {
                textMesh.current.material.uniforms.drawUV = false;
                textMesh.current.material.uniforms.drawDistance = false;
                textMesh.current.material.uniforms.smoothing = 0.05 / pixiViewport.current.transform.scale.x;
                textMesh.current.material.uniforms.buffer = .27;
                textMesh.current.material.uniforms.outlineSize = .25;
                textMesh.current.material.uniforms.uScale = 0.4 / pixiViewport.current.transform.scale.x;
            }
                
            pixiRenderer.current.render(stage.current);   
        }

        //Set initial values for shader uniforms
        textMesh.current.material.uniforms.drawUV = false;
        textMesh.current.material.uniforms.drawDistance = false;
        textMesh.current.material.uniforms.smoothing = 0.05 / pixiViewport.current.transform.scale.x;
        textMesh.current.material.uniforms.buffer = .27;
        textMesh.current.material.uniforms.outlineSize = .25;
        textMesh.current.material.uniforms.uScale = 0.4 / pixiViewport.current.transform.scale.x;
        pixiViewport.current.addChild(textMesh.current);

        //Setup ticker/animation loop
        pixiTicker.current.stop();
        pixiTicker.current.destroy();

        pixiTicker.current = new PIXI.Ticker();
        pixiTicker.current.add(loop, PIXI.UPDATE_PRIORITY.HIGH);
        
        pixiTicker.current.start();

    }, [radarFrames, isAnimating, startTime]);

  

    const incrementCurrentFrame = () => {
        currentFrame.current = (currentFrame.current + 1) % numberOfFrames.current;
        sliderRef.current.noUiSlider.set(currentFrame.current);
        var newTime = new Date(startTime);
        newTime.setSeconds(startTime.getSeconds()+minutesPerFrame*currentFrame.current*60);
        setCurrentTime(newTime);
        
    }

    const decrementCurrentFrame = () => {
        currentFrame.current = (currentFrame.current - 1 + numberOfFrames.current) % numberOfFrames.current;
        sliderRef.current.noUiSlider.set(currentFrame.current);
        var newTime = new Date(startTime);
        newTime.setSeconds(startTime.getSeconds()+minutesPerFrame*currentFrame.current*60);
        setCurrentTime(newTime);
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
        currentFrame.current = parseInt(value[0],10)%numberOfFrames.current;

        var newTime = new Date(startTime);
        newTime.setSeconds(startTime.getSeconds()+minutesPerFrame*currentFrame.current*60);
        
        setCurrentTime(prev => {
           return newTime;
        });
    }

    var timeFormatter = Intl.DateTimeFormat('en-US', { timeStyle:'short'});
    var dateFormatter = Intl.DateTimeFormat('en-US', { month: "long", day: "numeric", year: "numeric" });



    
    return (

        <div style={{ position: 'relative' }}>

            <canvas style={{position: 'absolute', width: userWindowWidth, height: userWindowHeight }} ref={renderCanvas}>

            </canvas>

            <Grid style={{position:'absolute',top: userWindowHeight*8/10}} direction="column" alignItems="center" container>
                <Grid item>
                    <div style={{color: "white", backgroundColor: "rgb(31,31,31,0.8)"}}>
                        Forecast time: {timeFormatter.format(currentTime)} {dateFormatter.format(currentTime)} ET
                    </div>
                </Grid>
                <Grid item>
                    
                    <div style={{margin: 3,width: userWindowWidth/2}} ref={sliderRef}>

                    </div>

                </Grid>
                <Grid alignItems="center" justify="center" container>
                    <Grid item>
                    <ControlButton userWindowHeight={userWindowHeight} userWindowWidth={userWindowWidth} onClick={onLeftArrowButtonClick} ><img alt="left arrow" src={leftArrowButtonImage}></img></ControlButton>
                    <ControlButton userWindowHeight={userWindowHeight} userWindowWidth={userWindowWidth} onClick={onStartStopButtonClick} ><img alt="start/pause button" src={isAnimating ? pauseButtonImage : playButtonImage}></img></ControlButton>
                    <ControlButton userWindowHeight={userWindowHeight} userWindowWidth={userWindowWidth} onClick={onRightArrowButtonClick} ><img alt="right arrow" src={rightArrowButtonImage}></img></ControlButton>
                    </Grid>

                </Grid>
                <Grid item>
                    {userWindowWidth>800 ?
                    <img width={600} height={50} src={largeColorLegend} alt="Color Legend"></img>
                    :
                    <img src={smallColorLegend} alt="Color Legend"></img>}
                </Grid>
            </Grid>
        </div>
    )
}

function round(numToRound, decimalPlaces){
    numToRound = numToRound * Math.pow(10,decimalPlaces);
    return numToRound/Math.pow(10,decimalPlaces);
}

export default Map;












