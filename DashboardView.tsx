import { Download, RefreshCw } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { apiRequest, exportToCsv, formatCurrency, formatDateTime } from '../lib/api';

interface OverviewResponse {
  institution: {
    id: number;
    institution_code: string;
    name: string;
    city: string;
    academic_year: string;
    currency_symbol: string;
    subscription_plan: string;
  };
  kpis: {
    totalStudents: number;
    totalTeachers: number;
    totalStaff: number;
    totalParents: number;
    attendanceRate: number;
    totalBilled: number;
    totalCollected: number;
    totalOutstanding: number;
    averageExamScore: number;
    totalBooks: number;
    activeLoans: number;
    activeRoutes: number;
    assignedStudents: number;
  };
  charts: {
    enrollmentByCourse: { code: string; name: string; students: number }[];
    attendanceByDate: { date: string; present: number; late: number; absent: number }[];
    feeStatusBreakdown: { status: string; count: number; amount: number }[];
    gradeDistribution: { grade: string; count: number }[];
  };
  recentNotices: { id: number; title: string; category: string; priority: string; created_at: string }[];
  recentPayments: { id: number; receipt_number: string; amount: number; payment_method: string; student_name: string; created_at: string }[];
}

interface DashboardViewProps {
  mode: 'dashboard' | 'reports';
  tenantVersion: number;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ mode, tenantVersion }) => {
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiRequest<OverviewResponse>('/api/dashboard/overview');
      setData(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to load institution analytics.');
    } finally {
      setLoading(false);
    }
  }, [tenantVersion]);

  useEffect(() => {
    load();
  }, [load]);

  const handleExportSummaryCsv = () => {
    if (!data) return;
    exportToCsv(
      `aaknova-report-${data.institution.institution_code}`,
      ['Metric', 'Value'],
      [
        ['Institution', data.institution.name],
        ['Institution Code', data.institution.institution_code],
        ['Total Students', data.kpis.totalStudents],
        ['Total Teachers', data.kpis.totalTeachers],
        ['Total Staff', data.kpis.totalStaff],
        ['Attendance Rate (%)', data.kpis.attendanceRate],
        ['Total Tuition Billed', data.kpis.totalBilled],
        ['Total Tuition Collected', data.kpis.totalCollected],
        ['Total Outstanding', data.kpis.totalOutstanding],
        ['Average Exam Score (%)', data.kpis.averageExamScore],
        ['Library Books', data.kpis.totalBooks],
        ['Active Library Loans', data.kpis.activeLoans],
        ['Active Transport Routes', data.kpis.activeRoutes],
      ]
    );
  };

  if (loading && !data) {
    return (
      <div className="space-y-4">
        <div className="h-20 rounded-xl bg-slate-200/70 dark:bg-slate-800/50 animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-xl bg-slate-200/70 dark:bg-slate-800/50 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-red-300 dark:border-red-900 bg-red-50 dark:bg-red-950/30 p-6 text-sm text-red-700 dark:text-red-200">
        {error || 'Select an active institution to view analytics.'}
      </div>
    );
  }

  const sym = data.institution.currency_symbol || '$';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-[#B89223] dark:text-[#D4AF37]">
            {data.institution.institution_code} · Academic Year {data.institution.academic_year}
          </p>
          <h1 className="mt-0.5 font-display text-2xl font-bold text-slate-900 dark:text-white">
            {mode === 'reports' ? `${data.institution.name} — Reports & Analytics` : data.institution.name}
          </h1>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B192C] px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
          <button
            type="button"
            onClick={handleExportSummaryCsv}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B192C] dark:bg-[#D4AF37] px-4 py-2 text-xs font-semibold text-white dark:text-[#050B16] hover:bg-[#132946] dark:hover:bg-[#E5C158] cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Export Report CSV
          </button>
        </div>
      </div>

      {/* Core Institutional KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Enrolled Students', val: data.kpis.totalStudents, meta: `${data.kpis.totalParents} registered guardians` },
          { label: 'Faculty & Staff', val: data.kpis.totalTeachers + data.kpis.totalStaff, meta: `${data.kpis.totalTeachers} teachers · ${data.kpis.totalStaff} staff` },
          { label: 'Attendance Rate', val: `${data.kpis.attendanceRate}%`, meta: `Avg exam score ${data.kpis.averageExamScore}%` },
          { label: 'Tuition Collected', val: formatCurrency(data.kpis.totalCollected, sym), meta: `${formatCurrency(data.kpis.totalOutstanding, sym)} outstanding` },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B192C] p-5"
          >
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{item.label}</p>
            <p className="mt-2 font-mono text-2xl font-bold text-slate-900 dark:text-white tabular-nums">{item.val}</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{item.meta}</p>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B192C] p-5">
          <h2 className="font-display text-sm font-bold text-slate-900 dark:text-white">Daily Student Attendance Trend</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Present vs. late and absent headcount</p>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.charts.attendanceByDate}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.16)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} />
                <Tooltip contentStyle={{ backgroundColor: '#060E1D', borderColor: '#1E293B', borderRadius: 8, color: '#fff', fontSize: 12 }} />
                <Area type="monotone" dataKey="present" stroke="#D4AF37" fill="#D4AF37" fillOpacity={0.22} />
                <Area type="monotone" dataKey="late" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.18} />
                <Area type="monotone" dataKey="absent" stroke="#EF4444" fill="#EF4444" fillOpacity={0.14} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B192C] p-5">
          <h2 className="font-display text-sm font-bold text-slate-900 dark:text-white">Enrollment by Academic Program</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Active student distribution per course</p>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.charts.enrollmentByCourse}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.16)" />
                <XAxis dataKey="code" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: '#060E1D', borderColor: '#1E293B', borderRadius: 8, color: '#fff', fontSize: 12 }} />
                <Bar dataKey="students" fill="#D4AF37" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {mode === 'reports' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B192C] p-5">
            <h2 className="font-display text-sm font-bold text-slate-900 dark:text-white">Examination Grade Distribution</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Published &amp; recorded subject grades</p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.charts.gradeDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.16)" />
                  <XAxis dataKey="grade" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#060E1D', borderColor: '#1E293B', borderRadius: 8, color: '#fff', fontSize: 12 }} />
                  <Bar dataKey="count" fill="#2563EB" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B192C] p-5">
            <h2 className="font-display text-sm font-bold text-slate-900 dark:text-white">Campus Operations Summary</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Library, transport, and fee ledger utilization</p>
            <dl className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              <div className="py-3 flex justify-between">
                <dt className="text-slate-500 dark:text-slate-400">Library Catalog Copies</dt>
                <dd className="font-mono font-semibold tabular-nums">{data.kpis.totalBooks}</dd>
              </div>
              <div className="py-3 flex justify-between">
                <dt className="text-slate-500 dark:text-slate-400">Active Book Loans</dt>
                <dd className="font-mono font-semibold tabular-nums">{data.kpis.activeLoans}</dd>
              </div>
              <div className="py-3 flex justify-between">
                <dt className="text-slate-500 dark:text-slate-400">Active Transport Routes</dt>
                <dd className="font-mono font-semibold tabular-nums">{data.kpis.activeRoutes}</dd>
              </div>
              <div className="py-3 flex justify-between">
                <dt className="text-slate-500 dark:text-slate-400">Students on Campus Transport</dt>
                <dd className="font-mono font-semibold tabular-nums">{data.kpis.assignedStudents}</dd>
              </div>
              <div className="py-3 flex justify-between">
                <dt className="text-slate-500 dark:text-slate-400">Total Tuition Billed</dt>
                <dd className="font-mono font-semibold tabular-nums">{formatCurrency(data.kpis.totalBilled, sym)}</dd>
              </div>
            </dl>
          </div>
        </div>
      )}

      {/* Recent Payments & Institutional Notices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B192C] p-5">
          <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white mb-3">Recent Verified Payments</h3>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {data.recentPayments.length === 0 ? (
              <p className="py-6 text-xs text-slate-500">No verified payments recorded yet.</p>
            ) : (
              data.recentPayments.map((p) => (
                <div key={p.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{p.student_name}</p>
                    <p className="text-slate-500 dark:text-slate-400 font-mono">{p.receipt_number} · {p.payment_method}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {formatCurrency(p.amount, sym)}
                    </p>
                    <p className="text-slate-400">{formatDateTime(p.created_at)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B192C] p-5">
          <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white mb-3">Latest Institutional Notices</h3>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {data.recentNotices.length === 0 ? (
              <p className="py-6 text-xs text-slate-500">No announcements published yet.</p>
            ) : (
              data.recentNotices.map((n) => (
                <div key={n.id} className="py-2.5 text-xs">
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{n.title}</p>
                  <p className="mt-0.5 text-slate-500 dark:text-slate-400">
                    {n.category} · Priority: {n.priority} · {formatDateTime(n.created_at)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
