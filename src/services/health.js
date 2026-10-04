function numberOrNull(value) {
  return value === null || value === undefined ? null : Number(value);
}

function normalizeToday(payload) {
  const source = payload?.today || payload?.data?.today || payload || {};
  const nutrition = source.nutrition || {};
  const water = source.water || {};
  const workout = source.workout || {};
  const sleep = source.sleep || {};
  const healthScore = source.health_score || {};
  const score = numberOrNull(healthScore.score);

  return {
    date: source.date || null,
    healthScore: {
      score: Number.isFinite(score) ? score : null,
      components: {
        nutrition: numberOrNull(healthScore.components?.nutrition),
        hydration: numberOrNull(healthScore.components?.hydration),
        workout: numberOrNull(healthScore.components?.workout),
        sleep: numberOrNull(healthScore.components?.sleep),
        consistency: numberOrNull(healthScore.components?.consistency),
      },
      availableComponents: Array.isArray(healthScore.available_components) ? healthScore.available_components : [],
    },
    nutrition: {
      caloriesTarget: numberOrNull(nutrition.calories_target),
      caloriesConsumed: numberOrNull(nutrition.calories_consumed),
      protein: numberOrNull(nutrition.protein_g),
      carbohydrates: numberOrNull(nutrition.carbohydrates_g),
      fat: numberOrNull(nutrition.fat_g),
    },
    water: {
      targetMl: numberOrNull(water.target_ml),
      consumedMl: numberOrNull(water.consumed_ml),
      remainingMl: numberOrNull(water.remaining_ml),
      percentage: numberOrNull(water.percentage),
    },
    workout: {
      durationMinutes: numberOrNull(workout.duration_minutes),
      caloriesBurned: numberOrNull(workout.calories_burned),
    },
    sleep: {
      durationMinutes: numberOrNull(sleep.duration_minutes),
      bedtime: sleep.bedtime || null,
      wakeTime: sleep.wake_time || null,
    },
  };
}

export { normalizeToday };