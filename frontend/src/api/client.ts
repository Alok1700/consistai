import axios from 'axios';

const getBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (!envUrl) return '/api';
  let clean = envUrl.trim().replace(/\/+$/, '');
  if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
    clean = `https://${clean}`;
  }
  return clean.endsWith('/api') ? clean : `${clean}/api`;
};

export const api = axios.create({
  baseURL: getBaseUrl(),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor: Attach stored JWT Bearer token if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('consistai_token');
  if (token && token !== 'none' && token !== 'null') {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: Capture refreshed tokens & handle auth errors cleanly
api.interceptors.response.use(
  (response) => {
    // Check if server refreshed the token in headers or response body
    const refreshedToken = response.headers['x-refreshed-token'] || response.data?.token;
    if (refreshedToken && typeof refreshedToken === 'string' && refreshedToken !== 'none') {
      localStorage.setItem('consistai_token', refreshedToken);
    }
    return response;
  },
  async (error) => {
    // If 401 occurs, clear expired token without silent fallback
    if (error.response?.status === 401) {
      localStorage.removeItem('consistai_token');
    }
    return Promise.reject(error);
  }
);
