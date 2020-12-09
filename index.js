const MODEL_PATH = './tf_model_t082_unfixed/model.json';

let BIG_SIZE = 1024;

let WIDTH_SMALL = 640;
let HEIGHT_SMALL = 480;

let height = 0;
let width = 0;

let N_FRAMES_FPS_COUNT = 20

let canvasOutput = document.getElementById("canvasOutput")
let resolution = {width: {ideal: BIG_SIZE}, height: {ideal: BIG_SIZE}};
let video = document.getElementById("video");
const cv = window.cv;
let streaming = false;
let stream = null;
let videoCapture = null;
let frame = null
let size_small = null
let frame_small = null


let timeForFPSCount = performance.now();
let timeForFPSCountOld = timeForFPSCount;
let frameIndex = 0
let FPS = 0.0

let net = null;

function roundAdvanced(inp) {
    return Math.floor(10.0 * (inp + 0.5)) / 10.0;
}

function startCamera() {
  if (streaming) return;
  navigator.mediaDevices.getUserMedia({video: resolution, audio: false})
    .then(function(s) {
    stream = s;
    video.srcObject = s;
    video.play();
    function step() {
      if (streaming) {
          let isCountFPS = frameIndex % N_FRAMES_FPS_COUNT == 0;
          
          if (isCountFPS) {
              timeForFPSCount = performance.now();
          }
          
          videoCapture.read(frame);
          
          cv.resize(frame, frame_small, size_small, 0, 0, cv.INTER_LINEAR);
          cv.putText(frame_small, `FPS: ${roundAdvanced(FPS)}  ${frameIndex}  ${width}x${height}`, {x: 10, y: 15}, cv.FONT_HERSHEY_SIMPLEX, 0.4, [255, 0, 0, 255]);
          cv.imshow('canvasOutput', frame_small);
          
          
          
          if (isCountFPS) {
              let timeDelta = timeForFPSCount - timeForFPSCountOld;
              let timeDeltaSec = timeDelta / 1000;
              FPS = N_FRAMES_FPS_COUNT / timeDeltaSec;
              timeForFPSCountOld = timeForFPSCount;
          }
          
          frameIndex += 1;
      }
      //canvasOutputContext.drawImage(video, 0, 0);
      requestAnimationFrame(step)
    }
    requestAnimationFrame(step);
  })
    .catch(function(err) {
    console.log("An error occured! " + err);
  });

  video.addEventListener("canplay", function(ev){
    if (!streaming) {
      height = video.videoHeight;
      width = video.videoWidth;
      video.setAttribute("width", width);
      video.setAttribute("height", height);
      streaming = true;
      videoCapture = new cv.VideoCapture(video);
      frame = new cv.Mat(height, width, cv.CV_8UC4);
      size_small = new cv.Size(WIDTH_SMALL, HEIGHT_SMALL);
      frame_small = new cv.Mat(HEIGHT_SMALL, WIDTH_SMALL, cv.CV_8UC4);
    }
  }, false);
}

const main = async () => {
  net = await tf.loadGraphModel(MODEL_PATH);
  startCamera();
}

main();
