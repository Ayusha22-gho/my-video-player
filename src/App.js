import React, { useState,useEffect,useRef } from "react";
import { fabric } from "fabric";
import * as faceapi from "face-api.js";
import "./App.css"
import "face-api.js";
function App() {
  const [videoUrl, setVideoUrl] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);

  let fabricCanvas;
  const videoRef = useRef();
  const canvasRef = useRef();

  useEffect(() => {
    const loadModels = async () => {
      try{
      await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
      await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
      await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
      console.log("Models loaded successfully");
      }catch(e){
        console.error("Error loading models",e);
      }
    };
    loadModels();
  }, []);

  const startVideo = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    console.log("video", video);
    if (!video || !fabricCanvas) {
      console.error("video referenve is null or undefined");
      return;
    }
    try {
      await video.play();
      setIsPlaying(true)
    } catch (e) {
      console.error("error playing video", e);
    }


    const displaySize = { width: canvas.width, height: canvas.height };
    faceapi.matchDimensions(canvasRef.current, displaySize);

    setInterval(async () => {
      const detections = await faceapi
        .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptors();

      const resizedDetections = faceapi.resizeResults(detections, displaySize);
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(video,0,0,canvas.width,canvas.height);
      //faceapi.draw.drawDetections(canvas, resizedDetections);
      faceapi.draw.drawDetections(canvasRef.current,resizedDetections)
      faceapi.draw.drawFaceLandmarks(canvasRef.current,resizedDetections)
      fabricCanvas.clear();
      // Draw rectangles on Fabric canvas
      resizedDetections.forEach((face) => {
        const rect = new fabric.Rect({
          left: face.detection.box.x,
          top: face.detection.box.y,
          width: face.detection.box.width,
          height: face.detection.box.height,
          fill: 'transparent',
          stroke: 'blue',
          strokeWidth: 1,
          selectable: false,
        });
        fabricCanvas.add(rect);

      });
    }, 100);
  };

  const handleVideoUpload = (e) => {
    const file = e.target.files[0];
    console.log(file);
    if(!file || file.type !== 'video/mp4'){
      console.error('Please upload a valid mp4 format video');
    }
    const videoObject = URL.createObjectURL(file);
    setVideoUrl(videoObject);
    const video = videoRef.current;
    // const canvas = canvasRef.current;
    console.log("video current from handleVideoupload", video);
    video.src = videoObject;
    video.load();

    video.onloadedmetadata = () => {
      console.log("onloadedmetadata");
      fabricCanvas = new fabric.Canvas("canvas_id");
      const fabricVideo = new fabric.Image(video, {
        left: 0,
        top: 0,
        width: video.width,
        height: video.height,
        selectable: false,
      });
      fabricCanvas.add(fabricVideo);
      startVideo();
    };
  };
  const togglePlayPause = () => {
    const video = videoRef.current;
    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };
  return (
    <div className="video-container">
      <label className = "uploadField">
      <input type="file" accept="video/*" onChange={handleVideoUpload} />
      </label>
      <video
      className="video"
        ref={videoRef}
        width={100}
        height={100}
        onEnded={() => setIsPlaying(false)}
      />
      <div  id="canvas-id">
      <canvas
      width={640}
      height={360}
       ref = {canvasRef}/>
      </div>
    
      <button className = "upload-button" onClick={togglePlayPause}>{isPlaying ? "Pause" : "Play"}</button>
    </div>
  );
}
export default App;
