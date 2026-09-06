import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProject } from '../context/ProjectContext';
import { createProject, getUserProjects } from '../services/projects';
import { 
  getPendingInvitationsForUser, 
  acceptInvitation, 
  declineInvitation 
} from '../services/invitations';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Project, Task, Invitation } from '../types';
import { 
  Plus, Calendar, Folder, CheckSquare, Clock, 
  Inbox, Check, X, AlertTriangle, ArrowRight 
} from 'lucide-react';
import { subscribeUserProjectTasks } from '../services/tasks';

const getDueDateMillis = (dueDate: any): number | null => {
  if (!dueDate) return null;
  if (typeof dueDate.toMillis === 'function') return dueDate.toMillis();
  if (typeof dueDate.toDate === 'function') return dueDate.toDate().getTime();
  if (dueDate instanceof Date) return dueDate.getTime();
  if (typeof dueDate === 'number') return dueDate;
  if (typeof dueDate === 'string') return new Date(dueDate).getTime();
  if (dueDate.seconds) return dueDate.seconds * 1000;
  return null;
};

export const AppDashboard: React.FC = () => {
  const { profile, refreshProfile } = useAuth();
  const { setCurrentProjectId } = useProject();
  const navigate = useNavigate();

  const [projects, setProjects] = useState<Project[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [pendingInvites, setPendingInvites] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);

  // New Project Form State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Filtered Tasks Modal Overlay State
  const [tasksModalOpen, setTasksModalOpen] = useState(false);
  const [tasksModalTitle, setTasksModalTitle] = useState('');
  const [tasksModalList, setTasksModalList] = useState<Task[]>([]);

  // Project List Anchor Ref
  const projectsListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentProjectId(null);
    if (!profile) return;

    let unsubTasks: (() => void) | null = null;

    const loadDashboardData = async () => {
      setLoading(true);
      try {
        // 1. Load Projects
        const userProjects = await getUserProjects(profile.uid);
        setProjects(userProjects);

        // 2. Load Pending project invitations
        const invites = await getPendingInvitationsForUser(profile.email);
        setPendingInvites(invites);

        // 3. Subscribe in real time to all tasks in user's projects
        const pids = userProjects.map(p => p.id);
        unsubTasks = subscribeUserProjectTasks(pids, (tasks) => {
          setAllTasks(tasks);
        });
      } catch (e) {
        console.error('Error loading dashboard data:', e);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();

    return () => {
      if (unsubTasks) unsubTasks();
    };
  }, [profile]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    if (!newProjectName.trim()) {
      setFormError('Project name is required.');
      return;
    }

    setFormSubmitting(true);
    setFormError(null);

    try {
      const pid = await createProject(
        newProjectName.trim(),
        newProjectDesc.trim(),
        profile.uid,
        profile.displayName
      );
      setNewProjectName('');
      setNewProjectDesc('');
      setShowCreateModal(false);
      navigate(`/app/projects/${pid}`);
    } catch (err: any) {
      console.error(err);
      setFormError('Failed to create project.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Invitation Actions
  const handleAcceptInvite = async (invite: Invitation) => {
    if (!profile) return;
    try {
      await acceptInvitation(invite.id, profile.uid, profile.displayName);
      const userProjects = await getUserProjects(profile.uid);
      setProjects(userProjects);
      const invites = await getPendingInvitationsForUser(profile.email);
      setPendingInvites(invites);
    } catch (e) {
      console.error('Error accepting invitation:', e);
    }
  };

  const handleDeclineInvite = async (inviteId: string) => {
    try {
      await declineInvitation(inviteId);
      setPendingInvites(prev => prev.filter(inv => inv.id !== inviteId));
    } catch (e) {
      console.error('Error declining invitation:', e);
    }
  };

  // Tasks assigned to current user
  const assignedTasks = allTasks.filter(t => t.assigneeId === profile?.uid);

  // Stats calculations
  const totalProjects = projects.length;
  const totalAssignedTasks = assignedTasks.length;
  const completedTasks = assignedTasks.filter(t => t.status === 'COMPLETED').length;
  
  // Overdue calculations (assigned to user & not completed & past due)
  const overdueTasks = assignedTasks.filter(t => {
    if (t.status === 'COMPLETED') return false;
    const millis = getDueDateMillis(t.dueDate);
    return millis !== null && millis < Date.now();
  });

  // Upcoming deadlines (assigned to user or in user's projects with a due date)
  const upcomingDeadlines = allTasks
    .filter(t => {
      if (t.status === 'COMPLETED') return false;
      const millis = getDueDateMillis(t.dueDate);
      return millis !== null;
    })
    .sort((a, b) => (getDueDateMillis(a.dueDate) || 0) - (getDueDateMillis(b.dueDate) || 0))
    .slice(0, 5);

  // Click handler for stats cards
  const handleStatCardClick = (statType: 'PROJECTS' | 'ASSIGNED' | 'COMPLETED' | 'OVERDUE') => {
    switch (statType) {
      case 'PROJECTS':
        projectsListRef.current?.scrollIntoView({ behavior: 'smooth' });
        break;
      case 'ASSIGNED':
        setTasksModalTitle('My assigned tasks');
        setTasksModalList(assignedTasks);
        setTasksModalOpen(true);
        break;
      case 'COMPLETED':
        setTasksModalTitle('Completed tasks');
        setTasksModalList(assignedTasks.filter(t => t.status === 'COMPLETED'));
        setTasksModalOpen(true);
        break;
      case 'OVERDUE':
        setTasksModalTitle('Overdue tasks');
        setTasksModalList(overdueTasks);
        setTasksModalOpen(true);
        break;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="flex gap-3 items-end mb-4">
          <div className="w-3 h-3 rounded-full bg-primary-red animate-bounce" />
          <div className="w-3 h-3 bg-primary-yellow animate-bounce [animation-delay:0.15s]" />
          <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[10px] border-b-primary-blue animate-bounce [animation-delay:0.3s]" />
        </div>
        <span className="font-medium text-sm text-text-secondary">Loading metrics...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto animate-fade-in">
      {/* Header and top action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b-2 border-border pb-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-canvas-fg">Overview</h1>
          <p className="text-sm font-medium text-text-secondary mt-1">
            Welcome back, {profile?.displayName}.
          </p>
        </div>
        <Button 
          variant="primary" 
          onClick={() => setShowCreateModal(true)}
          className="shadow-sm hover:shadow-md transition-all duration-150"
        >
          <Plus className="w-4 h-4" />
          <span>Create project</span>
        </Button>
      </div>

      {/* Pending Workspace Invitations Banner */}
      {pendingInvites.length > 0 && (
        <div className="flex flex-col gap-4 border-2 border-primary-red bg-primary-red/10 p-6 shadow-sm select-none">
          <div className="flex items-center gap-2 border-b border-primary-red/30 pb-2">
            <AlertTriangle className="w-5 h-5 text-primary-red" />
            <h3 className="font-bold text-xs tracking-wider text-canvas-fg">Pending workspace invitations</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingInvites.map(invite => (
              <div key={invite.id} className="bg-card-bg border-2 border-border p-4 flex justify-between items-center gap-4">
                <div className="min-w-0">
                  <div className="font-bold text-sm text-canvas-fg truncate">
                    {invite.projectName}
                  </div>
                  <div className="text-xs text-text-secondary mt-0.5">
                    Invited by {invite.inviterName}
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button 
                    onClick={() => handleDeclineInvite(invite.id)} 
                    className="p-1.5 border-2 border-border bg-card-bg text-primary-red hover:bg-surface-hover flex items-center justify-center active:translate-y-[1px] transition-colors"
                    title="Decline"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleAcceptInvite(invite)} 
                    className="p-1.5 border-2 border-border bg-primary-blue text-white hover:opacity-90 flex items-center justify-center active:translate-y-[1px] transition-opacity"
                    title="Accept"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metric statistics grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 select-none">
        <Card 
          onClick={() => handleStatCardClick('PROJECTS')}
          className="p-5 bg-card-bg border-2 cursor-pointer hover:-translate-y-[2px] hover:shadow-md transition-all duration-150" 
          shadow="sm" 
          accent="red"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">Active projects</span>
            <div className="p-2 border border-primary-red/30 bg-primary-red/10 text-primary-red">
              <Folder className="w-5 h-5" />
            </div>
          </div>
          <span className="text-4xl font-black mt-3 text-canvas-fg block">{totalProjects}</span>
        </Card>

        <Card 
          onClick={() => handleStatCardClick('ASSIGNED')}
          className="p-5 bg-card-bg border-2 cursor-pointer hover:-translate-y-[2px] hover:shadow-md transition-all duration-150" 
          shadow="sm" 
          accent="blue"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">Assigned tasks</span>
            <div className="p-2 border border-primary-blue/30 bg-primary-blue/10 text-primary-blue">
              <Inbox className="w-5 h-5" />
            </div>
          </div>
          <span className="text-4xl font-black mt-3 text-canvas-fg block">{totalAssignedTasks}</span>
        </Card>

        <Card 
          onClick={() => handleStatCardClick('COMPLETED')}
          className="p-5 bg-card-bg border-2 cursor-pointer hover:-translate-y-[2px] hover:shadow-md transition-all duration-150" 
          shadow="sm" 
          accent="green"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">Completed tasks</span>
            <div className="p-2 border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckSquare className="w-5 h-5" />
            </div>
          </div>
          <span className="text-4xl font-black mt-3 text-canvas-fg block">
            {completedTasks} <span className="text-sm font-semibold text-text-secondary">/ {totalAssignedTasks}</span>
          </span>
        </Card>

        <Card 
          onClick={() => handleStatCardClick('OVERDUE')}
          className="p-5 bg-card-bg border-2 cursor-pointer hover:-translate-y-[2px] hover:shadow-md transition-all duration-150" 
          shadow="sm" 
          accent="yellow"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">Overdue tasks</span>
            <div className="p-2 border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <span className="text-4xl font-black mt-3 text-primary-red block">{overdueTasks.length}</span>
        </Card>
      </div>

      {/* Main dashboard content sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Projects List */}
        <div ref={projectsListRef} className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b-2 border-border pb-2">
            <h2 className="text-xl font-bold tracking-tight text-canvas-fg flex items-center gap-2">
              <Folder className="w-5 h-5 text-primary-red" />
              <span>My projects</span>
            </h2>
            <span className="text-xs font-bold bg-canvas-bg border border-border px-2.5 py-0.5 text-text-secondary">
              {projects.length} Total
            </span>
          </div>
          
          {projects.length === 0 ? (
            <Card className="p-8 text-center bg-card-bg border-2 flex flex-col items-center justify-center gap-4" shadow="sm">
              <div className="flex gap-2">
                <span className="text-primary-red font-black text-xl">●</span>
                <span className="text-primary-yellow font-black text-xl">■</span>
                <span className="text-primary-blue font-black text-xl">▲</span>
              </div>
              <div>
                <h3 className="font-bold text-lg text-canvas-fg">No active projects</h3>
                <p className="text-xs text-text-secondary font-medium mt-1">
                  Get started by initializing a new workspace project.
                </p>
              </div>
              <Button variant="attention" size="sm" onClick={() => setShowCreateModal(true)}>
                Create project
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {projects.map((proj, idx) => {
                const projTasks = allTasks.filter(t => t.projectId === proj.id);
                const projCompleted = projTasks.filter(t => t.status === 'COMPLETED').length;
                const progressPct = projTasks.length > 0 ? Math.round((projCompleted / projTasks.length) * 100) : 0;
                const accentColor = idx % 3 === 0 ? 'blue' : idx % 3 === 1 ? 'yellow' : 'purple';

                return (
                  <Card 
                    key={proj.id} 
                    accent={accentColor}
                    className="bg-card-bg border-2 flex flex-col justify-between h-48 cursor-pointer hover:-translate-y-[2px] hover:shadow-md transition-all duration-150"
                    shadow="sm"
                    onClick={() => navigate(`/app/projects/${proj.id}`)}
                  >
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="font-bold text-lg text-canvas-fg truncate">
                          {proj.name}
                        </h3>
                        {proj.ownerId === profile?.uid && (
                          <span className="px-2 py-0.5 border text-[10px] font-bold bg-primary-yellow text-canvas-fg select-none border-border">
                            Owner
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-text-secondary font-medium line-clamp-2 mt-2 leading-relaxed">
                        {proj.description || 'No description provided.'}
                      </p>
                    </div>

                    {/* Progress indicator */}
                    <div className="mt-3 flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-[11px] font-bold text-text-secondary">
                        <span>Progress</span>
                        <span>{progressPct}% ({projCompleted}/{projTasks.length} tasks)</span>
                      </div>
                      <div className="w-full bg-canvas-bg border border-border h-2 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-primary-blue to-emerald-500 h-full transition-all duration-300"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>
                    
                    <div className="border-t border-border/50 pt-2.5 flex items-center justify-between text-xs font-bold text-text-secondary mt-2">
                      <span>{proj.memberIds.length + 1} members</span>
                      <span className="text-primary-blue hover:underline">View board →</span>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Upcoming deadlines */}
        <div className="flex flex-col gap-6 select-none">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b-2 border-border pb-2">
              <h2 className="text-xl font-bold tracking-tight text-canvas-fg flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary-yellow" />
                <span>Upcoming deadlines</span>
              </h2>
              <span className="text-xs font-bold bg-primary-yellow/10 border border-primary-yellow px-2 py-0.5 text-canvas-fg">
                {upcomingDeadlines.length}
              </span>
            </div>

            <Card className="bg-card-bg border-2 p-4 flex flex-col gap-3" shadow="sm">
              {upcomingDeadlines.length === 0 ? (
                <div className="text-xs text-text-secondary font-medium py-6 text-center">
                  No upcoming deadlines scheduled
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {upcomingDeadlines.map((task) => (
                    <div 
                      key={task.id} 
                      onClick={() => navigate(`/app/projects/${task.projectId}?task=${task.id}`)}
                      className="flex justify-between items-center gap-2 border-b border-border/60 pb-2.5 last:border-b-0 last:pb-0 hover:bg-surface-hover p-1 cursor-pointer transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-sm text-canvas-fg truncate hover:text-primary-blue">
                          {task.title}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[10px] font-bold border px-1.5 py-0.2 ${
                            task.priority === 'HIGH' 
                              ? 'bg-primary-red/10 border-primary-red text-primary-red' 
                              : task.priority === 'MEDIUM' 
                              ? 'bg-amber-500/10 border-amber-500 text-amber-600 dark:text-amber-400' 
                              : 'bg-primary-blue/10 border-primary-blue text-primary-blue'
                          }`}>
                            {task.priority}
                          </span>
                        </div>
                      </div>
                      <span className="flex-shrink-0 text-xs font-bold bg-primary-red/10 border border-primary-red px-2 py-0.5 text-primary-red select-none">
                        {getDueDateMillis(task.dueDate) ? new Date(getDueDateMillis(task.dueDate)!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>

      {/* FILTERED TASKS MODAL LIST OVERLAY */}
      {tasksModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setTasksModalOpen(false)} />
          
          <Card className="relative w-full max-w-lg bg-card-bg border-4 border-border p-6 z-10 animate-fade-in flex flex-col max-h-[80vh] overflow-hidden text-canvas-fg" shadow="lg">
            <div className="flex items-center justify-between border-b-2 border-border pb-3 mb-4">
              <h3 className="text-xl font-bold tracking-tight text-canvas-fg">{tasksModalTitle}</h3>
              <button 
                onClick={() => setTasksModalOpen(false)}
                className="p-1 border-2 border-border bg-canvas-bg text-canvas-fg hover:bg-surface-hover active:translate-y-[1px] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3">
              {tasksModalList.length === 0 ? (
                <div className="text-center py-8 text-xs font-medium text-text-secondary">
                  No tasks match this status
                </div>
              ) : (
                tasksModalList.map(t => (
                  <div 
                    key={t.id}
                    onClick={() => {
                      setTasksModalOpen(false);
                      navigate(`/app/projects/${t.projectId}?task=${t.id}`);
                    }}
                    className="border-2 border-border bg-canvas-bg hover:bg-surface-hover p-3 shadow-sm cursor-pointer transition-all flex justify-between items-center gap-4 group"
                  >
                    <div className="min-w-0">
                      <span className="font-bold text-xs text-canvas-fg block truncate">
                        {t.title}
                      </span>
                      <span className="text-[11px] text-text-secondary font-medium mt-0.5 block">
                        Status: {t.status === 'COMPLETED' ? 'Completed' : t.status === 'IN_PROGRESS' ? 'In progress' : 'To do'} | Priority: {t.priority === 'HIGH' ? 'High' : t.priority === 'MEDIUM' ? 'Medium' : 'Low'}
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-text-secondary group-hover:text-primary-blue flex-shrink-0 transition-colors" />
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      )}

      {/* CREATE PROJECT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setShowCreateModal(false)} />
          
          <Card className="relative w-full max-w-md bg-card-bg border-4 border-border p-8 z-10 animate-fade-in text-canvas-fg" shadow="lg">
            <h3 className="text-2xl font-bold tracking-tight mb-2 text-canvas-fg">Create project</h3>
            <p className="text-xs text-text-secondary font-medium mb-6">Initialize a new workspace board</p>

            {formError && (
              <div className="bg-primary-red/10 border-2 border-primary-red text-primary-red p-3 font-bold text-sm mb-6">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateProject} className="flex flex-col gap-5">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-canvas-fg">Project name</label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full text-sm font-medium bg-canvas-bg text-canvas-fg border-2 border-border p-2"
                  placeholder="e.g. Authentication System"
                  required
                  disabled={formSubmitting}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-canvas-fg">Description</label>
                <textarea
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  className="w-full text-sm font-medium bg-canvas-bg text-canvas-fg border-2 border-border p-2 resize-none h-24"
                  placeholder="Summarize the project's goal..."
                  disabled={formSubmitting}
                />
              </div>

              <div className="flex justify-end gap-3 mt-2">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setShowCreateModal(false)}
                  disabled={formSubmitting}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="primary"
                  disabled={formSubmitting}
                >
                  {formSubmitting ? 'Creating...' : 'Create'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};
