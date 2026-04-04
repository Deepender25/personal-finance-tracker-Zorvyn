import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Briefcase, Search } from 'lucide-react';
import { BentoBox } from '../components/BentoBox';
import { fetchApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';

interface Category {
  id: string;
  name: string;
}

export function Categories() {
  const { viewRole } = useAuth();
  const isAdmin = viewRole === 'Admin';
  const navigate = useNavigate();

  const [categories, setCategories] = useState<Category[]>([]);
  const [filtered, setFiltered] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showInput, setShowInput] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetchApi('/categories').catch(() => null);
      if (res?.data) {
        setCategories(res.data);
        setFiltered(res.data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(categories.filter((c) => c.name.toLowerCase().includes(q)));
  }, [search, categories]);

  const handleCreate = async () => {
    if (!newName.trim()) return setError('Category name is required.');
    setSaving(true); setError('');
    try {
      await fetchApi('/categories', { method: 'POST', body: JSON.stringify({ name: newName.trim() }) });
      setNewName('');
      setShowInput(false);
      load();
    } catch (e: any) {
      setError(e.message || 'Failed to create category.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete category "${name}"? This will fail if it has transactions.`)) return;
    try {
      await fetchApi(`/categories/${id}`, { method: 'DELETE' });
      load();
    } catch (e: any) {
      alert(e.message || 'Cannot delete — category may still have transactions.');
    }
  };

  if (loading) return <div className="p-8 text-center text-muted">Loading categories...</div>;

  return (
    <div className="space-y-6">
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary tracking-tight">Categories</h1>
          <p className="text-muted mt-1">Organise your transactions by category.</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => { setShowInput(true); setError(''); }}
            className="flex items-center gap-2 py-2 px-4 bg-white text-black rounded-xl font-medium hover:bg-gray-200 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.2)]"
          >
            <Plus className="w-4 h-4" /> New Category
          </button>
        )}
      </header>

      {/* Add input inline */}
      {showInput && isAdmin && (
        <BentoBox span={4}>
          <p className="text-sm text-muted mb-3">Enter a new category name:</p>
          {error && <p className="text-red-400 text-xs mb-2">{error}</p>}
          <div className="flex gap-3">
            <input
              autoFocus
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              placeholder="e.g. Utilities"
              className="flex-1 px-3 py-2 bg-black border border-border-subtle rounded-lg text-sm focus:outline-none focus:border-border-strong"
            />
            <button onClick={() => { setShowInput(false); setError(''); setNewName(''); }}
              className="px-4 py-2 border border-border-subtle rounded-xl text-sm hover:bg-surface transition-colors">Cancel</button>
            <button onClick={handleCreate} disabled={saving}
              className="px-4 py-2 bg-white text-black rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50">
              {saving ? 'Saving...' : 'Create'}
            </button>
          </div>
        </BentoBox>
      )}

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
        <input
          type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search categories..."
          className="w-full pl-9 pr-4 py-2 bg-black/50 border border-border-subtle rounded-lg text-sm focus:outline-none focus:border-border-strong"
        />
      </div>

      {filtered.length === 0 ? (
        <BentoBox span={4} className="min-h-[200px] flex items-center justify-center text-center">
          <div>
            <Briefcase className="w-12 h-12 text-muted mx-auto mb-4 opacity-40" />
            <p className="text-muted">{search ? 'No categories match your search.' : 'No categories yet.'}</p>
          </div>
        </BentoBox>
      ) : (
        <BentoBox span={4} className="p-0 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border-subtle text-muted text-sm bg-black/20">
                <th className="px-6 py-4 font-medium">Category Name</th>
                <th className="px-6 py-4 font-medium">ID</th>
                {isAdmin && <th className="px-6 py-4 font-medium text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="text-sm">
              {filtered.map((cat, i) => (
                <tr key={cat.id}
                  onClick={() => navigate(`/transactions?category_id=${cat.id}`)}
                  className={`border-b border-border-subtle/50 hover:bg-[#111111] cursor-pointer transition-colors ${i % 2 === 0 ? 'bg-[#0a0a0a]' : 'bg-[#000000]'}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-surface-hover border border-border-subtle flex items-center justify-center">
                        <Briefcase className="w-3.5 h-3.5 text-muted" />
                      </div>
                      <span className="font-medium text-primary">{cat.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-muted font-mono text-xs">{cat.id}</td>
                  {isAdmin && (
                    <td className="px-6 py-4 text-right">
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(cat.id, cat.name); }}
                        className="p-1.5 text-muted hover:text-red-400 transition-colors rounded">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </BentoBox>
      )}
    </div>
  );
}
