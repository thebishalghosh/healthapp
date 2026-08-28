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
};

export { ApiError, api };