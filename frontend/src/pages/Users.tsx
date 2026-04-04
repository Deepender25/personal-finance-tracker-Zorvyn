import React, { useEffect, useState } from 'react';
import { Plus, Search, UserCog, Trash2, Shield,  Eye, BarChart2 } from 'lucide-react';
import { BentoBox } from '../components/BentoBox';
import { Badge } from '../components/Badge';
import { fetchApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';

interface AppUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  last_login: string | null;
  created_at: string;
}

const roleIcon = (role: string) => {
  if (role === 'admin') return <Shield className="w-3.5 h-3.5" />;
  if (role === 'analyst') return <BarChart2 className="w-3.5 h-3.5" />;
  return <Eye className="w-3.5 h-3.5" />;
};

const roleBadgeVariant = (role: string): 'success' | 'warning' | 'neutral' => {
  if (role === 'admin') return 'success';
  if (role === 'analyst') return 'warning';
  return 'neutral';
};

export function Users() {
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState<AppUser | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'viewer' });

  const loadUsers = async () => {
    setLoading(true);
    try {
      let url = '/users?per_page=50';
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (roleFilter) url += `&role=${roleFilter}`;
      const res = await fetchApi(url).catch(() => null);
      if (res?.data) setUsers(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, [roleFilter]);

  useEffect(() => {
    const delay = setTimeout(() => { loadUsers(); }, 500);
    return () => clearTimeout(delay);
  }, [search]);

  const handleCreate = async () => {
    if (!form.name || !form.email || !form.password || !form.role)
      return setError('All fields are required.');
    setSaving(true); setError('');
    try {
      await fetchApi('/users', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setShowModal(false);
      setForm({ name: '', email: '', password: '', role: 'viewer' });
      loadUsers();
    } catch (e: any) {
      setError(e.message || 'Failed to create user.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      await fetchApi(`/users/${userId}`, { method: 'PUT', body: JSON.stringify({ role: newRole }) });
      loadUsers();
    } catch {}
  };

  const handleToggleStatus = async (u: AppUser) => {
    const newStatus = u.status === 'active' ? 'inactive' : 'active';
    try {
      await fetchApi(`/users/${u.id}`, { method: 'PUT', body: JSON.stringify({ status: newStatus }) });
      loadUsers();
    } catch {}
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Deactivate this user?')) return;
    try {
      await fetchApi(`/users/${userId}`, { method: 'DELETE' });
      loadUsers();
    } catch {}
  };

  if (loading) return <div className="p-8 text-center text-muted">Loading users...</div>;

  return (
    <div className="space-y-6">
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary tracking-tight">User Management</h1>
          <p className="text-muted mt-1">Manage system users and role assignments.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 py-2 px-4 bg-white text-black rounded-xl font-medium hover:bg-gray-200 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.2)]"
        >
          <Plus className="w-4 h-4" /> New User
        </button>
      </header>

      <BentoBox span={4} className="p-0 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-border-subtle flex flex-col sm:flex-row gap-4 items-center justify-between bg-surface/50">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users..."
              className="w-full pl-9 pr-4 py-2 bg-black/50 border border-border-subtle rounded-lg text-sm focus:outline-none focus:border-border-strong"
            />
          </div>
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 border border-border-subtle rounded-lg text-sm bg-black focus:outline-none">
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="analyst">Analyst</option>
            <option value="viewer">Viewer</option>
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border-subtle text-muted text-sm bg-black/20">
                <th className="px-6 py-4 font-medium">User</th>
                <th className="px-6 py-4 font-medium">Role</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Last Login</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {users.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-muted">No users found.</td></tr>
              ) : users.map((u, i) => (
                <tr key={u.id}
                  className={`border-b border-border-subtle/50 hover:bg-[#111111] transition-colors ${i % 2 === 0 ? 'bg-[#0a0a0a]' : 'bg-[#000000]'}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-border-strong flex items-center justify-center font-semibold text-sm">
                        {u.name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="font-medium text-primary">{u.name}
                          {currentUser?.id === u.id && <span className="text-xs text-muted ml-2">(you)</span>}
                        </p>
                        <p className="text-xs text-muted">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {currentUser?.id === u.id ? (
                      <Badge variant={roleBadgeVariant(u.role)}>
                        <span className="flex items-center gap-1">{roleIcon(u.role)} {u.role}</span>
                      </Badge>
                    ) : (
                      <select
                        value={u.role}
                        onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                        className="px-2 py-1 bg-black border border-border-subtle rounded text-xs focus:outline-none"
                      >
                        <option value="viewer">viewer</option>
                        <option value="analyst">analyst</option>
                        <option value="admin">admin</option>
                      </select>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={u.status === 'active' ? 'success' : 'danger'}>{u.status}</Badge>
                  </td>
                  <td className="px-6 py-4 text-muted text-xs">
                    {u.last_login ? new Date(u.last_login).toLocaleDateString('en-IN') : 'Never'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {currentUser?.id !== u.id && (
                        <>
                          <button onClick={() => handleToggleStatus(u)}
                            className="px-2 py-1 border border-border-subtle rounded text-xs hover:bg-surface transition-colors">
                            {u.status === 'active' ? 'Deactivate' : 'Activate'}
                          </button>
                          <button onClick={() => handleDelete(u.id)}
                            className="p-1.5 text-muted hover:text-red-400 transition-colors rounded">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </BentoBox>

      {/* Create User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#0a0a0a] border border-border-subtle rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <h2 className="text-xl font-bold text-primary mb-6">Create New User</h2>
            {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-muted mb-1">Full Name</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Jane Doe"
                  className="w-full px-3 py-2 bg-black border border-border-subtle rounded-lg text-sm focus:outline-none focus:border-border-strong" />
              </div>
              <div>
                <label className="block text-sm text-muted mb-1">Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="jane@example.com"
                  className="w-full px-3 py-2 bg-black border border-border-subtle rounded-lg text-sm focus:outline-none focus:border-border-strong" />
              </div>
              <div>
                <label className="block text-sm text-muted mb-1">Password</label>
                <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Min 8 chars with uppercase, number"
                  className="w-full px-3 py-2 bg-black border border-border-subtle rounded-lg text-sm focus:outline-none focus:border-border-strong" />
              </div>
              <div>
                <label className="block text-sm text-muted mb-1">Role</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full px-3 py-2 bg-black border border-border-subtle rounded-lg text-sm focus:outline-none focus:border-border-strong">
                  <option value="viewer">Viewer</option>
                  <option value="analyst">Analyst</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowModal(false); setError(''); }}
                className="flex-1 py-2 px-4 border border-border-subtle rounded-xl text-sm hover:bg-surface transition-colors">Cancel</button>
              <button onClick={handleCreate} disabled={saving}
                className="flex-1 py-2 px-4 bg-white text-black rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50">
                {saving ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
