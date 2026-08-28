function normalizeNutrition(payload) {
  const nutrition = payload?.nutrition || payload?.data?.nutrition || payload || {};

  return {
    id: nutrition.id || null,
    calculatedDate: nutrition.calculated_date || null,
    caloriesTarget: nutrition.calories_target === null || nutrition.calories_target === undefined ? null : Number(nutrition.calories_target),
    protein: nutrition.protein_g === null || nutrition.protein_g === undefined ? null : Number(nutrition.protein_g),
    carbohydrates: nutrition.carbohydrates_g === null || nutrition.carbohydrates_g === undefined ? null : Number(nutrition.carbohydrates_g),
    fat: nutrition.fat_g === null || nutrition.fat_g === undefined ? null : Number(nutrition.fat_g),
    fiber: nutrition.fiber_g === null || nutrition.fiber_g === undefined ? null : Number(nutrition.fiber_g),
    water: nutrition.water_ml === null || nutrition.water_ml === undefined ? null : Number(nutrition.water_ml),
  };
}

export { normalizeNutrition };