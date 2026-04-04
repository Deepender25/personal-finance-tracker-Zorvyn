import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';
import { BentoBox } from '../components/BentoBox';
import { fetchApi } from '../lib/api';

export function Register() {
  const [step, setStep] = useState<'register' | 'verify'>('register');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await fetchApi('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password })
      });
      setSuccessMsg('Registration successful! Please check your email for the OTP.');
      setStep('verify');
    } catch (err: any) {
      setError(err.message || 'Failed to register');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await fetchApi('/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({ email, otp })
      });
      navigate('/login');
    } catch (err: any) {
      setError(err.message || 'Failed to verify email');
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
          <h1 className="text-2xl font-bold text-primary text-glow">
            {step === 'register' ? 'Create Account' : 'Verify Email'}
          </h1>
          <p className="text-muted mt-2 text-sm">
            {step === 'register' ? 'Join FinanceDash today' : 'Enter the OTP sent to your email'}
          </p>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
            <AlertCircle className="w-4 h-4" />
            <p>{error}</p>
          </div>
        )}

        {successMsg && step === 'verify' && (
          <div className="mb-4 flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-500 text-sm">
            <CheckCircle className="w-4 h-4" />
            <p>{successMsg}</p>
          </div>
        )}

        {step === 'register' ? (
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-muted" />
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 border border-border-subtle rounded-xl bg-black/50 text-primary placeholder-muted focus:outline-none focus:border-border-strong focus:ring-1 focus:ring-border-strong transition-colors shadow-inner"
                placeholder="Full Name"
                required
              />
            </div>

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

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-transparent rounded-xl text-sm font-medium text-black bg-gradient-to-b from-white to-gray-300 hover:from-white hover:to-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-white transition-all shadow-[0_0_15px_rgba(255,255,255,0.2)] hover:shadow-[0_0_25px_rgba(255,255,255,0.3)] disabled:opacity-50"
            >
              {loading ? 'Creating Account...' : 'Continue'}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
            <div className="mt-6 text-center text-sm text-muted">
              Already have an account? <Link to="/login" className="text-primary hover:underline">Sign In</Link>
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-muted" />
              </div>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 border border-border-subtle rounded-xl bg-black/50 text-primary placeholder-muted focus:outline-none focus:border-border-strong focus:ring-1 focus:ring-border-strong transition-colors shadow-inner text-center tracking-widest font-mono text-lg"
                placeholder="Enter 6-digit OTP"
                maxLength={6}
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-transparent rounded-xl text-sm font-medium text-black bg-gradient-to-b from-white to-gray-300 hover:from-white hover:to-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-white transition-all shadow-[0_0_15px_rgba(255,255,255,0.2)] hover:shadow-[0_0_25px_rgba(255,255,255,0.3)] disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify Email'}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
        )}
      </BentoBox>
    </div>
  );
}
