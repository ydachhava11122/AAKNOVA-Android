import { Lock, Moon, Save, Sun } from 'lucide-react';
import React, { useState } from 'react';
import { apiRequest } from '../lib/api';
import type { AuthUser } from '../types';

interface Props {
  user: AuthUser;
  theme: 'light' | 'dark';
  onThemeChange: (next: 'light' | 'dark') => void;
  onUserUpdated: (user: AuthUser) => void;
}

export const SettingsModule: React.FC<Props> = ({ user, theme, onThemeChange, onUserUpdated }) => {
  const [fullName, setFullName] = useState(user.fullName);
  const [mobile, setMobile] = useState(user.mobile);
  const [notifyEmail, setNotifyEmail] = useState(user.notifyEmail);
  const [notifyPush, setNotifyPush] = useState(user.notifyPush);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    setErr('');
    try {
      const res = await apiRequest<{ user: AuthUser; message: string }>('/api/auth/profile', {
        method: 'PATCH',
        body: { fullName, mobile, theme, notifyEmail, notifyPush },
      });
      onUserUpdated(res.user);
      setMsg(res.message);
    } catch (error: unknown) {
      setErr(error instanceof Error ? error.message : 'Unable to save profile.');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    setErr('');
    try {
      const res = await apiRequest<{ message: string }>('/api/auth/change-password', {
        method: 'POST',
        body: { currentPassword, newPassword },
      });
      setMsg(res.message);
      setCurrentPassword('');
      setNewPassword('');
    } catch (error: unknown) {
      setErr(error instanceof Error ? error.message : 'Password update failed.');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Profile &amp; Workspace Settings</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Manage your identity, password security, notification preferences, and Light/Dark interface theme.
        </p>
      </div>

      {err && <div className="rounded-lg border border-red-300 dark:border-red-900 bg-red-50 dark:bg-red-950/30 px-4 py-3 text-sm text-red-700 dark:text-red-200">{err}</div>}
      {msg && <div className="rounded-lg border border-emerald-300 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-200">{msg}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form onSubmit={handleSaveProfile} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B192C] p-6 space-y-4">
          <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100 dark:border-slate-800">
            <img
              src="/src/assets/images/aaknova_founder_avatar_1795194966892.jpg"
              alt={user.fullName}
              referrerPolicy="no-referrer"
              className="w-12 h-12 rounded-full object-cover border border-[#D4AF37]/50"
            />
            <div>
              <p className="font-display font-bold text-slate-900 dark:text-white">{user.fullName}</p>
              <p className="text-xs text-[#B89223] dark:text-[#E8CC72]">{user.roleName} · {user.email}</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">Full Name</label>
            <input required value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060E1D] px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Phone Number</label>
            <input value={mobile} onChange={(e) => setMobile(e.target.value)} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060E1D] px-3 py-2 text-sm" />
          </div>

          <div className="pt-2">
            <label className="block text-xs font-medium mb-2">Interface Appearance</label>
            <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-[#060E1D] border border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => onThemeChange('light')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md cursor-pointer ${
                  theme === 'light' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                }`}
              >
                <Sun className="w-3.5 h-3.5" /> Light Mode
              </button>
              <button
                type="button"
                onClick={() => onThemeChange('dark')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md cursor-pointer ${
                  theme === 'dark' ? 'bg-[#132946] text-[#E8CC72] shadow-sm' : 'text-slate-500'
                }`}
              >
                <Moon className="w-3.5 h-3.5" /> Deep Navy Dark
              </button>
            </div>
          </div>

          <div className="space-y-2 pt-2 text-xs">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={notifyEmail} onChange={(e) => setNotifyEmail(e.target.checked)} className="accent-[#D4AF37]" />
              Receive email alerts for security and billing notices
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={notifyPush} onChange={(e) => setNotifyPush(e.target.checked)} className="accent-[#D4AF37]" />
              Enable in-app notification center alerts
            </label>
          </div>

          <button type="submit" className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B192C] dark:bg-[#D4AF37] px-4 py-2 text-xs font-semibold text-white dark:text-[#050B16] cursor-pointer">
            <Save className="w-3.5 h-3.5" /> Save Profile
          </button>
        </form>

        <form onSubmit={handleChangePassword} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B192C] p-6 space-y-4">
          <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
            <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">Update Password</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Re-hashed immediately with cryptographic scrypt key derivation.</p>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Current Password</label>
            <input type="password" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060E1D] px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">New Password</label>
            <input type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="8+ chars, mixed case, digit, symbol" className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060E1D] px-3 py-2 text-sm" />
          </div>
          <button type="submit" className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B192C] dark:bg-[#D4AF37] px-4 py-2 text-xs font-semibold text-white dark:text-[#050B16] cursor-pointer">
            <Lock className="w-3.5 h-3.5" /> Change Password
          </button>
        </form>
      </div>
    </div>
  );
};
