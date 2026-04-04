import React, { useEffect, useState } from 'react';
import { Plus, Trash2, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';
import { BentoBox } from '../components/BentoBox';
import { Badge } from '../components/Badge';
import { fetchApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';

interface BudgetStatus {
  id: string;
  category_id: string;
  category_name: string;
  amount_limit: number;
  actual_spend: number;
  remaining: number;
  pct_used: number;
  period: string;
  status: 'ok' | 'warning' | 'over';
}

interface Category {
  id: string;
  name: string;
}

interface NewBudgetForm {
  category_id: string;
  amount_limit: string;
  period: 'monthly' | 'yearly';
}

export function Budgets() {
  const { viewRole } = useAuth();
  const isAdmin = viewRole === 'Admin';

  const [budgets, setBudgets] = useState<BudgetStatus[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<NewBudgetForm>({ category_id: '', amount_limit: '', period: 'monthly' });

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n);

  const loadData = async () => {
    setLoading(true);
    try {
      const [budRes, catRes] = await Promise.allSettled([
        fetchApi('/budgets/status').catch(() => null),
        fetchApi('/categories').catch(() => null),
      ]);
      if (budRes.status === 'fulfilled' && budRes.value?.data) setBudgets(budRes.value.data);
      if (catRes.status === 'fulfilled' && catRes.value?.data) setCategories(catRes.value.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleCreate = async () => {
    if (!form.category_id || !form.amount_limit) return setError('Category and amount are required.');
    setSaving(true); setError('');
    try {
      await fetchApi('/budgets', {
        method: 'POST',
        body: JSON.stringify({ category_id: form.category_id, amount_limit: parseFloat(form.amount_limit), period: form.period }),
      });
      setShowModal(false);
      setForm({ category_id: '', amount_limit: '', period: 'monthly' });
      loadData();
    } catch (e: any) {
      setError(e.message || 'Failed to create budget.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this budget?')) return;
    try {
      await fetchApi(`/budgets/${id}`, { method: 'DELETE' });
      loadData();
    } catch {}
  };

  const statusBadge = (s: BudgetStatus['status']) => {
    if (s === 'over') return <Badge variant="danger">Over Budget</Badge>;
    if (s === 'warning') return <Badge variant="warning">Warning</Badge>;
    return <Badge variant="success">On Track</Badge>;
  };

  if (loading) return <div className="p-8 text-center text-muted">Loading budgets...</div>;

  return (
    <div className="space-y-6">
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary tracking-tight">Budgets</h1>
          <p className="text-muted mt-1">Track spending limits by category.</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 py-2 px-4 bg-white text-black rounded-xl font-medium hover:bg-gray-200 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.2)]"
          >
            <Plus className="w-4 h-4" /> New Budget
          </button>
        )}
      </header>

      {budgets.length === 0 ? (
        <BentoBox span={4} className="min-h-[300px] flex items-center justify-center text-center">
          <div>
            <TrendingUp className="w-12 h-12 text-muted mx-auto mb-4 opacity-40" />
            <p className="text-muted">No budgets configured yet.{isAdmin ? ' Create one to start tracking.' : ''}</p>
          </div>
        </BentoBox>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {budgets.map((b) => (
            <BentoBox key={b.id} span={1}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-primary">{b.category_name}</h3>
                  <p className="text-xs text-muted capitalize">{b.period} budget</p>
                </div>
                <div className="flex items-center gap-2">
                  {statusBadge(b.status)}
                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(b.id)}
                      className="p-1.5 text-muted hover:text-red-400 transition-colors rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Spent</span>
                  <span className="font-medium text-primary">{formatCurrency(b.actual_spend)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Limit</span>
                  <span className="font-medium text-primary">{formatCurrency(b.amount_limit)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Remaining</span>
                  <span className={`font-medium ${b.remaining === 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {formatCurrency(b.remaining)}
                  </span>
                </div>
              </div>
              <div className="w-full h-2 bg-black rounded-full overflow-hidden border border-border-subtle">
                <div
                  className={`h-full rounded-full transition-all ${
                    b.status === 'over' ? 'bg-red-500' : b.status === 'warning' ? 'bg-yellow-500' : 'bg-white'
                  }`}
                  style={{ width: `${Math.min(100, b.pct_used)}%` }}
                />
              </div>
              <p className="text-xs text-muted mt-2 text-right">{b.pct_used}% used</p>
            </BentoBox>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#0a0a0a] border border-border-subtle rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <h2 className="text-xl font-bold text-primary mb-6">New Budget</h2>
            {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-muted mb-1">Category</label>
                <select
                  value={form.category_id}
                  onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                  className="w-full px-3 py-2 bg-black border border-border-subtle rounded-lg text-sm focus:outline-none focus:border-border-strong"
                >
                  <option value="">Select category...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-muted mb-1">Amount Limit (₹)</label>
                <input
                  type="number"
                  value={form.amount_limit}
                  onChange={(e) => setForm({ ...form, amount_limit: e.target.value })}
                  placeholder="e.g. 10000"
                  className="w-full px-3 py-2 bg-black border border-border-subtle rounded-lg text-sm focus:outline-none focus:border-border-strong"
                />
              </div>
              <div>
                <label className="block text-sm text-muted mb-1">Period</label>
                <select
                  value={form.period}
                  onChange={(e) => setForm({ ...form, period: e.target.value as 'monthly' | 'yearly' })}
                  className="w-full px-3 py-2 bg-black border border-border-subtle rounded-lg text-sm focus:outline-none focus:border-border-strong"
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setShowModal(false); setError(''); }}
                className="flex-1 py-2 px-4 border border-border-subtle rounded-xl text-sm hover:bg-surface transition-colors"
              >Cancel</button>
              <button
                onClick={handleCreate}
                disabled={saving}
                className="flex-1 py-2 px-4 bg-white text-black rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
              >{saving ? 'Saving...' : 'Create Budget'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
