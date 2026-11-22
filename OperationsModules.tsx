import { Award, BookOpen, Bus, CheckCircle2, Plus, Printer, RotateCcw, Trash2, X } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { BrandMark } from '../components/BrandMark';
import { apiRequest, formatCurrency, formatDate } from '../lib/api';
import type { AcademicClass, StaffRecord, StudentRecord, Subject, TeacherRecord } from '../types';

/* ============================================================================
 * STAFF MANAGEMENT MODULE
 * ========================================================================== */
export const StaffModule: React.FC<{ tenantVersion: number; canManage: boolean; currencySymbol: string }> = ({
  tenantVersion,
  canManage,
  currencySymbol,
}) => {
  const [staff, setStaff] = useState<StaffRecord[]>([]);
  const [modal, setModal] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', department: 'Administration', designation: 'Operations Coordinator', shiftSchedule: 'Mon-Fri, 08:00-17:00', monthlySalary: 4500 });

  const load = useCallback(async () => {
    try {
      const res = await apiRequest<{ staff: StaffRecord[] }>('/api/operations/staff');
      setStaff(res.staff);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to load staff.');
    }
  }, [tenantVersion]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await apiRequest('/api/operations/staff', { method: 'POST', body: form });
      setModal(false);
      setForm({ fullName: '', email: '', phone: '', department: 'Administration', designation: 'Operations Coordinator', shiftSchedule: 'Mon-Fri, 08:00-17:00', monthlySalary: 4500 });
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to add staff.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this staff record?')) return;
    await apiRequest(`/api/operations/staff/${id}`, { method: 'DELETE' });
    await load();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Staff Management</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">Manage non-teaching operations staff, departments, shifts, and payroll records.</p>
        </div>
        {canManage && (
          <button type="button" onClick={() => setModal(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B192C] dark:bg-[#D4AF37] px-4 py-2 text-xs font-semibold text-white dark:text-[#050B16] cursor-pointer shrink-0">
            <Plus className="w-4 h-4" /> Add Staff
          </button>
        )}
      </div>
      {error && <div className="rounded-lg border border-red-300 dark:border-red-900 bg-red-50 dark:bg-red-950/30 px-4 py-3 text-sm text-red-700 dark:text-red-200">{error}</div>}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B192C] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#060E1D]/70 text-xs text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">Staff Member</th>
                <th className="px-4 py-3 font-medium">Code &amp; Department</th>
                <th className="px-4 py-3 font-medium">Designation &amp; Shift</th>
                <th className="px-4 py-3 font-medium text-right">Monthly Salary</th>
                {canManage && <th className="px-5 py-3 font-medium text-right">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {staff.map((st) => (
                <tr key={st.id}>
                  <td className="px-5 py-3">
                    <p className="font-semibold text-slate-900 dark:text-white">{st.full_name}</p>
                    <p className="text-xs text-slate-500">{st.email}</p>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <p className="font-mono">{st.staff_code}</p>
                    <p className="text-slate-500">{st.department}</p>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <p className="font-medium">{st.designation}</p>
                    <p className="text-slate-500">{st.shift_schedule}</p>
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums text-xs">{formatCurrency(st.monthly_salary, currencySymbol)}</td>
                  {canManage && (
                    <td className="px-5 py-3 text-right">
                      <button type="button" onClick={() => handleDelete(st.id)} className="p-1.5 rounded-md border border-slate-200 dark:border-slate-700 text-red-600 dark:text-red-400 cursor-pointer">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B192C] p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-display text-base font-bold">Add Staff Member</h3>
              <button type="button" onClick={() => setModal(false)} className="cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSave} className="mt-4 space-y-3">
              <input required placeholder="Full Name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060E1D] px-3 py-2 text-sm" />
              <input type="email" required placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060E1D] px-3 py-2 text-sm" />
              <div className="grid grid-cols-2 gap-3">
                <input required placeholder="Department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060E1D] px-3 py-2 text-sm" />
                <input required placeholder="Designation" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060E1D] px-3 py-2 text-sm" />
              </div>
              <input type="number" min={0} placeholder="Monthly Salary" value={form.monthlySalary} onChange={(e) => setForm({ ...form, monthlySalary: Number(e.target.value) })} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060E1D] px-3 py-2 text-sm font-mono" />
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setModal(false)} className="rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs cursor-pointer">Cancel</button>
                <button type="submit" className="rounded-lg bg-[#0B192C] dark:bg-[#D4AF37] px-4 py-2 text-xs font-semibold text-white dark:text-[#050B16] cursor-pointer">Save Staff</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

/* ============================================================================
 * TIMETABLE MANAGEMENT MODULE
 * ========================================================================== */
interface TimetableSlot {
  id: number;
  day_of_week: string;
  start_time: string;
  end_time: string;
  room_number: string;
  class_name: string;
  class_section: string;
  subject_name: string;
  subject_code: string;
  teacher_name: string | null;
}

export const TimetableModule: React.FC<{ tenantVersion: number; canManage: boolean }> = ({ tenantVersion, canManage }) => {
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [classes, setClasses] = useState<AcademicClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<TeacherRecord[]>([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ classId: 0, subjectId: 0, teacherId: 0, dayOfWeek: 'Monday', startTime: '09:00', endTime: '10:30', roomNumber: 'Hall-101' });

  const load = useCallback(async () => {
    const [ttRes, catRes, tRes] = await Promise.all([
      apiRequest<{ slots: TimetableSlot[] }>('/api/operations/timetables'),
      apiRequest<{ classes: AcademicClass[]; subjects: Subject[] }>('/api/academics/catalog'),
      apiRequest<{ teachers: TeacherRecord[] }>('/api/teachers'),
    ]);
    setSlots(ttRes.slots);
    setClasses(catRes.classes);
    setSubjects(catRes.subjects);
    setTeachers(tRes.teachers);
  }, [tenantVersion]);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await apiRequest('/api/operations/timetables', {
      method: 'POST',
      body: { ...form, teacherId: form.teacherId || null },
    });
    setModal(false);
    await load();
  };

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Timetable Management</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">Weekly academic schedule mapped by cohort, subject, faculty, and lecture room.</p>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={() => {
              setForm({ ...form, classId: classes[0]?.id || 0, subjectId: subjects[0]?.id || 0, teacherId: teachers[0]?.id || 0 });
              setModal(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B192C] dark:bg-[#D4AF37] px-4 py-2 text-xs font-semibold text-white dark:text-[#050B16] cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" /> Add Slot
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {days.map((day) => {
          const daySlots = slots.filter((s) => s.day_of_week === day);
          return (
            <div key={day} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B192C] p-4">
              <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white pb-2.5 border-b border-slate-100 dark:border-slate-800">
                {day}
              </h3>
              <div className="mt-3 space-y-2.5">
                {daySlots.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3">No scheduled classes.</p>
                ) : (
                  daySlots.map((sl) => (
                    <div key={sl.id} className="flex items-start justify-between gap-2 pb-2.5 border-b last:border-b-0 border-slate-100 dark:border-slate-800/70">
                      <div className="text-xs">
                        <p className="font-mono font-semibold text-[#B89223] dark:text-[#E8CC72]">
                          {sl.start_time} – {sl.end_time}
                        </p>
                        <p className="font-semibold text-slate-900 dark:text-white mt-0.5">{sl.subject_name}</p>
                        <p className="text-slate-500 dark:text-slate-400">
                          {sl.class_name}-{sl.class_section} · {sl.teacher_name || 'TBA'} · {sl.room_number}
                        </p>
                      </div>
                      {canManage && (
                        <button
                          type="button"
                          onClick={async () => {
                            await apiRequest(`/api/operations/timetables/${sl.id}`, { method: 'DELETE' });
                            await load();
                          }}
                          className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B192C] p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-display text-base font-bold">Schedule Timetable Slot</h3>
              <button type="button" onClick={() => setModal(false)} className="cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleAdd} className="mt-4 space-y-3">
              <select value={form.dayOfWeek} onChange={(e) => setForm({ ...form, dayOfWeek: e.target.value })} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060E1D] px-3 py-2 text-sm">
                {days.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
              <select value={form.classId} onChange={(e) => setForm({ ...form, classId: Number(e.target.value) })} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060E1D] px-3 py-2 text-sm">
                {classes.map((c) => <option key={c.id} value={c.id}>{c.name}-{c.section}</option>)}
              </select>
              <select value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: Number(e.target.value) })} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060E1D] px-3 py-2 text-sm">
                {subjects.map((s) => <option key={s.id} value={s.id}>{s.code} — {s.name}</option>)}
              </select>
              <select value={form.teacherId} onChange={(e) => setForm({ ...form, teacherId: Number(e.target.value) })} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060E1D] px-3 py-2 text-sm">
                <option value={0}>Unassigned Faculty</option>
                {teachers.map((t) => <option key={t.id} value={t.id}>{t.full_name}</option>)}
              </select>
              <div className="grid grid-cols-3 gap-2">
                <input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060E1D] px-2.5 py-2 text-xs font-mono" />
                <input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060E1D] px-2.5 py-2 text-xs font-mono" />
                <input placeholder="Room" value={form.roomNumber} onChange={(e) => setForm({ ...form, roomNumber: e.target.value })} className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060E1D] px-2.5 py-2 text-xs" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setModal(false)} className="rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs cursor-pointer">Cancel</button>
                <button type="submit" className="rounded-lg bg-[#0B192C] dark:bg-[#D4AF37] px-4 py-2 text-xs font-semibold text-white dark:text-[#050B16] cursor-pointer">Save Slot</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

/* ============================================================================
 * LIBRARY MANAGEMENT MODULE
 * ========================================================================== */
interface BookRow {
  id: number;
  isbn: string;
  title: string;
  author: string;
  category: string;
  shelf_location: string;
  total_copies: number;
  available_copies: number;
  status: string;
}

interface LoanRow {
  id: number;
  book_title: string;
  isbn: string;
  student_name: string;
  student_code: string;
  issued_date: string;
  due_date: string;
  returned_date: string | null;
  status: string;
}

export const LibraryModule: React.FC<{ tenantVersion: number; canManage: boolean }> = ({ tenantVersion, canManage }) => {
  const [books, setBooks] = useState<BookRow[]>([]);
  const [issues, setIssues] = useState<LoanRow[]>([]);
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [bookModal, setBookModal] = useState(false);
  const [issueModal, setIssueModal] = useState(false);
  const [error, setError] = useState('');
  const [bookForm, setBookForm] = useState({ isbn: '', title: '', author: '', category: 'Academic', shelfLocation: 'A-01', totalCopies: 5 });
  const [issueForm, setIssueForm] = useState({ bookId: 0, studentId: 0, dueDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10) });

  const load = useCallback(async () => {
    setError('');
    try {
      const [lib, stRes] = await Promise.all([
        apiRequest<{ books: BookRow[]; issues: LoanRow[] }>('/api/operations/library'),
        apiRequest<{ students: StudentRecord[] }>('/api/students'),
      ]);
      setBooks(lib.books);
      setIssues(lib.issues);
      setStudents(stRes.students);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to load library.');
    }
  }, [tenantVersion]);

  useEffect(() => { load(); }, [load]);

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/api/operations/library/books', { method: 'POST', body: bookForm });
      setBookModal(false);
      setBookForm({ isbn: '', title: '', author: '', category: 'Academic', shelfLocation: 'A-01', totalCopies: 5 });
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to catalog book.');
    }
  };

  const handleIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/api/operations/library/issues', { method: 'POST', body: issueForm });
      setIssueModal(false);
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to issue book.');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Library Management</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">Catalog books, monitor copy availability, and manage student loans and returns.</p>
        </div>
        {canManage && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setIssueForm({ ...issueForm, bookId: books.find((b) => b.available_copies > 0)?.id || 0, studentId: students[0]?.id || 0 });
                setIssueModal(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B192C] px-3.5 py-2 text-xs font-medium cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" /> Issue Book
            </button>
            <button type="button" onClick={() => setBookModal(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B192C] dark:bg-[#D4AF37] px-4 py-2 text-xs font-semibold text-white dark:text-[#050B16] cursor-pointer">
              <Plus className="w-4 h-4" /> Add Book
            </button>
          </div>
        )}
      </div>

      {error && <div className="rounded-lg border border-red-300 dark:border-red-900 bg-red-50 dark:bg-red-950/30 px-4 py-3 text-sm text-red-700 dark:text-red-200">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B192C] overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 font-display text-sm font-bold">
            Catalog Holdings ({books.length})
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {books.map((b) => (
              <div key={b.id} className="px-5 py-3.5 flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-sm text-slate-900 dark:text-white">{b.title}</p>
                  <p className="text-xs text-slate-500">{b.author} · ISBN {b.isbn} · Shelf {b.shelf_location}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-mono text-xs tabular-nums font-semibold text-[#B89223] dark:text-[#E8CC72]">
                    {b.available_copies}/{b.total_copies} avail
                  </span>
                  {canManage && (
                    <button
                      type="button"
                      onClick={async () => {
                        await apiRequest(`/api/operations/library/books/${b.id}`, { method: 'DELETE' });
                        await load();
                      }}
                      className="p-1.5 rounded border border-slate-200 dark:border-slate-700 text-red-600 dark:text-red-400 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B192C] overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 font-display text-sm font-bold">
            Active &amp; Returned Loans ({issues.length})
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {issues.map((i) => (
              <div key={i.id} className="px-5 py-3.5 flex items-center justify-between gap-3 text-xs">
                <div>
                  <p className="font-semibold text-sm text-slate-900 dark:text-white">{i.book_title}</p>
                  <p className="text-slate-500">{i.student_name} ({i.student_code}) · Due {formatDate(i.due_date)}</p>
                </div>
                {i.status === 'issued' && canManage ? (
                  <button
                    type="button"
                    onClick={async () => {
                      await apiRequest(`/api/operations/library/issues/${i.id}/return`, { method: 'PATCH', body: { fineAmount: 0 } });
                      await load();
                    }}
                    className="inline-flex items-center gap-1 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1.5 font-semibold text-emerald-700 dark:text-emerald-300 cursor-pointer shrink-0"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Mark Returned
                  </button>
                ) : (
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400 capitalize">{i.status}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {bookModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B192C] p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-display text-base font-bold">Catalog New Book</h3>
              <button type="button" onClick={() => setBookModal(false)} className="cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleAddBook} className="mt-4 space-y-3">
              <input required placeholder="ISBN" value={bookForm.isbn} onChange={(e) => setBookForm({ ...bookForm, isbn: e.target.value })} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060E1D] px-3 py-2 text-sm font-mono" />
              <input required placeholder="Book Title" value={bookForm.title} onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060E1D] px-3 py-2 text-sm" />
              <input required placeholder="Author" value={bookForm.author} onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060E1D] px-3 py-2 text-sm" />
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Shelf Location" value={bookForm.shelfLocation} onChange={(e) => setBookForm({ ...bookForm, shelfLocation: e.target.value })} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060E1D] px-3 py-2 text-sm" />
                <input type="number" min={1} placeholder="Copies" value={bookForm.totalCopies} onChange={(e) => setBookForm({ ...bookForm, totalCopies: Number(e.target.value) })} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060E1D] px-3 py-2 text-sm font-mono" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setBookModal(false)} className="rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs cursor-pointer">Cancel</button>
                <button type="submit" className="rounded-lg bg-[#0B192C] dark:bg-[#D4AF37] px-4 py-2 text-xs font-semibold text-white dark:text-[#050B16] cursor-pointer">Add to Catalog</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {issueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B192C] p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-display text-base font-bold">Issue Library Book</h3>
              <button type="button" onClick={() => setIssueModal(false)} className="cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleIssue} className="mt-4 space-y-3">
              <select required value={issueForm.bookId} onChange={(e) => setIssueForm({ ...issueForm, bookId: Number(e.target.value) })} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060E1D] px-3 py-2 text-sm">
                {books.filter((b) => b.available_copies > 0).map((b) => <option key={b.id} value={b.id}>{b.title} ({b.available_copies} avail)</option>)}
              </select>
              <select required value={issueForm.studentId} onChange={(e) => setIssueForm({ ...issueForm, studentId: Number(e.target.value) })} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060E1D] px-3 py-2 text-sm">
                {students.map((s) => <option key={s.id} value={s.id}>{s.full_name} ({s.student_code})</option>)}
              </select>
              <input type="date" required value={issueForm.dueDate} onChange={(e) => setIssueForm({ ...issueForm, dueDate: e.target.value })} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060E1D] px-3 py-2 text-sm font-mono" />
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIssueModal(false)} className="rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs cursor-pointer">Cancel</button>
                <button type="submit" className="rounded-lg bg-[#0B192C] dark:bg-[#D4AF37] px-4 py-2 text-xs font-semibold text-white dark:text-[#050B16] cursor-pointer">Issue Loan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

/* ============================================================================
 * TRANSPORT MANAGEMENT MODULE
 * ========================================================================== */
interface RouteRow {
  id: number;
  route_code: string;
  route_name: string;
  vehicle_number: string;
  driver_name: string;
  driver_phone: string;
  stops: string;
  capacity: number;
  assigned_count: number;
  monthly_fee: number;
}

interface AssignRow {
  id: number;
  route_code: string;
  route_name: string;
  student_name: string;
  student_code: string;
  pickup_stop: string;
}

export const TransportModule: React.FC<{ tenantVersion: number; canManage: boolean; currencySymbol: string }> = ({
  tenantVersion,
  canManage,
  currencySymbol,
}) => {
  const [routes, setRoutes] = useState<RouteRow[]>([]);
  const [assignments, setAssignments] = useState<AssignRow[]>([]);
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [routeModal, setRouteModal] = useState(false);
  const [assignModal, setAssignModal] = useState(false);
  const [rForm, setRForm] = useState({ routeCode: '', routeName: '', vehicleNumber: '', driverName: '', driverPhone: '', stops: '', capacity: 40, monthlyFee: 160 });
  const [aForm, setAForm] = useState({ routeId: 0, studentId: 0, pickupStop: 'Central Station' });

  const load = useCallback(async () => {
    const [tr, st] = await Promise.all([
      apiRequest<{ routes: RouteRow[]; assignments: AssignRow[] }>('/api/operations/transport'),
      apiRequest<{ students: StudentRecord[] }>('/api/students'),
    ]);
    setRoutes(tr.routes);
    setAssignments(tr.assignments);
    setStudents(st.students);
  }, [tenantVersion]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Transport Management</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">Fleet corridors, vehicle assignments, driver rosters, and student shuttle allocations.</p>
        </div>
        {canManage && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setAForm({ routeId: routes[0]?.id || 0, studentId: students[0]?.id || 0, pickupStop: 'Central Stop' });
                setAssignModal(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B192C] px-3.5 py-2 text-xs font-medium cursor-pointer"
            >
              <Bus className="w-3.5 h-3.5" /> Assign Student
            </button>
            <button type="button" onClick={() => setRouteModal(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B192C] dark:bg-[#D4AF37] px-4 py-2 text-xs font-semibold text-white dark:text-[#050B16] cursor-pointer">
              <Plus className="w-4 h-4" /> Add Route
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B192C] overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 font-display text-sm font-bold">Fleet Routes ({routes.length})</div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {routes.map((r) => (
              <div key={r.id} className="px-5 py-3.5 flex items-center justify-between gap-3">
                <div className="text-xs">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{r.route_code} — {r.route_name}</p>
                  <p className="text-slate-500 mt-0.5">Vehicle {r.vehicle_number} · Driver {r.driver_name} ({r.driver_phone})</p>
                  <p className="text-slate-400 mt-0.5">{r.stops}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-mono text-xs font-semibold text-[#B89223] dark:text-[#E8CC72]">{formatCurrency(r.monthly_fee, currencySymbol)}/mo</p>
                  <p className="font-mono text-xs text-slate-500">{r.assigned_count}/{r.capacity} seats</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B192C] overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 font-display text-sm font-bold">Student Assignments ({assignments.length})</div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {assignments.map((a) => (
              <div key={a.id} className="px-5 py-3.5 flex items-center justify-between gap-3 text-xs">
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{a.student_name}</p>
                  <p className="text-slate-500">{a.route_code} · {a.route_name} · Pickup: {a.pickup_stop}</p>
                </div>
                {canManage && (
                  <button
                    type="button"
                    onClick={async () => {
                      await apiRequest(`/api/operations/transport/assignments/${a.id}`, { method: 'DELETE' });
                      await load();
                    }}
                    className="p-1.5 rounded border border-slate-200 dark:border-slate-700 text-red-600 dark:text-red-400 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {routeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B192C] p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-display text-base font-bold">Create Transport Route</h3>
              <button type="button" onClick={() => setRouteModal(false)} className="cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await apiRequest('/api/operations/transport/routes', { method: 'POST', body: rForm });
                setRouteModal(false);
                await load();
              }}
              className="mt-4 space-y-3"
            >
              <div className="grid grid-cols-2 gap-3">
                <input required placeholder="Route Code (R-03)" value={rForm.routeCode} onChange={(e) => setRForm({ ...rForm, routeCode: e.target.value })} className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060E1D] px-3 py-2 text-sm font-mono" />
                <input required placeholder="Vehicle Plate" value={rForm.vehicleNumber} onChange={(e) => setRForm({ ...rForm, vehicleNumber: e.target.value })} className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060E1D] px-3 py-2 text-sm font-mono" />
              </div>
              <input required placeholder="Route Name" value={rForm.routeName} onChange={(e) => setRForm({ ...rForm, routeName: e.target.value })} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060E1D] px-3 py-2 text-sm" />
              <div className="grid grid-cols-2 gap-3">
                <input required placeholder="Driver Name" value={rForm.driverName} onChange={(e) => setRForm({ ...rForm, driverName: e.target.value })} className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060E1D] px-3 py-2 text-sm" />
                <input type="number" min={0} placeholder="Monthly Fee" value={rForm.monthlyFee} onChange={(e) => setRForm({ ...rForm, monthlyFee: Number(e.target.value) })} className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060E1D] px-3 py-2 text-sm font-mono" />
              </div>
              <input placeholder="Key Stops" value={rForm.stops} onChange={(e) => setRForm({ ...rForm, stops: e.target.value })} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060E1D] px-3 py-2 text-sm" />
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setRouteModal(false)} className="rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs cursor-pointer">Cancel</button>
                <button type="submit" className="rounded-lg bg-[#0B192C] dark:bg-[#D4AF37] px-4 py-2 text-xs font-semibold text-white dark:text-[#050B16] cursor-pointer">Save Route</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {assignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B192C] p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-display text-base font-bold">Assign Student to Route</h3>
              <button type="button" onClick={() => setAssignModal(false)} className="cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await apiRequest('/api/operations/transport/assignments', { method: 'POST', body: aForm });
                setAssignModal(false);
                await load();
              }}
              className="mt-4 space-y-3"
            >
              <select required value={aForm.routeId} onChange={(e) => setAForm({ ...aForm, routeId: Number(e.target.value) })} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060E1D] px-3 py-2 text-sm">
                {routes.map((r) => <option key={r.id} value={r.id}>{r.route_code} — {r.route_name}</option>)}
              </select>
              <select required value={aForm.studentId} onChange={(e) => setAForm({ ...aForm, studentId: Number(e.target.value) })} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060E1D] px-3 py-2 text-sm">
                {students.map((s) => <option key={s.id} value={s.id}>{s.full_name} ({s.student_code})</option>)}
              </select>
              <input required placeholder="Pickup Stop" value={aForm.pickupStop} onChange={(e) => setAForm({ ...aForm, pickupStop: e.target.value })} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060E1D] px-3 py-2 text-sm" />
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setAssignModal(false)} className="rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs cursor-pointer">Cancel</button>
                <button type="submit" className="rounded-lg bg-[#0B192C] dark:bg-[#D4AF37] px-4 py-2 text-xs font-semibold text-white dark:text-[#050B16] cursor-pointer">Assign</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

/* ============================================================================
 * PARENT MANAGEMENT MODULE
 * ========================================================================== */
interface ParentRow {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  occupation: string;
  address: string;
  wards: { id: number; student_code: string; full_name: string; relationship: string }[];
}

export const ParentsModule: React.FC<{ tenantVersion: number; canManage: boolean }> = ({ tenantVersion, canManage }) => {
  const [parents, setParents] = useState<ParentRow[]>([]);
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', occupation: '', address: '', studentId: 0, relationship: 'Parent' });

  const load = useCallback(async () => {
    const [pRes, sRes] = await Promise.all([
      apiRequest<{ parents: ParentRow[] }>('/api/operations/parents'),
      apiRequest<{ students: StudentRecord[] }>('/api/students'),
    ]);
    setParents(pRes.parents);
    setStudents(sRes.students);
  }, [tenantVersion]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Parent Management</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">Verified guardian contacts linked to enrolled students.</p>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={() => {
              setForm({ fullName: '', email: '', phone: '', occupation: '', address: '', studentId: students[0]?.id || 0, relationship: 'Parent' });
              setModal(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B192C] dark:bg-[#D4AF37] px-4 py-2 text-xs font-semibold text-white dark:text-[#050B16] cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" /> Register Parent
          </button>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B192C] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#060E1D]/70 text-xs text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">Guardian</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Occupation</th>
                <th className="px-4 py-3 font-medium">Linked Students</th>
                {canManage && <th className="px-5 py-3 font-medium text-right">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {parents.map((p) => (
                <tr key={p.id}>
                  <td className="px-5 py-3 font-semibold text-slate-900 dark:text-white">{p.full_name}</td>
                  <td className="px-4 py-3 text-xs">
                    <p>{p.email}</p>
                    <p className="text-slate-500">{p.phone}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300">{p.occupation || '—'}</td>
                  <td className="px-4 py-3 text-xs">
                    {p.wards.length === 0 ? 'Unlinked' : p.wards.map((w) => `${w.full_name} (${w.student_code})`).join(', ')}
                  </td>
                  {canManage && (
                    <td className="px-5 py-3 text-right">
                      <button
                        type="button"
                        onClick={async () => {
                          await apiRequest(`/api/operations/parents/${p.id}`, { method: 'DELETE' });
                          await load();
                        }}
                        className="p-1.5 rounded border border-slate-200 dark:border-slate-700 text-red-600 dark:text-red-400 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B192C] p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-display text-base font-bold">Register Guardian</h3>
              <button type="button" onClick={() => setModal(false)} className="cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await apiRequest('/api/operations/parents', {
                  method: 'POST',
                  body: { ...form, studentId: form.studentId || undefined },
                });
                setModal(false);
                await load();
              }}
              className="mt-4 space-y-3"
            >
              <input required placeholder="Full Name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060E1D] px-3 py-2 text-sm" />
              <input type="email" required placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060E1D] px-3 py-2 text-sm" />
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060E1D] px-3 py-2 text-sm" />
                <input placeholder="Occupation" value={form.occupation} onChange={(e) => setForm({ ...form, occupation: e.target.value })} className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060E1D] px-3 py-2 text-sm" />
              </div>
              <select value={form.studentId} onChange={(e) => setForm({ ...form, studentId: Number(e.target.value) })} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060E1D] px-3 py-2 text-sm">
                <option value={0}>Link Student (Optional)</option>
                {students.map((s) => <option key={s.id} value={s.id}>{s.full_name} ({s.student_code})</option>)}
              </select>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setModal(false)} className="rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs cursor-pointer">Cancel</button>
                <button type="submit" className="rounded-lg bg-[#0B192C] dark:bg-[#D4AF37] px-4 py-2 text-xs font-semibold text-white dark:text-[#050B16] cursor-pointer">Save Guardian</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

