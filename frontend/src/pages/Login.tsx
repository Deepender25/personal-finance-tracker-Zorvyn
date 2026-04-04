import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { BentoBox } from '../components/BentoBox';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Radial Gradient Background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05)_0%,transparent_70%)] pointer-events-none" />
      
      <BentoBox className="w-full max-w-[440px] p-8 z-10">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary text-black flex items-center justify-center font-bold text-2xl shadow-[0_0_20px_rgba(255,255,255,0.4)] mx-auto mb-4">
            F
          </div>
          <h1 className="text-2xl font-bold text-primary text-glow">Welcome Back</h1>
          <p className="text-muted mt-2 text-sm">Sign in to FinanceDash</p>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
            <AlertCircle className="w-4 h-4" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-muted" />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full pl-10 pr-3 py-2.5 border border-border-subtle rounded-xl bg-black/50 text-primary placeholder-muted focus:outline-none focus:border-border-strong focus:ring-1 focus:ring-border-strong transition-colors shadow-inner"
              placeholder="Email address"
              required
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-muted" />
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full pl-10 pr-3 py-2.5 border border-border-subtle rounded-xl bg-black/50 text-primary placeholder-muted focus:outline-none focus:border-border-strong focus:ring-1 focus:ring-border-strong transition-colors shadow-inner"
              placeholder="Password"
              required
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="rounded border-border-subtle bg-black/50 text-primary focus:ring-0 focus:ring-offset-0" />
              <span className="text-muted">Remember me</span>
            </label>
            <a href="#" className="text-primary hover:underline">Forgot password?</a>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-transparent rounded-xl text-sm font-medium text-black bg-gradient-to-b from-white to-gray-300 hover:from-white hover:to-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-white transition-all shadow-[0_0_15px_rgba(255,255,255,0.2)] hover:shadow-[0_0_25px_rgba(255,255,255,0.3)] disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-muted">
          Don't have an account? <Link to="/register" className="text-primary hover:underline">Create Account</Link>
        </div>
      </BentoBox>
    </div>
  );
}
