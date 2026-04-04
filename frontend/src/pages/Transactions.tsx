import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, MoreHorizontal, X, Pencil, Trash2 } from 'lucide-react';
import { BentoBox } from '../components/BentoBox';
import { Badge } from '../components/Badge';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import { fetchApi } from '../lib/api';

interface Category { id: string; name: string; }

interface TxForm {
  amount: string;
  type: 'income' | 'expense';
  category_id: string;
  date: string;
  notes: string;
}

const emptyForm = (): TxForm => ({
  amount: '', type: 'expense', category_id: '',
  date: new Date().toISOString().split('T')[0], notes: '',
});

export function Transactions() {
  const { viewRole } = useAuth();
  const canManage = viewRole === 'Admin';

  const [transactions, setTransactions] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, total_pages: 1, per_page: 15 });
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All Types');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editTx, setEditTx] = useState<any | null>(null);
  const [form, setForm] = useState<TxForm>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchApi('/categories').then((r) => { if (r?.data) setCategories(r.data); }).catch(() => {});
  }, []);

  useEffect(() => { fetchTransactions(); }, [page, typeFilter]);

  useEffect(() => {
    const delay = setTimeout(() => { fetchTransactions(); }, 500);
    return () => clearTimeout(delay);
  }, [searchTerm]);

  const fetchTransactions = async () => {
    setLoading(true);
    let url = `/transactions?page=${page}&per_page=${meta.per_page}`;
    if (typeFilter !== 'All Types') url += `&type=${typeFilter.toLowerCase()}`;
    if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;
    try {
      const res = await fetchApi(url);
      setTransactions(res.data);
      if (res.meta) setMeta(res.meta);
    } catch (error) {
      console.error('Failed to load transactions', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const openCreate = () => { setEditTx(null); setForm(emptyForm()); setFormError(''); setShowModal(true); };

  const openEdit = (tx: any) => {
    setEditTx(tx);
    setForm({
      amount: String(tx.amount),
      type: tx.type as 'income' | 'expense',
      category_id: tx.category_id || '',
      date: tx.date ? tx.date.split('T')[0] : new Date().toISOString().split('T')[0],
      notes: tx.notes || '',
    });
    setFormError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.amount || !form.date) return setFormError('Amount and date are required.');
    setSaving(true); setFormError('');
    try {
      const body = {
        amount: parseFloat(form.amount),
        type: form.type,
        category_id: form.category_id || null,
        date: form.date,
        notes: form.notes || null,
      };
      if (editTx) {
        await fetchApi(`/transactions/${editTx.id}`, { method: 'PUT', body: JSON.stringify(body) });
      } else {
        await fetchApi('/transactions', { method: 'POST', body: JSON.stringify(body) });
      }
      setShowModal(false);
      fetchTransactions();
    } catch (e: any) {
      setFormError(e.message || 'Failed to save transaction.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this transaction?')) return;
    try {
      await fetchApi(`/transactions/${id}`, { method: 'DELETE' });
      fetchTransactions();
    } catch {}
  };

  const handlePrevPage = () => { if (page > 1) setPage(page - 1); };
  const handleNextPage = () => { if (page < meta.total_pages) setPage(page + 1); };
  const startCurrent = (page - 1) * meta.per_page + 1;
  const endCurrent = Math.min(page * meta.per_page, meta.total);

  return (
    <div className="space-y-6">
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary tracking-tight">Transactions</h1>
          <p className="text-muted mt-1">Manage and view all your financial records.</p>
        </div>
        {canManage && (
          <button
            onClick={openCreate}
            className="flex items-center gap-2 py-2 px-4 bg-white text-black rounded-xl font-medium hover:bg-gray-200 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.2)]"
          >
            <Plus className="w-4 h-4" /> New Transaction
          </button>
        )}
      </header>

      <BentoBox span={4} className="p-0 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-border-subtle flex flex-col sm:flex-row gap-4 items-center justify-between bg-surface/50">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search transactions..."
              className="w-full pl-9 pr-4 py-2 bg-black/50 border border-border-subtle rounded-lg text-sm focus:outline-none focus:border-border-strong focus:ring-1 focus:ring-border-strong transition-colors"
            />
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 border border-border-subtle rounded-lg text-sm font-medium bg-black focus:outline-none w-full sm:w-auto"
            >
              <option>All Types</option>
              <option>Income</option>
              <option>Expense</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="table-wrap overflow-x-auto min-h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center h-full min-h-[300px] text-muted">Loading transactions...</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-subtle text-muted text-sm bg-black/20">
                  <th className="px-6 py-4 font-medium">Transaction ID</th>
                  <th className="px-6 py-4 font-medium">Description</th>
                  <th className="px-6 py-4 font-medium">Category</th>
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 font-medium">Amount</th>
                  <th className="px-6 py-4 font-medium">Type</th>
                  {canManage && <th className="px-6 py-4 font-medium text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="text-sm">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={canManage ? 7 : 6} className="px-6 py-8 text-center text-muted">No transactions found.</td>
                  </tr>
                ) : (
                  transactions.map((tx, index) => (
                    <tr key={tx.id} className={cn(
                      'border-b border-border-subtle/50 hover:bg-[#111111] transition-colors',
                      index % 2 === 0 ? 'bg-[#0a0a0a]' : 'bg-[#000000]'
                    )}>
                      <td className="px-6 py-4 font-medium text-primary">
                        TXN-{tx.id.substring(0, 6).toUpperCase()}
                      </td>
                      <td className="px-6 py-4">{tx.notes || tx.category_name || 'Transaction'}</td>
                      <td className="px-6 py-4 text-muted">{tx.category_name || 'Uncategorized'}</td>
                      <td className="px-6 py-4 text-muted">{formatDate(tx.date)}</td>
                      <td className="px-6 py-4">{formatCurrency(tx.amount)}</td>
                      <td className="px-6 py-4">
                        <Badge variant={tx.type === 'income' ? 'success' : 'danger'}>
                          {tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
                        </Badge>
                      </td>
                      {canManage && (
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => openEdit(tx)} className="p-1.5 text-muted hover:text-primary transition-colors rounded">
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(tx.id)} className="p-1.5 text-muted hover:text-red-400 transition-colors rounded">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {!loading && transactions.length > 0 && (
          <div className="p-4 border-t border-border-subtle flex items-center justify-between text-sm text-muted bg-surface/50">
            <span>Showing {startCurrent} to {endCurrent} of {meta.total} results</span>
            <div className="flex gap-1 items-center">
              <button onClick={handlePrevPage} disabled={page <= 1}
                className="px-3 py-1 border border-border-subtle rounded hover:bg-surface transition-colors disabled:opacity-50">Prev</button>
              <span className="px-3 py-1 text-primary">Page {page} of {meta.total_pages}</span>
              <button onClick={handleNextPage} disabled={page >= meta.total_pages}
                className="px-3 py-1 border border-border-subtle rounded hover:bg-surface transition-colors disabled:opacity-50">Next</button>
            </div>
          </div>
        )}
      </BentoBox>

      {/* Add / Edit Transaction Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#0a0a0a] border border-border-subtle rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-primary">{editTx ? 'Edit Transaction' : 'New Transaction'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 text-muted hover:text-primary transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            {formError && <p className="text-red-400 text-sm mb-4">{formError}</p>}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-muted mb-1">Amount (₹)</label>
                  <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    placeholder="e.g. 5000"
                    className="w-full px-3 py-2 bg-black border border-border-subtle rounded-lg text-sm focus:outline-none focus:border-border-strong" />
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
              <div>
                <label className="block text-sm text-muted mb-1">Date</label>
                <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full px-3 py-2 bg-black border border-border-subtle rounded-lg text-sm focus:outline-none focus:border-border-strong" />
              </div>
              <div>
                <label className="block text-sm text-muted mb-1">Notes (optional)</label>
                <input type="text" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="e.g. Grocery run"
                  className="w-full px-3 py-2 bg-black border border-border-subtle rounded-lg text-sm focus:outline-none focus:border-border-strong" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-2 px-4 border border-border-subtle rounded-xl text-sm hover:bg-surface transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-2 px-4 bg-white text-black rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50">
                {saving ? 'Saving...' : editTx ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
