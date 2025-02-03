// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
/*[student's name: Size Liu]
[sliu236@ucsc.edu 1852375]

Notes to Grader:
[N/A]*/
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'uniform float u_Size;\n' +
  'void main() {\n' +
  '  gl_Position = a_Position;\n' +
  '  gl_PointSize = u_Size;\n' +
  '}\n';

// Fragment shader program
var FSHADER_SOURCE =
  'precision mediump float;\n' +
  'uniform vec4 u_FragColor;\n' + 
  'void main() {\n' +
  '  gl_FragColor = u_FragColor;\n' +
  '}\n';


let canvas;
let gl;
let a_Position;
let u_FragColor;
let u_Size;
let isRandomColorMode = false;

function setupWebGL() {
    // Retrieve <canvas> element
    canvas = document.getElementById('webgl');

    // Get the rendering context for WebGL
    //gl = getWebGLContext(canvas);
    gl = canvas.getContext('webgl', {preserveDrawingBuffer: true});
    if (!gl) {
      console.log('Failed to get the rendering context for WebGL');
      return;
    }
}

function connectVariablesToGLSL() { 
    // Initialize shaders
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
      console.log('Failed to intialize shaders.');
      return;
    }
  
    // // Get the storage location of a_Position
    a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
      console.log('Failed to get the storage location of a_Position');
      return;
    }
  
    // Get the storage location of u_FragColor
    u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
    if (!u_FragColor) {
      console.log('Failed to get the storage location of u_FragColor');
      return;
    }

    u_Size = gl.getUniformLocation(gl.program, 'u_Size');
    if(!u_Size) {
      console.log('Failed to get the storage location of u_Size');
      return;
    }
}

const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;

// Global variables
let g_selectedColor = [1.0, 1.0, 1.0, 1.0]; // White
let g_selectedSize = 5; // Default point size
let g_selectedType = POINT;
let g_selectedSegments = 10;

function addActionForHtmlUI() {

  document.getElementById('green').onclick = function() { g_selectedColor = [0.0,1.0,0.0,1.0]; }; // Green
  document.getElementById('red').onclick = function() { g_selectedColor = [1.0,0.0,0.0,1.0]; }; // Red
  document.getElementById('blue').onclick = function() { g_selectedColor = [0.0,0.0,1.0,1.0]; }; // Blue
  document.getElementById('clearButton').onclick = function() { g_shapeList = []; renderAllShapes()}; // Clear
  document.getElementById('drawPicture').onclick = function() {drawPicture();}; // Draw Picture
  document.getElementById('enableRandomColor').onclick = function() { isRandomColorMode = true; console.log('Randon mode enabled, have fun!');}; 
  document.getElementById('disableRandomColor').onclick = function() { isRandomColorMode = false; reseteverything(); console.log('Randon mode disabled, you can select color now!');};

  document.getElementById('pointButton').onclick = function() { g_selectedType = POINT}; // Point
  document.getElementById('triButton').onclick = function() { g_selectedType = TRIANGLE}; // Triangle
  document.getElementById('circleButton').onclick = function() { g_selectedType = CIRCLE}; // Triangle
  // slider event handling
  document.getElementById('redSlide').addEventListener('mouseup', function() { g_selectedColor[0] = this.value/100; }); // Red
  document.getElementById('greenSlide').addEventListener('mouseup', function() { g_selectedColor[1] = this.value/100; }); // Green
  document.getElementById('blueSlide').addEventListener('mouseup', function() { g_selectedColor[2] = this.value/100; }); // Blue

  // Size slider event handling
  document.getElementById('sizeSlide').addEventListener('mouseup', function() { g_selectedSize = this.value; }); // Size
  document.getElementById('segmentSlide').addEventListener('mouseup', function() {g_selectedSegments = parseInt(this.value); }); // Size
}

function getRandomColor() {
  return [Math.random(), Math.random(), Math.random(), 1.0];
}

