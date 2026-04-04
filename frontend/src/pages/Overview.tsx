import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, ArrowDownRight, Users, Calendar, CreditCard, TrendingUp } from 'lucide-react';
import { BentoBox } from '../components/BentoBox';
import { Badge } from '../components/Badge';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from '../lib/utils';
import { fetchApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export function Overview() {
  const [summary, setSummary] = useState({ netBalance: 0, totalIncome: 0, totalExpenses: 0, savingsRate: 0 });
  const [chartData, setChartData] = useState<any[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { viewRole } = useAuth();
  const canManage = viewRole === 'Admin' || viewRole === 'Analyst';
  const chartSpan = canManage ? 3 : 4;

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [sumRes, trendRes, recentRes] = await Promise.allSettled([
          fetchApi('/dashboard/summary').catch(() => null),
          fetchApi('/dashboard/monthly-trend').catch(() => null),
          fetchApi('/dashboard/recent').catch(() => null)
        ]);

        if (sumRes.status === 'fulfilled' && sumRes.value?.data) {
          setSummary(sumRes.value.data);
        }
        if (trendRes.status === 'fulfilled' && trendRes.value?.data) {
          setChartData(trendRes.value.data);
        }
        if (recentRes.status === 'fulfilled' && recentRes.value?.data) {
          setRecentTransactions(recentRes.value.data);
        }
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  };

  if (loading) {
    return <div className="p-8 text-center text-muted">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-primary tracking-tight">Overview</h1>
        <p className="text-muted mt-1">Welcome back, here's what's happening today.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <BentoBox span={1}>
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-surface-hover rounded-lg border border-border-subtle">
              <CreditCard className="w-5 h-5 text-primary" />
            </div>
          </div>
          <p className="text-muted text-sm font-medium">Net Balance</p>
          <h3 className="text-2xl font-bold text-primary mt-1">{formatCurrency(summary.netBalance)}</h3>
        </BentoBox>

        <BentoBox span={1}>
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-surface-hover rounded-lg border border-border-subtle">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
          </div>
          <p className="text-muted text-sm font-medium">Total Income</p>
          <h3 className="text-2xl font-bold text-primary mt-1">{formatCurrency(summary.totalIncome)}</h3>
        </BentoBox>

        <BentoBox span={1}>
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-surface-hover rounded-lg border border-border-subtle">
              <Users className="w-5 h-5 text-primary" />
            </div>
          </div>
          <p className="text-muted text-sm font-medium">Total Expenses</p>
          <h3 className="text-2xl font-bold text-primary mt-1">{formatCurrency(summary.totalExpenses)}</h3>
        </BentoBox>

        <BentoBox span={1}>
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-surface-hover rounded-lg border border-border-subtle">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
          </div>
          <p className="text-muted text-sm font-medium">Savings Rate</p>
          <h3 className="text-2xl font-bold text-primary mt-1">{summary.savingsRate}%</h3>
        </BentoBox>

        <BentoBox span={chartSpan} className="h-[400px]">
          <h3 className="text-lg font-semibold text-primary mb-6">Cash Flow Overview</h3>
          <div className="w-full h-[300px]">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ffffff" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ffffff" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                  <XAxis dataKey="name" stroke="#a3a3a3" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#a3a3a3" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#262626', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Area type="monotone" dataKey="value" stroke="#ffffff" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-muted border border-border-subtle/30 rounded-xl bg-black/20">
                <p>No cash flow data available yet.</p>
              </div>
            )}
          </div>
        </BentoBox>

        {canManage && (
          <BentoBox span={1} className="flex flex-col">
            <h3 className="text-lg font-semibold text-primary mb-4">Quick Actions</h3>
            <div className="space-y-3 flex-1">
              <button onClick={() => navigate('/transactions', { state: { openModal: true } })}
                className="w-full text-left px-4 py-3 rounded-xl bg-surface-hover border border-border-subtle hover:border-border-strong transition-colors flex items-center justify-between group">
                <span className="text-sm font-medium">Add Transaction</span>
                <ArrowUpRight className="w-4 h-4 text-muted group-hover:text-primary transition-colors" />
              </button>
              <button onClick={() => navigate('/analytics')}
                className="w-full text-left px-4 py-3 rounded-xl bg-surface-hover border border-border-subtle hover:border-border-strong transition-colors flex items-center justify-between group">
                <span className="text-sm font-medium">Generate Report</span>
                <ArrowUpRight className="w-4 h-4 text-muted group-hover:text-primary transition-colors" />
              </button>
              {viewRole === 'Admin' && (
                <button onClick={() => navigate('/users')}
                  className="w-full text-left px-4 py-3 rounded-xl bg-surface-hover border border-border-subtle hover:border-border-strong transition-colors flex items-center justify-between group">
                  <span className="text-sm font-medium">Manage Users</span>
                  <ArrowUpRight className="w-4 h-4 text-muted group-hover:text-primary transition-colors" />
                </button>
              )}
            </div>
          </BentoBox>
        )}

        <BentoBox span={4}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-primary">Recent Transactions</h3>
            <button className="text-sm text-muted hover:text-primary transition-colors">View All</button>
          </div>
          <div className="table-wrap overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-subtle text-muted text-sm">
                  <th className="pb-3 font-medium">Transaction ID</th>
                  <th className="pb-3 font-medium">Description</th>
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Amount</th>
                  <th className="pb-3 font-medium text-right">Type</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {recentTransactions.map((transaction, index) => (
                  <tr key={transaction.id} className={cn(
                    "border-b border-border-subtle/50 hover:bg-[#111111] transition-colors group",
                    index % 2 === 0 ? "bg-[#0a0a0a]" : "bg-[#000000]"
                  )}>
                    <td className="py-4 font-medium text-primary">{transaction.id}</td>
                    <td className="py-4">{transaction.description}</td>
                    <td className="py-4 text-muted">{transaction.date}</td>
                    <td className="py-4">{formatCurrency(transaction.amount)}</td>
                    <td className="py-4 text-right">
                      <Badge 
                        variant={
                          transaction.type === 'Income' ? 'success' : 'danger'
                        }
                      >
                        {transaction.type}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </BentoBox>
      </div>
    </div>
  );
}
