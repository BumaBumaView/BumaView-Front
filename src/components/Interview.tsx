import React, { useEffect, useRef, useState } from "react";
import {
  FaceLandmarker,
  FilesetResolver
} from "@mediapipe/tasks-vision";

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
  const [faceLandmarker, setFaceLandmarker] = useState(null);
  const [blendshapes, setBlendshapes] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isInterviewStarted, setIsInterviewStarted] = useState(false);
  const [isInterviewFinished, setIsInterviewFinished] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [userAnswer, setUserAnswer] = useState("");
  const [allAnswers, setAllAnswers] = useState([]);

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

  const handleNextQuestion = () => {
    stopListening();
    setAllAnswers(prev => [...prev, { question: questions[currentQuestionIndex], answer: userAnswer }]);
    setUserAnswer("");

    const nextIndex = currentQuestionIndex + 1;
    if (nextIndex < questions.length) {
      setCurrentQuestionIndex(nextIndex);
      speak(questions[nextIndex]);
    } else {
      setIsInterviewFinished(true);
    }
  };

  // STT 제어
  const startListening = () => {
    if (!recognition) {
        alert("브라우저가 음성 인식을 지원하지 않습니다.");
        return;
    }
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

  if (isInterviewFinished) {
    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
            <h1 className="text-4xl font-bold mb-4">면접이 종료되었습니다.</h1>
            <p className="text-lg mb-8">수고하셨습니다. 결과를 확인해보세요.</p>
            <div className="w-full max-w-2xl bg-white p-6 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold mb-4">면접 답변 요약</h2>
                {allAnswers.map((item, index) => (
                    <div key={index} className="mb-4">
                        <p className="font-semibold text-gray-800">{item.question}</p>
                        <p className="text-gray-600">{item.answer}</p>
                    </div>
                ))}
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