function main() {

  setupWebGL(); // WebGL Initialization

  connectVariablesToGLSL(); // GLSL Variables Connection

  addActionForHtmlUI(); // HTML UI Event Handling

  // Register function (event handler) to be called on a mouse press
  //canvas.onmousedown = click;
  canvas.onmousedown = click;
  canvas.onmousemove  = function(ev) { if (ev.buttons == 1) click(ev); }; // click and drag

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);
}


var g_shapeList = [];

//var g_points = [];  // The array for the position of a mouse press
//var g_colors = [];  // The array to store the color of a point
//var g_sizes = [];  // The array to store the size of a point


function click(ev) {

  let [x, y] = convertCoordinatesEventToGL(ev);

  let point;
  if(isRandomColorMode) {
    let randomType = Math.floor(Math.random() * 3); // randon type
    g_selectedType = randomType;

    let randomSize = Math.random() * 0 + 55; // random size
    g_selectedSize = randomSize;

    g_selectedColor = getRandomColor();
  }
  if(g_selectedType == POINT) { 
    point = new Point();
  } else if (g_selectedType == TRIANGLE) { 
    point = new Triangle();
  } else if (g_selectedType == CIRCLE) { 
    point = new Circle();
  }
  point.position = [x, y];
  point.color = isRandomColorMode ? getRandomColor() : g_selectedColor.slice();
  point.size = g_selectedSize;
  g_shapeList.push(point);

  renderAllShapes();
}

function convertCoordinatesEventToGL(ev) {
  var x = ev.clientX; // x coordinate of a mouse pointer
  var y = ev.clientY; // y coordinate of a mouse pointer
  var rect = ev.target.getBoundingClientRect();

  x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
  y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);

  return ([x, y]);
}

function renderAllShapes() {

  var startTime = performance.now();

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);

  var len = g_shapeList.length;
  for(var i = 0; i < len; i++) {
    g_shapeList[i].render();
  }
  var duration = performance.now() - startTime;
  sentTextToHTML("numdots: " + len + " ms: " + Math.floor(duration) + " fps: " + Math.floor(10000/duration)/10, "numdot");
}

function sentTextToHTML(text, htmlID) {
  var htmlElm = document.getElementById(htmlID);
  if(!htmlElm) {
    console.log('Failed to get' + htmlElm + 'from HTML');
    return;
  }
  htmlElm.innerHTML = text;
}

function resetCanvas() {
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);
}

function reseteverything() {
  g_selectedColor = [1.0, 1.0, 1.0, 1.0];
  g_selectedSize = 5;
  g_selectedType = POINT;
  g_selectedSegments = 10;

  document.getElementById('redSlide').value = g_selectedColor[0] * 100;
  document.getElementById('greenSlide').value = g_selectedColor[1] * 100;
  document.getElementById('blueSlide').value = g_selectedColor[2] * 100;
  document.getElementById('sizeSlide').value = g_selectedSize;
  document.getElementById('segmentSlide').value = g_selectedSegments;
  resetCanvas();
}


