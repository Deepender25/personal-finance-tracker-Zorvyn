/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Overview } from './pages/Overview';
import { Analytics } from './pages/Analytics';
import { Transactions } from './pages/Transactions';
import { Settings } from './pages/Settings';
import { Placeholder } from './pages/Placeholder';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<Overview />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="transactions" element={<Transactions />} />
            <Route path="budgets" element={<Placeholder title="Budgets" description="Manage your financial budgets." />} />
            <Route path="recurring" element={<Placeholder title="Recurring" description="Manage recurring transactions." />} />
            <Route path="categories" element={<Placeholder title="Categories" description="Configure transaction categories." />} />
            <Route path="tags" element={<Placeholder title="Tags" description="Manage system tags." />} />
            <Route path="users" element={<Placeholder title="Users" description="System user management and RBAC." />} />
            <Route path="audit" element={<Placeholder title="Audit Log" description="System security and activity logs." />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
