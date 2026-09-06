import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { TEST_PERSONAS, loginAsTestPersona, seedTestWorkspaceData } from '../../services/seedTestMode';
import { logoutUser } from '../../services/auth';
import { Zap, Users, RefreshCw, LogOut, ChevronDown, Check } from 'lucide-react';

export const TestModeBar: React.FC = () => {
  const { profile } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loadingPersona, setLoadingPersona] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);

  // Determine if current logged in user is a test persona
  if (!profile) return null;
  const activePersonaKey = Object.keys(TEST_PERSONAS).find(
    k => TEST_PERSONAS[k].email.toLowerCase() === profile.email.toLowerCase()
  );

  // If not logged in as a test persona, don't show the bar
  if (!activePersonaKey) return null;

  const activePersona = TEST_PERSONAS[activePersonaKey];

  const handleSwitchPersona = async (personaKey: string) => {
    if (personaKey === activePersonaKey) return;
    setLoadingPersona(personaKey);
    try {
      await loginAsTestPersona(personaKey);
      window.location.reload();
    } catch (err) {
      console.error('Failed switching test persona:', err);
    } finally {
      setLoadingPersona(null);
      setDropdownOpen(false);
    }
  };

  const handleResetData = async () => {
    setResetting(true);
    try {
      await seedTestWorkspaceData(profile.uid, true);
      window.location.reload();
    } catch (err) {
      console.error('Error resetting test workspace data:', err);
    } finally {
      setResetting(false);
    }
  };

  const handleExitTestMode = async () => {
    localStorage.removeItem('tjflow_test_persona');
    await logoutUser();
    window.location.href = '/login';
  };

  return (
    <div className="bg-neutral-900 text-white border-b-2 border-primary-yellow px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs z-50 sticky top-0 shadow-md select-none">
      
      {/* Left Indicator */}
      <div className="flex items-center gap-2 font-black uppercase tracking-wider">
        <span className="px-2 py-0.5 bg-primary-red text-white text-[10px] flex items-center gap-1 border border-white/20">
          <Zap className="w-3 h-3 animate-pulse" />
          TEST MODE ACTIVE
        </span>
        <span className="hidden sm:inline text-gray-300 text-xs font-medium">
          Real-Time Reviewer Sandbox
        </span>
      </div>

      {/* Center Persona Switcher */}
      <div className="relative">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2 px-3 py-1 bg-neutral-800 hover:bg-neutral-700 border border-neutral-600 font-bold transition-all text-white"
        >
          <div className="w-4 h-4 rounded-full bg-cover bg-center border border-white" style={{ backgroundImage: `url(${activePersona.avatar})` }} />
          <span>{activePersona.displayName} ({activePersona.role})</span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 sm:left-0 mt-1 w-64 bg-card-bg border-2 border-border text-canvas-fg shadow-xl z-50 p-2 animate-fade-in">
            <div className="text-[10px] font-black uppercase tracking-widest text-text-secondary px-2 py-1 mb-1">
              Switch Test Account (1-Click)
            </div>
            {Object.values(TEST_PERSONAS).map((p) => {
              const isSelected = p.key === activePersonaKey;
              const isLoading = loadingPersona === p.key;

              return (
                <button
                  key={p.key}
                  onClick={() => handleSwitchPersona(p.key)}
                  disabled={isLoading}
                  className={`w-full flex items-center justify-between p-2 text-left hover:bg-surface-hover transition-colors font-medium border-b border-border/40 last:border-0 ${
                    isSelected ? 'bg-primary-blue/10 border-l-4 border-l-primary-blue' : ''
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-full bg-cover bg-center border border-border flex-shrink-0" style={{ backgroundImage: `url(${p.avatar})` }} />
                    <div className="truncate">
                      <div className="font-bold text-xs truncate">{p.displayName}</div>
                      <div className="text-[10px] text-text-secondary truncate">{p.role}</div>
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-primary-blue flex-shrink-0" />}
                  {isLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin text-primary-blue flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3 font-semibold">
        <button
          onClick={handleResetData}
          disabled={resetting}
          className="flex items-center gap-1.5 text-gray-300 hover:text-white transition-colors"
          title="Restore original seed projects, tasks, and messages"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
          <span className="hidden md:inline">{resetting ? 'Resetting...' : 'Reset Dummy Data'}</span>
        </button>

        <button
          onClick={handleExitTestMode}
          className="flex items-center gap-1 px-2.5 py-1 bg-primary-red/20 border border-primary-red hover:bg-primary-red text-white transition-colors text-xs font-bold"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Exit Test Mode</span>
        </button>
      </div>

    </div>
  );
};
