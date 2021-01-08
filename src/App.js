import './App.css';
import { useEffect, useRef,useState } from "react";

import React from "react"

function App() {

  const canvasRef = useRef(null);
  


  useEffect(() => {
    var canvas = canvasRef.current;

    
    
    

    canvas.width = 800;
    canvas.height = 800;

    // wheel event must not be passive to allow default action to be prevented
    canvas.addEventListener("wheel", trackWheel, { passive: false });
    //canvas.addEventListener("mousemove", move)
    canvas.addEventListener("mousedown", move)
    canvas.addEventListener("mouseup", move)
    canvas.addEventListener("mouseout", move) // to stop mouse button locking up 

    draw();

  }, []);


  // draw everything in pixels coords
  function draw() {
    var canvas = canvasRef.current;
    var context = canvas.getContext("2d");


    context.clearRect(0, 0, canvas.width, canvas.height);


    function toRadians(angle) {
      return (angle * Math.PI) / 180;
    }

    function poly(startx, starty, to1x, to1y, to2x, to2y, to3x, to3y, context) {
      var colors = ["rgba(125, 200, 10, 0.2)", "rgba(125, 50, 255, 0.2)", "rgba(10, 40, 230, 0.2)"]

      

      //context.fillStyle = "rgba(125, 200, 10, 0.5)";
      context.fillStyle = colors[Math.floor(Math.random() * 3)];
      context.beginPath();
      context.moveTo(zoomedX(startx) + 100, zoomedY(starty) + 100);
      context.lineTo(zoomedX(to1x) + 100, zoomedY(to1y) + 100);
      context.lineTo(zoomedX(to2x) + 100, zoomedY(to2y) + 100);
      context.lineTo(zoomedX(to3x) + 100, zoomedY(to3y) + 100);
      context.closePath();
      context.fill();
    }



    var spacing = 5;
    var angle = 1;


    for (var radialDist = 5; radialDist <= 1000; radialDist += 5) {
      for (var pos = 0; pos < 360; pos += angle) {


        poly(radialDist * Math.sin(toRadians(pos)), radialDist * -1 * Math.cos(toRadians(pos)), radialDist * Math.sin(toRadians(pos + angle)), radialDist * -1 * Math.cos(toRadians(pos + angle)), (spacing + radialDist) * Math.sin(toRadians(pos + angle)), (spacing + radialDist) * -1 * Math.cos(toRadians(pos + angle)), (spacing + radialDist) * Math.sin(toRadians(pos)), (spacing + radialDist) * -1 * Math.cos(toRadians(pos)), context);


      }
    }





  }

  // lazy programmers globals
  var scale = 1;
  var wx = 0; // world zoom origin
  var wy = 0;
  var sx = 0; // mouse screen pos
  var sy = 0;

  var mouse = {};
  mouse.x = 0; // pixel pos of mouse
  mouse.y = 0;
  mouse.rx = 0; // mouse real (world) pos
  mouse.ry = 0;
  mouse.button = 0;

  function zoomed(number) { // just scale
    return Math.floor(number * scale);
  }
  // converts from world coord to screen pixel coord
  function zoomedX(number) { // scale & origin X
    return Math.floor((number - wx) * scale + sx);
  }

  function zoomedY(number) { // scale & origin Y
    return Math.floor((number - wy) * scale + sy);
  }

  // Inverse does the reverse of a calculation. Like (3 - 1) * 5 = 10   the inverse is 10 * (1/5) + 1 = 3
  // multiply become 1 over ie *5 becomes * 1/5  (or just /5)
  // Adds become subtracts and subtract become add.
  // and what is first become last and the other way round.

  // inverse function converts from screen pixel coord to world coord
  function zoomedX_INV(number) { // scale & origin INV
    return Math.floor((number - sx) * (1 / scale) + wx);
    // or return Math.floor((number - sx) / scale + wx);
  }

  function zoomedY_INV(number) { // scale & origin INV
    return Math.floor((number - sy) * (1 / scale) + wy);
    // or return Math.floor((number - sy) / scale + wy);
  }


  //below here are functions for mouse events


  function move(event) { // mouse move event

    var canvas = canvasRef.current;
    var context = canvas.getContext("2d");
    if (event.type === "mousedown") {
      mouse.button = 1;
    }
    else if (event.type === "mouseup" || event.type === "mouseout") {
      mouse.button = 0;
    }

    mouse.bounds = canvas.getBoundingClientRect();
    mouse.x = event.clientX - mouse.bounds.left;
    mouse.y = event.clientY - mouse.bounds.top;
    var xx = mouse.rx; // get last real world pos of mouse
    var yy = mouse.ry;

    mouse.rx = zoomedX_INV(mouse.x); // get the mouse real world pos via inverse scale and translate
    mouse.ry = zoomedY_INV(mouse.y);
    if (mouse.button === 1) { // is mouse button down 
      wx -= mouse.rx - xx; // move the world origin by the distance 
      // moved in world coords
      wy -= mouse.ry - yy;
      // recaculate mouse world 
      mouse.rx = zoomedX_INV(mouse.x);
      mouse.ry = zoomedY_INV(mouse.y);
    }
    draw();
  }

  function trackWheel(e) {

    if (e.deltaY < 0) {
      scale = Math.min(5, scale * 1.1); // zoom in
    } else {
      scale = Math.max(0.1, scale * (1 / 1.1)); // zoom out is inverse of zoom in
    }
    wx = mouse.rx; // set world origin
    wy = mouse.ry;
    sx = mouse.x; // set screen origin
    sy = mouse.y;
    mouse.rx = zoomedX_INV(mouse.x); // recalc mouse world (real) pos
    mouse.ry = zoomedY_INV(mouse.y);

    draw();
    e.preventDefault(); // stop the page scrolling
  }

  








  return (
    <canvas ref={canvasRef}></canvas>
  );
}

export default App;
