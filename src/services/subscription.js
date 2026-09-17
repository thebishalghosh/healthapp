import * as WebBrowser from 'expo-web-browser';
import { api } from './api';
import tokenStorage from './tokenStorage';

const PLAN_CODES = ['PERSONAL', 'PREMIUM'];

function unwrapSubscription(data) {
  return data?.subscription || data?.data?.subscription || data?.data || data || null;
}

function isActive(subscription) {
  return ['active', 'authenticated'].includes(String(subscription?.status || '').toLowerCase());
}

function isPending(subscription) {
  return String(subscription?.status || '').toLowerCase() === 'pending';
}

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function refreshAfterCheckout(token, onPending) {
  let subscription = unwrapSubscription(await api.getCurrentSubscription(token));
  if (!isPending(subscription)) return subscription;

  onPending?.(subscription);
  const startedAt = Date.now();
  for (const delay of [2000, 4000, 6000, 8000, 10000]) {
    await wait(Math.max(0, delay - (Date.now() - startedAt)));
    subscription = unwrapSubscription(await api.getCurrentSubscription(token));
    if (isActive(subscription) || !isPending(subscription)) return subscription;
  }
  return subscription;
}

async function authenticated(operation) {
  const token = await tokenStorage.get();
  if (!token) {
    const error = new Error('Your session has expired. Please sign in again.');
    error.code = 'UNAUTHENTICATED';
    error.status = 401;
    throw error;
  }
  return operation(token);
}

async function getMembership() {
  return authenticated(async (token) => {
    const [plansData, currentData, featuresData] = await Promise.all([
      api.getSubscriptionPlans(token),
      api.getCurrentSubscription(token),
      api.getSubscriptionFeatures(token),
    ]);
    return {
      plans: Array.isArray(plansData) ? plansData : plansData?.plans || [],
      subscription: unwrapSubscription(currentData),
      features: featuresData?.features || featuresData || {},
    };
  });
}

async function openSubscriptionCheckout(planCode, onPending) {
  if (!PLAN_CODES.includes(planCode)) throw new Error('Select a valid membership plan.');

  return authenticated(async (token) => {
    const checkout = await api.createSubscription(token, planCode);
    if (checkout?.already_active === true) {
      return {
        type: 'already_active',
        subscription: unwrapSubscription(await api.getCurrentSubscription(token)),
      };
    }
    if (!checkout?.checkout_url) throw new Error('The server returned no hosted checkout URL. Try again.');

    const result = await WebBrowser.openBrowserAsync(checkout.checkout_url);
    return {
      type: result.type === 'cancel' ? 'cancelled' : 'closed',
      subscription: await refreshAfterCheckout(token, onPending),
    };
  });
}

async function refreshCurrentSubscription() {
  return authenticated(async (token) => unwrapSubscription(await api.getCurrentSubscription(token)));
}

async function cancelMembership() {
  return authenticated(async (token) => {
    await api.cancelSubscription(token);
    return unwrapSubscription(await api.getCurrentSubscription(token));
  });
}

export { cancelMembership, getMembership, openSubscriptionCheckout, refreshCurrentSubscription };