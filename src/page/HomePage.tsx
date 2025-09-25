import React from 'react';
import { Link } from 'react-router-dom';
import { Camera, Mic, BarChart, Brain } from 'lucide-react';

const FeatureCard = ({ icon, title, description }) => (
  <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300">
    <div className="flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 text-blue-600 mb-4">
      {icon}
    </div>
    <h3 className="text-xl font-bold mb-2">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </div>
);

const HomePage = () => {
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero Section */}
      <section className="text-center py-20 px-4 bg-white">
        <h1 className="text-5xl font-extrabold text-gray-800 mb-4">
          AI와 함께하는 완벽한 면접 준비
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
          실시간 표정, 시선, 음성 분석을 통해 당신의 비언어적 커뮤니케이션 능력을 강화하고, 어떤 면접에서도 자신감을 가지세요.
        </p>
        <Link
          to="/interview"
          className="bg-blue-600 text-white font-bold py-3 px-8 rounded-full hover:bg-blue-700 transition-transform duration-300 transform hover:scale-105"
        >
          모의 면접 시작하기
        </Link>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
            주요 기능
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard
              icon={<Camera size={24} />}
              title="실시간 표정 & 시선 분석"
              description="AI가 당신의 표정과 시선을 실시간으로 분석하여 집중도, 안정감, 긍정성을 측정하고 피드백을 제공합니다."
            />
            <FeatureCard
              icon={<Mic size={24} />}
              title="음성 인식 및 답변 분석"
              description="면접관의 질문을 듣고, 당신의 답변을 음성으로 녹음하세요. STT 기술로 텍스트화된 답변을 확인할 수 있습니다."
            />
            <FeatureCard
              icon={<BarChart size={24} />}
              title="종합 점수 및 리포트"
              description="면접이 끝나면 각 항목별 상세 점수와 종합 점수를 포함한 리포트를 통해 자신의 강점과 약점을 파악할 수 있습니다."
            />
            <FeatureCard
              icon={<Brain size={24} />}
              title="맞춤형 면접 경험"
              description="향후 기업 정보와 연동하여 실제 기업에 맞춘 예상 질문으로 더욱 현실감 있는 면접을 경험할 수 있습니다."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-8 bg-white border-t">
        <p className="text-gray-600">&copy; 2025 AI Mock Interview. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default HomePage;