function drawPicture() {
  gl.clearColor(0.53, 0.80, 0.98, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Left fuseelage（white)
  gl.uniform4f(u_FragColor, 1.0, 1.0, 1.0, 1.0); 
  drawTriangle([0.0, 0.5, -0.05, 0.45, 0.0, 0.4]);
  drawTriangle([-0.05, 0.45, -0.1, 0.4, 0.0, 0.4]);
  drawTriangle([-0.1, 0.4, 0.0, 0.4, -0.1, 0.3]);
  drawTriangle([0.0, 0.4, -0.1, 0.3, 0.0, 0.2]);
  drawTriangle([-0.1, 0.3, 0.0, 0.2, -0.1, 0.1]);
  drawTriangle([0.0, 0.2, -0.1, 0.1, 0.0, 0.0]);
  drawTriangle([-0.1, 0.1, 0.0, 0.0, -0.1, -0.1]);
  drawTriangle([0.0, 0.0, -0.1, -0.1, 0.0, -0.2]);
  drawTriangle([-0.1, -0.1, 0.0, -0.2, -0.1, -0.3]);
  drawTriangle([0.0, -0.2, -0.1, -0.3, 0.0, -0.3]);
  drawTriangle([-0.1, -0.4, 0.0, -0.3, -0.1, -0.3]);

  // right fuseelage（white)
  drawTriangle([0.0, 0.5, 0.05, 0.45, 0.0, 0.4]);
  drawTriangle([0.05, 0.45, 0.1, 0.4, 0.0, 0.4]);
  drawTriangle([0.1, 0.4, 0.0, 0.4, 0.1, 0.3]);
  drawTriangle([0.0, 0.4, 0.1, 0.3, 0.0, 0.2]);
  drawTriangle([0.1, 0.3, 0.0, 0.2, 0.1, 0.1]);
  drawTriangle([0.0, 0.2, 0.1, 0.1, 0.0, 0.0]);
  drawTriangle([0.1, 0.1, 0.0, 0.0, 0.1, -0.1]);
  drawTriangle([0.0, 0.0, 0.1, -0.1, 0.0, -0.2]);
  drawTriangle([0.1, -0.1, 0.0, -0.2, 0.1, -0.3]);
  drawTriangle([0.0, -0.2, 0.1, -0.3, 0.0, -0.3]);
  drawTriangle([0.1, -0.4, 0.0, -0.3, 0.1, -0.3]);

  // left engine（green)
  gl.uniform4f(u_FragColor, 0.0, 1.0, 0.0, 1.0); 
  drawTriangle([-0.2, 0.3, -0.2, 0.2, -0.1, 0.3]);

  // right engine（green)
  drawTriangle([0.2, 0.2, 0.2, 0.3, 0.1, 0.3]);

  // left wing（blue）
  gl.uniform4f(u_FragColor, 0.0, 0.0, 1.0, 1.0); 
  drawTriangle([-0.1, 0.3, -0.1, 0.0, -0.2, 0.0]);
  drawTriangle([-0.1, 0.3, -0.2, 0.0, -0.3, 0.2]);
  drawTriangle([-0.2, 0.0, -0.3, 0.0, -0.3, 0.2]);
  drawTriangle([-0.3, 0.0, -0.4, 0.0, -0.3, 0.2]);
  drawTriangle([-0.4, 0.0, -0.3, 0.2, -0.5, 0.1]);
  drawTriangle([-0.5, 0.1, -0.5, 0.0, -0.4, 0.0]);

  // right wing（blue）
  drawTriangle([0.1, 0.3, 0.1, 0.0, 0.2, 0.0]);
  drawTriangle([0.1, 0.3, 0.2, 0.0, 0.3, 0.2]);
  drawTriangle([0.2, 0.0, 0.3, 0.0, 0.3, 0.2]);
  drawTriangle([0.3, 0.0, 0.4, 0.0, 0.3, 0.2]);
  drawTriangle([0.4, 0.0, 0.3, 0.2, 0.5, 0.1]);
  drawTriangle([0.5, 0.1, 0.5, 0.0, 0.4, 0.0]);

  // left tail wing（yellow and red）
  gl.uniform4f(u_FragColor, 1.0, 1.0, 0.0, 1.0); 
  drawTriangle([-0.1, -0.2, -0.3, -0.3, -0.3, -0.4]);
  gl.uniform4f(u_FragColor, 1.0, 0.0, 0.0, 1.0); 
  drawTriangle([-0.1, -0.2, -0.1, -0.3, -0.3, -0.35]);

  // right tail wing（yellow and red）
  gl.uniform4f(u_FragColor, 1.0, 1.0, 0.0, 1.0); 
  drawTriangle([0.1, -0.2, 0.3, -0.3, 0.3, -0.4]);
  gl.uniform4f(u_FragColor, 1.0, 0.0, 0.0, 1.0); 
  drawTriangle([0.1, -0.2, 0.1, -0.3, 0.3, -0.35]);

  document.getElementById('clearButton').onclick = function() { resetCanvas();}; // Clear
}





