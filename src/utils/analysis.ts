import type { FaceLandmarkerResult } from "@mediapipe/tasks-vision";

export interface AnalysisResult {
  gaze: {
    isLookingAtCamera: boolean;
    pitch: number;
    yaw: number;
  };
  pose: {
    shoulderAngle: number;
    isUpright: boolean;
  };
  expressions: Record<string, number>;
}

export function analyze(results: FaceLandmarkerResult): AnalysisResult | null {
  if (!results || !results.faceLandmarks || results.faceLandmarks.length === 0) {
    return null;
  }

  const landmarks = results.faceLandmarks[0];

  // Gaze Analysis (simplified)
  // This is a placeholder. A more accurate model would involve 3D model fitting.
  const rightEye = landmarks[33];
  const leftEye = landmarks[263];
  const nose = landmarks[1];

  const eyeMidpoint = {
    x: (rightEye.x + leftEye.x) / 2,
    y: (rightEye.y + leftEye.y) / 2,
    z: (rightEye.z + leftEye.z) / 2,
  };

  const pitch = Math.atan2(nose.y - eyeMidpoint.y, eyeMidpoint.z) * 180 / Math.PI;
  const yaw = Math.atan2(nose.x - eyeMidpoint.x, eyeMidpoint.z) * 180 / Math.PI;

  const isLookingAtCamera = Math.abs(pitch) < 10 && Math.abs(yaw) < 10;

  // Pose Analysis (simplified)
  const rightShoulder = landmarks[11];
  const leftShoulder = landmarks[12];

  const shoulderAngle = rightShoulder && leftShoulder
    ? Math.atan2(rightShoulder.y - leftShoulder.y, rightShoulder.x - leftShoulder.x) * 180 / Math.PI
    : 0;
  const isUpright = Math.abs(shoulderAngle) < 15;

  // Expression Analysis
  const expressions: Record<string, number> = {};
  if (results.faceBlendshapes && results.faceBlendshapes.length > 0) {
    results.faceBlendshapes[0].categories.forEach(c => {
      expressions[c.categoryName] = c.score;
    });
  }

  return {
    gaze: { isLookingAtCamera, pitch, yaw },
    pose: { shoulderAngle, isUpright },
    expressions,
  };
}