import React, { useState, useEffect } from 'react';
import InterviewUI from '../components/InterviewUI';
import type { FaceLandmarkerResult } from '@mediapipe/tasks-vision';
import { analyze, AnalysisResult } from '../utils/analysis';
import { useSpeech } from '../stores/useSpeech';

const mockQuestions = [
  "Tell me about a time you had to work with a difficult coworker.",
  "What are your biggest strengths and weaknesses?",
  "Where do you see yourself in 5 years?",
  "Why do you want to work for this company?",
];

const InterviewPage = () => {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const { transcript, isListening, startListening, stopListening, speak, setTranscript } = useSpeech();

  const handleResults = (results: FaceLandmarkerResult) => {
    const analysis = analyze(results);
    setAnalysisResult(analysis);
  };

  const startInterview = () => {
    speak(mockQuestions[questionIndex]);
    startListening();
  };

  const stopInterview = () => {
    stopListening();
  };

  const nextQuestion = () => {
    if (questionIndex < mockQuestions.length - 1) {
      setQuestionIndex(questionIndex + 1);
      setTranscript('');
    }
  };

  useEffect(() => {
    if (!isListening && questionIndex < mockQuestions.length) {
      speak(mockQuestions[questionIndex])
    }
  }, [questionIndex])

  return (
    <div className="min-h-screen p-8 font-sans">
      <h1 className="text-5xl font-extrabold mb-8 text-center text-gray-800 tracking-tight">AI Mock Interview</h1>
      <div className="flex justify-center gap-4 mb-8">
        <button onClick={startInterview} disabled={isListening} className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:bg-gray-400 transition-all duration-300">
          Start Interview
        </button>
        <button onClick={stopInterview} disabled={!isListening} className="px-8 py-3 bg-red-600 text-white font-semibold rounded-full shadow-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 disabled:bg-gray-400 transition-all duration-300">
          Stop Interview
        </button>
        <button onClick={nextQuestion} disabled={questionIndex >= mockQuestions.length - 1 || isListening} className="px-8 py-3 bg-gray-700 text-white font-semibold rounded-full shadow-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-600 focus:ring-opacity-50 disabled:bg-gray-400 transition-all duration-300">
          Next Question
        </button>
      </div>
      <InterviewUI
        analysisResult={analysisResult}
        question={mockQuestions[questionIndex]}
        transcript={transcript}
        onResults={handleResults}
        isListening={isListening}
      />
    </div>
  );
};

export default InterviewPage;