import { PauseCircle, PlayCircle, Plus, Wand2, X } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { apiRequest, formatDateTime, generateClientStrongPassword } from '../lib/api';
import type { AuthUser, InstitutionSummary } from '../types';

interface UserRow {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role_code: string;
  role_name: string;
  institution_name: string | null;
  status: string;
  last_login_at: string | null;
}

interface RoleRow {
  id: number;
  code: string;
  name: string;
}

interface AuditRow {
  id: number;
  actor_name: string;
  actor_role: string;
  action: string;
  resource_type: string;
  details: string;
  ip_address: string;
  institution_name: string | null;
  created_at: string;
}

interface LoginRow {
  id: number;
  identifier: string;
  outcome: string;
  ip_address: string;
  reason: string;
  institution_name: string | null;
  created_at: string;
}

interface Props {
  user: AuthUser;
  institutions: InstitutionSummary[];
  tenantVersion: number;
}

export const GovernanceModule: React.FC<Props> = ({ user, institutions, tenantVersion }) => {
  const [tab, setTab] = useState<'users' | 'logins' | 'audit'>('users');
  const [users, setUsers] = useState<UserRow[]>([]);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [logs, setLogs] = useState<AuditRow[]>([]);
  const [logins, setLogins] = useState<LoginRow[]>([]);
  const [modal, setModal] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    fullName: '',
    username: '',
    email: '',
    roleCode: 'TEACHER',
    password: '',
    institutionId: institutions[0]?.id || user.institutionId || 0,
  });

  const load = useCallback(async () => {
    setError('');
    try {
      const [uRes, aRes] = await Promise.all([
        apiRequest<{ users: UserRow[]; roles: RoleRow[] }>('/api/admin/users'),
        apiRequest<{ logs: AuditRow[]; loginHistory: LoginRow[] }>('/api/admin/audit-logs'),
      ]);
      setUsers(uRes.users);
      setRoles(uRes.roles);
      setLogs(aRes.logs);
      setLogins(aRes.loginHistory);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to load governance records.');
    }
  }, [tenantVersion]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await apiRequest('/api/admin/users', {
        method: 'POST',
        body: {
          ...form,
          institutionId: form.roleCode === 'FOUNDER_SUPER_ADMIN' ? null : form.institutionId || undefined,
        },
      });
      setModal(false);
      setForm({ fullName: '', username: '', email: '', roleCode: 'TEACHER', password: '', institutionId: institutions[0]?.id || 0 });
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to create account.');
    }
  };

  const toggleStatus = async (u: UserRow) => {
    const next = u.status === 'active' ? 'suspended' : 'active';
    try {
      await apiRequest(`/api/admin/users/${u.id}/status`, { method: 'PATCH', body: { status: next } });
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to update status.');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Security &amp; User Governance</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Role-based access control, account activation/suspension, authentication logs, and immutable audit trails.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModal(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B192C] dark:bg-[#D4AF37] px-4 py-2 text-xs font-semibold text-white dark:text-[#050B16] cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" /> Provision User
        </button>
      </div>

      {error && <div className="rounded-lg border border-red-300 dark:border-red-900 bg-red-50 dark:bg-red-950/30 px-4 py-3 text-sm text-red-700 dark:text-red-200">{error}</div>}

      <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-[#0B192C] border border-slate-200 dark:border-slate-800">
        {[
          { key: 'users', label: `Accounts (${users.length})` },
          { key: 'logins', label: `Login History (${logins.length})` },
          { key: 'audit', label: `Audit Logs (${logs.length})` },
        ].map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key as typeof tab)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md cursor-pointer ${
              tab === t.key ? 'bg-white dark:bg-[#132946] text-slate-900 dark:text-[#E8CC72]' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'users' && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B192C] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#060E1D]/70 text-xs text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-medium">User</th>
                  <th className="px-4 py-3 font-medium">Role &amp; Tenant</th>
                  <th className="px-4 py-3 font-medium">Last Login</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="px-5 py-3">
                      <p className="font-semibold text-slate-900 dark:text-white">{u.full_name}</p>
                      <p className="text-xs text-slate-500">{u.email} · @{u.username}</p>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <p className="font-semibold text-[#B89223] dark:text-[#E8CC72]">{u.role_name}</p>
                      <p className="text-slate-500">{u.institution_name || 'Global Sovereign'}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{formatDateTime(u.last_login_at)}</td>
                    <td className="px-4 py-3 text-xs font-semibold capitalize">
                      <span className={u.status === 'active' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600'}>{u.status}</span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      {u.id !== user.id && (
                        <button
                          type="button"
                          onClick={() => toggleStatus(u)}
                          className="inline-flex items-center gap-1 rounded-md border border-slate-200 dark:border-slate-700 px-2.5 py-1 text-xs font-medium cursor-pointer"
                        >
                          {u.status === 'active' ? <PauseCircle className="w-3.5 h-3.5 text-red-500" /> : <PlayCircle className="w-3.5 h-3.5 text-emerald-500" />}
                          {u.status === 'active' ? 'Suspend' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'logins' && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B192C] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#060E1D]/70 text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Identifier</th>
                  <th className="px-4 py-3 font-medium">Outcome</th>
                  <th className="px-4 py-3 font-medium">IP Address</th>
                  <th className="px-4 py-3 font-medium">Details</th>
                  <th className="px-5 py-3 font-medium">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {logins.map((l) => (
                  <tr key={l.id}>
                    <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">{l.identifier}</td>
                    <td className="px-4 py-3 font-semibold capitalize">
                      <span className={l.outcome === 'success' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600'}>{l.outcome}</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-500">{l.ip_address}</td>
                    <td className="px-4 py-3 text-slate-500">{l.reason}</td>
                    <td className="px-5 py-3 text-slate-500">{formatDateTime(l.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'audit' && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B192C] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#060E1D]/70 text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Actor</th>
                  <th className="px-4 py-3 font-medium">Event</th>
                  <th className="px-4 py-3 font-medium">Details</th>
                  <th className="px-4 py-3 font-medium">IP</th>
                  <th className="px-5 py-3 font-medium">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {logs.map((a) => (
                  <tr key={a.id}>
                    <td className="px-5 py-3">
                      <p className="font-semibold text-slate-900 dark:text-white">{a.actor_name}</p>
                      <p className="text-slate-500">{a.actor_role}</p>
                    </td>
                    <td className="px-4 py-3 font-mono font-semibold text-[#B89223] dark:text-[#E8CC72]">{a.action}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{a.details}</td>
                    <td className="px-4 py-3 font-mono text-slate-500">{a.ip_address}</td>
                    <td className="px-5 py-3 text-slate-500">{formatDateTime(a.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B192C] p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-display text-base font-bold">Provision User Account</h3>
              <button type="button" onClick={() => setModal(false)} className="cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleCreateUser} className="mt-4 space-y-3">
              <input required placeholder="Full Name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060E1D] px-3 py-2 text-sm" />
              <div className="grid grid-cols-2 gap-3">
                <input required placeholder="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060E1D] px-3 py-2 text-sm" />
                <input type="email" required placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060E1D] px-3 py-2 text-sm" />
              </div>
              <select value={form.roleCode} onChange={(e) => setForm({ ...form, roleCode: e.target.value })} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060E1D] px-3 py-2 text-sm">
                {roles.map((r) => <option key={r.code} value={r.code}>{r.name}</option>)}
              </select>
              {user.isFounder && form.roleCode !== 'FOUNDER_SUPER_ADMIN' && (
                <select value={form.institutionId} onChange={(e) => setForm({ ...form, institutionId: Number(e.target.value) })} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060E1D] px-3 py-2 text-sm">
                  {institutions.map((i) => <option key={i.id} value={i.id}>{i.name} ({i.institution_code})</option>)}
                </select>
              )}
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-xs font-medium">Password</span>
                  <button type="button" onClick={() => setForm({ ...form, password: generateClientStrongPassword(14) })} className="inline-flex items-center gap-1 text-xs text-[#B89223] dark:text-[#D4AF37] cursor-pointer">
                    <Wand2 className="w-3 h-3" /> Generate
                  </button>
                </div>
                <input required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Strong password" className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060E1D] px-3 py-2 text-sm font-mono" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setModal(false)} className="rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs cursor-pointer">Cancel</button>
                <button type="submit" className="rounded-lg bg-[#0B192C] dark:bg-[#D4AF37] px-4 py-2 text-xs font-semibold text-white dark:text-[#050B16] cursor-pointer">Create User</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
