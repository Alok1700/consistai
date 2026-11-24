import { create } from 'zustand';
import { api } from '../api/client';
import { User } from '../types';

export const DEMO_PREVIEW_USER: User = {
  _id: 'guest_user_demo_001',
  name: 'Alok Singh (Preview Mode)',
  email: 'singhalok1700@gmail.com',
  role: 'student',
  avatar: '',
  timezone: 'Asia/Kolkata',
  createdAt: new Date().toISOString()
};

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role?: string) => Promise<void>;
  demoLogin: () => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
  updateUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: DEMO_PREVIEW_USER,
  isAuthenticated: true,
  isLoading: false,
  error: null,

  updateUser: (user: User) => set({ user }),

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data?.token) {
        localStorage.setItem('consistai_token', res.data.token);
      }
      set({ user: res.data.user, isAuthenticated: true, isLoading: false });
    } catch (err: any) {
      set({
        error: err.response?.data?.message || 'Login failed. Please check credentials.',
        isLoading: false
      });
      throw err;
    }
  },

  register: async (name, email, password, role = 'student') => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/auth/register', { name, email, password, role });
      if (res.data?.token) {
        localStorage.setItem('consistai_token', res.data.token);
      }
      set({ user: res.data.user, isAuthenticated: true, isLoading: false });
    } catch (err: any) {
      set({
        error: err.response?.data?.message || 'Registration failed.',
        isLoading: false
      });
      throw err;
    }
  },

  demoLogin: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/auth/demo-login');
      if (res.data?.token) {
        localStorage.setItem('consistai_token', res.data.token);
      }
      set({ user: res.data.user, isAuthenticated: true, isLoading: false });
    } catch (err: any) {
      // In offline / preview mode, keep the rich demo user
      set({
        user: DEMO_PREVIEW_USER,
        isAuthenticated: true,
        isLoading: false
      });
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // ignore
    }
    localStorage.removeItem('consistai_token');
    set({ user: DEMO_PREVIEW_USER, isAuthenticated: true, error: null });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('consistai_token');
    if (!token || token === 'none' || token === 'null') {
      // Default to guest preview user so the frontend is immediately accessible without login
      set({ user: DEMO_PREVIEW_USER, isAuthenticated: true, isLoading: false });
      return;
    }
    try {
      const res = await api.get('/auth/me');
      if (res.data?.token) {
        localStorage.setItem('consistai_token', res.data.token);
      }
      set({ user: res.data.user, isAuthenticated: true, isLoading: false });
    } catch (err) {
      // If backend is unavailable or token expired, keep preview user active
      set({ user: DEMO_PREVIEW_USER, isAuthenticated: true, isLoading: false });
    }
  },

  clearError: () => set({ error: null })
}));
