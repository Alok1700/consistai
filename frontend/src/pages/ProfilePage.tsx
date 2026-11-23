import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { api } from '../api/client';
import { User, Mail, Shield, KeyRound, Check, AlertCircle, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ProfilePage: React.FC = () => {
  const { user, updateUser, logout } = useAuthStore();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || '');
  const [email] = useState(user?.email || '');
  const [role, setRole] = useState(user?.role || 'student');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isUpdating, setIsUpdating] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [isChangingPass, setIsChangingPass] = useState(false);
  const [passSuccess, setPassSuccess] = useState(false);
  const [passError, setPassError] = useState<string | null>(null);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setProfileSuccess(false);
    setProfileError(null);

    try {
      const res = await api.put('/auth/profile', { name, role });
      if (res.data?.user) {
        updateUser(res.data.user);
      }
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err: any) {
      setProfileError(err.response?.data?.message || err.message || 'Profile update failed.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPassError('New passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setPassError('New password must be at least 6 characters.');
      return;
    }

    setIsChangingPass(true);
    setPassSuccess(false);
    setPassError(null);

    try {
      await api.put('/auth/password', { currentPassword, newPassword });
      setPassSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPassSuccess(false), 3000);
    } catch (err: any) {
      setPassError(err.response?.data?.message || err.message || 'Password update failed.');
    } finally {
      setIsChangingPass(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-800 pb-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <User className="w-6 h-6 text-purple-400" />
            <span>User Account & Profile</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Manage your personal credentials, identity roles, and active sessions.
          </p>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="px-4 py-2 rounded-xl bg-gray-900 hover:bg-rose-950/40 border border-gray-800 hover:border-rose-500/40 text-gray-300 hover:text-rose-300 text-xs font-semibold transition flex items-center gap-2 self-start sm:self-auto"
        >
          <LogOut className="w-4 h-4 text-rose-400" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Profile Overview Card */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-gray-900 border border-purple-800/40 flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-purple-600/30 border border-purple-500/40 text-purple-300 font-extrabold text-xl flex items-center justify-center uppercase shadow-inner">
          {user?.name ? user.name[0] : 'U'}
        </div>
        <div className="space-y-0.5">
          <h2 className="text-base font-bold text-white">{user?.name}</h2>
          <span className="text-xs text-purple-300 font-mono block">{user?.email}</span>
          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-purple-900/60 text-purple-300 border border-purple-700/40 inline-block">
            {user?.role || 'Student'}
          </span>
        </div>
      </div>

      {/* Form 1: Profile Details */}
      <div className="p-5 rounded-2xl bg-gray-900/70 border border-gray-800 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <User className="w-4 h-4 text-purple-400" />
          <span>Personal Information</span>
        </h3>

        {profileSuccess && (
          <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-600/40 text-emerald-300 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>Profile information updated successfully.</span>
          </div>
        )}

        {profileError && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-600/40 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            <span>{profileError}</span>
          </div>
        )}

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2 bg-gray-950 border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full px-3.5 py-2 bg-gray-950/50 border border-gray-800/60 rounded-xl text-xs text-gray-400 cursor-not-allowed font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Primary Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              className="w-full sm:w-1/2 px-3.5 py-2 bg-gray-950 border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
            >
              <option value="student">Student / Academic Learner</option>
              <option value="professional">Software Professional / Engineer</option>
              <option value="researcher">Researcher / Academic</option>
              <option value="admin">Administrator</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isUpdating}
            className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/20 transition disabled:opacity-50"
          >
            {isUpdating ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </div>

      {/* Form 2: Password Update */}
      <div className="p-5 rounded-2xl bg-gray-900/70 border border-gray-800 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-indigo-400" />
          <span>Security & Password</span>
        </h3>

        {passSuccess && (
          <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-600/40 text-emerald-300 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>Password updated successfully.</span>
          </div>
        )}

        {passError && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-600/40 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            <span>{passError}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3.5 py-2 bg-gray-950 border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3.5 py-2 bg-gray-950 border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3.5 py-2 bg-gray-950 border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isChangingPass}
            className="px-5 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-700 text-purple-300 hover:text-white font-semibold text-xs transition disabled:opacity-50"
          >
            {isChangingPass ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
};
