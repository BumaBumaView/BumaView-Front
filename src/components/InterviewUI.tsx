import React from 'react';
import type { FaceLandmarkerResult } from '@mediapipe/tasks-vision';
import { AnalysisResult } from '../utils/analysis';
import FaceLandmarkerCamera from './FaceLandmarkerCamera';

interface InterviewUIProps {
  analysisResult: AnalysisResult | null;
  question: string;
  transcript: string;
  onResults: (results: FaceLandmarkerResult) => void;
  isListening: boolean;
}

const InterviewUI: React.FC<InterviewUIProps> = ({ analysisResult, question, transcript, onResults, isListening }) => {
  return (
    <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 bg-black rounded-2xl shadow-2xl overflow-hidden">
        <FaceLandmarkerCamera onResults={onResults} />
      </div>
      <div className="lg:col-span-1 bg-white shadow-2xl rounded-2xl p-8 flex flex-col gap-6">
        <div>
          <h3 className="text-2xl font-bold text-gray-800 mb-4">Real-time Feedback</h3>
          {analysisResult ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-100 rounded-lg">
                <span className="font-semibold text-gray-700">Eye Contact</span>
                <span className={`px-4 py-1 text-sm font-medium rounded-full ${analysisResult.gaze.isLookingAtCamera ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {analysisResult.gaze.isLookingAtCamera ? 'Good' : 'Look at the camera'}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-100 rounded-lg">
                <span className="font-semibold text-gray-700">Posture</span>
                <span className={`px-4 py-1 text-sm font-medium rounded-full ${analysisResult.pose.isUpright ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                  {analysisResult.pose.isUpright ? 'Upright' : 'Leaning'}
                </span>
              </div>
            </div>
          ) : <p className="text-gray-500 italic">Initializing camera, please wait...</p>}
        </div>
        <div className="flex-grow flex flex-col bg-gray-50 rounded-lg p-6">
           <h3 className="text-2xl font-bold text-gray-800 mb-3">Interviewer's Question</h3>
           <p className="text-gray-700 text-lg mb-6">{question}</p>
           <h3 className="text-2xl font-bold text-gray-800 mb-3">Your Response</h3>
           <div className="flex-grow bg-white p-4 rounded-lg border border-gray-200 min-h-[150px] overflow-y-auto">
            <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">{transcript || (isListening ? "Listening intently..." : "Press 'Start Interview' to begin your response.")}</p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewUI;