import { CheckCircle2, Plus, Printer, Trash2, X } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { apiRequest, formatDate } from '../lib/api';
import type { AcademicClass, Course, StudentRecord, Subject } from '../types';

interface ExamRow {
  id: number;
  name: string;
  exam_type: string;
  course_name: string;
  class_name: string;
  class_section: string;
  start_date: string;
  end_date: string;
  status: string;
  result_count: number;
}

interface ResultRow {
  id: number;
  examination_id: number;
  exam_name: string;
  student_id: number;
  student_name: string;
  student_code: string;
  subject_name: string;
  subject_code: string;
  marks_obtained: number;
  max_marks: number;
  percentage: number;
  grade: string;
  remarks: string;
}

interface Props {
  tenantVersion: number;
  canManage: boolean;
}

export const ExamsModule: React.FC<Props> = ({ tenantVersion, canManage }) => {
  const [tab, setTab] = useState<'exams' | 'results'>('exams');
  const [exams, setExams] = useState<ExamRow[]>([]);
  const [results, setResults] = useState<ResultRow[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [classes, setClasses] = useState<AcademicClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [error, setError] = useState('');

  const [examModal, setExamModal] = useState(false);
  const [resultModal, setResultModal] = useState(false);
  const [examForm, setExamForm] = useState({
    name: '',
    examType: 'Midterm',
    courseId: 0,
    classId: 0,
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
  });
  const [resultForm, setResultForm] = useState({
    examinationId: 0,
    studentId: 0,
    subjectId: 0,
    marksObtained: 85,
    maxMarks: 100,
    remarks: '',
  });

  const load = useCallback(async () => {
    setError('');
    try {
      const [exRes, catRes, stRes] = await Promise.all([
        apiRequest<{ examinations: ExamRow[]; results: ResultRow[] }>('/api/exams'),
        apiRequest<{ courses: Course[]; classes: AcademicClass[]; subjects: Subject[] }>('/api/academics/catalog'),
        apiRequest<{ students: StudentRecord[] }>('/api/students'),
      ]);
      setExams(exRes.examinations);
      setResults(exRes.results);
      setCourses(catRes.courses);
      setClasses(catRes.classes);
      setSubjects(catRes.subjects);
      setStudents(stRes.students);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to load examinations.');
    }
  }, [tenantVersion]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/api/exams', { method: 'POST', body: examForm });
      setExamModal(false);
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create exam.');
    }
  };

  const handlePublish = async (id: number) => {
    try {
      await apiRequest(`/api/exams/${id}/status`, { method: 'PATCH', body: { status: 'published' } });
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to publish exam.');
    }
  };

  const handleDeleteExam = async (id: number) => {
    if (!window.confirm('Delete this examination and its recorded grades?')) return;
    try {
      await apiRequest(`/api/exams/${id}`, { method: 'DELETE' });
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to delete exam.');
    }
  };

  const handleSaveResult = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/api/exams/results', { method: 'POST', body: resultForm });
      setResultModal(false);
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to save result.');
    }
  };

  const handleDeleteResult = async (id: number) => {
    if (!window.confirm('Delete this grade record?')) return;
    try {
      await apiRequest(`/api/exams/results/${id}`, { method: 'DELETE' });
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to delete result.');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Examinations &amp; Results</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Schedule formal assessments, enter subject marks with automatic grading, and publish transcripts.
          </p>
        </div>
        {canManage && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setResultForm({
                  examinationId: exams[0]?.id || 0,
                  studentId: students[0]?.id || 0,
                  subjectId: subjects[0]?.id || 0,
                  marksObtained: 88,
                  maxMarks: 100,
                  remarks: '',
                });
                setResultModal(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B192C] px-3.5 py-2 text-xs font-medium cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Record Marks
            </button>
            <button
              type="button"
              onClick={() => {
                setExamForm({ ...examForm, name: '', courseId: courses[0]?.id || 0, classId: classes[0]?.id || 0 });
                setExamModal(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B192C] dark:bg-[#D4AF37] px-4 py-2 text-xs font-semibold text-white dark:text-[#050B16] cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Schedule Exam
            </button>
          </div>
        )}
      </div>

      {error && <div className="rounded-lg border border-red-300 dark:border-red-900 bg-red-50 dark:bg-red-950/30 px-4 py-3 text-sm text-red-700 dark:text-red-200">{error}</div>}

      <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-[#0B192C] border border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setTab('exams')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md cursor-pointer ${tab === 'exams' ? 'bg-white dark:bg-[#132946] text-slate-900 dark:text-[#E8CC72]' : 'text-slate-600 dark:text-slate-400'}`}
        >
          Examinations ({exams.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('results')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md cursor-pointer ${tab === 'results' ? 'bg-white dark:bg-[#132946] text-slate-900 dark:text-[#E8CC72]' : 'text-slate-600 dark:text-slate-400'}`}
        >
          Results Ledger ({results.length})
        </button>
      </div>

      {tab === 'exams' ? (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B192C] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#060E1D]/70 text-xs text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Examination</th>
                  <th className="px-4 py-3 font-medium">Course &amp; Cohort</th>
                  <th className="px-4 py-3 font-medium">Schedule</th>
                  <th className="px-4 py-3 font-medium text-right">Results</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  {canManage && <th className="px-5 py-3 font-medium text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {exams.map((ex) => (
                  <tr key={ex.id}>
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-slate-900 dark:text-white">{ex.name}</p>
                      <p className="text-xs text-slate-500">{ex.exam_type}</p>
                    </td>
                    <td className="px-4 py-3.5 text-xs">
                      <p>{ex.course_name}</p>
                      <p className="text-slate-500">{ex.class_name}-{ex.class_section}</p>
                    </td>
                    <td className="px-4 py-3.5 text-xs font-mono text-slate-500">
                      {formatDate(ex.start_date)} — {formatDate(ex.end_date)}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono tabular-nums">{ex.result_count}</td>
                    <td className="px-4 py-3.5 text-xs font-semibold capitalize">
                      <span className={ex.status === 'published' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}>
                        {ex.status}
                      </span>
                    </td>
                    {canManage && (
                      <td className="px-5 py-3.5 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {ex.status !== 'published' && (
                            <button
                              type="button"
                              onClick={() => handlePublish(ex.id)}
                              className="inline-flex items-center gap-1 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Publish
                            </button>
                          )}
                          <button type="button" onClick={() => handleDeleteExam(ex.id)} className="p-1.5 rounded-md border border-slate-200 dark:border-slate-700 text-red-600 dark:text-red-400 cursor-pointer">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B192C] overflow-hidden">
          <div className="flex items-center justify-end px-5 py-3 border-b border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#B89223] dark:text-[#D4AF37] cursor-pointer no-print"
            >
              <Printer className="w-3.5 h-3.5" /> Print Result Sheet
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#060E1D]/70 text-xs text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Student</th>
                  <th className="px-4 py-3 font-medium">Examination &amp; Subject</th>
                  <th className="px-4 py-3 font-medium text-right">Marks</th>
                  <th className="px-4 py-3 font-medium text-right">Percentage</th>
                  <th className="px-4 py-3 font-medium text-right">Grade</th>
                  {canManage && <th className="px-5 py-3 font-medium text-right no-print">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {results.map((r) => (
                  <tr key={r.id}>
                    <td className="px-5 py-3">
                      <p className="font-semibold text-slate-900 dark:text-white">{r.student_name}</p>
                      <p className="font-mono text-xs text-slate-500">{r.student_code}</p>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <p className="font-medium">{r.exam_name}</p>
                      <p className="text-slate-500">{r.subject_code} · {r.subject_name}</p>
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums">{r.marks_obtained} / {r.max_marks}</td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums">{r.percentage}%</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-[#B89223] dark:text-[#E8CC72]">{r.grade}</td>
                    {canManage && (
                      <td className="px-5 py-3 text-right no-print">
                        <button type="button" onClick={() => handleDeleteResult(r.id)} className="p-1.5 rounded-md border border-slate-200 dark:border-slate-700 text-red-600 dark:text-red-400 cursor-pointer">
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
      )}

      {examModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B192C] p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-display text-base font-bold">Schedule Examination</h3>
              <button type="button" onClick={() => setExamModal(false)} className="cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleCreateExam} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-medium mb-1">Exam Title</label>
                <input required value={examForm.name} onChange={(e) => setExamForm({ ...examForm, name: e.target.value })} placeholder="Spring Final Examination 2027" className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060E1D] px-3 py-2 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Course</label>
                  <select required value={examForm.courseId} onChange={(e) => setExamForm({ ...examForm, courseId: Number(e.target.value) })} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060E1D] px-3 py-2 text-sm">
                    {courses.map((c) => <option key={c.id} value={c.id}>{c.code}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Cohort</label>
                  <select required value={examForm.classId} onChange={(e) => setExamForm({ ...examForm, classId: Number(e.target.value) })} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060E1D] px-3 py-2 text-sm">
                    {classes.map((cl) => <option key={cl.id} value={cl.id}>{cl.name}-{cl.section}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Start Date</label>
                  <input type="date" required value={examForm.startDate} onChange={(e) => setExamForm({ ...examForm, startDate: e.target.value })} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060E1D] px-3 py-2 text-sm font-mono" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">End Date</label>
                  <input type="date" required value={examForm.endDate} onChange={(e) => setExamForm({ ...examForm, endDate: e.target.value })} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060E1D] px-3 py-2 text-sm font-mono" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setExamModal(false)} className="rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs cursor-pointer">Cancel</button>
                <button type="submit" className="rounded-lg bg-[#0B192C] dark:bg-[#D4AF37] px-4 py-2 text-xs font-semibold text-white dark:text-[#050B16] cursor-pointer">Schedule</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {resultModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B192C] p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-display text-base font-bold">Record Examination Marks</h3>
              <button type="button" onClick={() => setResultModal(false)} className="cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSaveResult} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-medium mb-1">Examination</label>
                <select required value={resultForm.examinationId} onChange={(e) => setResultForm({ ...resultForm, examinationId: Number(e.target.value) })} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060E1D] px-3 py-2 text-sm">
                  {exams.map((ex) => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Student</label>
                <select required value={resultForm.studentId} onChange={(e) => setResultForm({ ...resultForm, studentId: Number(e.target.value) })} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060E1D] px-3 py-2 text-sm">
                  {students.map((s) => <option key={s.id} value={s.id}>{s.full_name} ({s.student_code})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Subject</label>
                <select required value={resultForm.subjectId} onChange={(e) => setResultForm({ ...resultForm, subjectId: Number(e.target.value) })} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060E1D] px-3 py-2 text-sm">
                  {subjects.map((sub) => <option key={sub.id} value={sub.id}>{sub.code} — {sub.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Marks Obtained</label>
                  <input type="number" min={0} required value={resultForm.marksObtained} onChange={(e) => setResultForm({ ...resultForm, marksObtained: Number(e.target.value) })} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060E1D] px-3 py-2 text-sm font-mono" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Max Marks</label>
                  <input type="number" min={1} required value={resultForm.maxMarks} onChange={(e) => setResultForm({ ...resultForm, maxMarks: Number(e.target.value) })} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060E1D] px-3 py-2 text-sm font-mono" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setResultModal(false)} className="rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs cursor-pointer">Cancel</button>
                <button type="submit" className="rounded-lg bg-[#0B192C] dark:bg-[#D4AF37] px-4 py-2 text-xs font-semibold text-white dark:text-[#050B16] cursor-pointer">Save Marks</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
