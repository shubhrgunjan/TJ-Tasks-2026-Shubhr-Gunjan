import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from './Card';
import { Button } from './Button';
import { TEST_PERSONAS, loginAsTestPersona, seedTestWorkspaceData } from '../../services/seedTestMode';
import { X, Sparkles, UserCheck, ShieldCheck, RefreshCw, Zap, Users } from 'lucide-react';

interface TestModeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TestModeModal: React.FC<TestModeModalProps> = ({ isOpen, onClose }) => {
  const [loadingPersona, setLoadingPersona] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleSelectPersona = async (key: string) => {
    setLoadingPersona(key);
    try {
      await loginAsTestPersona(key);
      onClose();
      navigate('/app/dashboard');
    } catch (err) {
      console.error('Failed to log in as test persona:', err);
    } finally {
      setLoadingPersona(null);
    }
  };

  const handleReSeedData = async () => {
    setSeeding(true);
    try {
      await seedTestWorkspaceData('test_mode_reviewer', true);
    } catch (err) {
      console.error(err);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in select-none">
      <Card className="w-full max-w-2xl bg-card-bg border-4 border-border p-6 md:p-8 relative max-h-[90vh] overflow-y-auto text-canvas-fg" shadow="lg">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-text-secondary hover:text-canvas-fg hover:bg-surface-hover border-2 border-transparent hover:border-border transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Badge & Title */}
        <div className="flex items-center gap-2 mb-2">
          <span className="px-3 py-1 bg-primary-red text-white text-xs font-black uppercase tracking-widest border-2 border-border shadow-xs flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 animate-pulse" />
            REVIEWER TEST MODE
          </span>
          <span className="text-xs font-bold text-text-secondary uppercase">Sandbox Environment</span>
        </div>

        <h2 className="text-2xl md:text-3xl font-black tracking-tight text-canvas-fg mb-3">
          Experience TJFlow at Full Capacity
        </h2>

        <p className="text-sm font-medium text-text-secondary leading-relaxed mb-6">
          Test Mode gives evaluators and reviewers instant, 1-click access to a fully populated real-time workspace. No signup or password typing required.
        </p>

        {/* Highlighted Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <div className="p-3 bg-canvas-bg border-2 border-border flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary-blue/20 border-2 border-primary-blue flex items-center justify-center flex-shrink-0">
              <Users className="w-4 h-4 text-primary-blue" />
            </div>
            <div>
              <div className="font-bold text-xs">4 Dummy Accounts</div>
              <div className="text-[11px] text-text-secondary">Lead Designer, Eng, QA & PM</div>
            </div>
          </div>

          <div className="p-3 bg-canvas-bg border-2 border-border flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary-yellow/30 border-2 border-primary-yellow flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-canvas-fg" />
            </div>
            <div>
              <div className="font-bold text-xs">Real-Time Data</div>
              <div className="text-[11px] text-text-secondary">Pre-built boards & chat</div>
            </div>
          </div>

          <div className="p-3 bg-canvas-bg border-2 border-border flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary-red/20 border-2 border-primary-red flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-4 h-4 text-primary-red" />
            </div>
            <div>
              <div className="font-bold text-xs">Multi-Tab Sync</div>
              <div className="text-[11px] text-text-secondary">Test live multi-user sync</div>
            </div>
          </div>
        </div>

        {/* Persona Selection */}
        <h3 className="font-black text-xs uppercase tracking-widest text-text-secondary mb-3 flex items-center justify-between">
          <span>Select Test Persona to Enter</span>
          <span className="text-[11px] font-semibold text-primary-blue">1-Click Instant Authorization</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {Object.values(TEST_PERSONAS).map((persona) => {
            const isLoading = loadingPersona === persona.key;
            return (
              <div
                key={persona.key}
                onClick={() => !loadingPersona && handleSelectPersona(persona.key)}
                className="p-4 bg-canvas-bg border-2 border-border hover:border-primary-blue hover:-translate-y-0.5 transition-all cursor-pointer flex items-start gap-3 relative overflow-hidden group shadow-sm"
              >
                <div 
                  className="w-12 h-12 rounded-full border-2 border-border overflow-hidden flex-shrink-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${persona.avatar})` }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="font-bold text-sm text-canvas-fg group-hover:text-primary-blue transition-colors truncate">
                      {persona.displayName}
                    </h4>
                    <span className="text-[10px] font-black uppercase px-1.5 py-0.5 border border-border bg-primary-yellow text-canvas-fg flex-shrink-0">
                      PRO
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-primary-blue mb-1 truncate">
                    {persona.role}
                  </div>
                  <p className="text-[11px] text-text-secondary line-clamp-2 leading-tight">
                    {persona.bio}
                  </p>
                </div>
                {isLoading && (
                  <div className="absolute inset-0 bg-card-bg/80 flex items-center justify-center gap-2 font-bold text-xs text-primary-blue">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Quick Action Footer */}
        <div className="pt-4 border-t-2 border-border flex flex-wrap items-center justify-between gap-3 text-xs">
          <button
            onClick={handleReSeedData}
            disabled={seeding}
            className="flex items-center gap-1.5 font-bold text-text-secondary hover:text-canvas-fg transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${seeding ? 'animate-spin' : ''}`} />
            <span>{seeding ? 'Resetting seed data...' : 'Reset Dummy Workspace Data'}</span>
          </button>

          <Button 
            variant="primary" 
            size="md" 
            className="flex items-center gap-2"
            onClick={() => handleSelectPersona('sarah')}
          >
            <UserCheck className="w-4 h-4" />
            <span>Launch Instant Test Mode (Sarah)</span>
          </Button>
        </div>

      </Card>
    </div>
  );
};