/* ============================================================================
 * CERTIFICATES MANAGEMENT MODULE (WITH OFFICIAL PRINT SHEET)
 * ========================================================================== */
interface CertRow {
  id: number;
  certificate_number: string;
  certificate_type: string;
  issue_date: string;
  remarks: string;
  signed_by: string;
  status: string;
  student_name: string;
  student_code: string;
  admission_number: string;
  course_name: string;
  class_name: string;
  institution_name: string;
  institution_code: string;
}

export const CertificatesModule: React.FC<{ tenantVersion: number; canManage: boolean }> = ({ tenantVersion, canManage }) => {
  const [certs, setCerts] = useState<CertRow[]>([]);
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [modal, setModal] = useState(false);
  const [preview, setPreview] = useState<CertRow | null>(null);
  const [form, setForm] = useState({
    studentId: 0,
    certificateType: 'Bonafide',
    remarks: 'Certified enrolled in good academic standing.',
    signedBy: 'Office of the Principal & Registrar',
  });

  const load = useCallback(async () => {
    const [cRes, sRes] = await Promise.all([
      apiRequest<{ certificates: CertRow[] }>('/api/operations/certificates'),
      apiRequest<{ students: StudentRecord[] }>('/api/students'),
    ]);
    setCerts(cRes.certificates);
    setStudents(sRes.students);
  }, [tenantVersion]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Official Certificates</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">Issue, print, and verify Bonafide, Transfer, Character, and Merit credentials.</p>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={() => {
              setForm({ ...form, studentId: students[0]?.id || 0 });
              setModal(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B192C] dark:bg-[#D4AF37] px-4 py-2 text-xs font-semibold text-white dark:text-[#050B16] cursor-pointer shrink-0"
          >
            <Award className="w-4 h-4" /> Issue Certificate
          </button>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B192C] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#060E1D]/70 text-xs text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">Serial #</th>
                <th className="px-4 py-3 font-medium">Student</th>
                <th className="px-4 py-3 font-medium">Certificate Type</th>
                <th className="px-4 py-3 font-medium">Issued</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {certs.map((c) => (
                <tr key={c.id}>
                  <td className="px-5 py-3 font-mono text-xs font-semibold text-[#B89223] dark:text-[#E8CC72]">{c.certificate_number}</td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-900 dark:text-white">{c.student_name}</p>
                    <p className="text-xs text-slate-500">{c.course_name}</p>
                  </td>
                  <td className="px-4 py-3 text-xs font-medium">{c.certificate_type}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{formatDate(c.issue_date)}</td>
                  <td className="px-4 py-3 text-xs font-semibold capitalize">
                    <span className={c.status === 'issued' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600'}>{c.status}</span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <button type="button" onClick={() => setPreview(c)} className="inline-flex items-center gap-1 rounded-md border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-2.5 py-1 text-xs font-semibold text-[#9A781B] dark:text-[#E8CC72] cursor-pointer">
                        <Printer className="w-3.5 h-3.5" /> View / Print
                      </button>
                      {canManage && (
                        <button
                          type="button"
                          onClick={async () => {
                            await apiRequest(`/api/operations/certificates/${c.id}`, { method: 'DELETE' });
                            await load();
                          }}
                          className="p-1.5 rounded border border-slate-200 dark:border-slate-700 text-red-600 dark:text-red-400 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B192C] p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-display text-base font-bold">Issue Official Certificate</h3>
              <button type="button" onClick={() => setModal(false)} className="cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await apiRequest('/api/operations/certificates', { method: 'POST', body: form });
                setModal(false);
                await load();
              }}
              className="mt-4 space-y-3"
            >
              <select required value={form.studentId} onChange={(e) => setForm({ ...form, studentId: Number(e.target.value) })} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060E1D] px-3 py-2 text-sm">
                {students.map((s) => <option key={s.id} value={s.id}>{s.full_name} ({s.student_code})</option>)}
              </select>
              <select value={form.certificateType} onChange={(e) => setForm({ ...form, certificateType: e.target.value })} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060E1D] px-3 py-2 text-sm">
                {['Bonafide', 'Transfer', 'Character', 'Course Completion', 'Merit Award'].map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <input placeholder="Authorized Signatory" value={form.signedBy} onChange={(e) => setForm({ ...form, signedBy: e.target.value })} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060E1D] px-3 py-2 text-sm" />
              <textarea rows={3} placeholder="Citation / Remarks" value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060E1D] px-3 py-2 text-sm" />
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setModal(false)} className="rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs cursor-pointer">Cancel</button>
                <button type="submit" className="rounded-lg bg-[#0B192C] dark:bg-[#D4AF37] px-4 py-2 text-xs font-semibold text-white dark:text-[#050B16] cursor-pointer">Issue</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-xl border-2 border-[#D4AF37] bg-white text-slate-900 p-8 shadow-2xl print-sheet">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <BrandMark size={38} />
              <div className="text-right">
                <p className="font-mono text-xs text-slate-500">Serial: {preview.certificate_number}</p>
                <p className="font-mono text-xs text-slate-500">Institution ID: {preview.institution_code}</p>
              </div>
            </div>
            <div className="py-8 text-center space-y-4">
              <p className="text-xs font-semibold tracking-[0.2em] text-[#9A781B] uppercase">{preview.institution_name}</p>
              <h2 className="font-display text-3xl font-bold text-[#060E1D]">Certificate of {preview.certificate_type}</h2>
              <p className="text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
                This official institutional document certifies that <strong className="text-slate-950">{preview.student_name}</strong> (Admission ID: <span className="font-mono">{preview.admission_number}</span>), enrolled in <strong>{preview.course_name}</strong> ({preview.class_name}), is hereby recognized as follows:
              </p>
              <p className="text-sm italic text-slate-700 max-w-md mx-auto">{preview.remarks}</p>
            </div>
            <div className="mt-6 pt-5 border-t border-slate-200 flex items-end justify-between text-xs text-slate-600">
              <div>
                <p className="font-mono">Issued: {formatDate(preview.issue_date)}</p>
                <p className="mt-1 inline-flex items-center gap-1 text-emerald-700 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Verified AAKNOVA Ledger Record
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-slate-900">{preview.signed_by}</p>
                <p className="text-slate-500">Authorized Institutional Signatory</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2 no-print">
              <button type="button" onClick={() => setPreview(null)} className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-medium cursor-pointer">Close</button>
              <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-1.5 rounded-lg bg-[#060E1D] px-4 py-2 text-xs font-semibold text-[#E8CC72] cursor-pointer">
                <Printer className="w-3.5 h-3.5" /> Print / Save PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
