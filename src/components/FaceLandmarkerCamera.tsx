import React, { useEffect, useRef, useState } from "react";
import {
  FaceLandmarker,
  FilesetResolver
} from "@mediapipe/tasks-vision";

export default function FaceLandmarkerCamera() {
  const videoRef = useRef(null);
  const [faceLandmarker, setFaceLandmarker] = useState(null);
  const [blendshapes, setBlendshapes] = useState([]);

  useEffect(() => {
    async function initFaceLandmarker() {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm"
      );
      const faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task"
        },
        outputFaceBlendshapes: true,
        runningMode: "VIDEO",
      });
      setFaceLandmarker(faceLandmarker);
    }

    initFaceLandmarker();
  }, []);

  useEffect(() => {
    if (!faceLandmarker) return;

    const video = videoRef.current;

    async function enableCamera() {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      video.srcObject = stream;
      await video.play();

      const processVideo = async () => {
        if (video.readyState >= 2) {
          const nowInMs = Date.now();
          const results = await faceLandmarker.detectForVideo(video, nowInMs);
          if (results.faceBlendshapes && results.faceBlendshapes.length > 0) {
            setBlendshapes(results.faceBlendshapes[0].categories);
          }
        }
        requestAnimationFrame(processVideo);
      };

      processVideo();
    }

    enableCamera();
  }, [faceLandmarker]);

  return (
    <div className="flex flex-col md:flex-row gap-4 p-4">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full md:w-1/2 border rounded-lg"
      />
      <div className="w-full md:w-1/2 h-[480px] overflow-y-scroll border rounded-lg p-2 font-mono text-sm">
        {blendshapes.length > 0 ? (
          blendshapes.map((b, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-40">{b.categoryName}</span>
              <span className="w-16">{b.score.toFixed(4)}</span>
              <div
                className="bg-teal-600 h-4"
                style={{ width: `${b.score * 200}px` }}
              />
            </div>
          ))
        ) : (
          <p>No results yet</p>
        )}
      </div>
    </div>
  );
}