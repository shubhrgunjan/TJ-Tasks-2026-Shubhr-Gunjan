import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useProject } from '../../context/ProjectContext';
import { logoutUser } from '../../services/auth';
import { subscribeNotifications } from '../../services/notifications';
import { getUserProjects } from '../../services/projects';
import { getAllUsers } from '../../services/users';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Project, Task, UserProfile } from '../../types';
import { 
  LayoutDashboard, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  KanbanSquare,
  MessageSquare,
  Bell,
  Search,
  Hash,
  User,
  CheckSquare,
  Clock,
  Sun,
  Moon,
  Sparkles
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { PaymentGatewayModal } from '../ui/PaymentGatewayModal';

export const AppLayout: React.FC = () => {
  const { profile } = useAuth();
  const { currentProject, setCurrentProjectId } = useProject();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  // Global Search State
  const [searchVal, setSearchVal] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [dbProjects, setDbProjects] = useState<Project[]>([]);
  const [dbTasks, setDbTasks] = useState<Task[]>([]);
  const [dbUsers, setDbUsers] = useState<UserProfile[]>([]);
  const [searchLoaded, setSearchLoaded] = useState(false);

  // Subscribe to live notifications count
  useEffect(() => {
    if (!profile) return;
    const unsubscribe = subscribeNotifications(profile.uid, (notifs) => {
      const unread = notifs.filter(n => !n.isRead).length;
      setUnreadNotifCount(unread);
    });
    return () => unsubscribe();
  }, [profile]);

  // Load all search database items on focus
  const loadSearchData = async () => {
    if (!profile || searchLoaded) return;
    try {
      const userProjects = await getUserProjects(profile.uid);
      setDbProjects(userProjects);

      const usersList = await getAllUsers();
      setDbUsers(usersList);

      // Load tasks in user's projects
      const taskList: Task[] = [];
      const tasksColl = collection(db, 'tasks');
      for (const p of userProjects) {
        const q = query(tasksColl, where('projectId', '==', p.id));
        const snap = await getDocs(q);
        snap.forEach((doc) => {
          taskList.push(doc.data() as Task);
        });
      }
      setDbTasks(taskList);
      setSearchLoaded(true);
    } catch (e) {
      console.error('Error loading search database:', e);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate('/login');
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const isProjectActive = (projectId: string, tab: 'board' | 'chat' | 'activity' | 'members' = 'board') => {
    if (tab === 'board') {
      return location.pathname === `/app/projects/${projectId}`;
    }
    return location.pathname === `/app/projects/${projectId}/${tab}`;
  };

  // Filter Search results in-memory
  const q = searchVal.trim().toLowerCase();
  const matchedProjects = q ? dbProjects.filter(p => p.name.toLowerCase().includes(q)) : [];
  const matchedTasks = q ? dbTasks.filter(t => t.title.toLowerCase().includes(q)) : [];
  const matchedUsers = q ? dbUsers.filter(u => u.displayName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)) : [];

  const hasSearchResults = matchedProjects.length > 0 || matchedTasks.length > 0 || matchedUsers.length > 0;

  const sidebarContent = () => (
    <div className="flex flex-col h-full bg-card-bg border-r-4 border-border select-none">
      {/* Brand logo */}
      <div className="p-6 border-b-4 border-border flex items-center justify-between bg-card-bg flex-shrink-0">
        <Link to="/app/dashboard" className="flex items-center gap-3">
          <div className="flex gap-1.5 items-center">
            <span className="text-primary-red font-black text-xl">●</span>
            <span className="text-primary-yellow font-black text-xl">■</span>
            <span className="text-primary-blue font-black text-xl">▲</span>
          </div>
          <span className="font-black text-xl tracking-tighter uppercase text-canvas-fg">TJFLOW</span>
        </Link>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={toggleTheme}
            className="p-1.5 border-2 border-border bg-card-bg text-canvas-fg hover:bg-canvas-bg transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-none shadow-sm cursor-pointer flex items-center justify-center"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle dark mode"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-primary-yellow" />
            ) : (
              <Moon className="w-4 h-4 text-canvas-fg" />
            )}
          </button>
          <button 
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-1 border-2 border-border bg-primary-red text-white active:translate-x-[1px] active:translate-y-[1px] active:shadow-none shadow-sm cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Global Search Bar Container */}
      <div className="p-4 border-b-2 border-border bg-canvas-bg relative flex-shrink-0">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-gray" />
          <input
            type="text"
            value={searchVal}
            onFocus={() => {
              setSearchFocused(true);
              loadSearchData();
            }}
            onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
            onChange={(e) => setSearchVal(e.target.value)}
            className="w-full pl-9 py-2 text-xs font-medium shadow-none border-2"
            placeholder="Search workspace..."
          />
        </div>

        {/* Global Search Results Panel */}
        {searchFocused && searchVal.trim() && (
          <div className="absolute top-[56px] left-4 right-4 bg-card-bg border-2 border-border z-30 shadow-md flex flex-col max-h-64 overflow-y-auto select-none">
            {!hasSearchResults ? (
              <div className="p-3 text-xs text-muted-gray font-medium text-center">No results found</div>
            ) : (
              <div className="flex flex-col">
                {/* Projects Section */}
                {matchedProjects.length > 0 && (
                  <div className="border-b border-canvas-bg">
                    <div className="px-3 py-1.5 bg-canvas-bg text-[10px] font-bold uppercase text-muted-gray">Projects</div>
                    {matchedProjects.map(p => (
                      <div 
                        key={p.id}
                        onClick={() => {
                          setSearchVal('');
                          setSearchFocused(false);
                          navigate(`/app/projects/${p.id}`);
                        }}
                        className="px-3 py-2 text-xs font-bold text-canvas-fg hover:bg-primary-blue hover:text-white cursor-pointer truncate flex items-center justify-between"
                      >
                        <span className="truncate">{p.name}</span>
                        <span className="text-[10px] opacity-75 font-semibold">Board →</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Tasks Section */}
                {matchedTasks.length > 0 && (
                  <div className="border-b border-canvas-bg">
                    <div className="px-3 py-1.5 bg-canvas-bg text-[10px] font-bold uppercase text-muted-gray">Tasks</div>
                    {matchedTasks.map(t => (
                      <div 
                        key={t.id}
                        onClick={() => {
                          setSearchVal('');
                          setSearchFocused(false);
                          navigate(`/app/projects/${t.projectId}?task=${t.id}`);
                        }}
                        className="px-3 py-2 text-xs font-bold text-canvas-fg hover:bg-primary-red hover:text-white cursor-pointer truncate flex items-center justify-between"
                      >
                        <span className="truncate">{t.title}</span>
                        <span className="text-[10px] opacity-75 font-semibold">{t.status}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Teammates Section */}
                {matchedUsers.length > 0 && (
                  <div>
                    <div className="px-3 py-1.5 bg-canvas-bg text-[10px] font-bold uppercase text-muted-gray">Teammates</div>
                    {matchedUsers.map(u => (
                      <div 
                        key={u.uid}
                        onClick={() => {
                          setSearchVal('');
                          setSearchFocused(false);
                          navigate(`/app/profile/${u.uid}`);
                        }}
                        className="px-3 py-2 text-xs font-bold text-canvas-fg hover:bg-primary-yellow hover:text-canvas-fg cursor-pointer truncate flex items-center justify-between"
                      >
                        <span className="truncate">{u.displayName}</span>
                        <span className="text-[10px] opacity-75 font-semibold">Profile →</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Nav links */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-muted-gray mb-2 px-3">Workspace</div>
          <div className="flex flex-col gap-1">
            <Link
              to="/app/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 text-sm font-semibold border-2 transition-colors ${
                isActive('/app/dashboard')
                  ? 'bg-primary-blue text-white border-border shadow-sm'
                  : 'border-transparent hover:bg-surface-hover text-canvas-fg'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Overview</span>
            </Link>

            <Link
              to="/app/chat"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 text-sm font-semibold border-2 transition-colors ${
                isActive('/app/chat')
                  ? 'bg-primary-blue text-white border-border shadow-sm'
                  : 'border-transparent hover:bg-surface-hover text-canvas-fg'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Direct messages</span>
            </Link>
          </div>
        </div>

        {currentProject && (
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted-gray mb-2 px-3 truncate">
              {currentProject.name}
            </div>
            <div className="flex flex-col gap-1">
              <Link
                to={`/app/projects/${currentProject.id}`}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 text-sm font-semibold border-2 transition-colors ${
                  isProjectActive(currentProject.id, 'board')
                    ? 'bg-primary-yellow text-canvas-fg border-border shadow-sm'
                    : 'border-transparent hover:bg-surface-hover text-canvas-fg'
                }`}
              >
                <KanbanSquare className="w-4 h-4" />
                <span>Task board</span>
              </Link>

              <Link
                to={`/app/projects/${currentProject.id}/chat`}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 text-sm font-semibold border-2 transition-colors ${
                  isProjectActive(currentProject.id, 'chat')
                    ? 'bg-primary-yellow text-canvas-fg border-border shadow-sm'
                    : 'border-transparent hover:bg-surface-hover text-canvas-fg'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Project chat</span>
              </Link>

              <Link
                to={`/app/projects/${currentProject.id}/activity`}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 text-sm font-semibold border-2 transition-colors ${
                  isProjectActive(currentProject.id, 'activity')
                    ? 'bg-primary-yellow text-canvas-fg border-border shadow-sm'
                    : 'border-transparent hover:bg-surface-hover text-canvas-fg'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>Activity</span>
              </Link>

              <Link
                to={`/app/projects/${currentProject.id}/members`}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 text-sm font-semibold border-2 transition-colors ${
                  isProjectActive(currentProject.id, 'members')
                    ? 'bg-primary-yellow text-canvas-fg border-border shadow-sm'
                    : 'border-transparent hover:bg-surface-hover text-canvas-fg'
                }`}
              >
                <User className="w-4 h-4" />
                <span>Members</span>
              </Link>
            </div>
          </div>
        )}

        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-muted-gray mb-2 px-3">System</div>
          <div className="flex flex-col gap-1">
            <Link
              to="/app/notifications"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center justify-between px-3 py-2.5 text-sm font-semibold border-2 transition-colors ${
                isActive('/app/notifications')
                  ? 'bg-primary-blue text-white border-border shadow-sm'
                  : 'border-transparent hover:bg-surface-hover text-canvas-fg'
              }`}
            >
              <div className="flex items-center gap-3">
                <Bell className="w-4 h-4" />
                <span>Notifications</span>
              </div>
              {unreadNotifCount > 0 && (
                <span className={`text-[10px] font-bold w-5 h-5 rounded-none flex items-center justify-center border-2 ${
                  isActive('/app/notifications') ? 'bg-card-bg text-primary-blue border-white' : 'bg-primary-red text-white border-border'
                }`}>
                  {unreadNotifCount}
                </span>
              )}
            </Link>

            <Link
              to="/app/settings"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 text-sm font-semibold border-2 transition-colors ${
                isActive('/app/settings')
                  ? 'bg-primary-blue text-white border-border shadow-sm'
                  : 'border-transparent hover:bg-surface-hover text-canvas-fg'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </Link>
          </div>
        </div>
      </div>

      {/* User profile footer */}
      {profile && (
        <div className="p-4 border-t-4 border-border bg-canvas-bg flex flex-col gap-3 flex-shrink-0">
          {!profile.isPro && (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setPaymentModalOpen(true);
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 border-2 border-border bg-primary-yellow text-canvas-fg font-black text-xs hover:opacity-90 transition-all shadow-sm cursor-pointer active:translate-y-[1px]"
            >
              <Sparkles className="w-4 h-4 text-canvas-fg animate-pulse" />
              <span>Upgrade to Pro</span>
            </button>
          )}

          <Link 
            to={`/app/profile/${profile.uid}`}
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 hover:opacity-85 transition-opacity"
          >
            <div className="w-10 h-10 border-2 border-border bg-card-bg flex items-center justify-center font-bold text-lg text-primary-red shadow-sm select-none relative">
              {profile.displayName.substring(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-xs text-canvas-fg truncate flex items-center gap-1.5">
                <span>{profile.displayName}</span>
                {profile.isPro && (
                  <span className="bg-primary-yellow text-canvas-fg text-[9px] font-black px-1.5 py-0.2 border border-border shadow-2xs">
                    PRO
                  </span>
                )}
              </div>
              <div className="text-[10px] text-text-secondary font-medium truncate">
                {profile.email}
              </div>
            </div>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 border-2 border-border bg-card-bg text-primary-red font-bold text-xs hover:bg-primary-red hover:text-white transition-colors shadow-sm active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign out</span>
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-canvas-bg text-canvas-fg">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 h-full flex-shrink-0">
        {sidebarContent()}
      </aside>

      {/* Mobile Drawer Sidebar */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div 
            className="fixed inset-0 bg-black/55 backdrop-blur-xs" 
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative w-64 h-full z-10 animate-slide-in">
            {sidebarContent()}
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Mobile Header Topbar */}
        <header className="lg:hidden bg-card-bg border-b-4 border-border p-4 flex items-center justify-between flex-shrink-0">
          <Link to="/app/dashboard" className="flex items-center gap-2">
            <span className="text-primary-red font-black text-lg">●</span>
            <span className="text-primary-yellow font-black text-lg">■</span>
            <span className="text-primary-blue font-black text-lg">▲</span>
            <span className="font-black text-lg tracking-tighter uppercase text-canvas-fg">TJFLOW</span>
          </Link>
          
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 border-2 border-border bg-card-bg text-canvas-fg active:translate-x-[1px] active:translate-y-[1px] active:shadow-none shadow-sm cursor-pointer flex items-center justify-center"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle dark mode"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-primary-yellow" />
              ) : (
                <Moon className="w-4 h-4 text-canvas-fg" />
              )}
            </button>
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 border-2 border-border bg-card-bg text-canvas-fg active:translate-x-[1px] active:translate-y-[1px] active:shadow-none shadow-sm cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Content Outlet */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 bg-canvas-bg">
          <Outlet />
        </main>
      </div>

      {/* Global Pro Upgrade Payment Gateway Modal */}
      <PaymentGatewayModal 
        isOpen={paymentModalOpen} 
        onClose={() => setPaymentModalOpen(false)} 
      />
    </div>
  );
};
