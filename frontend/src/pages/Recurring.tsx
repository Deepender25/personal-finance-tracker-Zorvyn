import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Repeat, Calendar, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { BentoBox } from '../components/BentoBox';
import { Badge } from '../components/Badge';
import { fetchApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';

interface RecurringTemplate {
  id: string;
  amount: number;
  type: string;
  recurrence_interval: string;
  next_due_date: string | null;
  notes: string | null;
  category_name: string | null;
}

interface Category { id: string; name: string; }

interface NewRecurringForm {
  amount: string;
  type: 'income' | 'expense';
  category_id: string;
  start_date: string;
  interval: 'daily' | 'weekly' | 'monthly' | 'yearly';
  notes: string;
}

export function Recurring() {
  const { viewRole } = useAuth();
  const isAdmin = viewRole === 'Admin';

  const [templates, setTemplates] = useState<RecurringTemplate[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<NewRecurringForm>({
    amount: '', type: 'expense', category_id: '', start_date: new Date().toISOString().split('T')[0],
    interval: 'monthly', notes: '',
  });

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n);

  const loadData = async () => {
    setLoading(true);
    try {
      const [recRes, catRes] = await Promise.allSettled([
        fetchApi('/recurring').catch(() => null),
        fetchApi('/categories').catch(() => null),
      ]);
      if (recRes.status === 'fulfilled' && recRes.value?.data) setTemplates(recRes.value.data);
      if (catRes.status === 'fulfilled' && catRes.value?.data) setCategories(catRes.value.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleCreate = async () => {
    if (!form.amount || !form.start_date) return setError('Amount and start date are required.');
    setSaving(true); setError('');
    try {
      await fetchApi('/recurring', {
        method: 'POST',
        body: JSON.stringify({
          amount: parseFloat(form.amount),
          type: form.type,
          category_id: form.category_id || null,
          start_date: form.start_date,
          interval: form.interval,
          notes: form.notes || null,
        }),
      });
      setShowModal(false);
      setForm({ amount: '', type: 'expense', category_id: '', start_date: new Date().toISOString().split('T')[0], interval: 'monthly', notes: '' });
      loadData();
    } catch (e: any) {
      setError(e.message || 'Failed to create recurring transaction.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Stop this recurring transaction?')) return;
    try {
      await fetchApi(`/recurring/${id}`, { method: 'DELETE' });
      loadData();
    } catch {}
  };

  const intervalLabel = (i: string) => ({ daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly', yearly: 'Yearly' }[i] || i);

  if (loading) return <div className="p-8 text-center text-muted">Loading recurring transactions...</div>;

  return (
    <div className="space-y-6">
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary tracking-tight">Recurring</h1>
          <p className="text-muted mt-1">Manage automatic recurring transactions.</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 py-2 px-4 bg-white text-black rounded-xl font-medium hover:bg-gray-200 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.2)]"
          >
            <Plus className="w-4 h-4" /> New Recurring
          </button>
        )}
      </header>

      {templates.length === 0 ? (
        <BentoBox span={4} className="min-h-[300px] flex items-center justify-center text-center">
          <div>
            <Repeat className="w-12 h-12 text-muted mx-auto mb-4 opacity-40" />
            <p className="text-muted">No recurring transactions set up yet.</p>
          </div>
        </BentoBox>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((t) => (
            <BentoBox key={t.id} span={1}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {t.type === 'income'
                    ? <ArrowUpCircle className="w-5 h-5 text-green-400" />
                    : <ArrowDownCircle className="w-5 h-5 text-red-400" />}
                  <div>
                    <p className="font-semibold text-primary text-sm">{t.notes || t.category_name || 'Recurring'}</p>
                    <p className="text-xs text-muted">{t.category_name || 'Uncategorized'}</p>
                  </div>
                </div>
                {isAdmin && (
                  <button onClick={() => handleDelete(t.id)} className="p-1.5 text-muted hover:text-red-400 transition-colors rounded">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="flex items-center justify-between mt-4">
                <h3 className="text-xl font-bold text-primary">{formatCurrency(t.amount)}</h3>
                <Badge variant={t.type === 'income' ? 'success' : 'danger'}>{intervalLabel(t.recurrence_interval)}</Badge>
              </div>
              {t.next_due_date && (
                <div className="flex items-center gap-2 mt-3 text-xs text-muted">
                  <Calendar className="w-3 h-3" />
                  <span>Next: {new Date(t.next_due_date).toLocaleDateString('en-IN')}</span>
                </div>
              )}
            </BentoBox>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#0a0a0a] border border-border-subtle rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <h2 className="text-xl font-bold text-primary mb-6">New Recurring Transaction</h2>
            {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-muted mb-1">Amount (₹)</label>
                  <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    placeholder="e.g. 5000" className="w-full px-3 py-2 bg-black border border-border-subtle rounded-lg text-sm focus:outline-none focus:border-border-strong" />
                </div>
                <div>
                  <label className="block text-sm text-muted mb-1">Type</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as 'income' | 'expense' })}
                    className="w-full px-3 py-2 bg-black border border-border-subtle rounded-lg text-sm focus:outline-none focus:border-border-strong">
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-muted mb-1">Category (optional)</label>
                <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                  className="w-full px-3 py-2 bg-black border border-border-subtle rounded-lg text-sm focus:outline-none focus:border-border-strong">
                  <option value="">None</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-muted mb-1">Start Date</label>
                  <input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                    className="w-full px-3 py-2 bg-black border border-border-subtle rounded-lg text-sm focus:outline-none focus:border-border-strong" />
                </div>
                <div>
                  <label className="block text-sm text-muted mb-1">Frequency</label>
                  <select value={form.interval} onChange={(e) => setForm({ ...form, interval: e.target.value as any })}
                    className="w-full px-3 py-2 bg-black border border-border-subtle rounded-lg text-sm focus:outline-none focus:border-border-strong">
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-muted mb-1">Notes (optional)</label>
                <input type="text" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="e.g. Monthly salary" className="w-full px-3 py-2 bg-black border border-border-subtle rounded-lg text-sm focus:outline-none focus:border-border-strong" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowModal(false); setError(''); }}
                className="flex-1 py-2 px-4 border border-border-subtle rounded-xl text-sm hover:bg-surface transition-colors">Cancel</button>
              <button onClick={handleCreate} disabled={saving}
                className="flex-1 py-2 px-4 bg-white text-black rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50">
                {saving ? 'Saving...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
