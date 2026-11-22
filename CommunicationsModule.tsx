import { Megaphone, Plus, Trash2, X } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { apiRequest, formatDateTime } from '../lib/api';

interface NoticeRow {
  id: number;
  title: string;
  content: string;
  category: 'notice' | 'announcement' | 'alert';
  priority: 'normal' | 'high' | 'urgent';
  target_roles: string;
  author_name?: string;
  created_at: string;
}

export const CommunicationsModule: React.FC<{ tenantVersion: number; canManage: boolean }> = ({
  tenantVersion,
  canManage,
}) => {
  const [notices, setNotices] = useState<NoticeRow[]>([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({
    title: '',
    content: '',
    category: 'announcement' as NoticeRow['category'],
    priority: 'normal' as NoticeRow['priority'],
    targetRoles: 'ALL',
  });

  const load = useCallback(async () => {
    const res = await apiRequest<{ notices: NoticeRow[] }>('/api/communications/notices');
    setNotices(res.notices);
  }, [tenantVersion]);

  useEffect(() => {
    load();
  }, [load]);

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    await apiRequest('/api/communications/notices', { method: 'POST', body: form });
    setModal(false);
    setForm({ title: '', content: '', category: 'announcement', priority: 'normal', targetRoles: 'ALL' });
    await load();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Notices &amp; Announcements</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Broadcast institutional bulletins and automatically deliver alerts to active tenant accounts.
          </p>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={() => setModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B192C] dark:bg-[#D4AF37] px-4 py-2 text-xs font-semibold text-white dark:text-[#050B16] cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" /> Publish Notice
          </button>
        )}
      </div>

      <div className="space-y-3">
        {notices.length === 0 ? (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B192C] p-10 text-center text-sm text-slate-500">
            No notices published for this institution yet.
          </div>
        ) : (
          notices.map((n) => (
            <div
              key={n.id}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B192C] p-5 flex items-start justify-between gap-4"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <Megaphone className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span className="capitalize font-medium text-slate-700 dark:text-slate-200">{n.category}</span>
                  <span>·</span>
                  <span
                    className={
                      n.priority === 'urgent'
                        ? 'font-semibold text-red-600 dark:text-red-400'
                        : n.priority === 'high'
                        ? 'font-semibold text-amber-600 dark:text-amber-400'
                        : ''
                    }
                  >
                    Priority: {n.priority}
                  </span>
                  <span>·</span>
                  <span>{formatDateTime(n.created_at)}</span>
                </div>
                <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">{n.title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{n.content}</p>
                <p className="text-xs text-slate-400">Published by {n.author_name || 'Administration'} · Audience: {n.target_roles}</p>
              </div>
              {canManage && (
                <button
                  type="button"
                  onClick={async () => {
                    await apiRequest(`/api/communications/notices/${n.id}`, { method: 'DELETE' });
                    await load();
                  }}
                  className="p-1.5 rounded border border-slate-200 dark:border-slate-700 text-red-600 dark:text-red-400 cursor-pointer shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B192C] p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-display text-base font-bold">Publish Institutional Notice</h3>
              <button type="button" onClick={() => setModal(false)} className="cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handlePublish} className="mt-4 space-y-3.5">
              <input required placeholder="Headline" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060E1D] px-3 py-2 text-sm" />
              <div className="grid grid-cols-2 gap-3">
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as NoticeRow['category'] })} className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060E1D] px-3 py-2 text-sm">
                  <option value="announcement">Announcement</option>
                  <option value="notice">Notice</option>
                  <option value="alert">Alert</option>
                </select>
                <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as NoticeRow['priority'] })} className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060E1D] px-3 py-2 text-sm">
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <textarea required rows={4} placeholder="Detailed bulletin content..." value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060E1D] px-3 py-2 text-sm" />
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setModal(false)} className="rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs cursor-pointer">Cancel</button>
                <button type="submit" className="rounded-lg bg-[#0B192C] dark:bg-[#D4AF37] px-4 py-2 text-xs font-semibold text-white dark:text-[#050B16] cursor-pointer">Broadcast</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
