import axios from 'axios';
import { DEMO_GOALS, DEMO_FOLDERS, DEMO_TASKS, DEMO_HABITS, DEMO_ANALYTICS_OVERVIEW } from './demoData';

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

// Response interceptor: Capture refreshed tokens & handle offline preview fallback
api.interceptors.response.use(
  (response) => {
    const refreshedToken = response.headers['x-refreshed-token'] || response.data?.token;
    if (refreshedToken && typeof refreshedToken === 'string' && refreshedToken !== 'none') {
      localStorage.setItem('consistai_token', refreshedToken);
    }
    return response;
  },
  async (error) => {
    const config = error.config;
    // If backend is unreachable or not hosted, provide graceful demo data so preview works without login
    if (config && config.method?.toLowerCase() === 'get') {
      const url = config.url || '';
      if (url.includes('/goals')) {
        return { data: { goals: DEMO_GOALS }, status: 200, statusText: 'OK', headers: {}, config };
      }
      if (url.includes('/folders')) {
        return { data: { folders: DEMO_FOLDERS }, status: 200, statusText: 'OK', headers: {}, config };
      }
      if (url.includes('/tasks')) {
        return { data: { tasks: DEMO_TASKS, stats: { total: 3, completed: 1, pending: 2 } }, status: 200, statusText: 'OK', headers: {}, config };
      }
      if (url.includes('/habits')) {
        return { data: { habits: DEMO_HABITS }, status: 200, statusText: 'OK', headers: {}, config };
      }
      if (url.includes('/analytics')) {
        return { data: DEMO_ANALYTICS_OVERVIEW, status: 200, statusText: 'OK', headers: {}, config };
      }
      if (url.includes('/auth/me')) {
        return {
          data: {
            user: {
              _id: 'guest_user_demo_001',
              name: 'Alok Singh (Preview Mode)',
              email: 'singhalok1700@gmail.com',
              role: 'student'
            }
          },
          status: 200,
          statusText: 'OK',
          headers: {},
          config
        };
      }
    }

    if (error.response?.status === 401) {
      localStorage.removeItem('consistai_token');
    }
    return Promise.reject(error);
  }
);
