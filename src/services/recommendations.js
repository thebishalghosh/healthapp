function numberOrNull(value) {
  return value === null || value === undefined ? null : Number(value);
}

const MEAL_TYPES = ['breakfast', 'lunch', 'snack', 'dinner'];

function normalizeMealType(value) {
  const mealType = String(value || '').trim().toLowerCase();
  return MEAL_TYPES.includes(mealType) ? mealType : '';
}

function normalizeRecommendation(recommendation, fallbackMealType) {
  const nutrition = recommendation.estimated_nutrition || recommendation.nutrition || recommendation.estimatedNutrition || {};
  return {
      mealType: normalizeMealType(recommendation.meal_type || recommendation.recommendation_type || fallbackMealType),
      title: recommendation.title || '',
      description: recommendation.description || '',
      foods: Array.isArray(recommendation.foods) ? recommendation.foods.map((food) => ({
        name: food.name || '',
        quantity: food.quantity || '',
      })) : [],
      estimatedNutrition: {
        calories: numberOrNull(nutrition.calories),
        proteinG: numberOrNull(nutrition.protein_g ?? nutrition.proteinG),
        carbohydratesG: numberOrNull(nutrition.carbohydrates_g ?? nutrition.carbohydratesG),
        fatG: numberOrNull(nutrition.fat_g ?? nutrition.fatG),
        fiberG: numberOrNull(nutrition.fiber_g ?? nutrition.fiberG),
      },
      reason: recommendation.reason || '',
  };
}

function getRecommendationList(payload) {
  if (Array.isArray(payload?.recommendations)) return payload.recommendations;

  const source = payload?.recommendations && typeof payload.recommendations === 'object' ? payload.recommendations : payload;
  return MEAL_TYPES.flatMap((mealType) => {
    const recommendation = source?.[mealType];
    if (Array.isArray(recommendation)) return recommendation.map((item) => ({ ...item, recommendation_type: item.recommendation_type || mealType }));
    return recommendation && typeof recommendation === 'object' ? [{ ...recommendation, recommendation_type: recommendation.recommendation_type || mealType }] : [];
  });
}

function orderRecommendations(recommendations) {
  return recommendations
    .filter((recommendation) => recommendation.mealType)
    .sort((first, second) => MEAL_TYPES.indexOf(first.mealType) - MEAL_TYPES.indexOf(second.mealType));
}

function normalizeRecommendations(payload) {
  const context = payload?.daily_context || {};

  return {
    generationId: payload?.generation_id || payload?.id || null,
    recommendations: orderRecommendations(getRecommendationList(payload).map((recommendation) => normalizeRecommendation(recommendation))),
    dailyContext: {
      caloriesTarget: numberOrNull(context.calories_target),
      caloriesConsumed: numberOrNull(context.calories_consumed),
      caloriesRemaining: numberOrNull(context.calories_remaining),
      proteinTarget: numberOrNull(context.protein_target_g),
      proteinConsumed: numberOrNull(context.protein_consumed_g),
      proteinRemaining: numberOrNull(context.protein_remaining_g),
    },
    generatedBy: payload?.generated_by || null,
  };
}

function getHistoryEntries(payload) {
  if (Array.isArray(payload)) return payload;
  return payload?.history || payload?.generations || payload?.items || [];
}

function getGenerationRecommendations(entry) {
  const recommendations = entry.recommendations || entry.recommendation_items || entry.items;
  return Array.isArray(recommendations) ? recommendations : null;
}

function normalizeHistory(payload) {
  const groups = new Map();

  getHistoryEntries(payload).forEach((entry) => {
    const generationId = entry.generation_id || entry.generationId || entry.id || null;
    if (!generationId) return;

    const existing = groups.get(generationId) || {
      generationId,
      createdAt: entry.created_at || entry.generated_at || entry.createdAt || null,
      title: entry.title || entry.summary || 'AI meal plan',
      nutrition: entry.total_nutrition || entry.nutrition || {},
      recommendations: [],
    };
    const groupedRecommendations = getGenerationRecommendations(entry);
    const rawRecommendations = groupedRecommendations || [entry];
    existing.recommendations.push(...rawRecommendations.map((recommendation) => normalizeRecommendation(recommendation)));
    existing.createdAt = existing.createdAt || entry.created_at || entry.generated_at || entry.createdAt || null;
    existing.title = entry.title || entry.summary || existing.title;
    existing.nutrition = entry.total_nutrition || entry.nutrition || existing.nutrition;
    groups.set(generationId, existing);
  });

  return Array.from(groups.values()).map((generation) => ({
    ...generation,
    recommendations: orderRecommendations(generation.recommendations),
    mealTypes: orderRecommendations(generation.recommendations).map((recommendation) => recommendation.mealType),
    nutrition: {
      calories: numberOrNull(generation.nutrition.calories),
      proteinG: numberOrNull(generation.nutrition.protein_g ?? generation.nutrition.proteinG),
    },
  })).sort((first, second) => {
    const firstTime = first.createdAt ? new Date(first.createdAt).getTime() : 0;
    const secondTime = second.createdAt ? new Date(second.createdAt).getTime() : 0;
    return secondTime - firstTime;
  });
}

function normalizeAIUsage(payload) {
  const usage = payload?.usage || payload || {};
  const successfulRequests = numberOrNull(usage.successful_requests ?? usage.successfulRequests);
  const requestLimit = numberOrNull(usage.configured_limit ?? usage.allowed_requests ?? usage.request_limit ?? usage.limit ?? usage.max_requests);
  return {
    successfulRequests,
    requestLimit,
    remainingRequests: requestLimit === null || successfulRequests === null ? null : Math.max(0, requestLimit - successfulRequests),
    period: usage.period || usage.current_period || usage.period_label || null,
  };
}

export { MEAL_TYPES, normalizeAIUsage, normalizeHistory, normalizeRecommendations };