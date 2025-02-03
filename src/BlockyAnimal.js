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
let g_fishMoving = false;


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

function convertCoordinatesEventToGL(ev) {
  let rect = canvas.getBoundingClientRect();
  let x = ev.clientX - rect.left;
  let y = ev.clientY - rect.top;

  // 转换为 WebGL 坐标 (范围从 -1 到 1)
  x = (x - canvas.width / 2) / (canvas.width / 2);
  y = (canvas.height / 2 - y) / (canvas.height / 2);

  return [x, y];
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
let g_fishAnimation = false;
let g_bodyBendAngle = 0.0;
let g_headSwing = 0.0;
let g_tailSwing = 0.0;
let g_pitchAngle = 0.0;
let g_fishPosX = 0.0;
let g_fishPosY = 0.0;

function addActionForHtmlUI() {
  // Button Event
  document.getElementById('AnimationYellowOnButton').addEventListener('click', function() { g_fishAnimation=true;});
  document.getElementById('AnimationYellowOffButton').addEventListener('click', function() {g_fishAnimation = false; g_headSwing = 0; g_tailSwing = 0; renderAllShapes();});

  document.getElementById('bodyBendSlide').addEventListener('mousemove', function() { g_bodyBendAngle = this.value * 0.1; renderAllShapes();});
  document.getElementById('headSwingSlider').addEventListener('input', function() {g_headSwing = parseFloat(this.value);renderAllShapes();});
  document.getElementById('tailSwingSlider').addEventListener('input', function() {g_tailSwing = parseFloat(this.value);renderAllShapes();});

  
  document.getElementById('angleSlide').addEventListener('input', function() { g_globalAngle = parseFloat(this.value); renderAllShapes();});
  document.getElementById('pitchSlide').addEventListener('input', function() {g_pitchAngle = parseFloat(this.value);renderAllShapes();});

  document.getElementById('ResetFishButton').addEventListener('click', resetFish);
  document.getElementById('ResetCameraButton').addEventListener('click', resetCamera);
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
  if (g_fishAnimation) {
      g_headSwing = 15 * Math.sin(g_seconds * 2);  // 鱼头摆动
      g_tailSwing = 20 * Math.sin(g_seconds * 2 + Math.PI);  // 鱼尾反向摆动
  }

  if (g_fishMoving) {
      let speed = 0.005; // ✅ 减小速度，限制移动范围
      let angle = Math.sin(g_seconds) * Math.PI * 2;

      // 计算新的位置
      let newX = g_fishPosX + speed * Math.cos(angle);
      let newY = g_fishPosY + speed * Math.sin(angle);

      // ✅ 限制 X, Y 轴的移动范围到 [-0.5, 0.5]
      g_fishPosX = Math.max(-0.5, Math.min(0.5, newX));
      g_fishPosY = Math.max(-0.5, Math.min(0.5, newY));
  }
}



function click(ev) {
  let [x, y] = convertCoordinatesEventToGL(ev);

  if (ev.shiftKey) {
      console.log("Shift + Click detected, triggering continuous movement!");

      g_fishAnimation = true; // 开启鱼头 & 鱼尾动画
      g_fishMoving = true;  // 开启持续移动
  } else {
      g_fishMoving = false; // 停止移动
  }

  renderAllShapes();
}




function renderFishBody() {
  let fishMatrix = new Matrix4();
  fishMatrix.setTranslate(g_fishPosX, g_fishPosY, 0); // ✅ 应用全局位移

  let fishHeights = [1, 2, 2.5, 3.5, 5.2, 4.3, 3.5, 2.5, 4.0, 5];
  let fishColors = [
      [1.0, 0.5, 0.0, 1.0], [1.0, 0.5, 0.0, 1.0], [1.0, 1.0, 1.0, 1.0],
      [1.0, 0.5, 0.0, 1.0], [0.0, 0.0, 0.0, 1.0], [1.0, 1.0, 1.0, 1.0],
      [1.0, 0.5, 0.0, 1.0], [1.0, 1.0, 1.0, 1.0], [1.0, 0.5, 0.0, 1.0],
      [0.0, 0.0, 0.0, 1.0]
  ];

  let baseWidth = 0.08, baseDepth = 0.1, heightFactor = 0.1;
  let eyeSize = 0.05, eyeOffsetZ = baseDepth / 2;
  let gap = 0.01, totalWidth = fishHeights.length * (baseWidth + gap);
  let startX = -totalWidth / 2;
  let yOffsets = [0, -0.1, -0.15, -0.25, -0.38, -0.30, -0.25, -0.15, -0.3, -0.4];
  let centerX = startX + 4 * (baseWidth + gap) + baseWidth / 2;

  let decayFactor = 0.6;  

  for (let i = 0; i < fishHeights.length; i++) {
      let part = new Cube();
      part.color = fishColors[i] || [0.0, 0.5, 1.0, 1.0];

      let currentHeight = fishHeights[i] * heightFactor;
      let xPos = startX + i * (baseWidth + gap) + baseWidth / 2;
      
      let yPos = (g_bodyBendAngle > 0) ? yOffsets[4] + fishHeights[4] * heightFactor - currentHeight + 0.3 :
                 (g_bodyBendAngle < 0) ? yOffsets[4] + 0.2 :
                 yOffsets[i] + currentHeight / 2;

      part.matrix = new Matrix4(fishMatrix); // ✅ 应用全局移动
      part.matrix.translate(xPos, yPos, 0);
      
      if (i < 5) {
          let swingAngle = g_headSwing * Math.pow(decayFactor, i);
          part.matrix.translate(centerX - xPos, 0, 0);
          part.matrix.rotate(swingAngle, 0, 1, 0);
          part.matrix.translate(-(centerX - xPos), 0, 0);
      }

      if (i > 4) {
          let swingAngle = -g_tailSwing * Math.pow(decayFactor, 9 - i);
          part.matrix.translate(centerX - xPos, 0, 0);
          part.matrix.rotate(swingAngle, 0, 1, 0);
          part.matrix.translate(-(centerX - xPos), 0, 0);
      }
    
      part.matrix.scale(baseWidth, currentHeight, baseDepth);
      part.render();

      if (i === 1) {
          let leftEye = new Cube(), rightEye = new Cube();
          leftEye.color = [0.0, 0.0, 0.0, 1.0];  
          rightEye.color = [0.0, 0.0, 0.0, 1.0]; 

          let eyeX = xPos, eyeY = yPos + 0.07;
          let eyeZFront = eyeOffsetZ + 0.04, eyeZBack = -eyeOffsetZ + 0.03;

          let swingAngle = g_headSwing * Math.pow(decayFactor, 1);

          leftEye.matrix = new Matrix4(fishMatrix);
          leftEye.matrix.translate(eyeX, eyeY, eyeZFront);
          leftEye.matrix.translate(centerX - eyeX, 0, 0);
          leftEye.matrix.rotate(swingAngle, 0, 1, 0);
          leftEye.matrix.translate(-(centerX - eyeX), 0, 0);
          leftEye.matrix.scale(eyeSize, eyeSize, eyeSize * 0.5);
          leftEye.render();

          rightEye.matrix = new Matrix4(fishMatrix);
          rightEye.matrix.translate(eyeX, eyeY, eyeZBack);
          rightEye.matrix.translate(centerX - eyeX, 0, 0);
          rightEye.matrix.rotate(swingAngle, 0, 1, 0);
          rightEye.matrix.translate(-(centerX - eyeX), 0, 0);
          rightEye.matrix.scale(eyeSize, eyeSize, eyeSize * 0.5);
          rightEye.render();
      }
  }
}

function renderAllShapes() {
  var startTime = performance.now();

  var globalRotMat = new Matrix4()
      .rotate(g_globalAngle, 0, 1, 0)   // 水平旋转 (yaw)
      .rotate(g_pitchAngle, 1, 0, 0);  // 纵向旋转 (pitch)
  
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

function resetFish() {
  console.log("Resetting fish position and stopping animation.");

  g_fishMoving = false;  
  g_fishAnimation = false; 

  g_fishPosX = 0.0; 
  g_fishPosY = 0.0; 

  g_headSwing = 0.0;
  g_tailSwing = 0.0; 

  renderAllShapes(); 
}

function resetCamera() {
  console.log("Resetting camera position.");

  g_globalAngle = 0.0; 
  g_pitchAngle = 0.0; 

  renderAllShapes();
}







