import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { resetPassword } from '../services/auth';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      await resetPassword(email);
      setSuccess('Reset link sent! Please check your inbox.');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to send reset email.');
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

      <Card className="w-full max-w-md bg-card-bg border-2 border-border p-8 relative overflow-hidden text-canvas-fg" shadow="lg">
        {/* Decorative background shape */}
        <div className="absolute -top-12 -left-12 w-24 h-24 bg-primary-red/10 rounded-full pointer-events-none" />
        
        <h2 className="text-3xl font-bold tracking-tight mb-2 text-canvas-fg">Reset password</h2>
        <p className="text-sm text-text-secondary font-medium mb-6">Enter email for reset link</p>

        {error && (
          <div className="bg-primary-red/10 border-2 border-primary-red text-primary-red p-3 font-bold text-sm mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-primary-blue/10 border-2 border-primary-blue text-primary-blue p-3 font-bold text-sm mb-6">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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

          <Button type="submit" variant="attention" className="w-full mt-2 py-3" disabled={loading}>
            {loading ? 'Sending...' : 'Send reset link'}
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t-2 border-border flex justify-between items-center text-xs">
          <Link to="/login" className="text-primary-blue font-bold hover:underline">
            Back to login
          </Link>
        </div>
      </Card>
    </div>
  );
};
