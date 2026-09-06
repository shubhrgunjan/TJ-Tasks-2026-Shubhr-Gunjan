import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser, signInWithGoogle } from '../services/auth';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { TestModeModal } from '../components/ui/TestModeModal';
import { Zap } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [testModalOpen, setTestModalOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (user) {
      navigate('/app/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName || !email || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await registerUser(email, password, displayName);
      navigate('/app/dashboard');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered.');
      } else {
        setError(err.message || 'Failed to register.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithGoogle();
      navigate('/app/dashboard');
    } catch (err: any) {
      console.error(err);
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message || 'Google sign up failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas-bg flex flex-col justify-center items-center p-4 select-none">
      {/* Brand logo */}
      <Link to="/" className="mb-6 flex items-center gap-3 hover:opacity-85 transition-opacity">
        <span className="text-primary-red font-black text-3xl select-none">●</span>
        <span className="text-primary-yellow font-black text-3xl select-none">■</span>
        <span className="text-primary-blue font-black text-3xl select-none">▲</span>
        <span className="font-bold text-3xl tracking-tighter text-canvas-fg">TJFLOW</span>
      </Link>

      {/* Reviewer Test Mode Callout Banner */}
      <div 
        onClick={() => setTestModalOpen(true)}
        className="w-full max-w-md mb-6 p-4 bg-primary-yellow border-4 border-border shadow-md cursor-pointer hover:-translate-y-0.5 transition-all flex items-center justify-between group"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary-red text-white border-2 border-border flex items-center justify-center flex-shrink-0 font-bold">
            <Zap className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="font-black text-xs uppercase tracking-widest text-canvas-fg flex items-center gap-1.5">
              <span>Task Reviewer Test Mode</span>
              <span className="bg-primary-red text-white text-[9px] px-1.5 py-0.2">POPULATED</span>
            </div>
            <div className="text-xs font-semibold text-canvas-fg/90">
              1-Click instant access with 4 dummy accounts & live data
            </div>
          </div>
        </div>
        <span className="font-black text-xs text-canvas-fg group-hover:translate-x-1 transition-transform">
          Open →
        </span>
      </div>

      <Card className="w-full max-w-md bg-card-bg border-2 border-border p-8 relative overflow-hidden text-canvas-fg animate-fade-in" shadow="lg">
        {/* Decorative background shape */}
        <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-primary-yellow/20 rotate-45 pointer-events-none" />
        
        <h2 className="text-3xl font-bold tracking-tight mb-2 text-canvas-fg">Start building</h2>
        <p className="text-sm text-text-secondary font-medium mb-6">Create your TJFlow account</p>

        {error && (
          <div className="bg-primary-red/10 border-2 border-primary-red text-primary-red p-3 font-bold text-sm mb-6">
            {error}
          </div>
        )}

        {/* Google Sign Up Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full mb-6 flex items-center justify-center gap-3 py-3 px-4 bg-card-bg text-canvas-fg font-bold text-sm border-2 border-border hover:bg-surface-hover hover:-translate-y-[1px] active:translate-y-0 transition-all shadow-sm cursor-pointer disabled:opacity-60"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        <div className="relative flex items-center justify-center mb-6">
          <div className="border-t-2 border-border w-full" />
          <span className="bg-card-bg px-3 text-[11px] font-bold text-text-secondary uppercase tracking-wider absolute">
            OR
          </span>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-canvas-fg">Full name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full text-sm font-medium bg-canvas-bg border-2 border-border text-canvas-fg p-2"
              placeholder="Sarah Chen"
              required
              disabled={loading}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-canvas-fg">Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full text-sm font-medium bg-canvas-bg border-2 border-border text-canvas-fg p-2"
              placeholder="name@company.com"
              required
              disabled={loading}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-canvas-fg">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full text-sm font-medium bg-canvas-bg border-2 border-border text-canvas-fg p-2"
              placeholder="At least 6 characters"
              required
              disabled={loading}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-canvas-fg">Confirm password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full text-sm font-medium bg-canvas-bg border-2 border-border text-canvas-fg p-2"
              placeholder="Confirm password"
              required
              disabled={loading}
            />
          </div>

          <Button type="submit" variant="secondary" className="w-full mt-2 py-3" disabled={loading}>
            {loading ? 'Registering...' : 'Create account'}
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t-2 border-border flex justify-between items-center text-xs">
          <span className="text-text-secondary font-medium">Already have an account?</span>
          <Link to="/login" className="text-primary-blue font-bold hover:underline">
            Sign in
          </Link>
        </div>
      </Card>

      {/* Reviewer Test Mode Modal */}
      <TestModeModal 
        isOpen={testModalOpen} 
        onClose={() => setTestModalOpen(false)} 
      />
    </div>
  );
};
