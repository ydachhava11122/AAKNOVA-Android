import { CreditCard, Download, Plus, Trash2, X } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { apiRequest, exportToCsv, formatCurrency, formatDate } from '../lib/api';
import type { Course, StudentRecord } from '../types';

interface FeeRow {
  id: number;
  student_id: number;
  student_name: string;
  student_code: string;
  class_name: string;
  title: string;
  academic_year: string;
  gross_amount: number;
  discount_amount: number;
  net_amount: number;
  paid_amount: number;
  due_date: string;
  status: string;
}

interface PaymentRow {
  id: number;
  receipt_number: string;
  student_name: string;
  fee_title: string;
  amount: number;
  payment_method: string;
  transaction_reference: string;
  status: string;
  created_at: string;
}

interface Props {
  tenantVersion: number;
  canManage: boolean;
  currencySymbol: string;
}

export const FinanceModule: React.FC<Props> = ({ tenantVersion, canManage, currencySymbol }) => {
  const [tab, setTab] = useState<'ledger' | 'payments' | 'structures'>('ledger');
  const [fees, setFees] = useState<FeeRow[]>([]);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [structures, setStructures] = useState<{ id: number; title: string; course_name: string; category: string; amount: number; frequency: string }[]>([]);
  const [summary, setSummary] = useState({ totalBilled: 0, totalCollected: 0, totalOutstanding: 0 });
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [error, setError] = useState('');

  const [feeModal, setFeeModal] = useState(false);
  const [payModal, setPayModal] = useState<FeeRow | null>(null);
  const [structModal, setStructModal] = useState(false);

  const [feeForm, setFeeForm] = useState({ studentId: 0, title: 'Semester Tuition Fee', grossAmount: 5500, discountAmount: 0, dueDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10) });
  const [payForm, setPayForm] = useState({ amount: 0, paymentMethod: 'bank_transfer', transactionReference: '', notes: '' });
  const [structForm, setStructForm] = useState({ courseId: 0, title: 'Tuition & Lab Fee', category: 'Tuition', amount: 6000, frequency: 'semester' });

  const load = useCallback(async () => {
    setError('');
    try {
      const [fin, stRes, catRes] = await Promise.all([
        apiRequest<{ fees: FeeRow[]; payments: PaymentRow[]; structures: typeof structures; summary: typeof summary }>('/api/finance/overview'),
        apiRequest<{ students: StudentRecord[] }>('/api/students'),
        apiRequest<{ courses: Course[] }>('/api/academics/catalog'),
      ]);
      setFees(fin.fees);
      setPayments(fin.payments);
      setStructures(fin.structures);
      setSummary(fin.summary);
      setStudents(stRes.students);
      setCourses(catRes.courses);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to load fees ledger.');
    }
  }, [tenantVersion]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreateFee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/api/finance/fees', { method: 'POST', body: feeForm });
      setFeeModal(false);
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to create fee invoice.');
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payModal) return;
    try {
      await apiRequest('/api/finance/payments', {
        method: 'POST',
        body: { feeId: payModal.id, ...payForm },
      });
      setPayModal(null);
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Payment recording failed.');
    }
  };

  const handleCreateStructure = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/api/finance/structures', { method: 'POST', body: structForm });
      setStructModal(false);
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to create fee structure.');
    }
  };

  const handleDeleteFee = async (id: number) => {
    if (!window.confirm('Delete this fee invoice?')) return;
    try {
      await apiRequest(`/api/finance/fees/${id}`, { method: 'DELETE' });
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Delete failed.');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Fees Management</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Fee structures, student tuition ledgers, verified payment receipts, and balance reconciliation.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() =>
              exportToCsv(
                'aaknova-fee-ledger',
                ['Student', 'Code', 'Invoice', 'Net', 'Paid', 'Balance', 'Due Date', 'Status'],
                fees.map((f) => [f.student_name, f.student_code, f.title, f.net_amount, f.paid_amount, f.net_amount - f.paid_amount, f.due_date, f.status])
              )
            }
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B192C] px-3.5 py-2 text-xs font-medium cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
          {canManage && (
            <>
              <button
                type="button"
                onClick={() => {
                  setStructForm({ ...structForm, courseId: courses[0]?.id || 0 });
                  setStructModal(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B192C] px-3.5 py-2 text-xs font-medium cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Fee Structure
              </button>
              <button
                type="button"
                onClick={() => {
                  setFeeForm({ ...feeForm, studentId: students[0]?.id || 0 });
                  setFeeModal(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B192C] dark:bg-[#D4AF37] px-4 py-2 text-xs font-semibold text-white dark:text-[#050B16] cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Issue Invoice
              </button>
            </>
          )}
        </div>
      </div>

      {error && <div className="rounded-lg border border-red-300 dark:border-red-900 bg-red-50 dark:bg-red-950/30 px-4 py-3 text-sm text-red-700 dark:text-red-200">{error}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B192C] p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">Total Billed</p>
          <p className="mt-1.5 font-mono text-xl font-bold tabular-nums">{formatCurrency(summary.totalBilled, currencySymbol)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B192C] p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">Verified Collections</p>
          <p className="mt-1.5 font-mono text-xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{formatCurrency(summary.totalCollected, currencySymbol)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B192C] p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">Outstanding Receivables</p>
          <p className="mt-1.5 font-mono text-xl font-bold text-[#B89223] dark:text-[#E8CC72] tabular-nums">{formatCurrency(summary.totalOutstanding, currencySymbol)}</p>
        </div>
      </div>

      <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-[#0B192C] border border-slate-200 dark:border-slate-800">
        {[
          { key: 'ledger', label: `Fee Ledger (${fees.length})` },
          { key: 'payments', label: `Verified Receipts (${payments.length})` },
          { key: 'structures', label: `Fee Structures (${structures.length})` },
        ].map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key as typeof tab)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md cursor-pointer ${
              tab === t.key ? 'bg-white dark:bg-[#132946] text-slate-900 dark:text-[#E8CC72] shadow-sm' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'ledger' && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B192C] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#060E1D]/70 text-xs text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-5 py-3 font-medium">Student</th>
                  <th className="px-4 py-3 font-medium">Invoice Title</th>
                  <th className="px-4 py-3 font-medium text-right">Net</th>
                  <th className="px-4 py-3 font-medium text-right">Paid</th>
                  <th className="px-4 py-3 font-medium text-right">Balance</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  {canManage && <th className="px-5 py-3 font-medium text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {fees.map((f) => {
                  const bal = Math.max(0, f.net_amount - f.paid_amount);
                  return (
                    <tr key={f.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                      <td className="px-5 py-3">
                        <p className="font-semibold text-slate-900 dark:text-white">{f.student_name}</p>
                        <p className="font-mono text-xs text-slate-500">{f.student_code}</p>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <p className="font-medium">{f.title}</p>
                        <p className="text-slate-500">Due {formatDate(f.due_date)}</p>
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums text-xs">{formatCurrency(f.net_amount, currencySymbol)}</td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums text-xs text-emerald-600 dark:text-emerald-400">{formatCurrency(f.paid_amount, currencySymbol)}</td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums text-xs font-semibold">{formatCurrency(bal, currencySymbol)}</td>
                      <td className="px-4 py-3 text-xs font-semibold capitalize">
                        <span className={f.status === 'paid' ? 'text-emerald-600 dark:text-emerald-400' : f.status === 'overdue' ? 'text-red-600' : 'text-amber-600 dark:text-amber-400'}>
                          {f.status}
                        </span>
                      </td>
                      {canManage && (
                        <td className="px-5 py-3 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            {bal > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setPayModal(f);
                                  setPayForm({ amount: bal, paymentMethod: 'bank_transfer', transactionReference: `TXN-${Date.now().toString().slice(-6)}`, notes: '' });
                                }}
                                className="inline-flex items-center gap-1 rounded-md border border-[#D4AF37]/50 bg-[#D4AF37]/10 px-2.5 py-1 text-xs font-semibold text-[#9A781B] dark:text-[#E8CC72] cursor-pointer"
                              >
                                <CreditCard className="w-3.5 h-3.5" /> Collect
                              </button>
                            )}
                            <button type="button" onClick={() => handleDeleteFee(f.id)} className="p-1.5 rounded-md border border-slate-200 dark:border-slate-700 text-red-600 dark:text-red-400 cursor-pointer">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'payments' && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B192C] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#060E1D]/70 text-xs text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Receipt #</th>
                  <th className="px-4 py-3 font-medium">Student</th>
                  <th className="px-4 py-3 font-medium">Method &amp; Ref</th>
                  <th className="px-4 py-3 font-medium text-right">Amount</th>
                  <th className="px-5 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td className="px-5 py-3 font-mono text-xs font-semibold text-[#B89223] dark:text-[#E8CC72]">{p.receipt_number}</td>
                    <td className="px-4 py-3 text-xs font-medium">{p.student_name}</td>
                    <td className="px-4 py-3 text-xs text-slate-500 font-mono">{p.payment_method} · {p.transaction_reference}</td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(p.amount, currencySymbol)}</td>
                    <td className="px-5 py-3 text-xs text-slate-500">{formatDate(p.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'structures' && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B192C] overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#060E1D]/70 text-xs text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Course</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Cadence</th>
                <th className="px-5 py-3 font-medium text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {structures.map((s) => (
                <tr key={s.id}>
                  <td className="px-5 py-3 font-semibold">{s.title}</td>
                  <td className="px-4 py-3 text-xs">{s.course_name}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{s.category}</td>
                  <td className="px-4 py-3 text-xs capitalize">{s.frequency}</td>
                  <td className="px-5 py-3 text-right font-mono tabular-nums font-semibold">{formatCurrency(s.amount, currencySymbol)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Issue Invoice Modal */}
      {feeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B192C] p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-display text-base font-bold">Issue Student Fee Invoice</h3>
              <button type="button" onClick={() => setFeeModal(false)} className="cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleCreateFee} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-medium mb-1">Student</label>
                <select required value={feeForm.studentId} onChange={(e) => setFeeForm({ ...feeForm, studentId: Number(e.target.value) })} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060E1D] px-3 py-2 text-sm">
                  {students.map((s) => <option key={s.id} value={s.id}>{s.full_name} ({s.student_code})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Invoice Title</label>
                <input required value={feeForm.title} onChange={(e) => setFeeForm({ ...feeForm, title: e.target.value })} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060E1D] px-3 py-2 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Gross Amount</label>
                  <input type="number" min={0} required value={feeForm.grossAmount} onChange={(e) => setFeeForm({ ...feeForm, grossAmount: Number(e.target.value) })} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060E1D] px-3 py-2 text-sm font-mono" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Scholarship / Discount</label>
                  <input type="number" min={0} value={feeForm.discountAmount} onChange={(e) => setFeeForm({ ...feeForm, discountAmount: Number(e.target.value) })} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060E1D] px-3 py-2 text-sm font-mono" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Due Date</label>
                <input type="date" required value={feeForm.dueDate} onChange={(e) => setFeeForm({ ...feeForm, dueDate: e.target.value })} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060E1D] px-3 py-2 text-sm font-mono" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setFeeModal(false)} className="rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs cursor-pointer">Cancel</button>
                <button type="submit" className="rounded-lg bg-[#0B192C] dark:bg-[#D4AF37] px-4 py-2 text-xs font-semibold text-white dark:text-[#050B16] cursor-pointer">Create Invoice</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Collect Payment Modal */}
      {payModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B192C] p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-display text-base font-bold">Record Verified Payment</h3>
              <button type="button" onClick={() => setPayModal(null)} className="cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <p className="mt-3 text-xs text-slate-500">
              {payModal.student_name} · {payModal.title}
            </p>
            <form onSubmit={handleRecordPayment} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-medium mb-1">Amount ({currencySymbol})</label>
                <input type="number" step="0.01" min={1} required value={payForm.amount} onChange={(e) => setPayForm({ ...payForm, amount: Number(e.target.value) })} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060E1D] px-3 py-2 text-sm font-mono" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Payment Channel</label>
                <select value={payForm.paymentMethod} onChange={(e) => setPayForm({ ...payForm, paymentMethod: e.target.value })} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060E1D] px-3 py-2 text-sm">
                  <option value="bank_transfer">Bank Wire / Transfer</option>
                  <option value="card_gateway">Card Gateway</option>
                  <option value="upi_verified">Verified Digital Transfer</option>
                  <option value="cheque">Institutional Cheque</option>
                  <option value="cash_counter">Counter Cash</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Transaction Reference</label>
                <input required value={payForm.transactionReference} onChange={(e) => setPayForm({ ...payForm, transactionReference: e.target.value })} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060E1D] px-3 py-2 text-sm font-mono" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setPayModal(null)} className="rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs cursor-pointer">Cancel</button>
                <button type="submit" className="rounded-lg bg-[#0B192C] dark:bg-[#D4AF37] px-4 py-2 text-xs font-semibold text-white dark:text-[#050B16] cursor-pointer">Verify &amp; Issue Receipt</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fee Structure Modal */}
      {structModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B192C] p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-display text-base font-bold">New Fee Structure</h3>
              <button type="button" onClick={() => setStructModal(false)} className="cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleCreateStructure} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-medium mb-1">Course</label>
                <select required value={structForm.courseId} onChange={(e) => setStructForm({ ...structForm, courseId: Number(e.target.value) })} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060E1D] px-3 py-2 text-sm">
                  {courses.map((c) => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Structure Title</label>
                <input required value={structForm.title} onChange={(e) => setStructForm({ ...structForm, title: e.target.value })} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060E1D] px-3 py-2 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Amount</label>
                  <input type="number" min={0} required value={structForm.amount} onChange={(e) => setStructForm({ ...structForm, amount: Number(e.target.value) })} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060E1D] px-3 py-2 text-sm font-mono" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Cadence</label>
                  <select value={structForm.frequency} onChange={(e) => setStructForm({ ...structForm, frequency: e.target.value })} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060E1D] px-3 py-2 text-sm">
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="semester">Semester</option>
                    <option value="annual">Annual</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setStructModal(false)} className="rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs cursor-pointer">Cancel</button>
                <button type="submit" className="rounded-lg bg-[#0B192C] dark:bg-[#D4AF37] px-4 py-2 text-xs font-semibold text-white dark:text-[#050B16] cursor-pointer">Save Structure</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
