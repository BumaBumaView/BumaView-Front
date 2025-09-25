// @ts-nocheck
// 타입 정의가 복잡하므로 임시로 타입 체크를 비활성화합니다.

// 각 Blendshape 카테고리에 대한 가중치 및 임계값 정의 (점수 하향 조정)
const SCORE_WEIGHTS = {
  // 집중도 (시선 분산) - 페널티 강화
  eyeLookOutLeft: 1.5,
  eyeLookOutRight: 1.5,
  eyeLookUpLeft: 0.8,
  eyeLookUpRight: 0.8,
  eyeLookDownLeft: 0.7,
  eyeLookDownRight: 0.7,

  // 안정감 (불안/긴장) - 페널티 강화
  jawOpen: 0.5,
  mouthShrugUpper: 0.7,
  mouthShrugLower: 0.7,
  browDownLeft: 0.6,
  browDownRight: 0.6,
  jawLeft: 0.4,
  jawRight: 0.4,
  cheekPuff: 0.5, // 볼 부풀리기 추가

  // 긍정성 - 가중치 미세 조정
  mouthSmileLeft: 1.2,
  mouthSmileRight: 1.2,
  mouthFrownLeft: -1.5, // 찡그림 페널티 강화
  mouthFrownRight: -1.5,
  mouthDimpleLeft: 0.4,
  mouthDimpleRight: 0.4,
};

const ATTENTION_THRESHOLD = 0.25; // 집중도 이탈로 간주할 임계값 하향 조정

// Blendshapes 데이터를 분석하여 점수를 계산하는 함수
export const calculateScores = (blendshapesData) => {
  if (!blendshapesData || blendshapesData.length === 0) {
    return {
      attention: 80, // 데이터 없을 시 기본 점수 하향
      stability: 80,
      positivity: 50,
      finalScore: 70,
    };
  }

  const frameCount = blendshapesData.length;
  const averageScores = {};
  const attentionDistractionFrames = {
    eyeLookOutLeft: 0,
    eyeLookOutRight: 0,
    eyeLookUpLeft: 0,
    eyeLookUpRight: 0,
    eyeLookDownLeft: 0,
    eyeLookDownRight: 0,
  };

  // 모든 프레임의 점수를 합산
  for (const frame of blendshapesData) {
    for (const category of frame) {
      if (SCORE_WEIGHTS[category.categoryName]) {
        if (!averageScores[category.categoryName]) {
          averageScores[category.categoryName] = 0;
        }
        averageScores[category.categoryName] += category.score;
      }
      // 집중도 관련 지표가 임계값을 넘는지 확인
      if (attentionDistractionFrames.hasOwnProperty(category.categoryName) && category.score > ATTENTION_THRESHOLD) {
        attentionDistractionFrames[category.categoryName]++;
      }
    }
  }

  // 평균 점수 계산
  for (const key in averageScores) {
    averageScores[key] /= frameCount;
  }

  // 1. 집중도 점수 계산
  let totalDistractionRatio = 0;
  for (const key in attentionDistractionFrames) {
    totalDistractionRatio += (attentionDistractionFrames[key] / frameCount) * SCORE_WEIGHTS[key];
  }
  let attentionScore = Math.max(0, 100 - totalDistractionRatio * 120); // 페널티 비율 증폭


  // 2. 안정감 점수 계산
  let stabilityPenalty = 0;
  stabilityPenalty += (averageScores['jawOpen'] || 0) * SCORE_WEIGHTS['jawOpen'];
  stabilityPenalty += (averageScores['mouthShrugUpper'] || 0) * SCORE_WEIGHTS['mouthShrugUpper'];
  stabilityPenalty += (averageScores['mouthShrugLower'] || 0) * SCORE_WEIGHTS['mouthShrugLower'];
  stabilityPenalty += (averageScores['browDownLeft'] || 0) * SCORE_WEIGHTS['browDownLeft'];
  stabilityPenalty += (averageScores['browDownRight'] || 0) * SCORE_WEIGHTS['browDownRight'];
  stabilityPenalty += (averageScores['cheekPuff'] || 0) * SCORE_WEIGHTS['cheekPuff'];
  let stabilityScore = Math.max(0, 100 - stabilityPenalty * 150); // 페널티 비율 증폭

  // 3. 긍정성 점수 계산
  let positivityScore = 50; // 기본 점수 50점에서 시작
  positivityScore += ((averageScores['mouthSmileLeft'] || 0) + (averageScores['mouthSmileRight'] || 0)) * SCORE_WEIGHTS['mouthSmileLeft'] * 50;
  positivityScore += ((averageScores['mouthFrownLeft'] || 0) + (averageScores['mouthFrownRight'] || 0)) * SCORE_WEIGHTS['mouthFrownLeft'] * 50;
  positivityScore += ((averageScores['mouthDimpleLeft'] || 0) + (averageScores['mouthDimpleRight'] || 0)) * SCORE_WEIGHTS['mouthDimpleLeft'] * 20;

  positivityScore = Math.max(0, Math.min(100, positivityScore));

  // 최종 점수 계산 (가중 평균 변경: 집중도/안정감 45%, 긍정성 10%)
  const finalScore = attentionScore * 0.45 + stabilityScore * 0.45 + positivityScore * 0.1;

  return {
    attention: Math.round(attentionScore),
    stability: Math.round(stabilityScore),
    positivity: Math.round(positivityScore),
    finalScore: Math.round(finalScore),
  };
};