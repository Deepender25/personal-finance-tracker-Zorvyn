import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CalendarDays, 
  CreditCard, 
  Repeat, 
  Tags, 
  PieChart, 
  Users, 
  ShieldAlert, 
  Settings,
  LogOut,
  Briefcase
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

export function Sidebar() {
  const { user, logout, viewRole, setViewRole } = useAuth();

  if (!user) return null;

  const navItems = [
    { name: 'Overview', path: '/', icon: LayoutDashboard, roles: ['Admin', 'Analyst', 'Viewer'] },
    { name: 'Analytics', path: '/analytics', icon: PieChart, roles: ['Admin', 'Analyst'] },
    { name: 'Transactions', path: '/transactions', icon: CreditCard, roles: ['Admin', 'Analyst', 'Viewer'] },
    { name: 'Budgets', path: '/budgets', icon: CalendarDays, roles: ['Admin', 'Analyst', 'Viewer'] },
    { name: 'Recurring', path: '/recurring', icon: Repeat, roles: ['Admin', 'Analyst'] },
    { name: 'Categories', path: '/categories', icon: Briefcase, roles: ['Admin'] },
    { name: 'Tags', path: '/tags', icon: Tags, roles: ['Admin', 'Analyst', 'Viewer'] },
    { name: 'Users', path: '/users', icon: Users, roles: ['Admin'] },
    { name: 'Audit Log', path: '/audit', icon: ShieldAlert, roles: ['Admin'] },
    { name: 'Settings', path: '/settings', icon: Settings, roles: ['Admin', 'Analyst', 'Viewer'] },
  ];

  const visibleNavItems = navItems.filter(item => item.roles.includes(viewRole));

  return (
    <aside className="w-64 flex-shrink-0 flex flex-col bg-black border-r border-border-subtle h-screen sticky top-0">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary text-black flex items-center justify-center font-bold text-xl shadow-[0_0_15px_rgba(255,255,255,0.3)]">
          F
        </div>
        <span className="font-semibold text-lg tracking-tight text-glow">FinanceDash</span>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {visibleNavItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-surface-hover text-primary bento-glow-active"
                  : "text-muted hover:bg-surface hover:text-primary"
              )
            }
          >
            <item.icon className="w-5 h-5" />
            {item.name}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-border-subtle">
        {/* Role Switcher for Demo Purposes */}
        {user.role === 'Admin' && (
          <div className="mb-4 px-2">
            <p className="text-xs text-muted mb-2 uppercase tracking-wider">Demo Role Switcher</p>
            <div className="flex bg-surface rounded-lg p-1 border border-border-subtle">
              {(['Admin', 'Analyst', 'Viewer'] as const).map((role) => (
                <button
                  key={role}
                  onClick={() => setViewRole(role)}
                  className={cn(
                    "flex-1 text-[10px] py-1 rounded-md font-medium transition-colors",
                    viewRole === role ? "bg-border-strong text-primary" : "text-muted hover:text-primary"
                  )}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 px-2 py-2 rounded-xl bg-surface border border-border-subtle">
          <div className="w-10 h-10 rounded-lg bg-border-strong flex items-center justify-center font-semibold">
            {user.avatar}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-primary truncate">{user.name}</p>
            <p className="text-xs text-muted truncate">{user.role}</p>
          </div>
          <button 
            onClick={logout}
            className="p-2 text-muted hover:text-danger transition-colors rounded-lg hover:bg-danger-bg"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
