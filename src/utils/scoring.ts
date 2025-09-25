// @ts-nocheck
// 타입 정의가 복잡하므로 임시로 타입 체크를 비활성화합니다.

// 각 Blendshape 카테고리에 대한 가중치 및 임계값 정의
const SCORE_WEIGHTS = {
  // 집중도 (시선 분산)
  eyeLookOutLeft: 1.0,
  eyeLookOutRight: 1.0,
  eyeLookUpLeft: 0.5,
  eyeLookUpRight: 0.5,
  eyeLookDownLeft: 0.5,
  eyeLookDownRight: 0.5,

  // 안정감 (불안/긴장)
  jawOpen: 0.3,
  mouthShrugUpper: 0.5,
  mouthShrugLower: 0.5,
  browDownLeft: 0.4,
  browDownRight: 0.4,
  jawLeft: 0.2,
  jawRight: 0.2,

  // 긍정성
  mouthSmileLeft: 1.5,
  mouthSmileRight: 1.5,
  mouthFrownLeft: -1.0,
  mouthFrownRight: -1.0,
  mouthDimpleLeft: 0.5,
  mouthDimpleRight: 0.5,
};

const ATTENTION_THRESHOLD = 0.3; // 집중도 이탈로 간주할 임계값

// Blendshapes 데이터를 분석하여 점수를 계산하는 함수
export const calculateScores = (blendshapesData) => {
  if (!blendshapesData || blendshapesData.length === 0) {
    return {
      attention: 100,
      stability: 100,
      positivity: 0,
      finalScore: 67, // 기본 점수
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
  // 비율이므로 100을 곱하고, 최대 100점을 넘지 않도록 함
  let attentionScore = Math.max(0, 100 - totalDistractionRatio * 100);


  // 2. 안정감 점수 계산
  let stabilityPenalty = 0;
  stabilityPenalty += (averageScores['jawOpen'] || 0) * SCORE_WEIGHTS['jawOpen'];
  stabilityPenalty += (averageScores['mouthShrugUpper'] || 0) * SCORE_WEIGHTS['mouthShrugUpper'];
  stabilityPenalty += (averageScores['mouthShrugLower'] || 0) * SCORE_WEIGHTS['mouthShrugLower'];
  stabilityPenalty += (averageScores['browDownLeft'] || 0) * SCORE_WEIGHTS['browDownLeft'];
  stabilityPenalty += (averageScores['browDownRight'] || 0) * SCORE_WEIGHTS['browDownRight'];
  let stabilityScore = Math.max(0, 100 - stabilityPenalty * 100);

  // 3. 긍정성 점수 계산
  let positivityScore = 0;
  positivityScore += (averageScores['mouthSmileLeft'] || 0) * SCORE_WEIGHTS['mouthSmileLeft'];
  positivityScore += (averageScores['mouthSmileRight'] || 0) * SCORE_WEIGHTS['mouthSmileRight'];
  positivityScore += (averageScores['mouthFrownLeft'] || 0) * SCORE_WEIGHTS['mouthFrownLeft'];
  positivityScore += (averageScores['mouthFrownRight'] || 0) * SCORE_WEIGHTS['mouthFrownRight'];
  positivityScore += (averageScores['mouthDimpleLeft'] || 0) * SCORE_WEIGHTS['mouthDimpleLeft'];
  positivityScore += (averageScores['mouthDimpleRight'] || 0) * SCORE_WEIGHTS['mouthDimpleRight'];
  // 0~100 사이 값으로 조정
  positivityScore = Math.max(0, Math.min(100, positivityScore * 100));

  // 최종 점수 계산 (가중 평균)
  const finalScore = attentionScore * 0.4 + stabilityScore * 0.4 + positivityScore * 0.2;

  return {
    attention: Math.round(attentionScore),
    stability: Math.round(stabilityScore),
    positivity: Math.round(positivityScore),
    finalScore: Math.round(finalScore),
  };
};