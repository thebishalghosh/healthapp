import { api } from './api';

const PAID_FEATURES = ['ai', 'ai_food_recommendations', 'ai_recommendation_history', 'ai_usage', 'reminders'];

function normalizeEntitlements(data) {
  const source = data?.data || data || {};
  return {
    plan: source.plan ? String(source.plan).toUpperCase() : null,
    isPaid: Boolean(source.is_paid),
    features: source.features && typeof source.features === 'object' ? source.features : {},
  };
}

async function getEntitlements(token) {
  return normalizeEntitlements(await api.getEntitlements(token));
}

function isSubscriptionRestriction(error) {
  return error?.status === 403 && ['FEATURE_REQUIRES_SUBSCRIPTION', 'FEATURE_REQUIRES_PREMIUM'].includes(error.code);
}

export { PAID_FEATURES, getEntitlements, isSubscriptionRestriction, normalizeEntitlements };