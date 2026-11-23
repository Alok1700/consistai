import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { BrainCircuit, Sparkles, ArrowRight, Lock, Mail } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, demoLogin, error, clearError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      // Handled by store
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    try {
      await demoLogin();
      navigate('/');
    } catch (err) {
      // Handled
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[#8B5CF6] flex items-center justify-center shadow-xl shadow-[#8B5CF6]/30 mx-auto">
            <BrainCircuit className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-[#F8FAFC] tracking-tight">
            ConsistAI
          </h1>
          <p className="text-xs text-[#94A3B8]">
            Intelligent Personal Productivity Operating System
          </p>
        </div>

        {/* Demo Login Callout Button */}
        <div className="p-4 rounded-2xl bg-[#8B5CF6]/10 border border-[#8B5CF6]/30 text-center space-y-2.5">
          <div className="flex items-center justify-center gap-2 text-xs font-bold text-[#8B5CF6] uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>Instant Demo Access</span>
          </div>
          <p className="text-xs text-[#94A3B8]">
            Access pre-configured realistic student demonstration data with DSA goals, habits, and ML models.
          </p>
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-bold text-xs shadow-lg shadow-[#8B5CF6]/30 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <span>1-Click Demo Login</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Traditional Form Card */}
        <div className="p-6 rounded-2xl bg-[#161E2E] border border-[#263247] shadow-xl space-y-4">
          <h2 className="text-sm font-bold text-[#F8FAFC]">Sign in to your account</h2>

          {error && (
            <div className="p-3 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/30 text-xs text-[#EF4444]">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-[#94A3B8] font-semibold mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#64748B] absolute left-3 top-2.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    clearError();
                  }}
                  placeholder="name@university.edu"
                  required
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#0B0F19] border border-[#263247] text-[#F8FAFC] focus:outline-none focus:border-[#8B5CF6] text-xs placeholder-[#64748B]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[#94A3B8] font-semibold mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#64748B] absolute left-3 top-2.5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    clearError();
                  }}
                  placeholder="••••••••"
                  required
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#0B0F19] border border-[#263247] text-[#F8FAFC] focus:outline-none focus:border-[#8B5CF6] text-xs placeholder-[#64748B]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-[#1C2638] hover:bg-[#202B3D] text-[#F8FAFC] font-semibold text-xs border border-[#263247] transition disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-xs text-[#94A3B8] pt-2 border-t border-[#263247]">
            Don't have an account?{' '}
            <Link to="/register" className="text-[#8B5CF6] font-semibold hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
