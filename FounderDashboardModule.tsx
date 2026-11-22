import {
  Activity,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  PauseCircle,
  PlayCircle,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Wand2,
  X,
} from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import {
  apiRequest,
  formatBytes,
  formatCurrency,
  formatDateTime,
  generateClientStrongPassword,
} from '../lib/api';
import type { InstitutionSummary } from '../types';

interface FounderDashboardData {
  kpis: {
    totalInstitutions: number;
    activeInstitutions: number;
    suspendedInstitutions: number;
    totalStudents: number;
    totalTeachers: number;
    totalAdministrators: number;
    licenseRevenue: number;
    collectedTuition: number;
    pendingTuition: number;
  };
  institutionBreakdown: (InstitutionSummary & {
    student_count: number;
    teacher_count: number;
    user_count: number;
    collected_fees: number;
  })[];
  recentRegistrations: {
    id: number;
    full_name: string;
    email: string;
    role_name: string;
    institution_name: string | null;
    status: string;
    created_at: string;
  }[];
  systemActivity: {
    id: number;
    actor_name: string;
    actor_role: string;
    action: string;
    details: string;
    institution_name: string | null;
    created_at: string;
  }[];
  recentLogins: {
    id: number;
    identifier: string;
    outcome: string;
    ip_address: string;
    reason: string;
    created_at: string;
  }[];
  recentNotifications: {
    id: number;
    title: string;
    category: string;
    priority: string;
    created_at: string;
  }[];
  systemHealth: {
    status: string;
    databaseEngine: string;
    dbSizeBytes: number;
    uptimeSeconds: number;
    activeSessions: number;
    backupCount: number;
    lastBackup: { filename: string; created_at: string; status: string } | null;
    tenantIsolation: string;
  };
}

interface Props {
  mode: 'overview' | 'institutions';
  onEnterInstitution: (instId: number) => void;
  onInstitutionsChanged: () => void;
}

