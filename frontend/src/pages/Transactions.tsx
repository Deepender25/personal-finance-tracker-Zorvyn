import React, { useState } from 'react';
import { Search, Filter, Plus, MoreHorizontal } from 'lucide-react';
import { BentoBox } from '../components/BentoBox';
import { Badge } from '../components/Badge';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

const allTransactions = Array.from({ length: 15 }).map((_, i) => ({
  id: `TXN-${1050 - i}`,
  description: ['Office Supplies', 'Consulting Fee', 'Software License', 'Server Costs', 'Client Retainer'][i % 5],
  date: `Oct ${28 - (i % 10)}, 2023`,
  amount: `$${(Math.random() * 5000 + 500).toFixed(2)}`,
  type: ['Expense', 'Income', 'Expense', 'Expense', 'Income'][i % 5],
  category: ['Operations', 'Services', 'IT', 'Infrastructure', 'Services'][i % 5]
}));

export function Transactions() {
  const { viewRole } = useAuth();
  const canManage = viewRole === 'Admin';

  return (
    <div className="space-y-6">
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary tracking-tight">Transactions</h1>
          <p className="text-muted mt-1">Manage and view all your financial records.</p>
        </div>
        {canManage && (
          <button className="flex items-center gap-2 py-2 px-4 bg-white text-black rounded-xl font-medium hover:bg-gray-200 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.2)]">
            <Plus className="w-4 h-4" />
            New Transaction
          </button>
        )}
      </header>

      <BentoBox span={4} className="p-0 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-border-subtle flex flex-col sm:flex-row gap-4 items-center justify-between bg-surface/50">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input 
              type="text" 
              placeholder="Search transactions..." 
              className="w-full pl-9 pr-4 py-2 bg-black/50 border border-border-subtle rounded-lg text-sm focus:outline-none focus:border-border-strong focus:ring-1 focus:ring-border-strong transition-colors"
            />
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button className="flex items-center gap-2 px-3 py-2 border border-border-subtle rounded-lg text-sm font-medium hover:bg-surface transition-colors w-full sm:w-auto justify-center">
              <Filter className="w-4 h-4" />
              Filter
            </button>
            <select className="px-3 py-2 border border-border-subtle rounded-lg text-sm font-medium bg-black focus:outline-none focus:border-border-strong w-full sm:w-auto">
              <option>All Types</option>
              <option>Income</option>
              <option>Expense</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="table-wrap overflow-x-auto">
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
              {allTransactions.map((transaction, index) => (
                <tr key={transaction.id} className={cn(
                  "border-b border-border-subtle/50 hover:bg-[#111111] transition-colors",
                  index % 2 === 0 ? "bg-[#0a0a0a]" : "bg-[#000000]"
                )}>
                  <td className="px-6 py-4 font-medium text-primary">{transaction.id}</td>
                  <td className="px-6 py-4">{transaction.description}</td>
                  <td className="px-6 py-4 text-muted">{transaction.category}</td>
                  <td className="px-6 py-4 text-muted">{transaction.date}</td>
                  <td className="px-6 py-4">{transaction.amount}</td>
                  <td className="px-6 py-4">
                    <Badge 
                      variant={
                        transaction.type === 'Income' ? 'success' : 'danger'
                      }
                    >
                      {transaction.type}
                    </Badge>
                  </td>
                  {canManage && (
                    <td className="px-6 py-4 text-right">
                      <button className="p-1 text-muted hover:text-primary transition-colors rounded">
                        <MoreHorizontal className="w-5 h-5" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="p-4 border-t border-border-subtle flex items-center justify-between text-sm text-muted bg-surface/50">
          <span>Showing 1 to 15 of 45 results</span>
          <div className="flex gap-1">
            <button className="px-3 py-1 border border-border-subtle rounded hover:bg-surface transition-colors disabled:opacity-50" disabled>Prev</button>
            <button className="px-3 py-1 border border-border-subtle rounded bg-surface text-primary">1</button>
            <button className="px-3 py-1 border border-border-subtle rounded hover:bg-surface transition-colors">2</button>
            <button className="px-3 py-1 border border-border-subtle rounded hover:bg-surface transition-colors">3</button>
            <button className="px-3 py-1 border border-border-subtle rounded hover:bg-surface transition-colors">Next</button>
          </div>
        </div>
      </BentoBox>
    </div>
  );
}
