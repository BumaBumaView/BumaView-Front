import React, { useEffect, useRef, useState } from "react";
import {
  FaceLandmarker,
  FilesetResolver
} from "@mediapipe/tasks-vision";
import { calculateScores } from "../utils/scoring";

const questions = [
  "자기소개 부탁드립니다.",
  "우리 회사에 지원한 동기는 무엇인가요?",
  "자신의 장점과 단점은 무엇이라고 생각하나요?",
  "입사 후 포부에 대해 말씀해주세요.",
];

// STT 설정
const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition;
if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.lang = "ko-KR";
  recognition.interimResults = true;
  recognition.continuous = true;
}


export default function Interview() {
  const videoRef = useRef(null);
  const blendshapesCollector = useRef([]);
  const [faceLandmarker, setFaceLandmarker] = useState(null);
  const [blendshapes, setBlendshapes] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isInterviewStarted, setIsInterviewStarted] = useState(false);
  const [isInterviewFinished, setIsInterviewFinished] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [userAnswer, setUserAnswer] = useState("");
  const [allAnswers, setAllAnswers] = useState([]);
  const [finalScores, setFinalScores] = useState(null);

  // TTS 설정
  const speak = (text) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const setVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      const koreanVoice = voices.find((voice) => voice.lang === "ko-KR");
      if (koreanVoice) {
        utterance.voice = koreanVoice;
      }
      window.speechSynthesis.speak(utterance);
    };

    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = setVoice;
    } else {
      setVoice();
    }
  };

  const handleStartInterview = () => {
    setIsInterviewStarted(true);
    speak(questions[currentQuestionIndex]);
  };

  const processAndFinalizeInterview = (answers) => {
    const scoredAnswers = answers.map(item => ({
      ...item,
      scores: calculateScores(item.blendshapes)
    }));

    const totalScores = scoredAnswers.reduce((acc, item) => {
      acc.attention += item.scores.attention;
      acc.stability += item.scores.stability;
      acc.positivity += item.scores.positivity;
      acc.finalScore += item.scores.finalScore;
      return acc;
    }, { attention: 0, stability: 0, positivity: 0, finalScore: 0 });

    const averageScores = {
      attention: Math.round(totalScores.attention / scoredAnswers.length),
      stability: Math.round(totalScores.stability / scoredAnswers.length),
      positivity: Math.round(totalScores.positivity / scoredAnswers.length),
      finalScore: Math.round(totalScores.finalScore / scoredAnswers.length),
    };

    setAllAnswers(scoredAnswers);
    setFinalScores(averageScores);
    setIsInterviewFinished(true);
  }

  const handleNextQuestion = () => {
    stopListening();
    const newAnswer = {
        question: questions[currentQuestionIndex],
        answer: userAnswer,
        blendshapes: blendshapesCollector.current
    };
    const updatedAnswers = [...allAnswers, newAnswer];
    setAllAnswers(updatedAnswers);
    setUserAnswer("");
    blendshapesCollector.current = [];

    const nextIndex = currentQuestionIndex + 1;
    if (nextIndex < questions.length) {
      setCurrentQuestionIndex(nextIndex);
      speak(questions[nextIndex]);
    } else {
      processAndFinalizeInterview(updatedAnswers);
    }
  };

  // STT 제어
  const startListening = () => {
    if (!recognition) {
        alert("브라우저가 음성 인식을 지원하지 않습니다.");
        return;
    }
    blendshapesCollector.current = [];
    setIsListening(true);
    recognition.start();
  };

  const stopListening = () => {
    if (!recognition) return;
    setIsListening(false);
    recognition.stop();
  };

  useEffect(() => {
    if (!recognition) return;

    let finalTranscript = '';
    recognition.onresult = (event) => {
      let interimTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' ';
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      setUserAnswer(finalTranscript + interimTranscript);
    };

    recognition.onend = () => {
        if (isListening) {
            recognition.start();
        }
    };

    return () => {
      if (recognition) {
        recognition.onresult = null;
        recognition.onend = null;
        recognition.stop();
      }
    };
  }, [isListening]);


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
    let animationFrameId;

    async function enableCamera() {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      video.srcObject = stream;
      await video.play();

      processVideo();
    }

    const processVideo = () => {
        if (video.readyState >= 2) {
          const nowInMs = Date.now();
          const results = faceLandmarker.detectForVideo(video, nowInMs);
          if (results.faceBlendshapes && results.faceBlendshapes.length > 0) {
            const currentBlendshapes = results.faceBlendshapes[0].categories;
            setBlendshapes(currentBlendshapes);
            if (isListening) {
                blendshapesCollector.current.push(currentBlendshapes);
            }
          }
        }
        animationFrameId = requestAnimationFrame(processVideo);
      };

    enableCamera();

    return () => {
        cancelAnimationFrame(animationFrameId);
    }
  }, [faceLandmarker, isListening]);

  if (isInterviewFinished && finalScores) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4 sm:p-6">
            <div className="w-full max-w-4xl bg-white p-6 sm:p-8 rounded-lg shadow-2xl">
                <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-center text-gray-800">면접 결과</h1>
                <p className="text-lg mb-6 text-center text-gray-600">수고하셨습니다! 아래는 상세 분석 결과입니다.</p>

                <div className="mb-8 p-6 bg-blue-50 rounded-lg text-center">
                    <h2 className="text-xl font-semibold mb-2 text-blue-800">최종 점수</h2>
                    <p className="text-5xl font-bold text-blue-600">{finalScores.finalScore}점</p>
                    <div className="flex justify-center gap-4 sm:gap-8 mt-4">
                        <p><strong>집중도:</strong> {finalScores.attention}점</p>
                        <p><strong>안정감:</strong> {finalScores.stability}점</p>
                        <p><strong>긍정성:</strong> {finalScores.positivity}점</p>
                    </div>
                </div>

                <h2 className="text-2xl font-bold mb-4 text-gray-700">질문별 답변 및 분석</h2>
                <div className="space-y-6">
                    {allAnswers.map((item, index) => (
                        <div key={index} className="border border-gray-200 p-4 rounded-lg bg-gray-50">
                            <p className="font-bold text-lg text-gray-800 mb-2">{index + 1}. {item.question}</p>
                            <p className="text-gray-700 mb-3">"{item.answer || "답변 없음"}"</p>
                            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600">
                                <span><strong>집중도:</strong> {item.scores.attention}점</span>
                                <span><strong>안정감:</strong> {item.scores.stability}점</span>
                                <span><strong>긍정성:</strong> {item.scores.positivity}점</span>
                                <span className="font-semibold text-indigo-600">질문 점수: {item.scores.finalScore}점</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-4 h-screen">
      <div className="flex flex-col md:flex-row gap-4 flex-grow min-h-0">
        <div className="w-full md:w-1/2 flex flex-col gap-4">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full border rounded-lg aspect-video bg-black"
          />
          <div className="flex-grow border rounded-lg p-4 bg-gray-50 flex flex-col">
            <h2 className="text-xl font-bold mb-2 flex-shrink-0">답변 내용</h2>
            <div className="text-lg overflow-y-auto flex-grow">
              {userAnswer || "음성 인식을 시작하거나 다음 질문으로 넘어가세요."}
            </div>
          </div>
        </div>
        <div className="w-full md:w-1/2 flex flex-col gap-4">
           <div className="h-1/2 border rounded-lg p-4 bg-gray-50">
            <h2 className="text-xl font-bold mb-2">면접 질문</h2>
            <p className="text-lg">
              {isInterviewStarted
                ? questions[currentQuestionIndex]
                : "면접 시작 버튼을 눌러주세요."}
            </p>
          </div>
          <div className="h-1/2 overflow-y-scroll border rounded-lg p-2 font-mono text-sm">
            <h2 className="text-lg font-bold p-2">표정 분석 결과</h2>
            {blendshapes.length > 0 ? (
              blendshapes.map((b, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-40 truncate">{b.categoryName}</span>
                  <span className="w-16">{b.score.toFixed(4)}</span>
                  <div
                    className="bg-teal-600 h-4 rounded"
                    style={{ width: `${b.score * 200}px` }}
                  />
                </div>
              ))
            ) : (
              <p>분석 데이터가 없습니다.</p>
            )}
          </div>
        </div>
      </div>
      <div className="flex-shrink-0">
        {!isInterviewStarted ? (
          <button
            onClick={handleStartInterview}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            면접 시작
          </button>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            <button
              onClick={startListening}
              disabled={isListening}
              className="px-4 py-2 bg-green-600 text-white rounded-lg disabled:bg-green-400"
            >
              답변 시작
            </button>
            <button
              onClick={stopListening}
              disabled={!isListening}
              className="px-4 py-2 bg-red-600 text-white rounded-lg disabled:bg-red-400"
            >
              답변 종료
            </button>
            <button
              onClick={handleNextQuestion}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg"
            >
              다음 질문
            </button>
          </div>
        )}
      </div>
    </div>
  );
}