function numberOrNull(value) {
  return value === null || value === undefined ? null : Number(value);
}

function normalizeToday(payload) {
  const source = payload?.today || payload?.data?.today || payload || {};
  const nutrition = source.nutrition || {};
  const water = source.water || {};
  const workout = source.workout || {};
  const sleep = source.sleep || {};

  return {
    date: source.date || null,
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