import { API_BASE_URL } from '../constants/api';

const REQUEST_TIMEOUT_MS = 15000;

class ApiError extends Error {
  constructor(message, status, code, fields, responseBody) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.fields = fields || {};
    this.responseBody = responseBody || '';
  }
}

function sanitizeResponseBody(body) {
  return String(body || '')
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [redacted]')
    .replace(/("?(?:access_token|token|api_key|apikey|authorization)"?\s*:\s*")([^"\n]+)(")/gi, '$1[redacted]$3')
    .slice(0, 2000);
}

function logRequestFailure(path, response, body) {
  if (__DEV__) {
    console.warn('[API] request failed', {
      path,
      status: response?.status || 0,
      body: sanitizeResponseBody(body),
    });
  }
}

async function request(path, { method = 'GET', body, token } = {}) {
  let response;
  let payload;
  let responseBody = '';
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    responseBody = await response.text();
    if (responseBody) {
      try {
        payload = JSON.parse(responseBody);
      } catch (error) {
        logRequestFailure(path, response, responseBody);
        throw new ApiError(`The server returned an invalid response (HTTP ${response.status}).`, response.status, 'INVALID_RESPONSE', {}, sanitizeResponseBody(responseBody));
      }
    }
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error.name === 'AbortError') {
      throw new ApiError('The server took too long to respond. Please try again.', 0, 'TIMEOUT');
    }
    if (!response) {
      throw new ApiError('Unable to reach the server. Check your connection and try again.', 0, 'NETWORK_ERROR');
    }
    throw new ApiError('The server returned an invalid response. Please try again.', response.status, 'INVALID_RESPONSE');
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok || payload?.success === false) {
    logRequestFailure(path, response, responseBody);
    const error = payload?.error || {};
    throw new ApiError(error.message || `Request failed with HTTP ${response.status}.`, response.status, error.code, error.fields, sanitizeResponseBody(responseBody));
  }

  if (!payload?.success || payload.data === undefined) {
    logRequestFailure(path, response, responseBody);
    throw new ApiError('The server returned an invalid response. Please try again.', response.status, 'INVALID_RESPONSE');
  }

  return payload.data;
}

const api = {
  register: (body) => request('/auth/register', { method: 'POST', body }),
  login: (body) => request('/auth/login', { method: 'POST', body }),
  logout: (token) => request('/auth/logout', { method: 'POST', token }),
  me: (token) => request('/auth/me', { token }),
  getHealthProfile: (token) => request('/health/profile', { token }),
  updateHealthProfile: (token, body) => request('/health/profile', { method: 'PUT', body, token }),
  getNutrition: (token) => request('/health/nutrition', { token }),
  calculateNutrition: (token) => request('/health/nutrition/calculate', { method: 'POST', token }),
  getFoodRecommendations: (token) => request('/ai/food-recommendations', { method: 'POST', body: {}, token }),
  getFoodRecommendationHistory: (token, limit = 20, offset = 0) => request(`/ai/food-recommendations/history?limit=${limit}&offset=${offset}`, { token }),
  getAIUsage: (token) => request('/ai/usage', { token }),
  getTodayHealth: (token) => request('/health/today', { token }),
  getWater: (token) => request('/health/water', { token }),
  addWater: (token, amountMl) => request('/health/water', { method: 'POST', body: { amount_ml: amountMl }, token }),
  getFood: (token) => request('/health/food', { token }),
  addFood: (token, data) => request('/health/food', { method: 'POST', body: data, token }),
  getWorkouts: (token) => request('/health/workouts', { token }),
  addWorkout: (token, data) => request('/health/workouts', { method: 'POST', body: data, token }),
  getSleep: (token) => request('/health/sleep', { token }),
  addSleep: (token, data) => request('/health/sleep', { method: 'POST', body: data, token }),
};

export { ApiError, api };