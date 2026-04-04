import React, { useEffect, useState } from 'react';
import { Search, ShieldAlert, ChevronLeft, ChevronRight } from 'lucide-react';
import { BentoBox } from '../components/BentoBox';
import { Badge } from '../components/Badge';
import { fetchApi } from '../lib/api';
import { cn } from '../lib/utils';

interface AuditLog {
  id: string;
  user_email: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  ip_address: string | null;
  created_at: string;
}

const actionVariant = (action: string): 'success' | 'danger' | 'warning' | 'neutral' => {
  if (action.includes('delete') || action.includes('logout')) return 'danger';
  if (action.includes('create') || action.includes('login')) return 'success';
  if (action.includes('update') || action.includes('reset')) return 'warning';
  return 'neutral';
};

export function AuditLog() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, total_pages: 1, per_page: 50 });

  const load = async () => {
    setLoading(true);
    try {
      let url = `/audit?page=${page}&per_page=50`;
      if (search) url += `&action=${encodeURIComponent(search)}`;
      if (entityFilter) url += `&entity_type=${encodeURIComponent(entityFilter)}`;
      const res = await fetchApi(url).catch(() => null);
      if (res?.data) setLogs(res.data);
      if (res?.meta) setMeta(res.meta);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [page, entityFilter]);

  useEffect(() => {
    const delay = setTimeout(() => { setPage(1); load(); }, 500);
    return () => clearTimeout(delay);
  }, [search]);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      + ' ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading && logs.length === 0) return <div className="p-8 text-center text-muted">Loading audit logs...</div>;

  return (
    <div className="space-y-6">
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary tracking-tight">Audit Log</h1>
          <p className="text-muted mt-1">System activity and security event trail.</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted border border-border-subtle rounded-lg px-3 py-2">
          <ShieldAlert className="w-4 h-4" />
          <span>{meta.total} total events</span>
        </div>
      </header>

      <BentoBox span={4} className="p-0 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-border-subtle flex flex-col sm:flex-row gap-4 items-center bg-surface/50">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by action (e.g. login, delete)..."
              className="w-full pl-9 pr-4 py-2 bg-black/50 border border-border-subtle rounded-lg text-sm focus:outline-none focus:border-border-strong"
            />
          </div>
          <select value={entityFilter} onChange={(e) => { setEntityFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-border-subtle rounded-lg text-sm bg-black focus:outline-none">
            <option value="">All Entities</option>
            <option value="user">User</option>
            <option value="transaction">Transaction</option>
            <option value="budget">Budget</option>
            <option value="tag">Tag</option>
            <option value="api_key">API Key</option>
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto min-h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center h-[300px] text-muted">Loading...</div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[300px] text-muted gap-3">
              <ShieldAlert className="w-10 h-10 opacity-30" />
              <p>No audit events found.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-subtle text-muted text-sm bg-black/20">
                  <th className="px-6 py-4 font-medium">Action</th>
                  <th className="px-6 py-4 font-medium">User</th>
                  <th className="px-6 py-4 font-medium">Entity</th>
                  <th className="px-6 py-4 font-medium">IP Address</th>
                  <th className="px-6 py-4 font-medium">Timestamp</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {logs.map((log, i) => (
                  <tr key={log.id}
                    className={cn(
                      'border-b border-border-subtle/50 hover:bg-[#111111] transition-colors',
                      i % 2 === 0 ? 'bg-[#0a0a0a]' : 'bg-[#000000]'
                    )}>
                    <td className="px-6 py-3">
                      <Badge variant={actionVariant(log.action)}>
                        {log.action}
                      </Badge>
                    </td>
                    <td className="px-6 py-3 text-muted text-xs">{log.user_email || '—'}</td>
                    <td className="px-6 py-3 text-muted text-xs">
                      {log.entity_type ? (
                        <span>
                          <span className="text-primary/70">{log.entity_type}</span>
                          {log.entity_id && <span className="ml-1 opacity-50">/{log.entity_id.slice(0, 8)}…</span>}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-6 py-3 text-muted font-mono text-xs">{log.ip_address || '—'}</td>
                    <td className="px-6 py-3 text-muted text-xs whitespace-nowrap">{formatDate(log.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {meta.total_pages > 1 && (
          <div className="p-4 border-t border-border-subtle flex items-center justify-between text-sm text-muted bg-surface/50">
            <span>Showing page {page} of {meta.total_pages} ({meta.total} events)</span>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                className="p-1.5 border border-border-subtle rounded hover:bg-surface transition-colors disabled:opacity-40">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => setPage(p => Math.min(meta.total_pages, p + 1))} disabled={page >= meta.total_pages}
                className="p-1.5 border border-border-subtle rounded hover:bg-surface transition-colors disabled:opacity-40">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </BentoBox>
    </div>
  );
}
