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
  const finalTranscriptRef = useRef(''); // STT 최종 텍스트 Ref
  const [faceLandmarker, setFaceLandmarker] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isInterviewStarted, setIsInterviewStarted] = useState(false);
  const [isInterviewFinished, setIsInterviewFinished] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [userAnswer, setUserAnswer] = useState("");
  const [allAnswers, setAllAnswers] = useState([]);
  const [finalScores, setFinalScores] = useState(null);

  // Device states
  const [videoDevices, setVideoDevices] = useState([]);
  const [audioDevices, setAudioDevices] = useState([]);
  const [selectedVideoDevice, setSelectedVideoDevice] = useState('');
  const [selectedAudioDevice, setSelectedAudioDevice] = useState('');


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
        answer: finalTranscriptRef.current, // 최종본은 Ref에서 가져옴
        blendshapes: blendshapesCollector.current
    };
    const updatedAnswers = [...allAnswers, newAnswer];
    setAllAnswers(updatedAnswers);
    setUserAnswer(""); // UI 표시용 상태 초기화
    finalTranscriptRef.current = ""; // Ref 초기화
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
    // 답변 시작 시 모든 관련 상태 초기화
    setUserAnswer("");
    finalTranscriptRef.current = "";
    blendshapesCollector.current = [];
    setIsListening(true);
    recognition.start();
  };

  const stopListening = () => {
    if (!recognition) return;
    setIsListening(false);
    recognition.stop();
  };

  // Get media devices
  const getDevices = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true, audio: true }); // Request permission
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter(device => device.kind === 'videoinput');
      const audioInputs = devices.filter(device => device.kind === 'audioinput');
      setVideoDevices(videoInputs);
      setAudioDevices(audioInputs);
      if (videoInputs.length > 0 && !selectedVideoDevice) {
        setSelectedVideoDevice(videoInputs[0].deviceId);
      }
      if (audioInputs.length > 0 && !selectedAudioDevice) {
        setSelectedAudioDevice(audioInputs[0].deviceId);
      }
    } catch (err) {
      console.error("Error enumerating devices:", err);
    }
  };

  useEffect(() => {
    getDevices();
    async function initFaceLandmarker() {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm"
      );
      const landmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task"
        },
        outputFaceBlendshapes: true,
        runningMode: "VIDEO",
      });
      setFaceLandmarker(landmarker);
    }
    initFaceLandmarker();
  }, []);

  useEffect(() => {
    if (!recognition) return;

    recognition.onresult = (event) => {
      let interimTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscriptRef.current += event.results[i][0].transcript + ' ';
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      setUserAnswer(finalTranscriptRef.current + interimTranscript);
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
    if (!faceLandmarker || !selectedVideoDevice) return;

    const video = videoRef.current;
    let stream;
    let animationFrameId;

    async function setupCamera() {
      // 이전에 사용하던 스트림이 있으면 중지
      if (video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
      }

      const constraints = {
        video: {
          deviceId: selectedVideoDevice ? { exact: selectedVideoDevice } : undefined,
        },
        audio: {
          deviceId: selectedAudioDevice ? { exact: selectedAudioDevice } : undefined,
        }
      };

      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = stream;
        video.onloadedmetadata = () => {
          video.play();
          processVideo();
        };
      } catch (err) {
        console.error("Error setting up camera:", err);
      }
    }

    const processVideo = () => {
        if (video.readyState >= 2) {
          const nowInMs = Date.now();
          const results = faceLandmarker.detectForVideo(video, nowInMs);
          if (results.faceBlendshapes && results.faceBlendshapes.length > 0) {
            if (isListening) {
                blendshapesCollector.current.push(results.faceBlendshapes[0].categories);
            }
          }
        }
        animationFrameId = requestAnimationFrame(processVideo);
      };

    setupCamera();

    return () => {
        cancelAnimationFrame(animationFrameId);
        if (video.srcObject) {
            video.srcObject.getTracks().forEach(track => track.stop());
        }
    }
  }, [faceLandmarker, selectedVideoDevice, selectedAudioDevice, isListening]);

  if (isInterviewFinished && finalScores) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4 sm:p-6">
            <div className="w-full max-w-4xl bg-white p-6 sm:p-8 rounded-lg shadow-2xl">
                <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-center text-gray-800">면접 결과</h1>
                <p className="text-lg mb-6 text-center text-gray-600">수고하셨습니다! 아래는 상세 분석 결과입니다.</p>

                <div className="mb-8 p-6 bg-blue-50 rounded-lg text-center">
                    <h2 className="text-xl font-semibold mb-2 text-blue-800">최종 점수</h2>
                    <p className="text-5xl font-bold text-blue-600">{finalScores.finalScore}점</p>
                    <div className="flex justify-around gap-4 sm:gap-8 mt-6">
                        <div>
                            <p className="font-bold text-lg">{finalScores.attention}점</p>
                            <p className="text-sm text-gray-600">집중도</p>
                        </div>
                        <div>
                            <p className="font-bold text-lg">{finalScores.stability}점</p>
                            <p className="text-sm text-gray-600">안정감</p>
                        </div>
                        <div>
                            <p className="font-bold text-lg">{finalScores.positivity}점</p>
                            <p className="text-sm text-gray-600">긍정성</p>
                        </div>
                    </div>
                </div>

                <div className="mb-8 space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                        <h3 className="font-bold text-gray-800">집중도 (Attention)</h3>
                        <p className="text-sm text-gray-600">면접관에게 시선을 잘 고정하고 있는지, 혹은 주변을 두리번거리는지를 측정합니다. 높은 점수는 면접에 몰입하고 있다는 인상을 줍니다.</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                        <h3 className="font-bold text-gray-800">안정감 (Stability)</h3>
                        <p className="text-sm text-gray-600">답변 시 표정이 얼마나 안정적인지를 측정합니다. 불필요한 입 움직임, 과도한 인상 찡그림 등은 긴장감을 나타낼 수 있습니다.</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                        <h3 className="font-bold text-gray-800">긍정성 (Positivity)</h3>
                        <p className="text-sm text-gray-600">자연스러운 미소와 밝은 표정을 통해 얼마나 긍정적인 인상을 주는지를 측정합니다. 자신감과 친화력을 어필할 수 있습니다.</p>
                    </div>
                </div>

                <h2 className="text-2xl font-bold mb-4 text-gray-700">질문별 답변 및 분석</h2>
                <div className="space-y-6">
                    {allAnswers.map((item, index) => (
                        <div key={index} className="border border-gray-200 p-4 rounded-lg bg-white shadow-sm">
                            <p className="font-bold text-lg text-gray-800 mb-2">{index + 1}. {item.question}</p>
                            <p className="text-gray-700 mb-3 italic">"{item.answer || "답변 없음"}"</p>
                            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600 border-t pt-3 mt-3">
                                <span><strong>집중도:</strong> {item.scores.attention}점</span>
                                <span><strong>안정감:</strong> {item.scores.stability}점</span>
                                <span><strong>긍정성:</strong> {item.scores.positivity}점</span>
                                <span className="font-semibold text-indigo-600 ml-auto">질문 점수: {item.scores.finalScore}점</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
  }

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-900 text-white">
        {/* Left Panel: Video and Controls */}
        <div className="w-full md:w-3/5 lg:w-2/3 p-4 flex flex-col">
            <div className="relative w-full flex-grow rounded-lg overflow-hidden shadow-lg">
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4 bg-black bg-opacity-60 p-3 rounded-lg">
                    <p className="text-lg font-semibold">{isInterviewStarted ? questions[currentQuestionIndex] : "면접 대기 중..."}</p>
                </div>
            </div>
            <div className="flex-shrink-0 pt-4">
                {!isInterviewStarted ? (
                    <div className="flex flex-col items-center gap-4">
                        <div className="flex gap-4 w-full max-w-md">
                            <div className="flex-1">
                                <label htmlFor="video-device" className="block text-sm font-medium mb-1">카메라</label>
                                <select id="video-device" value={selectedVideoDevice} onChange={e => setSelectedVideoDevice(e.target.value)} className="bg-gray-700 border border-gray-600 rounded-md px-3 py-2 w-full">
                                    {videoDevices.map(device => <option key={device.deviceId} value={device.deviceId}>{device.label}</option>)}
                                </select>
                            </div>
                            <div className="flex-1">
                                <label htmlFor="audio-device" className="block text-sm font-medium mb-1">마이크</label>
                                <select id="audio-device" value={selectedAudioDevice} onChange={e => setSelectedAudioDevice(e.target.value)} className="bg-gray-700 border border-gray-600 rounded-md px-3 py-2 w-full">
                                    {audioDevices.map(device => <option key={device.deviceId} value={device.deviceId}>{device.label}</option>)}
                                </select>
                            </div>
                        </div>
                        <button onClick={handleStartInterview} className="w-full max-w-xs px-6 py-3 bg-blue-600 rounded-lg text-lg font-bold hover:bg-blue-700 transition-colors">
                            면접 시작
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-3 gap-4">
                        <button onClick={startListening} disabled={isListening} className="px-4 py-3 bg-green-600 rounded-lg font-semibold disabled:bg-green-800 disabled:cursor-not-allowed">답변 시작</button>
                        <button onClick={stopListening} disabled={!isListening} className="px-4 py-3 bg-red-600 rounded-lg font-semibold disabled:bg-red-800 disabled:cursor-not-allowed">답변 종료</button>
                        <button onClick={handleNextQuestion} className="px-4 py-3 bg-blue-600 rounded-lg font-semibold">다음 질문</button>
                    </div>
                )}
            </div>
        </div>

        {/* Right Panel: Answer Transcript */}
        <div className="w-full md:w-2/5 lg:w-1/3 p-4 bg-gray-800 flex flex-col">
            <div className="flex-grow border border-gray-700 rounded-lg p-4 bg-gray-900 shadow-inner">
                <h2 className="text-xl font-bold mb-4 text-gray-400">실시간 답변</h2>
                <div className="text-lg text-gray-200 h-full overflow-y-auto leading-relaxed">
                    {userAnswer || "이곳에 답변이 실시간으로 표시됩니다."}
                </div>
            </div>
        </div>
    </div>
  );
}