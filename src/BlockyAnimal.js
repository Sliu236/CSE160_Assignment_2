// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
/*[student's name: Size Liu]
[sliu236@ucsc.edu 1852375]

Notes to Grader:
[N/A]*/
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  void main() {
    gl_Position = u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
  }`


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
let u_ModelMatrix;
let u_GlobalRotateMatrix;
let g_globalAngle = 0.0;
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

    gl.enable(gl.DEPTH_TEST);
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

    u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    if (!u_ModelMatrix) {
      console.log('Failed to get the storage location of u_ModelMatrix');
      return;
    }

    u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
    if (!u_GlobalRotateMatrix) {
      console.log('Failed to get the storage location of u_GlobalRotateMatrix');
      return;
    }

    var identitiyM = new Matrix4();
    gl.uniformMatrix4fv(u_ModelMatrix, false, identitiyM.elements);
}

const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;

// Global variables
let g_selectedColor = [1.0, 1.0, 1.0, 1.0]; // White
let g_selectedSize = 5; // Default point size
let g_selectedType = POINT;
let g_selectedSegments = 10;
let g_yellowAngle = 0.0;
let g_magentaAngle = 0;
let g_yellowAnimation = false;

function addActionForHtmlUI() {
  // Button Event
  document.getElementById('AnimationYellowOnButton').addEventListener('click', function() { g_yellowAnimation=true;});
  document.getElementById('AnimationYellowOffButton').addEventListener('click', function() { g_yellowAnimation=false;});
  
  // Yellow
  document.getElementById('yellowSlide').addEventListener('mousemove', function() {g_yellowAngle = this.value; renderAllShapes();}); // Yellow
  document.getElementById('megenta').addEventListener('mousemove', function() {g_magentaAngle = this.value; renderAllShapes();}); // magenta
  // Camera
  document.getElementById('angleSlide').addEventListener('mousemove', function() { g_globalAngle = this.value; renderAllShapes();}); // Angle
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
  gl.clearColor(0.678, 0.847, 1, 1.0);

  // Clear <canvas>
  // gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  //renderAllShapes(); // Render all shapes

  requestAnimationFrame(tick);
}

var g_startTime = performance.now() / 1000.0;
var g_seconds = performance.now()/1000.0 - g_startTime;

function tick() {
  console.log(performance.now());

  g_seconds = performance.now()/1000.0 - g_startTime;

  updateAnimationAngles();

  renderAllShapes();

  requestAnimationFrame(tick);
}

function updateAnimationAngles() {
  if (g_yellowAnimation) {
    g_yellowAngle = 45*Math.sin(g_seconds);
  }
}


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

function renderFishBody() {
  let fishHeights = [1, 2, 2.5, 3.5, 5.2, 4.3, 3.5, 2.5, 4.0, 5];

  let fishColors = [
    [1.0, 0.5, 0.0, 1.0],  
    [1.0, 0.5, 0.0, 1.0],  
    [1.0, 1.0, 1.0, 1.0],  
    [1.0, 0.5, 0.0, 1.0],  
    [0.0, 0.0, 0.0, 1.0],  
    [1.0, 1.0, 1.0, 1.0],  
    [1.0, 0.5, 0.0, 1.0],  
    [1.0, 1.0, 1.0, 1.0],  
    [1.0, 0.5, 0.0, 1.0],  
    [0.0, 0.0, 0.0, 1.0]   
  ];

  let baseWidth = 0.08;   
  let baseDepth = 0.1;    
  let heightFactor = 0.1; 

  let eyeSize = 0.05;        
  let eyeOffsetZ = baseDepth / 2; 


  let gap = 0.01;


  let totalWidth = fishHeights.length * (baseWidth + gap);
  let startX = -totalWidth / 2;

  let yOffsets = [0, -0.1, -0.15, -0.25, -0.38, -0.30, -0.25, -0.15, -0.3, -0.4];

  for (let i = 0; i < fishHeights.length; i++) {
    let part = new Cube();
    part.color = fishColors[i] || [0.0, 0.5, 1.0, 1.0];

    let currentHeight = fishHeights[i] * heightFactor;
    let xPos = startX + i * (baseWidth + gap) + baseWidth / 2;
    let yPos = currentHeight / 2 + yOffsets[i];

    part.matrix.setTranslate(xPos, yPos, 0);
    part.matrix.scale(baseWidth, currentHeight, baseDepth);

    part.render();

    if (i === 1) {
      let leftEye = new Cube();
      let rightEye = new Cube();
      
      leftEye.color = [0.0, 0.0, 0.0, 1.0];  
      rightEye.color = [0.0, 0.0, 0.0, 1.0];

      leftEye.matrix.setTranslate(xPos, yPos + 0.07, eyeOffsetZ + 0.05);
      leftEye.matrix.scale(eyeSize, eyeSize, eyeSize * 0.1); 
      leftEye.render();

      rightEye.matrix.setTranslate(xPos, yPos + 0.07, -eyeOffsetZ + 0.04);
      rightEye.matrix.scale(eyeSize, eyeSize, eyeSize * 0.4); 
      rightEye.render();
    }
  }
}





function renderAllShapes() {
  var startTime = performance.now();

  var globalRotMat = new Matrix4().rotate(g_globalAngle, 0, 1, 0);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  renderFishBody();

  var duration = performance.now() - startTime;
  sentTextToHTML("ms: " + Math.floor(duration) + " fps: " +
      Math.floor(10000/duration)/10, "numdot");
}


function sentTextToHTML(text, htmlID) {
  var htmlElm = document.getElementById(htmlID);
  if(!htmlElm) {
    console.log('Failed to get' + htmlElm + 'from HTML');
    return;
  }
  htmlElm.innerHTML = text;
}









