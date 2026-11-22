import { Download, Edit3, Plus, Search, Trash2, X } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { apiRequest, exportToCsv } from '../lib/api';
import type { AcademicClass, Course, StudentRecord } from '../types';

interface Props {
  tenantVersion: number;
  canManage: boolean;
}

export const StudentsModule: React.FC<Props> = ({ tenantVersion, canManage }) => {
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [classes, setClasses] = useState<AcademicClass[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<StudentRecord | null>(null);
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: 'Unspecified',
    address: '',
    courseId: 0,
    classId: 0,
    guardianName: '',
    guardianPhone: '',
    guardianEmail: '',
    status: 'active' as StudentRecord['status'],
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [sRes, catRes] = await Promise.all([
        apiRequest<{ students: StudentRecord[] }>(`/api/students?status=${statusFilter}&q=${encodeURIComponent(search)}`),
        apiRequest<{ courses: Course[]; classes: AcademicClass[] }>('/api/academics/catalog'),
      ]);
      setStudents(sRes.students);
      setCourses(catRes.courses);
      setClasses(catRes.classes);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load students.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search, tenantVersion]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm({
      fullName: '',
      email: '',
      phone: '',
      dateOfBirth: '2005-01-15',
      gender: 'Unspecified',
      address: '',
      courseId: courses[0]?.id || 0,
      classId: classes[0]?.id || 0,
      guardianName: '',
      guardianPhone: '',
      guardianEmail: '',
      status: 'active',
    });
    setModalOpen(true);
  };

  const openEdit = (s: StudentRecord) => {
    setEditing(s);
    setForm({
      fullName: s.full_name,
      email: s.email,
      phone: s.phone,
      dateOfBirth: s.date_of_birth,
      gender: s.gender,
      address: s.address,
      courseId: s.course_id,
      classId: s.class_id,
      guardianName: s.guardian_name,
      guardianPhone: s.guardian_phone,
      guardianEmail: s.guardian_email,
      status: s.status,
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (editing) {
        await apiRequest(`/api/students/${editing.id}`, { method: 'PUT', body: form });
      } else {
        await apiRequest('/api/students', { method: 'POST', body: form });
      }
      setModalOpen(false);
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to save student.');
    }
  };

  const handleDelete = async (s: StudentRecord) => {
    if (!window.confirm(`Delete student record for ${s.full_name}?`)) return;
    try {
      await apiRequest(`/api/students/${s.id}`, { method: 'DELETE' });
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to delete student.');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Student Management</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Enroll, update, filter, and export tenant-isolated student records.
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() =>
              exportToCsv(
                'aaknova-students',
                ['Code', 'Admission #', 'Full Name', 'Email', 'Course', 'Class', 'Guardian', 'Status'],
                students.map((s) => [s.student_code, s.admission_number, s.full_name, s.email, s.course_name, `${s.class_name}-${s.class_section}`, s.guardian_name, s.status])
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
              <Plus className="w-4 h-4" /> Enroll Student
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-300 dark:border-red-900 bg-red-50 dark:bg-red-950/30 px-4 py-3 text-sm text-red-700 dark:text-red-200">
          {error}
        </div>
      )}

      {/* Search & Status Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, admission number, code, or email..."
            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B192C] pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white focus:border-[#D4AF37] focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-[#0B192C] border border-slate-200 dark:border-slate-800">
          {['all', 'active', 'graduated', 'suspended'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors cursor-pointer ${
                statusFilter === st
                  ? 'bg-white dark:bg-[#132946] text-slate-900 dark:text-[#E8CC72] shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B192C] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#060E1D]/70 text-xs text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-5 py-3 font-medium">Student</th>
                <th className="px-4 py-3 font-medium">Admission ID</th>
                <th className="px-4 py-3 font-medium">Program &amp; Cohort</th>
                <th className="px-4 py-3 font-medium">Guardian</th>
                <th className="px-4 py-3 font-medium">Status</th>
                {canManage && <th className="px-5 py-3 font-medium text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-xs text-slate-500">Loading students...</td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-500">
                    No students match the current filter.
                  </td>
                </tr>
              ) : (
                students.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-slate-900 dark:text-white">{s.full_name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{s.email}</p>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs text-slate-700 dark:text-slate-300">
                      <p>{s.student_code}</p>
                      <p className="text-slate-400">{s.admission_number}</p>
                    </td>
                    <td className="px-4 py-3.5 text-xs">
                      <p className="font-medium text-slate-800 dark:text-slate-200">{s.course_name}</p>
                      <p className="text-slate-500 dark:text-slate-400">{s.class_name} · Section {s.class_section}</p>
                    </td>
                    <td className="px-4 py-3.5 text-xs">
                      <p className="text-slate-800 dark:text-slate-200">{s.guardian_name || '—'}</p>
                      <p className="text-slate-500 dark:text-slate-400">{s.guardian_phone || ''}</p>
                    </td>
                    <td className="px-4 py-3.5 text-xs font-semibold capitalize">
                      <span
                        className={
                          s.status === 'active'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : s.status === 'suspended'
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-slate-500'
                        }
                      >
                        {s.status}
                      </span>
                    </td>
                    {canManage && (
                      <td className="px-5 py-3.5 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEdit(s)}
                            className="p-1.5 rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                            title="Edit student"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(s)}
                            className="p-1.5 rounded-md border border-slate-200 dark:border-slate-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
                            title="Delete student"
                          >
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

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 overflow-y-auto">
          <div className="w-full max-w-xl rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B192C] p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
                {editing ? 'Update Student Record' : 'Enroll New Student'}
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
                  <label className="block text-xs font-medium mb-1">Program / Course</label>
                  <select required value={form.courseId} onChange={(e) => setForm({ ...form, courseId: Number(e.target.value) })} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060E1D] px-3 py-2 text-sm">
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>{c.code} — {c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Cohort / Class</label>
                  <select required value={form.classId} onChange={(e) => setForm({ ...form, classId: Number(e.target.value) })} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060E1D] px-3 py-2 text-sm">
                    {classes.map((cl) => (
                      <option key={cl.id} value={cl.id}>{cl.name} (Sec {cl.section})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Guardian Name</label>
                  <input value={form.guardianName} onChange={(e) => setForm({ ...form, guardianName: e.target.value })} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060E1D] px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Guardian Phone</label>
                  <input value={form.guardianPhone} onChange={(e) => setForm({ ...form, guardianPhone: e.target.value })} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060E1D] px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Phone</label>
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060E1D] px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as StudentRecord['status'] })} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060E1D] px-3 py-2 text-sm">
                    <option value="active">Active</option>
                    <option value="graduated">Graduated</option>
                    <option value="suspended">Suspended</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2.5 pt-3">
                <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs font-medium cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="rounded-lg bg-[#0B192C] dark:bg-[#D4AF37] px-4 py-2 text-xs font-semibold text-white dark:text-[#050B16] cursor-pointer">
                  {editing ? 'Save Changes' : 'Enroll Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
