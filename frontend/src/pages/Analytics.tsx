import React, { useEffect, useState } from 'react';
import { 
  BarChart, Bar, Line, ComposedChart, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { Download, Calendar as CalendarIcon, TrendingUp, Activity, BarChart2, Target } from 'lucide-react';
import { BentoBox } from '../components/BentoBox';
import { Badge } from '../components/Badge';
import { fetchApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const COLORS = ['#ffffff', '#a3a3a3', '#525252', '#262626', '#1a1a1a'];

export function Analytics() {
  const { viewRole } = useAuth();
  const canViewAnalytics = viewRole === 'Admin' || viewRole === 'Analyst';
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ netBalance: 0, totalIncome: 0, totalExpenses: 0, savingsRate: 0, transaction_count: 0 });
  const [yoyData, setYoyData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [heatmapData, setHeatmapData] = useState<number[][]>([]);
  
  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      const [sumRes, yoyRes, catRes, heatRes] = await Promise.allSettled([
        fetchApi('/dashboard/summary').catch(() => null),
        fetchApi('/analytics/yoy-comparison').catch(() => null),
        fetchApi('/analytics/top-categories?limit=5').catch(() => null),
        fetchApi('/analytics/heatmap').catch(() => null)
      ]);

      if (sumRes.status === 'fulfilled' && sumRes.value?.data) {
        setSummary(sumRes.value.data);
      }

      if (yoyRes.status === 'fulfilled' && yoyRes.value?.data) {
        const { year, prev_year, data } = yoyRes.value.data;
        const formattedYoy = data.map((d: any) => ({
          month: d.month.trim(),
          thisYear: d[`income_${year}`] - d[`expense_${year}`],
          lastYear: d[`income_${prev_year}`] - d[`expense_${prev_year}`],
        }));
        setYoyData(formattedYoy);
      }

      if (catRes.status === 'fulfilled' && catRes.value?.data) {
        setCategoryData(catRes.value.data);
      }

      if (heatRes.status === 'fulfilled' && heatRes.value?.data) {
        // Initialize 7 rows containing 16 columns each
        const grid = Array.from({ length: 7 }, () => new Array(16).fill(0));
        const todayObj = new Date();
        todayObj.setHours(0,0,0,0);
        const currentDayOfWeek = (todayObj.getDay() + 6) % 7;
        
        const mostRecentMonday = new Date(todayObj);
        mostRecentMonday.setDate(todayObj.getDate() - currentDayOfWeek);
        
        const startOfGrid = new Date(mostRecentMonday);
        startOfGrid.setDate(mostRecentMonday.getDate() - (15 * 7));

        heatRes.value.data.forEach((item: any) => {
          const dt = new Date(item.day);
          dt.setHours(0,0,0,0);
          if (dt >= startOfGrid) {
            const diffTime = dt.getTime() - startOfGrid.getTime();
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            const col = Math.floor(diffDays / 7);
            const row = diffDays % 7;
            if (col >= 0 && col < 16 && row >= 0 && row < 7) {
              grid[row][col] += item.total;
            }
          }
        });
        setHeatmapData(grid);
      }

    } catch (error) {
      console.error("Failed to load analytics data", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  };

  const avgTransaction = summary.transaction_count > 0 
    ? (summary.totalIncome + summary.totalExpenses) / summary.transaction_count 
    : 0;

  const totalPieValue = categoryData.reduce((acc, curr) => acc + curr.total, 0);

  if (loading) {
    return <div className="p-8 text-center text-muted">Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary tracking-tight">Analytics</h1>
          <p className="text-muted mt-1">Advanced data insights and performance metrics.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-border-subtle rounded-xl text-sm font-medium hover:bg-surface transition-colors">
            <CalendarIcon className="w-4 h-4" />
            Last 9 Months
          </button>
          <button className="flex items-center gap-2 py-2 px-4 bg-white text-black rounded-xl font-medium hover:bg-gray-200 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.2)]">
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Top Stats */}
        <BentoBox span={1}>
          <div className="flex items-center gap-3 mb-2">
            <BarChart2 className="w-5 h-5 text-muted" />
            <h3 className="text-sm font-medium text-muted">Avg Transaction Size</h3>
          </div>
          <div className="flex items-end justify-between">
            <h2 className="text-2xl font-bold text-primary">{formatCurrency(avgTransaction)}</h2>
            <Badge variant="success">Active</Badge>
          </div>
        </BentoBox>
        
        <BentoBox span={1}>
          <div className="flex items-center gap-3 mb-2">
            <Target className="w-5 h-5 text-muted" />
            <h3 className="text-sm font-medium text-muted">Savings Rate</h3>
          </div>
          <div className="flex items-end justify-between">
            <h2 className="text-2xl font-bold text-primary">{summary.savingsRate}%</h2>
            <Badge variant="success">YTD</Badge>
          </div>
        </BentoBox>

        <BentoBox span={1}>
          <div className="flex items-center gap-3 mb-2">
            <Activity className="w-5 h-5 text-muted" />
            <h3 className="text-sm font-medium text-muted">Total Entries</h3>
          </div>
          <div className="flex items-end justify-between">
            <h2 className="text-2xl font-bold text-primary">{summary.transaction_count}</h2>
            <Badge variant="warning">YTD</Badge>
          </div>
        </BentoBox>

        <BentoBox span={1}>
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-muted" />
            <h3 className="text-sm font-medium text-muted">Net Balance</h3>
          </div>
          <div className="flex items-end justify-between">
            <h2 className="text-2xl font-bold text-primary">{formatCurrency(summary.netBalance)}</h2>
            <Badge variant={summary.netBalance >= 0 ? 'success' : 'danger'}>
              {summary.netBalance >= 0 ? '+' : '-'}
            </Badge>
          </div>
        </BentoBox>

        {/* YoY Comparison Chart */}
        <BentoBox span={3} className="h-[400px]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-primary">Year over Year Net Growth</h3>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-white"></div>
                <span className="text-muted">This Year</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#404040]"></div>
                <span className="text-muted">Last Year</span>
              </div>
            </div>
          </div>
          <div className="w-full h-[300px]">
            {canViewAnalytics && yoyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={yoyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                  <XAxis dataKey="month" stroke="#a3a3a3" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#a3a3a3" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#262626', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                    cursor={{ fill: '#1a1a1a' }}
                  />
                  <Bar dataKey="lastYear" fill="#404040" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Line type="monotone" dataKey="thisYear" stroke="#ffffff" strokeWidth={3} dot={{ r: 4, fill: '#000', stroke: '#fff', strokeWidth: 2 }} />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-muted border border-border-subtle/30 rounded-xl bg-black/20">
                <p>{canViewAnalytics ? 'No YoY data available yet.' : 'Requires Analyst privileges to view.'}</p>
              </div>
            )}
          </div>
        </BentoBox>

        {/* Category Distribution */}
        <BentoBox span={1} className="min-h-[400px] flex flex-col pt-6 px-6 pb-6 lg:p-6 overflow-visible">
          <h3 className="text-lg font-semibold text-primary mb-6">Expenses by Category</h3>
          <div className="flex-1 w-full relative min-h-[220px]">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={85}
                    paddingAngle={5}
                    dataKey="total"
                    nameKey="category"
                    stroke="none"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#262626', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                    formatter={(val: number) => `₹${val.toFixed(0)}`}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-muted text-sm">No expenses found</div>
            )}

            {/* Center text overlay */}
            {categoryData.length > 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold text-primary">{Math.max(1, Math.round(totalPieValue / 1000))}k</span>
                <span className="text-xs text-muted">Total</span>
              </div>
            )}
          </div>
          <div className="mt-4 space-y-2">
            {categoryData.slice(0, 4).map((entry, index) => (
              <div key={entry.category} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                  <span className="text-muted truncate max-w-[100px]">{entry.category}</span>
                </div>
                <span className="font-medium text-primary">{formatCurrency(entry.total)}</span>
              </div>
            ))}
          </div>
        </BentoBox>

        {/* Activity Heatmap */}
        <BentoBox span={2}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-primary">Expense Activity Heatmap</h3>
            <span className="text-sm text-muted">Last 16 Weeks</span>
          </div>
          <div className="flex gap-2">
            <div className="flex flex-col justify-between text-xs text-muted py-1 pr-2">
              <span>Mon</span>
              <span>Wed</span>
              <span>Fri</span>
              <span>Sun</span>
            </div>
            <div className="flex-1 grid grid-rows-7 gap-1.5">
              {heatmapData.map((week, rowIndex) => (
                <div key={rowIndex} className="grid grid-cols-16 gap-1.5" style={{ gridTemplateColumns: 'repeat(16, minmax(0, 1fr))' }}>
                  {week.map((val, colIndex) => {
                    let opacity = 0.05;
                    if (val > 0) opacity = 0.2;
                    if (val > 100) opacity = 0.5;
                    if (val > 500) opacity = 1;
                    
                    return (
                      <div 
                        key={colIndex} 
                        className="w-full aspect-square rounded-sm bg-white transition-opacity hover:ring-1 hover:ring-white cursor-pointer"
                        style={{ opacity }}
                        title={`Expense: ${formatCurrency(val)}`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 flex items-center justify-end gap-2 text-xs text-muted">
            <span>Less</span>
            <div className="flex gap-1">
              <div className="w-3 h-3 rounded-sm bg-white" style={{ opacity: 0.05 }}></div>
              <div className="w-3 h-3 rounded-sm bg-white" style={{ opacity: 0.2 }}></div>
              <div className="w-3 h-3 rounded-sm bg-white" style={{ opacity: 0.5 }}></div>
              <div className="w-3 h-3 rounded-sm bg-white" style={{ opacity: 1 }}></div>
            </div>
            <span>More</span>
          </div>
        </BentoBox>

        {/* Top Performing Services */}
        <BentoBox span={2}>
          <h3 className="text-lg font-semibold text-primary mb-6">Top Expense Categories</h3>
          <div className="space-y-5">
            {categoryData.length === 0 ? (
              <div className="text-muted text-sm pb-4">No top expenses to show.</div>
            ) : (
              categoryData.map((category) => (
                <div key={category.category}>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="font-medium text-primary">{category.category}</span>
                    <span className="text-muted">{formatCurrency(category.total)}</span>
                  </div>
                  <div className="w-full h-2 bg-black rounded-full overflow-hidden border border-border-subtle">
                    <div 
                      className="h-full bg-white rounded-full relative"
                      style={{ width: `${Math.max(2, category.percentage)}%` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/50"></div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </BentoBox>
      </div>
    </div>
  );
}
