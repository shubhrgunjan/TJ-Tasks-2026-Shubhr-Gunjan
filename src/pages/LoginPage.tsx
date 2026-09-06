import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser, signInWithGoogle } from '../services/auth';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (user) {
      navigate('/app/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await loginUser(email, password);
      navigate('/app/dashboard');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Invalid email or password.');
      } else {
        setError(err.message || 'Failed to log in.');
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
        setError(err.message || 'Google sign in failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas-bg flex flex-col justify-center items-center p-4">
      {/* Brand logo */}
      <Link to="/" className="mb-8 flex items-center gap-3 hover:opacity-85 transition-opacity">
        <span className="text-primary-red font-black text-3xl select-none">●</span>
        <span className="text-primary-yellow font-black text-3xl select-none">■</span>
        <span className="text-primary-blue font-black text-3xl select-none">▲</span>
        <span className="font-bold text-3xl tracking-tighter text-canvas-fg">TJFLOW</span>
      </Link>

      <Card className="w-full max-w-md bg-card-bg border-2 border-border p-8 relative overflow-hidden animate-fade-in text-canvas-fg" shadow="lg">
        {/* Decorative background shape */}
        <div className="absolute -top-12 -right-12 w-24 h-24 bg-primary-blue/10 rounded-full pointer-events-none" />
        
        <h2 className="text-3xl font-bold tracking-tight mb-2 text-canvas-fg">Welcome back</h2>
        <p className="text-sm text-text-secondary font-medium mb-6">Log in to your workspace</p>

        {error && (
          <div className="bg-primary-red/10 border-2 border-primary-red text-primary-red p-3 font-bold text-sm mb-6">
            {error}
          </div>
        )}

        {/* Google Authentication Button */}
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

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
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
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-canvas-fg">Password</label>
              <Link to="/forgot-password" className="text-xs font-bold text-primary-blue hover:underline">
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full text-sm font-medium bg-canvas-bg border-2 border-border text-canvas-fg p-2"
              placeholder="••••••••"
              required
              disabled={loading}
            />
          </div>

          <Button type="submit" variant="primary" className="w-full mt-2 py-3" disabled={loading}>
            {loading ? 'Authenticating...' : 'Sign in'}
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t-2 border-border flex justify-between items-center text-xs">
          <span className="text-text-secondary font-medium">New to TJFlow?</span>
          <Link to="/register" className="text-primary-red font-bold hover:underline">
            Create account
          </Link>
        </div>
      </Card>
    </div>
  );
};
