import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { BrainCircuit, Lock, Mail, User as UserIcon } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register, error, clearError } = useAuthStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(name, email, password, role);
      navigate('/');
    } catch (err) {
      // Handled in store
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
            Create Account
          </h1>
          <p className="text-xs text-[#94A3B8]">
            Join ConsistAI — Intelligent Personal Productivity Operating System
          </p>
        </div>

        {/* Card */}
        <div className="p-6 rounded-2xl bg-[#161E2E] border border-[#263247] shadow-xl space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/30 text-xs text-[#EF4444]">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-[#94A3B8] font-semibold mb-1">Full Name</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-[#64748B] absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    clearError();
                  }}
                  placeholder="Arjun Verma"
                  required
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#0B0F19] border border-[#263247] text-[#F8FAFC] focus:outline-none focus:border-[#8B5CF6] text-xs placeholder-[#64748B]"
                />
              </div>
            </div>

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
              <label className="block text-[#94A3B8] font-semibold mb-1">Password (min 6 chars)</label>
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
                  minLength={6}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#0B0F19] border border-[#263247] text-[#F8FAFC] focus:outline-none focus:border-[#8B5CF6] text-xs placeholder-[#64748B]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[#94A3B8] font-semibold mb-1">Role / Persona</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#0B0F19] border border-[#263247] text-[#F8FAFC] focus:outline-none focus:border-[#8B5CF6] text-xs"
              >
                <option value="student">Student / Exam Aspirant</option>
                <option value="software_engineer">Software Engineer</option>
                <option value="researcher">Academic Researcher</option>
                <option value="professional">Working Professional</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-bold text-xs shadow-md shadow-[#8B5CF6]/20 transition disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Creating Account...' : 'Register'}
            </button>
          </form>

          <p className="text-center text-xs text-[#94A3B8] pt-2 border-t border-[#263247]">
            Already have an account?{' '}
            <Link to="/login" className="text-[#8B5CF6] font-semibold hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
