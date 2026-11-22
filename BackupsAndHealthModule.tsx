import { Archive, CheckCircle2, Database, Download, FileJson, RotateCcw, ShieldCheck } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { apiRequest, formatBytes, formatDateTime } from '../lib/api';

interface BackupRow {
  id: number;
  filename: string;
  size_bytes: number;
  sha256_hash: string;
  status: string;
  created_at: string;
  restored_at: string | null;
}

export const BackupsAndHealthModule: React.FC = () => {
  const [backups, setBackups] = useState<BackupRow[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const res = await apiRequest<{ backups: BackupRow[]; currentCounts: Record<string, number> }>('/api/backups');
      setBackups(res.backups);
      setCounts(res.currentCounts);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to load backup history.');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async () => {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const res = await apiRequest<{ message: string }>('/api/backups/create', { method: 'POST' });
      setMessage(res.message);
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Backup creation failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleVerify = async (id: number) => {
    setError('');
    try {
      const res = await apiRequest<{ verified: boolean }>(`/api/backups/${id}/verify`, { method: 'POST' });
      setMessage(res.verified ? 'SHA-256 checksum verification PASSED.' : 'Verification FAILED: file corrupted.');
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Verification error.');
    }
  };

  const handleRestore = async (b: BackupRow) => {
    if (!window.confirm(`Restore the entire AAKNOVA database from ${b.filename}? Unbacked-up changes after this snapshot will be rolled back.`)) return;
    setBusy(true);
    setError('');
    try {
      const res = await apiRequest<{ message: string }>(`/api/backups/${b.id}/restore`, { method: 'POST' });
      setMessage(res.message);
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Restore failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Backup, Restore &amp; Project Deliverables</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Cryptographically verified database snapshots, point-in-time restore, and complete downloadable source deliverables.
          </p>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={handleCreate}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B192C] dark:bg-[#D4AF37] px-4 py-2 text-xs font-semibold text-white dark:text-[#050B16] disabled:opacity-50 cursor-pointer shrink-0"
        >
          <Database className="w-4 h-4" /> {busy ? 'Processing...' : 'Create Database Backup'}
        </button>
      </div>

      {error && <div className="rounded-lg border border-red-300 dark:border-red-900 bg-red-50 dark:bg-red-950/30 px-4 py-3 text-sm text-red-700 dark:text-red-200">{error}</div>}
      {message && <div className="rounded-lg border border-emerald-300 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-200">{message}</div>}

      {/* Deliverable Export Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B192C] p-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-sm font-bold text-slate-900 dark:text-white">
              Complete Project Source Bundle (ZIP)
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Includes the React + TypeScript PWA frontend, Express/SQLite server, Python Flask + SQLAlchemy + PostgreSQL/Alembic backend, Capacitor Android project, and deployment documentation.
            </p>
          </div>
          <a
            href="/api/backups/project-zip"
            download="aaknova-complete-enterprise-project.zip"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B192C] dark:bg-[#D4AF37] px-3.5 py-2 text-xs font-semibold text-white dark:text-[#050B16] whitespace-nowrap shrink-0"
          >
            <Archive className="w-3.5 h-3.5" /> Download ZIP
          </a>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B192C] p-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-sm font-bold text-slate-900 dark:text-white">
              Enterprise Multi-Tenant Report Export (JSON)
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Structured export of all institutions, student/faculty directories, tuition ledgers, examinations, results, and certificates.
            </p>
          </div>
          <a
            href="/api/backups/export-json"
            download
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#060E1D] px-3.5 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 whitespace-nowrap shrink-0"
          >
            <FileJson className="w-3.5 h-3.5" /> Export JSON
          </a>
        </div>
      </div>

      {/* Live Table Counts */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B192C] p-5">
        <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white mb-3">Live Database Record Inventory</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {Object.entries(counts).map(([table, cnt]) => (
            <div key={table} className="rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-[#060E1D] px-3 py-2.5">
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate capitalize">{table.replace(/_/g, ' ')}</p>
              <p className="mt-1 font-mono text-base font-bold tabular-nums text-slate-900 dark:text-white">{cnt}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Backup History */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B192C] overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 font-display text-sm font-bold">
          Snapshot History ({backups.length})
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#060E1D]/70 text-xs text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">Snapshot Filename</th>
                <th className="px-4 py-3 font-medium">SHA-256 Digest</th>
                <th className="px-4 py-3 font-medium text-right">Size</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {backups.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-sm text-slate-500">
                    No snapshots created yet. Click Create Database Backup to generate your first SHA-256 verified snapshot.
                  </td>
                </tr>
              ) : (
                backups.map((b) => (
                  <tr key={b.id}>
                    <td className="px-5 py-3">
                      <p className="font-mono text-xs font-semibold text-slate-900 dark:text-white">{b.filename}</p>
                      <p className="text-xs text-slate-500">Created {formatDateTime(b.created_at)}</p>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{b.sha256_hash.slice(0, 18)}...</td>
                    <td className="px-4 py-3 text-right font-mono text-xs tabular-nums">{formatBytes(b.size_bytes)}</td>
                    <td className="px-4 py-3 text-xs font-semibold capitalize">
                      <span className={b.status === 'corrupted' ? 'text-red-600' : 'text-emerald-600 dark:text-emerald-400'}>
                        {b.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleVerify(b.id)}
                          className="inline-flex items-center gap-1 rounded-md border border-slate-200 dark:border-slate-700 px-2.5 py-1 text-xs font-medium cursor-pointer"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Verify
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRestore(b)}
                          className="inline-flex items-center gap-1 rounded-md border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-2.5 py-1 text-xs font-semibold text-[#9A781B] dark:text-[#E8CC72] cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> Restore
                        </button>
                        <a
                          href={`/api/backups/${b.id}/download`}
                          download={b.filename}
                          className="p-1.5 rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                          title="Download raw .db file"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Android & Flask Production Note */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B192C] p-5 text-xs text-slate-600 dark:text-slate-300 space-y-2">
        <div className="flex items-center gap-2 font-display text-sm font-bold text-slate-900 dark:text-white">
          <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" /> Android Capacitor &amp; Python Flask PostgreSQL Readiness
        </div>
        <p>
          The downloadable ZIP archive includes the complete <span className="font-mono">flask_backend/</span> (Python Flask + SQLAlchemy + Alembic + PostgreSQL Docker Compose) and <span className="font-mono">android/</span> Capacitor project with release keystore signing configuration and GitHub Actions APK build workflow. Build and sign your production APK locally or via CI using JDK 17 + Android SDK as documented in <span className="font-mono">docs/DEPLOYMENT_AND_ANDROID.md</span>.
        </p>
      </div>
    </div>
  );
};
