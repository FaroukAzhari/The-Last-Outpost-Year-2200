export function calculateFinalScore(crew) {
  return (crew.lightTokens * 10) + crew.missionScore + crew.recoveryBonus - (crew.shadowMarks * 7);
}

export function getGateStabilityLevel(score) {
  if (score >= 250) {
    return "Stable";
  }

  if (score >= 180) {
    return "Controlled";
  }

  if (score >= 120) {
    return "Unstable";
  }

  if (score >= 60) {
    return "Critical";
  }

  return "Breach";
}

export function averageTraits(evaluation) {
  if (!evaluation) {
    return 0;
  }

  const values = [
    evaluation.courage,
    evaluation.loyalty,
    evaluation.intelligence,
    evaluation.discipline,
    evaluation.spirit
  ];

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
