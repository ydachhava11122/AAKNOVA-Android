import { Download, Edit3, Plus, Search, Trash2, X } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { apiRequest, exportToCsv } from '../lib/api';
import type { TeacherRecord } from '../types';

interface Props {
  tenantVersion: number;
  canManage: boolean;
}

export const TeachersModule: React.FC<Props> = ({ tenantVersion, canManage }) => {
  const [teachers, setTeachers] = useState<TeacherRecord[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<TeacherRecord | null>(null);
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    department: 'Engineering',
    qualification: '',
    specialization: '',
    workSchedule: 'Mon-Fri, 08:30-16:00',
    performanceRating: 4.5,
    status: 'active' as TeacherRecord['status'],
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiRequest<{ teachers: TeacherRecord[] }>(`/api/teachers?q=${encodeURIComponent(search)}`);
      setTeachers(res.teachers);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to load faculty directory.');
    } finally {
      setLoading(false);
    }
  }, [search, tenantVersion]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm({
      fullName: '',
      email: '',
      phone: '',
      department: 'Engineering',
      qualification: '',
      specialization: '',
      workSchedule: 'Mon-Fri, 08:30-16:00',
      performanceRating: 4.6,
      status: 'active',
    });
    setModalOpen(true);
  };

  const openEdit = (t: TeacherRecord) => {
    setEditing(t);
    setForm({
      fullName: t.full_name,
      email: t.email,
      phone: t.phone,
      department: t.department,
      qualification: t.qualification,
      specialization: t.specialization,
      workSchedule: t.work_schedule,
      performanceRating: t.performance_rating,
      status: t.status,
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (editing) {
        await apiRequest(`/api/teachers/${editing.id}`, { method: 'PUT', body: form });
      } else {
        await apiRequest('/api/teachers', { method: 'POST', body: form });
      }
      setModalOpen(false);
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to save faculty member.');
    }
  };

  const handleDelete = async (t: TeacherRecord) => {
    if (!window.confirm(`Remove faculty member ${t.full_name}?`)) return;
    try {
      await apiRequest(`/api/teachers/${t.id}`, { method: 'DELETE' });
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to delete teacher.');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Teacher Management</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Manage faculty profiles, departments, schedules, and performance ratings.
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() =>
              exportToCsv(
                'aaknova-teachers',
                ['Code', 'Full Name', 'Email', 'Department', 'Qualification', 'Rating', 'Status'],
                teachers.map((t) => [t.teacher_code, t.full_name, t.email, t.department, t.qualification, t.performance_rating, t.status])
              )
            }
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B192C] px-3.5 py-2 text-xs font-medium cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
          {canManage && (
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B192C] dark:bg-[#D4AF37] px-4 py-2 text-xs font-semibold text-white dark:text-[#050B16] cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Teacher
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-300 dark:border-red-900 bg-red-50 dark:bg-red-950/30 px-4 py-3 text-sm text-red-700 dark:text-red-200">
          {error}
        </div>
      )}

      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search faculty by name, code, department, or email..."
          className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B192C] pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white focus:border-[#D4AF37] focus:outline-none"
        />
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B192C] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#060E1D]/70 text-xs text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-5 py-3 font-medium">Faculty Member</th>
                <th className="px-4 py-3 font-medium">Code &amp; Department</th>
                <th className="px-4 py-3 font-medium">Qualification</th>
                <th className="px-4 py-3 font-medium text-right">Rating</th>
                <th className="px-4 py-3 font-medium">Status</th>
                {canManage && <th className="px-5 py-3 font-medium text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {loading ? (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-xs text-slate-500">Loading faculty...</td></tr>
              ) : teachers.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-500">No faculty records found.</td></tr>
              ) : (
                teachers.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-slate-900 dark:text-white">{t.full_name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{t.email}</p>
                    </td>
                    <td className="px-4 py-3.5 text-xs">
                      <p className="font-mono text-slate-800 dark:text-slate-200">{t.teacher_code}</p>
                      <p className="text-slate-500 dark:text-slate-400">{t.department}</p>
                    </td>
                    <td className="px-4 py-3.5 text-xs">
                      <p className="text-slate-800 dark:text-slate-200">{t.qualification || '—'}</p>
                      <p className="text-slate-500 dark:text-slate-400">{t.specialization || t.work_schedule}</p>
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono tabular-nums text-xs font-semibold text-[#B89223] dark:text-[#E8CC72]">
                      {Number(t.performance_rating).toFixed(1)} / 5.0
                    </td>
                    <td className="px-4 py-3.5 text-xs font-semibold capitalize">
                      <span className={t.status === 'active' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}>
                        {t.status.replace('_', ' ')}
                      </span>
                    </td>
                    {canManage && (
                      <td className="px-5 py-3.5 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button type="button" onClick={() => openEdit(t)} className="p-1.5 rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button type="button" onClick={() => handleDelete(t)} className="p-1.5 rounded-md border border-slate-200 dark:border-slate-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B192C] p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
                {editing ? 'Update Faculty Member' : 'Add Faculty Member'}
              </h3>
              <button type="button" onClick={() => setModalOpen(false)} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSave} className="mt-4 space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-medium mb-1">Full Name</label>
                  <input required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060E1D] px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Email</label>
                  <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060E1D] px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Department</label>
                  <input required value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060E1D] px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Qualification</label>
                  <input value={form.qualification} onChange={(e) => setForm({ ...form, qualification: e.target.value })} placeholder="PhD Computer Science" className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060E1D] px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Specialization</label>
                  <input value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060E1D] px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Rating (0 - 5)</label>
                  <input type="number" step="0.1" min="0" max="5" value={form.performanceRating} onChange={(e) => setForm({ ...form, performanceRating: Number(e.target.value) })} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060E1D] px-3 py-2 text-sm font-mono" />
                </div>
              </div>
              <div className="flex justify-end gap-2.5 pt-3">
                <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs font-medium cursor-pointer">Cancel</button>
                <button type="submit" className="rounded-lg bg-[#0B192C] dark:bg-[#D4AF37] px-4 py-2 text-xs font-semibold text-white dark:text-[#050B16] cursor-pointer">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
