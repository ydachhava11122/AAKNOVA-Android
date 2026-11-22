import { Check, Save } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '../lib/api';

interface RosterRow {
  entity_id: number;
  code: string;
  full_name: string;
  class_name: string;
  class_section: string;
  attendance_id: number | null;
  status: 'present' | 'absent' | 'late' | 'unmarked';
  remarks: string;
}

interface Props {
  tenantVersion: number;
  canMark: boolean;
}

export const AttendanceModule: React.FC<Props> = ({ tenantVersion, canMark }) => {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [entityType, setEntityType] = useState<'student' | 'teacher'>('student');
  const [roster, setRoster] = useState<RosterRow[]>([]);
  const [draft, setDraft] = useState<Record<number, { status: 'present' | 'absent' | 'late'; remarks: string }>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiRequest<{ roster: RosterRow[] }>(
        `/api/attendance?date=${encodeURIComponent(date)}&entityType=${entityType}`
      );
      setRoster(res.roster);
      const nextDraft: Record<number, { status: 'present' | 'absent' | 'late'; remarks: string }> = {};
      for (const r of res.roster) {
        nextDraft[r.entity_id] = {
          status: r.status === 'unmarked' ? 'present' : r.status,
          remarks: r.remarks || '',
        };
      }
      setDraft(nextDraft);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to load attendance register.');
    } finally {
      setLoading(false);
    }
  }, [date, entityType, tenantVersion]);

  useEffect(() => {
    load();
  }, [load]);

  const markAll = (status: 'present' | 'absent' | 'late') => {
    const next = { ...draft };
    for (const r of roster) {
      next[r.entity_id] = { status, remarks: next[r.entity_id]?.remarks || '' };
    }
    setDraft(next);
  };

  const handleSave = async () => {
    if (roster.length === 0) return;
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const records = roster.map((r) => ({
        entityId: r.entity_id,
        status: draft[r.entity_id]?.status || 'present',
        remarks: draft[r.entity_id]?.remarks || '',
      }));
      const res = await apiRequest<{ message: string }>('/api/attendance/mark', {
        method: 'POST',
        body: { date, entityType, records },
      });
      setMessage(res.message);
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save attendance.');
    } finally {
      setSaving(false);
    }
  };

  const counts = roster.reduce(
    (acc, r) => {
      const st = draft[r.entity_id]?.status || 'present';
      acc[st] += 1;
      return acc;
    },
    { present: 0, late: 0, absent: 0 }
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Attendance Management</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Daily tenant-isolated student and faculty attendance register with bulk persistence.
          </p>
        </div>
        {canMark && (
          <button
            type="button"
            disabled={saving || roster.length === 0}
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B192C] dark:bg-[#D4AF37] px-4 py-2 text-xs font-semibold text-white dark:text-[#050B16] disabled:opacity-50 cursor-pointer shrink-0"
          >
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Register'}
          </button>
        )}
      </div>

      {error && <div className="rounded-lg border border-red-300 dark:border-red-900 bg-red-50 dark:bg-red-950/30 px-4 py-3 text-sm text-red-700 dark:text-red-200">{error}</div>}
      {message && <div className="rounded-lg border border-emerald-300 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-200">{message}</div>}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-[#0B192C] border border-slate-200 dark:border-slate-800">
            {(['student', 'teacher'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setEntityType(t)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize cursor-pointer ${
                  entityType === t
                    ? 'bg-white dark:bg-[#132946] text-slate-900 dark:text-[#E8CC72] shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {t === 'student' ? 'Students' : 'Faculty'}
              </button>
            ))}
          </div>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B192C] px-3 py-1.5 text-xs font-mono"
          />
        </div>

        <div className="flex items-center gap-4 text-xs">
          <span className="font-mono tabular-nums text-emerald-600 dark:text-emerald-400">Present: {counts.present}</span>
          <span className="font-mono tabular-nums text-amber-600 dark:text-amber-400">Late: {counts.late}</span>
          <span className="font-mono tabular-nums text-red-600 dark:text-red-400">Absent: {counts.absent}</span>
          {canMark && (
            <button
              type="button"
              onClick={() => markAll('present')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#B89223] dark:text-[#D4AF37] hover:underline cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" /> Mark All Present
            </button>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B192C] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#060E1D]/70 text-xs text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Code</th>
                <th className="px-4 py-3 font-medium">{entityType === 'student' ? 'Cohort' : 'Department'}</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {loading ? (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-xs text-slate-500">Loading attendance register...</td></tr>
              ) : roster.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-10 text-center text-sm text-slate-500">No active records to mark for this date.</td></tr>
              ) : (
                roster.map((r) => {
                  const cur = draft[r.entity_id] || { status: 'present', remarks: '' };
                  return (
                    <tr key={r.entity_id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                      <td className="px-5 py-3 font-semibold text-slate-900 dark:text-white">{r.full_name}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500 dark:text-slate-400">{r.code}</td>
                      <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300">
                        {r.class_name}{r.class_section ? `-${r.class_section}` : ''}
                      </td>
                      <td className="px-4 py-3">
                        <div className="inline-flex items-center gap-1 p-0.5 rounded-lg bg-slate-100 dark:bg-[#060E1D] border border-slate-200 dark:border-slate-800">
                          {(['present', 'late', 'absent'] as const).map((st) => (
                            <button
                              key={st}
                              type="button"
                              disabled={!canMark}
                              onClick={() => setDraft({ ...draft, [r.entity_id]: { ...cur, status: st } })}
                              className={`px-2.5 py-1 text-xs font-medium rounded-md capitalize cursor-pointer ${
                                cur.status === st
                                  ? st === 'present'
                                    ? 'bg-emerald-600 text-white'
                                    : st === 'late'
                                    ? 'bg-amber-600 text-white'
                                    : 'bg-red-600 text-white'
                                  : 'text-slate-600 dark:text-slate-400'
                              }`}
                            >
                              {st}
                            </button>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <input
                          disabled={!canMark}
                          value={cur.remarks}
                          onChange={(e) => setDraft({ ...draft, [r.entity_id]: { ...cur, remarks: e.target.value } })}
                          placeholder="Optional note..."
                          className="w-full max-w-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#060E1D] px-2.5 py-1 text-xs"
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