export const FounderDashboardModule: React.FC<Props> = ({
  mode,
  onEnterInstitution,
  onInstitutionsChanged,
}) => {
  const [data, setData] = useState<FounderDashboardData | null>(null);
  const [institutions, setInstitutions] = useState<InstitutionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');

  // Create Institution Modal
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    shortName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    subscriptionPlan: 'Enterprise' as 'Standard' | 'Professional' | 'Enterprise',
    annualLicenseFee: 18000,
    adminFullName: '',
    adminEmail: '',
    adminUsername: '',
    adminPassword: '',
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [dash, instRes] = await Promise.all([
        apiRequest<FounderDashboardData>('/api/institutions/founder-dashboard'),
        apiRequest<{ institutions: InstitutionSummary[] }>('/api/institutions'),
      ]);
      setData(dash);
      setInstitutions(instRes.institutions);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load Founder dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateInstitution = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await apiRequest<{ message: string }>('/api/institutions', {
        method: 'POST',
        body: form,
      });
      setMessage(res.message);
      setShowCreate(false);
      setForm({
        name: '',
        shortName: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        subscriptionPlan: 'Enterprise',
        annualLicenseFee: 18000,
        adminFullName: '',
        adminEmail: '',
        adminUsername: '',
        adminPassword: '',
      });
      await loadData();
      onInstitutionsChanged();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create institution.');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (inst: InstitutionSummary) => {
    const next = inst.status === 'active' ? 'suspended' : 'active';
    try {
      const res = await apiRequest<{ message: string }>(`/api/institutions/${inst.id}/status`, {
        method: 'PATCH',
        body: { status: next },
      });
      setMessage(res.message);
      await loadData();
      onInstitutionsChanged();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to update institution status.');
    }
  };

  const handleDelete = async (inst: InstitutionSummary) => {
    if (!window.confirm(`Permanently delete ${inst.name} (${inst.institution_code}) and all its tenant records?`)) return;
    try {
      const res = await apiRequest<{ message: string }>(`/api/institutions/${inst.id}`, { method: 'DELETE' });
      setMessage(res.message);
      await loadData();
      onInstitutionsChanged();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to delete institution.');
    }
  };

  const filteredInsts = institutions.filter(
    (i) =>
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.institution_code.toLowerCase().includes(search.toLowerCase()) ||
      (i.city || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading && !data) {
    return (
      <div className="space-y-4">
        <div className="h-24 rounded-xl bg-slate-200/70 dark:bg-slate-800/50 animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((k) => (
            <div key={k} className="h-28 rounded-xl bg-slate-200/70 dark:bg-slate-800/50 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
            {mode === 'overview' ? 'Founder Command Overview' : 'Multi-Institution Registry'}
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Centralized sovereign governance across every registered institution tenant, license ledger, and security stream.
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={loadData}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B192C] px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B192C] dark:bg-[#D4AF37] px-4 py-2 text-xs font-semibold text-white dark:text-[#050B16] hover:bg-[#132946] dark:hover:bg-[#E5C158] whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Register Institution
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-300 dark:border-red-900 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-200">
          {error}
        </div>
      )}
      {message && (
        <div className="flex items-center justify-between rounded-lg border border-emerald-300 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-200">
          <span>{message}</span>
          <button type="button" onClick={() => setMessage('')} className="text-xs underline cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Founder Executive KPIs */}
      {data && mode === 'overview' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
            {[
              { label: 'Total Institutions', val: data.kpis.totalInstitutions, sub: `${data.kpis.activeInstitutions} active · ${data.kpis.suspendedInstitutions} suspended` },
              { label: 'Total Students', val: data.kpis.totalStudents, sub: 'Across all tenants' },
              { label: 'Total Teachers', val: data.kpis.totalTeachers, sub: 'Verified faculty' },
              { label: 'Administrators', val: data.kpis.totalAdministrators, sub: 'Founder & tenant admins' },
              { label: 'Annual Licensing', val: formatCurrency(data.kpis.licenseRevenue), sub: 'Active subscriptions' },
              { label: 'Collected Tuition', val: formatCurrency(data.kpis.collectedTuition), sub: `${formatCurrency(data.kpis.pendingTuition)} pending` },
            ].map((kpi) => (
              <div
                key={kpi.label}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B192C] p-4"
              >
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{kpi.label}</p>
                <p className="mt-2 font-mono text-xl font-bold text-slate-900 dark:text-white tabular-nums">
                  {kpi.val}
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 truncate">{kpi.sub}</p>
              </div>
            ))}
          </div>

          {/* Revenue Chart + System Health */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B192C] p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
                    Revenue Overview by Institution
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Annual platform license fees vs. verified tuition collections
                  </p>
                </div>
              </div>
              <div className="h-64 w-full">
                {data.institutionBreakdown.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-sm text-slate-500">
                    Register an institution to view revenue analytics.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={data.institutionBreakdown.map((i) => ({
                        name: i.short_name || i.name.slice(0, 12),
                        License: Number(i.annual_license_fee || 0),
                        Tuition: Number(i.collected_fees || 0),
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
                      <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94A3B8' }} />
                      <YAxis tick={{ fontSize: 12, fill: '#94A3B8' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#060E1D',
                          borderColor: '#1E293B',
                          borderRadius: '8px',
                          color: '#F8FAFC',
                          fontSize: '12px',
                        }}
                      />
                      <Bar dataKey="License" fill="#D4AF37" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Tuition" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="lg:col-span-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B192C] p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">System Health</h2>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {data.systemHealth.status}
                  </span>
                </div>
                <dl className="mt-4 divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  <div className="py-2.5 flex justify-between gap-2">
                    <dt className="text-slate-500 dark:text-slate-400">Engine</dt>
                    <dd className="font-medium text-slate-900 dark:text-slate-100 text-right">{data.systemHealth.databaseEngine}</dd>
                  </div>
                  <div className="py-2.5 flex justify-between gap-2">
                    <dt className="text-slate-500 dark:text-slate-400">Database Size</dt>
                    <dd className="font-mono font-medium text-slate-900 dark:text-slate-100 tabular-nums">
                      {formatBytes(data.systemHealth.dbSizeBytes)}
                    </dd>
                  </div>
                  <div className="py-2.5 flex justify-between gap-2">
                    <dt className="text-slate-500 dark:text-slate-400">Active Sessions</dt>
                    <dd className="font-mono font-medium text-slate-900 dark:text-slate-100 tabular-nums">
                      {data.systemHealth.activeSessions}
                    </dd>
                  </div>
                  <div className="py-2.5 flex justify-between gap-2">
                    <dt className="text-slate-500 dark:text-slate-400">Verified Backups</dt>
                    <dd className="font-mono font-medium text-slate-900 dark:text-slate-100 tabular-nums">
                      {data.systemHealth.backupCount}
                    </dd>
                  </div>
                  <div className="py-2.5 flex justify-between gap-2">
                    <dt className="text-slate-500 dark:text-slate-400">Tenant Security</dt>
                    <dd className="font-medium text-[#B89223] dark:text-[#D4AF37] text-right">
                      {data.systemHealth.tenantIsolation}
                    </dd>
                  </div>
                </dl>
              </div>
              <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
                Last Backup: {data.systemHealth.lastBackup ? `${data.systemHealth.lastBackup.filename}` : 'No snapshot yet'}
              </p>
            </div>
          </div>
        </>
      )}

      {/* Multi-Institution Registry Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B192C] overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
              Registered Institutions ({filteredInsts.length})
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Each tenant maintains strictly isolated students, faculty, attendance, fees, exams, and certificates.
            </p>
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by institution name, ID, or city..."
            className="w-full sm:w-64 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#060E1D] px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:border-[#D4AF37] focus:outline-none"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#060E1D]/70 text-xs text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-5 py-3 font-medium">Institution</th>
                <th className="px-4 py-3 font-medium">ID &amp; Plan</th>
                <th className="px-4 py-3 font-medium text-right">Students</th>
                <th className="px-4 py-3 font-medium text-right">Teachers</th>
                <th className="px-4 py-3 font-medium text-right">Collected Fees</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredInsts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-sm text-slate-500">
                    No institutions registered yet. Click Register Institution to create your first isolated tenant.
                  </td>
                </tr>
              ) : (
                filteredInsts.map((inst) => (
                  <tr key={inst.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-slate-900 dark:text-white">{inst.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {inst.city || 'Global'} · {inst.admin_email || inst.email}
                      </p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-mono text-xs font-medium text-slate-800 dark:text-slate-200">{inst.institution_code}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{inst.subscription_plan}</p>
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono tabular-nums text-slate-900 dark:text-slate-100">
                      {inst.student_count ?? 0}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono tabular-nums text-slate-900 dark:text-slate-100">
                      {inst.teacher_count ?? 0}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono tabular-nums text-slate-900 dark:text-slate-100">
                      {formatCurrency(inst.collected_fees ?? 0, inst.currency_symbol || '$')}
                    </td>
                    <td className="px-4 py-3.5 text-xs font-semibold">
                      <span className={inst.status === 'active' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>
                        {inst.status === 'active' ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onEnterInstitution(inst.id)}
                          className="inline-flex items-center gap-1 rounded-md border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-2.5 py-1.5 text-xs font-semibold text-[#9A781B] dark:text-[#E8CC72] hover:bg-[#D4AF37]/20 whitespace-nowrap cursor-pointer"
                        >
                          Manage <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleStatus(inst)}
                          title={inst.status === 'active' ? 'Suspend institution' : 'Activate institution'}
                          className="p-1.5 rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                        >
                          {inst.status === 'active' ? <PauseCircle className="w-4 h-4" /> : <PlayCircle className="w-4 h-4 text-emerald-500" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(inst)}
                          title="Delete institution"
                          className="p-1.5 rounded-md border border-slate-200 dark:border-slate-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* System Activity, Recent Registrations & Security Logins */}
      {data && mode === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B192C] p-5">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-[#D4AF37]" />
              <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white">System Activity</h3>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.systemActivity.slice(0, 6).map((a) => (
                <div key={a.id} className="py-2.5 text-xs">
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{a.action.replace(/_/g, ' ')}</p>
                  <p className="text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-2">{a.details}</p>
                  <p className="text-slate-400 dark:text-slate-500 mt-1">
                    {a.actor_name} · {formatDateTime(a.created_at)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B192C] p-5">
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="w-4 h-4 text-[#D4AF37]" />
              <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white">Recent Registrations</h3>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.recentRegistrations.slice(0, 6).map((u) => (
                <div key={u.id} className="py-2.5 text-xs">
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{u.full_name}</p>
                  <p className="text-slate-600 dark:text-slate-400">{u.email}</p>
                  <p className="text-slate-400 dark:text-slate-500 mt-0.5">
                    {u.role_name} · {u.institution_name || 'Platform Global'}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B192C] p-5">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
              <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white">Authentication History</h3>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.recentLogins.slice(0, 6).map((l) => (
                <div key={l.id} className="py-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-900 dark:text-slate-100 truncate">{l.identifier}</span>
                    <span
                      className={`font-semibold ${
                        l.outcome === 'success' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {l.outcome}
                    </span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                    {l.ip_address} · {formatDateTime(l.created_at)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Create Institution Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B192C] p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                  Provision New Institution Tenant
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Creates an isolated institutional database partition and dedicated Institution Administrator.
                </p>
              </div>
              <button type="button" onClick={() => setShowCreate(false)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateInstitution} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Institution Name</label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Oxford Sovereign College"
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060E1D] px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Short Code</label>
                  <input
                    value={form.shortName}
                    onChange={(e) => setForm({ ...form, shortName: e.target.value })}
                    placeholder="OSC"
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060E1D] px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Official Email</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="registrar@oxford-sovereign.edu"
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060E1D] px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">City</label>
                  <input
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    placeholder="Boston"
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060E1D] px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Subscription Plan</label>
                  <select
                    value={form.subscriptionPlan}
                    onChange={(e) => setForm({ ...form, subscriptionPlan: e.target.value as 'Standard' | 'Professional' | 'Enterprise' })}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060E1D] px-3 py-2 text-sm"
                  >
                    <option value="Standard">Standard</option>
                    <option value="Professional">Professional</option>
                    <option value="Enterprise">Enterprise</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Annual License Fee ($)</label>
                  <input
                    type="number"
                    min={0}
                    value={form.annualLicenseFee}
                    onChange={(e) => setForm({ ...form, annualLicenseFee: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060E1D] px-3 py-2 text-sm font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
                <p className="text-xs font-semibold text-[#B89223] dark:text-[#D4AF37] mb-3">
                  Dedicated Institution Administrator Credentials
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Admin Full Name</label>
                    <input
                      required
                      value={form.adminFullName}
                      onChange={(e) => setForm({ ...form, adminFullName: e.target.value })}
                      placeholder="Dr. Julian Mercer"
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060E1D] px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Admin Username</label>
                    <input
                      required
                      value={form.adminUsername}
                      onChange={(e) => setForm({ ...form, adminUsername: e.target.value })}
                      placeholder="j.mercer"
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060E1D] px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Admin Email</label>
                    <input
                      type="email"
                      required
                      value={form.adminEmail}
                      onChange={(e) => setForm({ ...form, adminEmail: e.target.value })}
                      placeholder="admin@oxford-sovereign.edu"
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060E1D] px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Admin Password</label>
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, adminPassword: generateClientStrongPassword(14) })}
                        className="inline-flex items-center gap-1 text-xs text-[#B89223] dark:text-[#D4AF37] cursor-pointer"
                      >
                        <Wand2 className="w-3 h-3" /> Generate
                      </button>
                    </div>
                    <input
                      required
                      value={form.adminPassword}
                      onChange={(e) => setForm({ ...form, adminPassword: e.target.value })}
                      placeholder="Strong password"
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060E1D] px-3 py-2 text-sm font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-[#0B192C] dark:bg-[#D4AF37] px-5 py-2 text-xs font-semibold text-white dark:text-[#050B16] disabled:opacity-50 cursor-pointer"
                >
                  {saving ? 'Provisioning...' : 'Provision Institution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
