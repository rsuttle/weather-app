import * as PIXI from 'pixi.js';
import { citiesList, projectedCitiesLocations } from './Map';
import texturePNG from '../assets/sdf.png';


const createLayout = require('layout-bmfont-text');
const createIndices = require('quad-indices');

function getUvs(glyphs, texWidth, texHeight, flipY) {
  const uvs = new Float32Array(glyphs.length * 4 * 2);
  let i = 0;
  glyphs.forEach(function (glyph) {
    const bitmap = glyph.data;
    const bw = (bitmap.x + bitmap.width);
    const bh = (bitmap.y + bitmap.height);

    // top left position
    const u0 = bitmap.x / texWidth;
    let v1 = bitmap.y / texHeight;
    const u1 = bw / texWidth;
    let v0 = bh / texHeight;

    if (flipY) {
      v1 = (texHeight - bitmap.y) / texHeight;
      v0 = (texHeight - bh) / texHeight;
    }

    // BL
    uvs[i++] = u0;
    uvs[i++] = v1;
    // TL
    uvs[i++] = u0;
    uvs[i++] = v0;
    // TR
    uvs[i++] = u1;
    uvs[i++] = v0;
    // BR
    uvs[i++] = u1;
    uvs[i++] = v1;
  });
  return uvs;
}

function getPositions(glyphs) {
  const positions = new Float32Array(glyphs.length * 4 * 2);
  let i = 0;
  glyphs.forEach(function (glyph) {
    const bitmap = glyph.data;

    // bottom left position
    const x = glyph.position[0] + bitmap.xoffset;
    const y = glyph.position[1] + bitmap.yoffset;

    // quad size
    const w = bitmap.width;
    const h = bitmap.height;

    // BL
    positions[i++] = x;
    positions[i++] = y;
    // TL
    positions[i++] = x;
    positions[i++] = y + h;
    // TR
    positions[i++] = x + w;
    positions[i++] = y + h;
    // BR
    positions[i++] = x + w;
    positions[i++] = y;
  });
  return positions;
}

//creates empty mesh with attrs and uniforms setup
function createTextMesh() {
  const geometry = new PIXI.Geometry();

  geometry.addAttribute('position', new Float32Array(), 2);
  geometry.addAttribute('uv', new Float32Array(), 2);
  geometry.addAttribute('scale', new Float32Array(), 2);
  geometry.addAttribute('offset', new Float32Array(), 2);
  geometry.addIndex(new Uint16Array());

  const vert = `
      #ifdef GL_FRAGMENT_PRECISION_HIGH
      precision highp float;
      #else
      precision mediump float;  
      #endif
 

      attribute vec2 position;
      attribute vec2 uv;
      attribute vec2 offset;
      attribute vec2 scale;

      varying vec2 vUv;
      varying float vScale;
      
      uniform mat3 translationMatrix;
      uniform mat3 projectionMatrix;
      uniform float uScale;

      void main() {
          vUv = uv;
          vScale = uScale;
          vec2 transformedPosition = position * uScale + offset;
          gl_Position = vec4((projectionMatrix * translationMatrix * vec3(transformedPosition, 1.0)).xy, 0.0, 1.0);
      }`;

  const frag = `
      precision mediump float;
      varying vec2 vUv;
      varying float vScale;
      uniform sampler2D tSDF;
      uniform bool drawUV;
      uniform bool drawDistance;
      uniform vec3 textColor;
      uniform vec3 outlineColor;
      uniform float buffer;
      uniform float opacity;
      uniform float outlineSize;
      uniform float smoothing;
      void main() {
          float fixedSmoothing = smoothing / vScale;
          float distance = texture2D(tSDF, vUv).a;
          float alpha = smoothstep(buffer - fixedSmoothing, buffer + fixedSmoothing, distance);
          float border = smoothstep(buffer + outlineSize - fixedSmoothing, buffer + outlineSize + fixedSmoothing, distance);
          gl_FragColor = vec4(mix(outlineColor, textColor, border), 1.) * alpha * opacity;
          if(drawUV) gl_FragColor = vec4(vUv, 0, 1);
          if(drawDistance) gl_FragColor = vec4(distance);
      }
      `;

  const material = PIXI.Shader.from(vert, frag, {
    tSDF: PIXI.Texture.from(texturePNG),
    textColor: [1, 1, 1],
    outlineColor: [0.1, 0.1, 0.1],
    smoothing: 0.1,
    buffer: 0.1,
    outlineSize: 0.1,
    opacity: 1,
    drawUV: false,
    drawDistance: false,
    uScale: 5
  });

  return new PIXI.Mesh(geometry, material);
}

