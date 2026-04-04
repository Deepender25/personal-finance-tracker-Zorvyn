import React from 'react';
import { 
  BarChart, Bar, Line, ComposedChart, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { Download, Calendar as CalendarIcon, TrendingUp, Activity, DollarSign, Target } from 'lucide-react';
import { BentoBox } from '../components/BentoBox';
import { Badge } from '../components/Badge';

// Mock Data
const yoyData = [
  { month: 'Jan', thisYear: 4000, lastYear: 2400 },
  { month: 'Feb', thisYear: 3000, lastYear: 1398 },
  { month: 'Mar', thisYear: 5000, lastYear: 4800 },
  { month: 'Apr', thisYear: 4500, lastYear: 3908 },
  { month: 'May', thisYear: 6000, lastYear: 4800 },
  { month: 'Jun', thisYear: 5500, lastYear: 3800 },
  { month: 'Jul', thisYear: 7000, lastYear: 4300 },
  { month: 'Aug', thisYear: 6500, lastYear: 5300 },
  { month: 'Sep', thisYear: 8000, lastYear: 6300 },
];

const categoryData = [
  { name: 'Consulting', value: 400 },
  { name: 'Development', value: 300 },
  { name: 'Design', value: 300 },
  { name: 'Support', value: 200 },
];
const COLORS = ['#ffffff', '#a3a3a3', '#525252', '#262626'];

// Heatmap Data (mocking 7 days x 16 weeks)
const heatmapData = Array.from({ length: 7 }).map(() => 
  Array.from({ length: 16 }).map(() => Math.floor(Math.random() * 100))
);

export function Analytics() {
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
            <DollarSign className="w-5 h-5 text-muted" />
            <h3 className="text-sm font-medium text-muted">Avg Transaction</h3>
          </div>
          <div className="flex items-end justify-between">
            <h2 className="text-2xl font-bold text-primary">$1,245</h2>
            <Badge variant="success">+12%</Badge>
          </div>
        </BentoBox>
        
        <BentoBox span={1}>
          <div className="flex items-center gap-3 mb-2">
            <Target className="w-5 h-5 text-muted" />
            <h3 className="text-sm font-medium text-muted">Savings Rate</h3>
          </div>
          <div className="flex items-end justify-between">
            <h2 className="text-2xl font-bold text-primary">24.8%</h2>
            <Badge variant="success">+2.4%</Badge>
          </div>
        </BentoBox>

        <BentoBox span={1}>
          <div className="flex items-center gap-3 mb-2">
            <Activity className="w-5 h-5 text-muted" />
            <h3 className="text-sm font-medium text-muted">Total Entries</h3>
          </div>
          <div className="flex items-end justify-between">
            <h2 className="text-2xl font-bold text-primary">842</h2>
            <Badge variant="warning">-4%</Badge>
          </div>
        </BentoBox>

        <BentoBox span={1}>
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-muted" />
            <h3 className="text-sm font-medium text-muted">Net Growth</h3>
          </div>
          <div className="flex items-end justify-between">
            <h2 className="text-2xl font-bold text-primary">$12.4k</h2>
            <Badge variant="success">+18%</Badge>
          </div>
        </BentoBox>

        {/* YoY Comparison Chart */}
        <BentoBox span={3} className="h-[400px]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-primary">Year over Year Comparison</h3>
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
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={yoyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                <XAxis dataKey="month" stroke="#a3a3a3" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#a3a3a3" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#262626', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                  cursor={{ fill: '#1a1a1a' }}
                />
                <Bar dataKey="lastYear" fill="#404040" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Line type="monotone" dataKey="thisYear" stroke="#ffffff" strokeWidth={3} dot={{ r: 4, fill: '#000', stroke: '#fff', strokeWidth: 2 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </BentoBox>

        {/* Category Distribution */}
        <BentoBox span={1} className="h-[400px] flex flex-col">
          <h3 className="text-lg font-semibold text-primary mb-2">Expenses by Category</h3>
          <div className="flex-1 w-full relative min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#262626', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-primary">1.2k</span>
              <span className="text-xs text-muted">Total</span>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {categoryData.map((entry, index) => (
              <div key={entry.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                  <span className="text-muted">{entry.name}</span>
                </div>
                <span className="font-medium text-primary">{entry.value}</span>
              </div>
            ))}
          </div>
        </BentoBox>

        {/* Activity Heatmap */}
        <BentoBox span={2}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-primary">Activity Heatmap</h3>
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
                    if (val > 20) opacity = 0.2;
                    if (val > 50) opacity = 0.5;
                    if (val > 80) opacity = 1;
                    
                    return (
                      <div 
                        key={colIndex} 
                        className="w-full aspect-square rounded-sm bg-white transition-opacity hover:ring-1 hover:ring-white cursor-pointer"
                        style={{ opacity }}
                        title={`Activity: ${val}`}
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
            {[
              { name: 'Server Infrastructure', revenue: '$45,200', progress: 85 },
              { name: 'Software Licenses', revenue: '$32,100', progress: 65 },
              { name: 'Office Supplies', revenue: '$28,500', progress: 55 },
              { name: 'Marketing & Ads', revenue: '$15,400', progress: 30 },
            ].map((service) => (
              <div key={service.name}>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="font-medium text-primary">{service.name}</span>
                  <span className="text-muted">{service.revenue}</span>
                </div>
                <div className="w-full h-2 bg-black rounded-full overflow-hidden border border-border-subtle">
                  <div 
                    className="h-full bg-white rounded-full relative"
                    style={{ width: `${service.progress}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/50"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </BentoBox>
      </div>
    </div>
  );
}
