import { API_BASE_URL } from '../constants/api';

class ApiError extends Error {
  constructor(message, status, code, fields) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.fields = fields || {};
  }
}

async function request(path, { method = 'GET', body, token } = {}) {
  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  } catch (error) {
    throw new ApiError('Unable to reach the server. Check your connection and try again.', 0, 'NETWORK_ERROR');
  }

  let payload;
  try {
    payload = await response.json();
  } catch (error) {
    throw new ApiError('The server returned an invalid response. Please try again.', response.status, 'INVALID_RESPONSE');
  }

  if (!response.ok || payload.success === false) {
    const error = payload.error || {};
    throw new ApiError(error.message || 'Something went wrong. Please try again.', response.status, error.code, error.fields);
  }

  if (!payload.success || payload.data === undefined) {
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