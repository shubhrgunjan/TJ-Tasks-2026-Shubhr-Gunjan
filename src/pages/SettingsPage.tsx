import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateUserProfile } from '../services/users';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { PaymentGatewayModal } from '../components/ui/PaymentGatewayModal';
import { Sparkles, Check, CreditCard, ShieldCheck } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { profile, refreshProfile } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    if (!displayName.trim()) {
      setError('Name cannot be empty.');
      return;
    }

    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      await updateUserProfile(profile.uid, { 
        displayName: displayName.trim(),
        bio: bio.trim()
      });
      await refreshProfile();
      setMessage('Profile updated successfully!');
    } catch (err: any) {
      console.error(err);
      setError('Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-8 animate-fade-in">
      <div className="flex flex-col gap-1 border-b-2 border-border pb-3">
        <h1 className="text-3xl font-bold tracking-tight text-canvas-fg">Account & Membership Settings</h1>
        <p className="text-sm font-medium text-text-secondary">Manage your system credentials and subscription plan</p>
      </div>

      {/* Pro Membership Banner */}
      <Card className="bg-card-bg border-2 border-border p-6 flex flex-col gap-4" shadow="md" accent={profile?.isPro ? 'yellow' : 'blue'}>
        <div className="flex justify-between items-start gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 border-2 border-border text-white font-bold ${profile?.isPro ? 'bg-primary-yellow text-canvas-fg' : 'bg-primary-blue text-white'}`}>
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-canvas-fg">
                  {profile?.isPro ? 'TJFlow PRO Membership' : 'TJFlow Free Plan'}
                </h3>
                {profile?.isPro && (
                  <span className="bg-primary-yellow text-canvas-fg border border-border px-2 py-0.5 text-[10px] font-black">
                    ACTIVE
                  </span>
                )}
              </div>
              <p className="text-xs text-text-secondary font-medium mt-0.5">
                {profile?.isPro 
                  ? 'Unlimited workspace projects, team chat, priority support, and pro status.'
                  : 'Free account limited to standard features. Upgrade to unlock full workspace power.'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t-2 border-border pt-4 mt-2">
          <div className="text-xs font-semibold text-text-secondary">
            Current Plan: <span className="font-bold text-canvas-fg uppercase">{profile?.subscriptionPlan || 'FREE'}</span>
          </div>
          <Button 
            variant={profile?.isPro ? 'outline' : 'primary'} 
            size="sm"
            onClick={() => setPaymentModalOpen(true)}
            className="flex items-center gap-2"
          >
            <CreditCard className="w-4 h-4" />
            <span>{profile?.isPro ? 'Manage Membership' : 'Upgrade to PRO'}</span>
          </Button>
        </div>
      </Card>

      {/* Profile Info Settings Form */}
      <Card className="bg-card-bg border-2 border-border p-8 relative overflow-hidden" shadow="md" accent="black">
        <h3 className="text-lg font-bold tracking-tight text-canvas-fg mb-4">Personal Details</h3>

        {error && (
          <div className="bg-primary-red/10 border-2 border-primary-red text-primary-red p-3 font-bold text-sm mb-6">
            {error}
          </div>
        )}

        {message && (
          <div className="bg-primary-blue/10 border-2 border-primary-blue text-primary-blue p-3 font-bold text-sm mb-6">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-canvas-fg">Email address</label>
            <input
              type="email"
              value={profile?.email || ''}
              className="w-full text-sm font-medium opacity-60 cursor-not-allowed bg-canvas-bg border-2 border-border text-canvas-fg p-2"
              disabled
            />
            <p className="text-[11px] font-normal text-text-secondary mt-1">Email is managed by Google/Firebase Auth.</p>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-canvas-fg">Display name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full text-sm font-medium bg-canvas-bg border-2 border-border text-canvas-fg p-2"
              placeholder="Your name"
              required
              disabled={loading}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-canvas-fg">Biography / Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full text-sm font-medium bg-canvas-bg border-2 border-border text-canvas-fg p-2 resize-none h-24"
              placeholder="Tell teammates about your role, skills, or projects..."
              disabled={loading}
            />
          </div>

          <Button type="submit" variant="primary" className="w-full py-3" disabled={loading}>
            {loading ? 'Saving changes...' : 'Save settings'}
          </Button>
        </form>
      </Card>

      <PaymentGatewayModal 
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
      />
    </div>
  );
};
