import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { updateUserProfile } from '../../services/users';
import { Card } from './Card';
import { Button } from './Button';
import { 
  X, Check, ShieldCheck, Lock, CreditCard, Sparkles, 
  ArrowRight, Zap, CheckCircle2, RefreshCw 
} from 'lucide-react';

interface PaymentGatewayModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPlan?: 'PRO' | 'ENTERPRISE';
}

export const PaymentGatewayModal: React.FC<PaymentGatewayModalProps> = ({
  isOpen,
  onClose,
  defaultPlan = 'PRO'
}) => {
  const { profile, refreshProfile } = useAuth();
  
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const [plan, setPlan] = useState<'PRO' | 'ENTERPRISE'>(defaultPlan);
  
  // Card input states
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardName, setCardName] = useState(profile?.displayName || 'Shubhr Gunjan');
  const [expiry, setExpiry] = useState('12/28');
  const [cvc, setCvc] = useState('888');

  // Processing state steps
  const [step, setStep] = useState<'FORM' | 'PROCESSING' | 'SUCCESS'>('FORM');
  const [processStatus, setProcessStatus] = useState('Securing 256-bit encrypted connection...');

  if (!isOpen) return null;

  const priceMonthly = plan === 'PRO' ? 19 : 49;
  const priceAnnual = plan === 'PRO' ? 190 : 490;
  const activePrice = billingCycle === 'annual' ? priceAnnual : priceMonthly;

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 16) val = val.substring(0, 16);
    let formatted = val.replace(/(.{4})/g, '$1 ').trim();
    setCardNumber(formatted || '4242 •••• •••• 4242');
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length >= 2) {
      val = val.substring(0, 2) + '/' + val.substring(2, 4);
    }
    setExpiry(val || 'MM/YY');
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setStep('PROCESSING');

    // Step 1: Secure connection
    setProcessStatus('Securing 256-bit encrypted connection...');
    await new Promise(res => setTimeout(res, 1200));

    // Step 2: Card authorization
    setProcessStatus('Authorizing transaction with bank issuer...');
    await new Promise(res => setTimeout(res, 1400));

    // Step 3: Activating membership
    setProcessStatus('Activating TJFlow PRO Membership features...');
    await new Promise(res => setTimeout(res, 1000));

    try {
      if (profile?.uid) {
        await updateUserProfile(profile.uid, {
          isPro: true,
          subscriptionPlan: plan,
        });
        await refreshProfile();
      }
    } catch (err) {
      console.error('Failed to update subscription in Firestore:', err);
    }

    setStep('SUCCESS');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity animate-fade-in" 
        onClick={step === 'PROCESSING' ? undefined : onClose} 
      />

      <Card 
        className="relative w-full max-w-2xl bg-card-bg border-4 border-border p-6 sm:p-8 z-10 animate-fade-in text-canvas-fg overflow-hidden max-h-[90vh] overflow-y-auto" 
        shadow="lg"
        accent="blue"
      >
        {/* Close Button */}
        {step !== 'PROCESSING' && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 border-2 border-border bg-canvas-bg text-canvas-fg hover:bg-surface-hover active:translate-y-[1px] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* STEP 1: FORM INPUT */}
        {step === 'FORM' && (
          <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary-blue text-white font-bold border-2 border-border shadow-sm">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-2xl font-black tracking-tight text-canvas-fg">Upgrade to TJFlow PRO</h3>
                  <span className="px-2 py-0.5 border text-[10px] font-bold bg-primary-yellow text-canvas-fg border-border">
                    UNLIMITED ACCESS
                  </span>
                </div>
                <p className="text-xs text-text-secondary font-semibold mt-0.5">
                  Unlock high-performance team collaboration & premium AI tools
                </p>
              </div>
            </div>

            {/* Plan Selector & Billing Frequency */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Billing Toggle */}
              <div className="col-span-full flex items-center justify-between bg-canvas-bg p-2 border-2 border-border">
                <span className="text-xs font-bold text-canvas-fg pl-2">Billing Period:</span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setBillingCycle('monthly')}
                    className={`px-3 py-1.5 text-xs font-bold border-2 transition-all cursor-pointer ${
                      billingCycle === 'monthly' 
                        ? 'bg-card-bg border-border shadow-xs text-canvas-fg' 
                        : 'border-transparent text-text-secondary hover:text-canvas-fg'
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingCycle('annual')}
                    className={`px-3 py-1.5 text-xs font-bold border-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                      billingCycle === 'annual' 
                        ? 'bg-primary-yellow border-border text-canvas-fg shadow-xs' 
                        : 'border-transparent text-text-secondary hover:text-canvas-fg'
                    }`}
                  >
                    <span>Annual</span>
                    <span className="text-[9px] bg-primary-red text-white px-1 font-black">20% OFF</span>
                  </button>
                </div>
              </div>

              {/* Pro Tier Option */}
              <div 
                onClick={() => setPlan('PRO')}
                className={`p-4 border-2 cursor-pointer transition-all flex flex-col justify-between ${
                  plan === 'PRO' ? 'border-primary-blue bg-primary-blue/5 shadow-sm' : 'border-border bg-canvas-bg'
                }`}
              >
                <div>
                  <div className="flex justify-between items-center">
                    <span className="font-black text-sm text-canvas-fg">PRO PLAN</span>
                    {plan === 'PRO' && <CheckCircle2 className="w-4 h-4 text-primary-blue" />}
                  </div>
                  <div className="text-2xl font-black text-canvas-fg mt-1">
                    ${billingCycle === 'annual' ? '190' : '19'}
                    <span className="text-xs text-text-secondary font-medium">/{billingCycle === 'annual' ? 'year' : 'month'}</span>
                  </div>
                  <ul className="mt-3 flex flex-col gap-1 text-[11px] font-semibold text-text-secondary">
                    <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-emerald-500" /> Unlimited Projects & Boards</li>
                    <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-emerald-500" /> Unlimited Team Members</li>
                    <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-emerald-500" /> Pro Badge & Custom Themes</li>
                  </ul>
                </div>
              </div>

              {/* Enterprise Tier Option */}
              <div 
                onClick={() => setPlan('ENTERPRISE')}
                className={`p-4 border-2 cursor-pointer transition-all flex flex-col justify-between ${
                  plan === 'ENTERPRISE' ? 'border-primary-red bg-primary-red/5 shadow-sm' : 'border-border bg-canvas-bg'
                }`}
              >
                <div>
                  <div className="flex justify-between items-center">
                    <span className="font-black text-sm text-canvas-fg">ENTERPRISE</span>
                    {plan === 'ENTERPRISE' && <CheckCircle2 className="w-4 h-4 text-primary-red" />}
                  </div>
                  <div className="text-2xl font-black text-canvas-fg mt-1">
                    ${billingCycle === 'annual' ? '490' : '49'}
                    <span className="text-xs text-text-secondary font-medium">/{billingCycle === 'annual' ? 'year' : 'month'}</span>
                  </div>
                  <ul className="mt-3 flex flex-col gap-1 text-[11px] font-semibold text-text-secondary">
                    <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-emerald-500" /> All Pro Features</li>
                    <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-emerald-500" /> Dedicated Account Manager</li>
                    <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-emerald-500" /> 24/7 Priority Support SLA</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Mock Credit Card Visual Widget */}
            <div className="relative bg-gradient-to-tr from-slate-900 via-zinc-800 to-neutral-900 border-2 border-border p-5 text-white shadow-md flex flex-col justify-between h-40 overflow-hidden">
              <div className="flex justify-between items-center">
                <div className="flex gap-1 items-center">
                  <span className="text-primary-red font-black text-lg">●</span>
                  <span className="text-primary-yellow font-black text-lg">■</span>
                  <span className="text-primary-blue font-black text-lg">▲</span>
                  <span className="font-bold text-xs tracking-tight text-white ml-1">TJFLOW CARD</span>
                </div>
                <CreditCard className="w-6 h-6 text-primary-yellow" />
              </div>

              <div className="font-mono text-lg tracking-widest my-2 text-zinc-100">
                {cardNumber}
              </div>

              <div className="flex justify-between items-end text-xs font-mono">
                <div>
                  <div className="text-[9px] uppercase text-zinc-400">Cardholder</div>
                  <div className="font-bold text-white truncate max-w-[180px]">{cardName}</div>
                </div>
                <div>
                  <div className="text-[9px] uppercase text-zinc-400">Expires</div>
                  <div className="font-bold text-white">{expiry}</div>
                </div>
              </div>
            </div>

            {/* Payment Form */}
            <form onSubmit={handlePay} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-canvas-fg">Name on card</label>
                <input
                  type="text"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  className="w-full text-sm font-medium bg-canvas-bg border-2 border-border text-canvas-fg p-2"
                  placeholder="Shubhr Gunjan"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-canvas-fg">Card number</label>
                <input
                  type="text"
                  onChange={handleCardNumberChange}
                  className="w-full text-sm font-medium font-mono bg-canvas-bg border-2 border-border text-canvas-fg p-2"
                  placeholder="4242 4242 4242 4242"
                  maxLength={19}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-canvas-fg">Expiry date</label>
                  <input
                    type="text"
                    onChange={handleExpiryChange}
                    className="w-full text-sm font-medium font-mono bg-canvas-bg border-2 border-border text-canvas-fg p-2"
                    placeholder="12/28"
                    maxLength={5}
                    required
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-canvas-fg">CVC / CVV</label>
                  <input
                    type="password"
                    value={cvc}
                    onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').substring(0, 4))}
                    className="w-full text-sm font-medium font-mono bg-canvas-bg border-2 border-border text-canvas-fg p-2"
                    placeholder="888"
                    maxLength={4}
                    required
                  />
                </div>
              </div>

              {/* Security info banner */}
              <div className="flex items-center gap-2 text-[11px] text-text-secondary font-medium bg-canvas-bg p-2.5 border border-border mt-1">
                <Lock className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>Simulated demo checkout. No real money will be charged.</span>
              </div>

              <Button type="submit" variant="primary" className="w-full py-3.5 mt-2 text-sm shadow-md">
                <span>Pay ${activePrice} & Activate {plan}</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </form>
          </div>
        )}

        {/* STEP 2: SIMULATED PROCESSING STATE */}
        {step === 'PROCESSING' && (
          <div className="py-12 flex flex-col items-center justify-center text-center gap-6 animate-fade-in">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-primary-blue border-t-transparent animate-spin" />
              <ShieldCheck className="w-8 h-8 text-primary-blue absolute inset-0 m-auto" />
            </div>

            <div>
              <h3 className="text-2xl font-black text-canvas-fg tracking-tight">Processing Payment</h3>
              <p className="text-xs font-bold text-primary-blue mt-2 animate-pulse">{processStatus}</p>
            </div>

            <div className="w-full max-w-xs bg-canvas-bg border border-border h-2 overflow-hidden mt-2">
              <div className="bg-primary-blue h-full w-3/4 animate-pulse" />
            </div>
          </div>
        )}

        {/* STEP 3: SUCCESS STATE */}
        {step === 'SUCCESS' && (
          <div className="py-10 flex flex-col items-center justify-center text-center gap-6 animate-fade-in">
            <div className="w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center border-4 border-border shadow-lg">
              <Check className="w-10 h-10 stroke-[3]" />
            </div>

            <div>
              <div className="flex items-center justify-center gap-2">
                <h3 className="text-3xl font-black text-canvas-fg tracking-tight">You're Pro Now!</h3>
                <Sparkles className="w-6 h-6 text-primary-yellow animate-bounce" />
              </div>
              <p className="text-sm font-medium text-text-secondary mt-2 max-w-sm">
                Your TJFlow {plan} membership is active! Enjoy unlimited projects, priority features, and pro credentials.
              </p>
            </div>

            <div className="bg-primary-yellow/10 border-2 border-primary-yellow p-4 text-xs font-bold text-canvas-fg w-full max-w-sm">
              ✨ PRO Status updated in your cloud account setting.
            </div>

            <Button 
              variant="primary" 
              onClick={onClose}
              className="w-full max-w-xs py-3 mt-2 shadow-md"
            >
              Continue to Workspace
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};
