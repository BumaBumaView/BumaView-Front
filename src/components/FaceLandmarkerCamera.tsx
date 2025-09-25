import React, { useEffect, useRef } from "react";
import {
  FaceLandmarker,
  FilesetResolver,
  FaceLandmarkerResult,
  DrawingUtils
} from "@mediapipe/tasks-vision";

interface FaceLandmarkerCameraProps {
  onResults: (results: FaceLandmarkerResult) => void;
}

export default function FaceLandmarkerCamera({ onResults }: FaceLandmarkerCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let faceLandmarker: FaceLandmarker;
    let animationFrameId: number;

    async function init() {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm"
      );
      faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task"
        },
        outputFaceBlendshapes: true,
        outputFaceLandmarks: true,
        runningMode: "VIDEO",
      });

      await enableCamera();
    }

    async function enableCamera() {
      const video = videoRef.current;
      if (!video) return;

      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      video.srcObject = stream;
      video.addEventListener("loadeddata", processVideo);
    }

    function processVideo() {
      const video = videoRef.current;
      if (!video || !faceLandmarker) return;

      const nowInMs = Date.now();
      const results = faceLandmarker.detectForVideo(video, nowInMs);
      onResults(results);

      const canvas = canvasRef.current;
      const canvasCtx = canvas?.getContext("2d");
      if (canvasCtx && canvas) {
        const drawingUtils = new DrawingUtils(canvasCtx);
        canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

        if (results.faceLandmarks) {
          for (const landmarks of results.faceLandmarks) {
            drawingUtils.drawConnectors(
              landmarks,
              FaceLandmarker.FACE_LANDMARKS_TESSELATION,
              { color: "#C0C0C070", lineWidth: 1 }
            );
          }
        }
      }

      animationFrameId = requestAnimationFrame(processVideo);
    }

    init();

    return () => {
      cancelAnimationFrame(animationFrameId);
      const stream = videoRef.current?.srcObject as MediaStream;
      stream?.getTracks().forEach(track => track.stop());
    };
  }, [onResults]);

  return (
    <div className="relative w-full h-[480px]">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full border rounded-lg"
      />
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full"
      />
    </div>
  );
}