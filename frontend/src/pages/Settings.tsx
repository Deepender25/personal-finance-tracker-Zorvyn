import React from 'react';
import { User, Key, Save } from 'lucide-react';
import { BentoBox } from '../components/BentoBox';
import { useAuth } from '../context/AuthContext';

export function Settings() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-primary tracking-tight">Settings</h1>
        <p className="text-muted mt-1">Manage your account settings and preferences.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BentoBox span={2} className="lg:col-span-1">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-surface-hover rounded-lg border border-border-subtle">
              <User className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-primary">My Profile</h3>
          </div>
          
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-muted mb-1">Full Name</label>
              <input 
                type="text" 
                defaultValue={user?.name}
                className="w-full px-4 py-2.5 bg-black/50 border border-border-subtle rounded-xl text-primary focus:outline-none focus:border-border-strong focus:ring-1 focus:ring-border-strong transition-colors shadow-inner"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted mb-1">Email Address</label>
              <input 
                type="email" 
                defaultValue={user?.email}
                className="w-full px-4 py-2.5 bg-black/50 border border-border-subtle rounded-xl text-primary focus:outline-none focus:border-border-strong focus:ring-1 focus:ring-border-strong transition-colors shadow-inner"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted mb-1">Role</label>
              <input 
                type="text" 
                value={user?.role}
                disabled
                className="w-full px-4 py-2.5 bg-black/20 border border-border-subtle rounded-xl text-muted cursor-not-allowed"
              />
            </div>
            <div className="pt-4">
              <button type="button" className="flex items-center gap-2 py-2.5 px-4 bg-white text-black rounded-xl font-medium hover:bg-gray-200 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                <Save className="w-4 h-4" />
                Save Changes
              </button>
            </div>
          </form>
        </BentoBox>

        <BentoBox span={2} className="lg:col-span-1">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-surface-hover rounded-lg border border-border-subtle">
              <Key className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-primary">API Keys</h3>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-muted">
              Manage your API keys for external integrations. Keep these keys secure and do not share them.
            </p>

            <div className="p-4 rounded-xl border border-border-subtle bg-black/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-primary">Production Key</span>
                <span className="text-xs px-2 py-1 rounded bg-success-bg text-success border border-success/20">Active</span>
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 rounded-lg bg-black border border-border-subtle text-xs text-muted font-mono truncate">
                  REMOVED_SECRET
                </code>
                <button className="px-3 py-2 rounded-lg border border-border-subtle hover:bg-surface transition-colors text-sm font-medium">
                  Copy
                </button>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-border-subtle bg-black/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-primary">Test Key</span>
                <span className="text-xs px-2 py-1 rounded bg-success-bg text-success border border-success/20">Active</span>
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 rounded-lg bg-black border border-border-subtle text-xs text-muted font-mono truncate">
                  REMOVED_SECRET
                </code>
                <button className="px-3 py-2 rounded-lg border border-border-subtle hover:bg-surface transition-colors text-sm font-medium">
                  Copy
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button className="w-full py-2.5 px-4 border border-border-strong rounded-xl text-sm font-medium hover:bg-surface transition-colors">
                Generate New Key
              </button>
            </div>
          </div>
        </BentoBox>
      </div>
    </div>
  );
}
