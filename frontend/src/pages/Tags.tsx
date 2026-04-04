import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Tag, Search } from 'lucide-react';
import { BentoBox } from '../components/BentoBox';
import { Badge } from '../components/Badge';
import { fetchApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';

interface AppTag {
  id: string;
  name: string;
  usage_count?: number;
}

export function Tags() {
  const { viewRole } = useAuth();
  const isAdmin = viewRole === 'Admin';
  const navigate = useNavigate();

  const [tags, setTags] = useState<AppTag[]>([]);
  const [filtered, setFiltered] = useState<AppTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showInput, setShowInput] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetchApi('/tags').catch(() => null);
      if (res?.data) {
        setTags(res.data);
        setFiltered(res.data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(tags.filter((t) => t.name.toLowerCase().includes(q)));
  }, [search, tags]);

  const handleCreate = async () => {
    if (!newName.trim()) return setError('Tag name is required.');
    setSaving(true); setError('');
    try {
      await fetchApi('/tags', { method: 'POST', body: JSON.stringify({ name: newName.trim() }) });
      setNewName('');
      setShowInput(false);
      load();
    } catch (e: any) {
      setError(e.message || 'Failed to create tag.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete tag "${name}"?`)) return;
    try {
      await fetchApi(`/tags/${id}`, { method: 'DELETE' });
      load();
    } catch (e: any) {
      alert(e.message || 'Failed to delete tag.');
    }
  };

  if (loading) return <div className="p-8 text-center text-muted">Loading tags...</div>;

  return (
    <div className="space-y-6">
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary tracking-tight">Tags</h1>
          <p className="text-muted mt-1">Label and group transactions with tags.</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => { setShowInput(true); setError(''); }}
            className="flex items-center gap-2 py-2 px-4 bg-white text-black rounded-xl font-medium hover:bg-gray-200 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.2)]"
          >
            <Plus className="w-4 h-4" /> New Tag
          </button>
        )}
      </header>

      {showInput && isAdmin && (
        <BentoBox span={4}>
          <p className="text-sm text-muted mb-3">Enter a new tag name:</p>
          {error && <p className="text-red-400 text-xs mb-2">{error}</p>}
          <div className="flex gap-3">
            <input
              autoFocus type="text" value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              placeholder="e.g. tax-deductible"
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

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tags..."
          className="w-full pl-9 pr-4 py-2 bg-black/50 border border-border-subtle rounded-lg text-sm focus:outline-none focus:border-border-strong"
        />
      </div>

      {filtered.length === 0 ? (
        <BentoBox span={4} className="min-h-[200px] flex items-center justify-center text-center">
          <div>
            <Tag className="w-12 h-12 text-muted mx-auto mb-4 opacity-40" />
            <p className="text-muted">{search ? 'No tags match your search.' : 'No tags created yet.'}</p>
          </div>
        </BentoBox>
      ) : (
        <div className="flex flex-wrap gap-3">
          {filtered.map((tag) => (
            <div key={tag.id}
              onClick={() => navigate(`/transactions?tag=${encodeURIComponent(tag.name)}`)}
              className="flex items-center gap-2 px-4 py-2 bg-[#0a0a0a] border border-border-subtle rounded-xl cursor-pointer hover:border-border-strong hover:bg-surface transition-all group">
              <Tag className="w-3.5 h-3.5 text-muted" />
              <span className="text-sm font-medium text-primary">{tag.name}</span>
              {tag.usage_count !== undefined && (
                <Badge variant="neutral">{tag.usage_count}</Badge>
              )}
              {isAdmin && (
                <button onClick={(e) => { e.stopPropagation(); handleDelete(tag.id, tag.name); }}
                  className="ml-1 opacity-0 group-hover:opacity-100 text-muted hover:text-red-400 transition-all">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
