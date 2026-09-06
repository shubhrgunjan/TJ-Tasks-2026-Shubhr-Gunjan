import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Check, HelpCircle, Hash, MessageSquare, Shield, Activity, Sun, Moon, Sparkles, Zap } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { PaymentGatewayModal } from '../components/ui/PaymentGatewayModal';
import { TestModeModal } from '../components/ui/TestModeModal';

export const LandingPage: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [testModalOpen, setTestModalOpen] = useState(false);

  return (
    <div className="bg-canvas-bg min-h-screen flex flex-col font-sans border-t-8 border-primary-red transition-colors duration-200">
      
      {/* 1. NAVIGATION BAR */}
      <nav className="border-b-4 border-border bg-card-bg px-6 py-4 flex items-center justify-between sticky top-0 z-40 select-none">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="flex gap-1.5 items-center">
            <span className="text-primary-red font-black text-2xl animate-shape-pulse inline-block">●</span>
            <span className="text-primary-yellow font-black text-2xl animate-shape-bounce inline-block [animation-delay:0.2s]">■</span>
            <span className="text-primary-blue font-black text-2xl animate-float-slow inline-block [animation-delay:0.4s]">▲</span>
          </div>
          <span className="font-black text-2xl tracking-tighter uppercase text-canvas-fg group-hover:text-primary-blue transition-colors">TJFLOW</span>
        </Link>
        
        <div className="hidden md:flex items-center gap-8 font-bold text-xs uppercase tracking-wider text-canvas-fg">
          <a href="#features" className="hover:text-primary-blue transition-colors">Features</a>
          <a href="#capabilities" className="hover:text-primary-blue transition-colors">Capabilities</a>
          <a href="#pricing" className="hover:text-primary-blue transition-colors">Pricing</a>
          <a href="#faq" className="hover:text-primary-blue transition-colors">FAQ</a>
        </div>

        <div className="flex gap-2.5 items-center">
          <button
            onClick={() => setTestModalOpen(true)}
            className="px-3 py-1.5 bg-primary-yellow text-canvas-fg font-black text-xs uppercase tracking-wider border-2 border-border shadow-xs hover:-translate-y-0.5 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 text-primary-red animate-pulse" />
            <span>Test Mode</span>
          </button>
          
          <button
            onClick={toggleTheme}
            className="p-2 border-2 border-border bg-card-bg text-canvas-fg hover:bg-canvas-bg transition-all active:translate-x-[1px] active:translate-y-[1px] shadow-sm flex items-center justify-center cursor-pointer"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle dark mode"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-primary-yellow" />
            ) : (
              <Moon className="w-4 h-4 text-canvas-fg" />
            )}
          </button>
          
          <Link to="/login">
            <Button variant="outline" size="sm">Sign In</Button>
          </Link>
          <Link to="/register">
            <Button variant="primary" size="sm">Get Started</Button>
          </Link>
        </div>
      </nav>

      {/* 2. HERO SECTION */}
      <section className="border-b-4 border-border bg-card-bg py-16 lg:py-24 px-6 relative overflow-hidden select-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#E0E0E0_1px,transparent_1px),linear-gradient(to_bottom,#E0E0E0_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-35" />
        
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            <div className="flex flex-wrap gap-2 mb-6">
              <span className="px-3 py-1 border-2 border-border text-xs font-black uppercase bg-primary-yellow tracking-widest text-canvas-fg shadow-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary-red animate-ping inline-block" />
                REAL-TIME TEAM WORKSPACE
              </span>
              <button 
                onClick={() => setTestModalOpen(true)}
                className="px-3 py-1 border-2 border-border text-xs font-black uppercase bg-primary-red text-white tracking-widest shadow-sm flex items-center gap-1.5 hover:opacity-90 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 animate-pulse" />
                REVIEWER TEST MODE
              </button>
            </div>

            <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tight leading-none text-canvas-fg mb-4">
              STRUCTURE THE WORK.<br />
              <span className="text-primary-blue">MOVE THE TEAM.</span>
            </h1>
            <p className="text-base md:text-lg font-medium text-text-secondary dark:text-gray-300 max-w-xl mb-8 leading-relaxed">
              TJFlow gives modern product teams a unified visual workspace for project boards, task tracking, team chat, and activity monitoring—fully synchronized in real time.
            </p>
            <div className="flex flex-wrap gap-4">
              <button onClick={() => setTestModalOpen(true)}>
                <Button variant="primary" size="lg" className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-primary-yellow" />
                  <span>Launch Reviewer Test Mode</span>
                </Button>
              </button>
              <Link to="/register">
                <Button variant="outline" size="lg">Get Started Free</Button>
              </Link>
            </div>
          </div>
          
          {/* Animated Hero Art Composition */}
          <div className="lg:col-span-5 flex justify-center items-center">
            <div className="relative w-80 h-80 md:w-96 md:h-96 border-4 border-border bg-canvas-bg shadow-lg flex items-center justify-center p-8 overflow-hidden">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#C0C0C0_1px,transparent_1px)] bg-[size:2rem] opacity-30" />
              
              {/* Floating Animated Geometric Shapes */}
              <div className="absolute w-56 h-56 rounded-full bg-primary-blue/90 border-4 border-border top-4 left-4 animate-float-slow" />
              <div className="absolute w-44 h-44 bg-primary-yellow/90 border-4 border-border rotate-12 bottom-8 left-8 animate-float-reverse" />
              <div className="absolute w-0 h-0 border-l-[60px] border-l-transparent border-r-[60px] border-r-transparent border-b-[100px] border-b-primary-red/90 bottom-16 right-8 animate-shape-pulse" />
              
              <div className="absolute h-[4px] w-full bg-border top-1/2 left-0 -translate-y-1/2" />
              <div className="absolute w-[4px] h-full bg-border left-2/3 top-0" />
              
              <div className="relative z-10 bg-card-bg border-4 border-border p-5 shadow-md flex flex-col items-center hover:scale-105 transition-transform">
                <div className="flex gap-2">
                  <span className="text-primary-red font-black text-2xl animate-shape-bounce inline-block">●</span>
                  <span className="text-primary-yellow font-black text-2xl animate-shape-pulse inline-block [animation-delay:0.3s]">■</span>
                  <span className="text-primary-blue font-black text-2xl animate-float-slow inline-block [animation-delay:0.6s]">▲</span>
                </div>
                <span className="font-black text-xs uppercase tracking-widest text-canvas-fg mt-2 select-none">TJFLOW WORKSPACE</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. CAPABILITIES BAR */}
      <section id="capabilities" className="border-b-4 border-border bg-primary-yellow py-12 px-6 select-none">
        <div className="max-w-7xl mx-auto flex flex-col items-center">
          <span className="text-xs font-bold uppercase tracking-widest text-canvas-fg mb-2">Core capabilities</span>
          <h2 className="text-2xl font-black tracking-tight text-canvas-fg mb-8 text-center">Everything your team needs to ship</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full">
            <Card className="p-4 bg-card-bg border-2 text-center flex flex-col justify-center items-center h-28 hover:-translate-y-1 transition-transform" shadow="sm">
              <Hash className="w-6 h-6 text-primary-red mb-1 animate-shape-bounce" />
              <span className="font-bold text-xs tracking-wider text-canvas-fg uppercase">Project boards</span>
            </Card>
            <Card className="p-4 bg-card-bg border-2 text-center flex flex-col justify-center items-center h-28 hover:-translate-y-1 transition-transform" shadow="sm">
              <Check className="w-6 h-6 text-primary-blue mb-1 animate-shape-pulse" />
              <span className="font-bold text-xs tracking-wider text-canvas-fg uppercase">Kanban workflow</span>
            </Card>
            <Card className="p-4 bg-card-bg border-2 text-center flex flex-col justify-center items-center h-28 hover:-translate-y-1 transition-transform" shadow="sm">
              <MessageSquare className="w-6 h-6 text-primary-yellow mb-1 animate-float-slow" />
              <span className="font-bold text-xs tracking-wider text-canvas-fg uppercase">Team chat & DMs</span>
            </Card>
            <Card className="p-4 bg-card-bg border-2 text-center flex flex-col justify-center items-center h-28 hover:-translate-y-1 transition-transform" shadow="sm">
              <Activity className="w-6 h-6 text-canvas-fg mb-1 animate-shape-bounce" />
              <span className="font-bold text-xs tracking-wider text-canvas-fg uppercase">Activity logs</span>
            </Card>
          </div>
        </div>
      </section>

      {/* 4. FEATURE SHOWCASE */}
      <section id="features" className="border-b-4 border-border bg-canvas-bg py-20 px-6">
        <div className="max-w-7xl mx-auto flex flex-col gap-12">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-primary-blue mb-2 block">Features</span>
            <h2 className="text-3xl lg:text-4xl font-black tracking-tight text-canvas-fg">Designed for productivity</h2>
            <p className="text-sm font-medium text-muted-gray mt-2">Streamlined tools designed to keep your workflow fast, focused, and organized.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-card-bg border-2 p-6 flex flex-col gap-4" shadow="md" accent="red">
              <div className="w-10 h-10 border-2 border-border bg-primary-red flex items-center justify-center text-white font-bold select-none">01</div>
              <h3 className="font-bold text-xl tracking-tight text-canvas-fg">Kanban task boards</h3>
              <p className="text-sm text-muted-gray font-medium leading-relaxed">
                Track work seamlessly across To Do, In Progress, and Completed columns. Status changes sync instantly for all team members.
              </p>
            </Card>

            <Card className="bg-card-bg border-2 p-6 flex flex-col gap-4" shadow="md" accent="blue">
              <div className="w-10 h-10 border-2 border-border bg-primary-blue flex items-center justify-center text-white font-bold select-none">02</div>
              <h3 className="font-bold text-xl tracking-tight text-canvas-fg">Integrated team chat</h3>
              <p className="text-sm text-muted-gray font-medium leading-relaxed">
                Collaborate directly inside dedicated project channels or private direct messages. Link tasks in chat discussions and navigate in one click.
              </p>
            </Card>

            <Card className="bg-card-bg border-2 p-6 flex flex-col gap-4" shadow="md" accent="yellow">
              <div className="w-10 h-10 border-2 border-border bg-primary-yellow flex items-center justify-center text-canvas-fg font-bold select-none">03</div>
              <h3 className="font-bold text-xl tracking-tight text-canvas-fg">Role-based security</h3>
              <p className="text-sm text-muted-gray font-medium leading-relaxed">
                Keep project data protected with database-enforced permissions. Only authorized project members and owners access project assets.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* 5. BENEFITS */}
      <section className="border-b-4 border-border bg-primary-red py-16 px-6 text-white select-none">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-primary-yellow mb-2 block">Workflow advantage</span>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-none mb-6">
              The smarter way to manage projects
            </h2>
            <p className="text-base font-medium text-white/90 leading-relaxed mb-8">
              TJFlow eliminates communication noise and scattered task lists. Experience a clean, visual workspace where priorities are instantly visible.
            </p>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 font-semibold text-sm">
                <Check className="w-4 h-4 text-primary-yellow flex-shrink-0" />
                <span>Real-time task and project status synchronization</span>
              </div>
              <div className="flex items-center gap-3 font-semibold text-sm">
                <Check className="w-4 h-4 text-primary-yellow flex-shrink-0" />
                <span>Seamless project invitations and team management</span>
              </div>
              <div className="flex items-center gap-3 font-semibold text-sm">
                <Check className="w-4 h-4 text-primary-yellow flex-shrink-0" />
                <span>High-contrast visual design optimized for focus</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col gap-6 text-canvas-fg">
            <Card className="p-6 bg-card-bg border-2" shadow="sm">
              <h4 className="font-bold text-base tracking-tight text-primary-red mb-1">Seamless member invitations</h4>
              <p className="text-xs text-muted-gray font-medium leading-relaxed">
                Invite colleagues by email to join your workspace projects. Track pending invitations and member access directly inside project settings.
              </p>
            </Card>
            <Card className="p-6 bg-card-bg border-2" shadow="sm">
              <h4 className="font-bold text-base tracking-tight text-primary-blue mb-1">Global workspace search</h4>
              <p className="text-xs text-muted-gray font-medium leading-relaxed">
                Search board tasks, project boards, and teammates instantly across your workspace using the global search navigation bar.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* 6. CORE VALUES */}
      <section className="border-b-4 border-border bg-canvas-bg py-20 px-6">
        <div className="max-w-7xl mx-auto flex flex-col gap-12">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-primary-red mb-2 block">Core principles</span>
            <h2 className="text-3xl font-black tracking-tight text-canvas-fg">Built on speed and clarity</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="bg-card-bg border-2 p-6 flex flex-col justify-between gap-4" shadow="md">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5 items-center">
                  <span className="text-primary-red font-black text-xl animate-shape-pulse inline-block">●</span>
                  <span className="text-primary-yellow font-black text-xl animate-shape-bounce inline-block [animation-delay:0.2s]">■</span>
                  <span className="text-primary-blue font-black text-xl animate-float-slow inline-block [animation-delay:0.4s]">▲</span>
                </div>
                <h4 className="font-bold text-lg text-canvas-fg">Visual task priorities</h4>
              </div>
              <p className="text-sm font-medium text-muted-gray leading-relaxed">
                Task priorities are mapped to distinct geometric indicators: High is a Red Circle, Medium is a Yellow Square, and Low is a Blue Triangle. This gives your team instant clarity at a glance.
              </p>
            </Card>

            <Card className="bg-card-bg border-2 p-6 flex flex-col justify-between gap-4" shadow="md">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary-blue animate-shape-bounce" />
                <h4 className="font-bold text-lg text-canvas-fg">Connected workspace context</h4>
              </div>
              <p className="text-sm font-medium text-muted-gray leading-relaxed">
                Every action generates an activity log. Tasks, user profiles, and project boards are linked together, allowing team members to navigate between work items and user profiles with a single click.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* 7. PRICING SECTION */}
      <section id="pricing" className="border-b-4 border-border bg-card-bg py-20 px-6">
        <div className="max-w-7xl mx-auto flex flex-col gap-12">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-primary-yellow mb-2 block">Transparent pricing</span>
            <h2 className="text-4xl font-black tracking-tight text-canvas-fg">Plans for every team</h2>
            <p className="text-sm font-medium text-muted-gray mt-2">Start free for individual projects or upgrade for collaborative teams.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto w-full">
            <Card className="bg-card-bg border-2 p-8 flex flex-col justify-between gap-8" shadow="md">
              <div>
                <h3 className="font-black text-2xl tracking-tight text-canvas-fg">Free plan</h3>
                <p className="text-xs text-muted-gray font-bold uppercase tracking-wider mt-1">For individuals & small teams</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-5xl font-black tracking-tight text-canvas-fg">$0</span>
                  <span className="text-xs font-bold text-muted-gray uppercase">/ forever free</span>
                </div>
                <ul className="mt-8 flex flex-col gap-4 text-xs font-bold uppercase tracking-wider text-canvas-fg">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary-blue" />
                    <span>Create up to 3 active projects</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary-blue" />
                    <span>Real-time Kanban status boards</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary-blue" />
                    <span>Task assignment and due dates</span>
                  </li>
                </ul>
              </div>
              <Link to="/register">
                <Button variant="outline" className="w-full py-3">Sign up free</Button>
              </Link>
            </Card>

            <Card className="bg-card-bg border-4 p-8 flex flex-col justify-between gap-8 relative overflow-hidden" shadow="lg" accent="yellow">
              <div>
                <div className="absolute top-0 right-0 bg-primary-yellow border-b-2 border-l-2 border-border text-[10px] font-bold uppercase tracking-wider px-3 py-1 text-canvas-fg select-none">
                  Popular
                </div>
                <h3 className="font-black text-2xl tracking-tight text-canvas-fg">Pro team plan</h3>
                <p className="text-xs text-muted-gray font-bold uppercase tracking-wider mt-1">For collaborative teams</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-5xl font-black tracking-tight text-canvas-fg">$12</span>
                  <span className="text-xs font-bold text-muted-gray uppercase">/ user / month</span>
                </div>
                <ul className="mt-8 flex flex-col gap-4 text-xs font-bold uppercase tracking-wider text-canvas-fg">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary-red" />
                    <span>Unlimited active projects & team members</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary-red" />
                    <span>Project group chat & direct messaging</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary-red" />
                    <span>Global workspace search engine</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary-red" />
                    <span>Real-time activity logs & custom user bios</span>
                  </li>
                </ul>
              </div>
              <Link to="/register">
                <Button variant="primary" className="w-full py-3">Start Pro trial</Button>
              </Link>
            </Card>
          </div>
        </div>
      </section>

      {/* 8. FAQ SECTION */}
      <section id="faq" className="border-b-4 border-border bg-canvas-bg py-20 px-6">
        <div className="max-w-4xl mx-auto flex flex-col gap-12">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-primary-blue mb-2 block">Support</span>
            <h2 className="text-3xl font-black tracking-tight text-canvas-fg">Frequently asked questions</h2>
          </div>

          <div className="flex flex-col gap-4">
            <Card className="bg-card-bg border-2 p-6 flex flex-col gap-2" shadow="sm">
              <h4 className="font-bold text-base text-canvas-fg flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-primary-red flex-shrink-0" />
                <span>How does real-time synchronization work?</span>
              </h4>
              <p className="text-sm text-muted-gray font-medium leading-relaxed">
                TJFlow connects your workspace directly to live database listeners. When a teammate creates a task, updates a status column, or sends a message, your board updates instantly without needing a manual refresh.
              </p>
            </Card>

            <Card className="bg-card-bg border-2 p-6 flex flex-col gap-2" shadow="sm">
              <h4 className="font-bold text-base text-canvas-fg flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-primary-red flex-shrink-0" />
                <span>How do project invitations work?</span>
              </h4>
              <p className="text-sm text-muted-gray font-medium leading-relaxed">
                Project owners can invite teammates by entering their email address. Invites appear in the user's dashboard notifications where they can accept or decline with one click.
              </p>
            </Card>

            <Card className="bg-card-bg border-2 p-6 flex flex-col gap-2" shadow="sm">
              <h4 className="font-bold text-base text-canvas-fg flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-primary-red flex-shrink-0" />
                <span>Can I connect team messaging with task management?</span>
              </h4>
              <p className="text-sm text-muted-gray font-medium leading-relaxed">
                Yes. You can reference tasks inside project chat channels, click task links to open detail panels, and create new tasks directly from conversation threads.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* 9. FINAL CTA */}
      <section className="border-b-4 border-border bg-primary-yellow py-16 px-6 select-none text-center">
        <div className="max-w-3xl mx-auto flex flex-col items-center gap-6">
          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-canvas-fg">
            Ready to organize your work?
          </h2>
          <p className="text-sm font-bold text-canvas-fg">
            Join TJFlow workspaces today and coordinate your team efficiently.
          </p>
          <Link to="/register" className="mt-2">
            <Button variant="primary" size="lg">Get started now</Button>
          </Link>
        </div>
      </section>

      {/* 10. FOOTER */}
      <footer className="bg-border text-white py-12 px-6 border-b-8 border-primary-red select-none">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 text-center md:text-left">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5 items-center">
              <span className="text-primary-red font-black text-xl animate-shape-pulse inline-block">●</span>
              <span className="text-primary-yellow font-black text-xl animate-shape-bounce inline-block [animation-delay:0.2s]">■</span>
              <span className="text-primary-blue font-black text-xl animate-float-slow inline-block [animation-delay:0.4s]">▲</span>
            </div>
            <span className="font-black text-xl tracking-tighter uppercase text-white">TJFLOW</span>
          </div>

          <div className="text-xs font-semibold text-gray-400">
            © 2026 TJFlow. Built for modern product teams.
          </div>

          <div className="flex gap-4 text-xs font-semibold text-gray-400">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">GitHub</a>
          </div>
        </div>
      </footer>

      {/* Reviewer Test Mode Modal */}
      <TestModeModal 
        isOpen={testModalOpen} 
        onClose={() => setTestModalOpen(false)} 
      />
    </div>
  );
};