function updateText(font, geometry) {
  const offsets = [];
  const scales = [];  //not currently used in shader

  //only need one offset per word, which makes sense because each vertex in the word needs to have the same
  //offset, otherwise the spacing/alignment of the words would be wrong
  for (let i = 0; i < citiesList.length; i++) {

    offsets.push(projectedCitiesLocations[i]);
    scales.push([10, 10]);


  }



  const attributes = buildMergedText(font, citiesList, offsets, scales);

  //shift vertices left by (textWidth/2), so that the middle of the word is directly over the city
  for (let i = 0; i < attributes.positions.length; i++) {
    if (i % 2 === 0) attributes.positions[i] -= 85;
  }

  geometry.getBuffer('position').update(attributes.positions);
  geometry.getBuffer('uv').update(attributes.uvs);
  geometry.getBuffer('scale').update(attributes.scales);
  geometry.getBuffer('offset').update(attributes.offsets);
  geometry.getIndex().update(attributes.indices);
}

//generates and returns attrs for each word (aka vertices of triangles)
function createTextAttributes(font, text) {
  const layout = createLayout({
    font,
    text: text,
    letterSpacing: 1,
    align: 'left',
  });

  const positions = getPositions(layout.glyphs);
  const uvs = getUvs(layout.glyphs, 512, 512, false);
  const indices = new Uint16Array(
    createIndices([], {
      clockwise: true,
      type: 'uint16',
      count: layout.glyphs.length,
    })
  );

  return { positions, uvs, indices };
}

//seems to generate pos,uv attrs every time, doesn't seem necessary
function buildMergedText(font, textArray, offsets, scales) {
  const positionsArrays = [];
  const uvsArrays = [];
  const indicesArrays = [];
  const offsetsArrays = [];
  const scalesArrays = [];

  //this is used to adjust the indices array, because there is only one pos array with all coords in it
  let maxIndex = 0;

  //loops through all 100 strings, creates the pos,uv,indices,offset,scale attrs
  //for all of them, and combines them all properly
  for (let i = 0; i < textArray.length; i++) {
    const attributeCollection = createTextAttributes(font, textArray[i]);
    const vertexCount = attributeCollection.positions.length / 2;

    for (let i = 0; i < attributeCollection.indices.length; i++) {
      attributeCollection.indices[i] += maxIndex;
    }

    maxIndex += vertexCount;

    positionsArrays.push(attributeCollection.positions);
    uvsArrays.push(attributeCollection.uvs);
    indicesArrays.push(attributeCollection.indices);

    const offsetsBuffer = fillTypedArraySequence(
      new Float32Array(vertexCount * 2),
      new Float32Array(offsets[i])
    );
    const scalesBuffer = fillTypedArraySequence(
      new Float32Array(vertexCount * 2),
      new Float32Array(scales[i])
    );
    offsetsArrays.push(offsetsBuffer);
    scalesArrays.push(scalesBuffer);
  }


  //I think this just flattens the arrays
  const mergedPositions = mergeTypedArrays(positionsArrays);
  const mergedUvs = mergeTypedArrays(uvsArrays);
  const mergedIndices = mergeTypedArrays(indicesArrays);
  const mergedOffsets = mergeTypedArrays(offsetsArrays);
  const mergedScales = mergeTypedArrays(scalesArrays);

  return {
    positions: mergedPositions,
    uvs: mergedUvs,
    indices: mergedIndices,
    offsets: mergedOffsets,
    scales: mergedScales,
  };
}


//just merges the attr arrays for different words into a single attr array (must pass each attr separately)
//typedArrays input is just a 2d array, where each row is the attr array for a single word
function mergeTypedArrays(typedArrays) {
  let length = 0;  //total number of vertices * 2  aka (number of chars *  4  * 2)

  for (let i = 0; i < typedArrays.length; i++) {
    length += typedArrays[i].length;
  }

  
  const array = new typedArrays[0].constructor(length);
  
  let currentLength = 0;

  for (let i = 0; i < typedArrays.length; i++) {
    array.set(typedArrays[i], currentLength);
    currentLength += typedArrays[i].length;
  }

  return array;
}

function fillTypedArraySequence(typedArray, sequence) {
  const length = typedArray.length;
  let sequenceLength = sequence.length;
  let position = sequenceLength;

  typedArray.set(sequence);

  while (position < length) {
    if (position + sequenceLength > length) sequenceLength = length - position;
    typedArray.copyWithin(position, 0, sequenceLength);
    position += sequenceLength;
    sequenceLength <<= 1;
  }

  return typedArray;
}


export { createTextMesh, updateText };