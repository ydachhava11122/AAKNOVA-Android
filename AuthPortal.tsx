import {
  AlertCircle,
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  ShieldCheck,
  Wand2,
} from 'lucide-react';
import React, { useState } from 'react';
import {
  apiRequest,
  evaluatePasswordStrength,
  generateClientStrongPassword,
  setCsrfToken,
} from '../lib/api';
import type { AuthUser, ProvisionedInstitutionCred } from '../types';
import { BrandMark } from './BrandMark';

interface AuthPortalProps {
  needsSetup: boolean;
  onAuthenticated: (user: AuthUser, provisioned?: ProvisionedInstitutionCred[]) => void;
}

type AuthMode = 'login' | 'provision' | 'forgot' | 'reset';

export const AuthPortal: React.FC<AuthPortalProps> = ({ needsSetup, onAuthenticated }) => {
  const [mode, setMode] = useState<AuthMode>(needsSetup ? 'provision' : 'login');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Login state
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPass, setShowPass] = useState(false);

  // First-run Founder provisioning state
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('founder');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [setupPassword, setSetupPassword] = useState('');
  const [seedSamples, setSeedSamples] = useState(true);

  // Password recovery state
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [issuedToken, setIssuedToken] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const strength = evaluatePasswordStrength(mode === 'provision' ? setupPassword : newPassword);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await apiRequest<{ user: AuthUser }>('/api/auth/login', {
        method: 'POST',
        body: { identifier, password, rememberMe },
      });
      setCsrfToken(res.user.csrfToken);
      onAuthenticated(res.user);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to sign in.');
    } finally {
      setLoading(false);
    }
  };

  const handleProvision = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await apiRequest<{
        user: AuthUser;
        provisionedInstitutions: ProvisionedInstitutionCred[];
      }>('/api/auth/provision-founder', {
        method: 'POST',
        body: {
          fullName,
          username,
          email,
          mobile,
          password: setupPassword,
          seedSampleInstitutions: seedSamples,
        },
      });
      setCsrfToken(res.user.csrfToken);
      onAuthenticated(res.user, res.provisionedInstitutions);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Founder provisioning failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const res = await apiRequest<{ message: string; resetToken?: string }>('/api/auth/forgot-password', {
        method: 'POST',
        body: { email: recoveryEmail },
      });
      setSuccess(res.message);
      if (res.resetToken) {
        setIssuedToken(res.resetToken);
        setResetToken(res.resetToken);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Recovery request failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const res = await apiRequest<{ message: string }>('/api/auth/reset-password', {
        method: 'POST',
        body: { token: resetToken, newPassword },
      });
      setSuccess(res.message);
      setMode('login');
      setPassword('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Reset failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-white dark:bg-[#050B16] text-slate-900 dark:text-slate-100">
      {/* Left Architectural Brand Column */}
      <div className="relative lg:col-span-6 xl:col-span-7 hidden lg:flex flex-col justify-between overflow-hidden bg-[#060E1D] p-12 border-r border-slate-800">
        <img
          src="/src/assets/images/aaknova_campus_architecture_1795194969108.jpg"
          alt="AAKNOVA modern enterprise institution atrium"
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-[#060E1D]/80 to-[#060E1D]/60" />

        <div className="relative z-10 flex items-center justify-between">
          <div className="inline-flex items-center gap-3">
            <BrandMark size={40} showWordmark={false} />
            <div>
              <p className="font-display text-lg font-extrabold tracking-[0.14em] text-white">
                AAK<span className="text-[#D4AF37]">NOVA</span>
              </p>
              <p className="text-xs text-slate-300">Enterprise Institution Management Platform</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 max-w-xl space-y-6">
          <h1 className="font-display text-4xl xl:text-5xl font-bold tracking-tight text-white leading-[1.12] [text-wrap:balance]">
            Sovereign control across every institution, campus, and ledger.
          </h1>
          <p className="text-base text-slate-300 leading-relaxed">
            Multi-tenant institutional governance engineered with cryptographic password protection, strict server-side
            tenant isolation, fourteen operational modules, and verifiable disaster recovery.
          </p>

          <div className="grid grid-cols-3 gap-6 pt-4 border-t border-white/15">
            <div>
              <p className="font-mono text-2xl font-semibold text-[#E8CC72] tabular-nums">14</p>
              <p className="mt-1 text-xs text-slate-300">Operational Modules</p>
            </div>
            <div>
              <p className="font-mono text-2xl font-semibold text-[#E8CC72] tabular-nums">100%</p>
              <p className="mt-1 text-xs text-slate-300">Tenant Data Isolation</p>
            </div>
            <div>
              <p className="font-mono text-2xl font-semibold text-[#E8CC72] tabular-nums">SHA-256</p>
              <p className="mt-1 text-xs text-slate-300">Verified Backups</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-3 text-xs text-slate-400">
          <span>AAKNOVA Enterprise Governance</span>
          <span aria-hidden="true">·</span>
          <span>Scrypt Cryptography</span>
          <span aria-hidden="true">·</span>
          <span>Multi-Institution Architecture</span>
        </div>
      </div>

      {/* Right Authentication / Provisioning Workspace */}
      <div className="lg:col-span-6 xl:col-span-5 flex flex-col justify-center px-6 py-10 sm:px-12 lg:px-14 bg-white dark:bg-[#050B16]">
        <div className="w-full max-w-md mx-auto">
          <div className="lg:hidden mb-8">
            <BrandMark size={38} />
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-red-300 dark:border-red-900/70 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-800 dark:text-red-200">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-emerald-300 dark:border-emerald-900/70 bg-emerald-50 dark:bg-emerald-950/40 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-200">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
              <span>{success}</span>
            </div>
          )}

          {mode === 'provision' && (
            <form onSubmit={handleProvision} className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-[#B89223] dark:text-[#D4AF37]">
                  First-Run Security Provisioning
                </p>
                <h2 className="mt-1 font-display text-2xl font-bold text-slate-900 dark:text-white">
                  Provision Founder Super Admin
                </h2>
                <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
                  AAKNOVA never ships with a hardcoded master password. Create your sovereign Founder account to initialize the platform.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                  <input
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Alexandra Sterling"
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B192C] px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Username</label>
                  <input
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="founder"
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B192C] px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Founder Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="founder@aaknova.com"
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B192C] px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Phone (Optional)</label>
                  <input
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="+1 (415) 555-0100"
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B192C] px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Master Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setSetupPassword(generateClientStrongPassword(16));
                      setShowPass(true);
                    }}
                    className="inline-flex items-center gap-1 text-xs font-medium text-[#B89223] dark:text-[#D4AF37] hover:underline cursor-pointer"
                  >
                    <Wand2 className="w-3 h-3" /> Generate Strong
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    required
                    value={setupPassword}
                    onChange={(e) => setSetupPassword(e.target.value)}
                    placeholder="Minimum 8 chars, mixed case, digit, symbol"
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B192C] px-3.5 py-2.5 pr-10 text-sm text-slate-900 dark:text-white focus:border-[#D4AF37] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    aria-label="Toggle password visibility"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {setupPassword && (
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{strength.label}</span>
                    {strength.checks.map((c) => (
                      <span key={c.label} className={c.passed ? 'text-emerald-600 dark:text-emerald-400' : ''}>
                        {c.passed ? '✓' : '·'} {c.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <label className="flex items-start gap-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0B192C]/60 p-3.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={seedSamples}
                  onChange={(e) => setSeedSamples(e.target.checked)}
                  className="mt-0.5 rounded border-slate-400 accent-[#D4AF37]"
                />
                <span className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  <strong className="text-slate-900 dark:text-white">Initialize two isolated multi-tenant institutions</strong> (Meridian Global Academy &amp; Summit Horizon Institute) with randomized admin credentials for immediate multi-tenant testing.
                </span>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#0B192C] dark:bg-[#D4AF37] px-4 py-2.5 text-sm font-semibold text-white dark:text-[#050B16] hover:bg-[#132946] dark:hover:bg-[#E5C158] disabled:opacity-50 transition-colors cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                {loading ? 'Provisioning Sovereign Account...' : 'Create Founder Account & Launch'}
              </button>
            </form>
          )}

          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Sign in to AAKNOVA</h2>
                <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
                  Enter your institutional or Founder credentials to access your workspace.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Email or Username
                  </label>
                  <input
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="founder@aaknova.com"
                    autoComplete="username"
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B192C] px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Password</label>
                    <button
                      type="button"
                      onClick={() => {
                        setError('');
                        setSuccess('');
                        setMode('forgot');
                      }}
                      className="text-xs font-medium text-[#B89223] dark:text-[#D4AF37] hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B192C] px-3.5 py-2.5 pr-10 text-sm text-slate-900 dark:text-white focus:border-[#D4AF37] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded accent-[#D4AF37]"
                  />
                  Keep session active for 30 days (HttpOnly encrypted cookie)
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#0B192C] dark:bg-[#D4AF37] px-4 py-2.5 text-sm font-semibold text-white dark:text-[#050B16] hover:bg-[#132946] dark:hover:bg-[#E5C158] disabled:opacity-50 transition-colors cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                {loading ? 'Authenticating...' : 'Sign In'}
              </button>
            </form>
          )}

          {mode === 'forgot' && (
            <form onSubmit={handleForgot} className="space-y-4">
              <div>
                <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Account Recovery</h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  Generate a single-use, 30-minute cryptographic reset token for your account.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Registered Email</label>
                <input
                  type="email"
                  required
                  value={recoveryEmail}
                  onChange={(e) => setRecoveryEmail(e.target.value)}
                  placeholder="user@institution.edu"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B192C] px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-[#D4AF37] focus:outline-none"
                />
              </div>

              {issuedToken && (
                <div className="rounded-lg border border-[#D4AF37]/40 bg-[#D4AF37]/10 p-3.5 text-xs">
                  <p className="font-semibold text-slate-900 dark:text-[#E8CC72]">Issued Recovery Token</p>
                  <div className="mt-1.5 flex items-center justify-between gap-2 font-mono text-slate-800 dark:text-slate-100 break-all">
                    <span>{issuedToken}</span>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard?.writeText(issuedToken)}
                      className="p-1.5 rounded hover:bg-black/10 cursor-pointer shrink-0"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMode('reset')}
                    className="mt-2.5 font-semibold text-[#9A781B] dark:text-[#D4AF37] underline cursor-pointer"
                  >
                    Proceed to Reset Password →
                  </button>
                </div>
              )}

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-[#0B192C] dark:bg-[#D4AF37] px-4 py-2.5 text-sm font-semibold text-white dark:text-[#050B16] cursor-pointer"
                >
                  <KeyRound className="w-4 h-4" />
                  {loading ? 'Generating...' : 'Generate Reset Token'}
                </button>
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  Back
                </button>
              </div>
            </form>
          )}

          {mode === 'reset' && (
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Set New Password</h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  Completing password reset revokes all existing sessions automatically.
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Reset Token</label>
                <input
                  required
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B192C] px-3.5 py-2.5 font-mono text-xs text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">New Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B192C] px-3.5 py-2.5 text-sm text-slate-900 dark:text-white"
                />
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-lg bg-[#0B192C] dark:bg-[#D4AF37] px-4 py-2.5 text-sm font-semibold text-white dark:text-[#050B16] cursor-pointer"
                >
                  {loading ? 'Updating...' : 'Reset Password'}
                </button>
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
