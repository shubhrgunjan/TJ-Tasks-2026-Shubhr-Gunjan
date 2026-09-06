import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserProfile } from '../services/users';
import { getUserProjects } from '../services/projects';
import { createOrGetDMConversation } from '../services/chat';
import { subscribeUserProjectTasks } from '../services/tasks';
import { UserProfile, Project, Task, ActivityLog } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Mail, Calendar, MessageSquare, Edit3, Folder, CheckSquare, Clock, Activity, Award } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const { profile: myProfile } = useAuth();
  const navigate = useNavigate();

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [assignedTasks, setAssignedTasks] = useState<Task[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  const isMe = myProfile?.uid === userId;

  useEffect(() => {
    let unsubTasks: (() => void) | null = null;

    const loadProfileData = async () => {
      if (!userId) return;
      setLoading(true);
      try {
        // 1. Fetch User Profile
        const prof = await getUserProfile(userId);
        if (!prof) {
          setLoading(false);
          return;
        }
        setUserProfile(prof);

        // 2. Fetch User Projects
        const userProjects = await getUserProjects(userId);
        setProjects(userProjects);

        // 3. Real-time tasks subscription across user projects
        const pids = userProjects.map(p => p.id);
        unsubTasks = subscribeUserProjectTasks(pids, (tasks) => {
          // Filter tasks assigned to or created by this user
          const userAssigned = tasks.filter(t => t.assigneeId === userId);
          setAssignedTasks(userAssigned);
        });

        // Fallback or addition: direct query for tasks assigned to this user across all projects
        try {
          const tasksColl = collection(db, 'tasks');
          const taskQ = query(tasksColl, where('assigneeId', '==', userId));
          const tasksSnap = await getDocs(taskQ);
          const directTasks: Task[] = [];
          tasksSnap.forEach((doc) => {
            directTasks.push(doc.data() as Task);
          });

          setAssignedTasks(prev => {
            const combinedMap = new Map<string, Task>();
            prev.forEach(t => combinedMap.set(t.id, t));
            directTasks.forEach(t => combinedMap.set(t.id, t));
            return Array.from(combinedMap.values());
          });
        } catch (tErr) {
          console.warn('Direct task query fallback check:', tErr);
        }

        // 4. Fetch Workspace Activity (actorId == userId OR in user's projects)
        const actColl = collection(db, 'activity');
        const actMap = new Map<string, ActivityLog>();

        // Query by actorId
        try {
          const actorQ = query(actColl, where('actorId', '==', userId));
          const actorSnap = await getDocs(actorQ);
          actorSnap.forEach((doc) => {
            const data = doc.data() as ActivityLog;
            actMap.set(data.id, data);
          });
        } catch (aErr) {
          console.warn('Error querying activities by actorId:', aErr);
        }

        // Also query by projects (if any)
        for (const pid of pids) {
          try {
            const projQ = query(actColl, where('projectId', '==', pid));
            const projSnap = await getDocs(projQ);
            projSnap.forEach((doc) => {
              const data = doc.data() as ActivityLog;
              actMap.set(data.id, data);
            });
          } catch (pErr) {
            console.warn(`Error querying activities for project ${pid}:`, pErr);
          }
        }

        const sortedActivities = Array.from(actMap.values())
          .sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0))
          .slice(0, 20);

        setActivities(sortedActivities);

      } catch (err) {
        console.error('Error loading profile data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProfileData();

    return () => {
      if (unsubTasks) unsubTasks();
    };
  }, [userId]);

  const handleSendMessage = async () => {
    if (!myProfile || !userId) return;
    try {
      const convId = await createOrGetDMConversation(myProfile.uid, userId);
      navigate(`/app/chat?conv=${convId}`);
    } catch (e) {
      console.error('Error initiating DM chat:', e);
    }
  };

  const getActivityBadge = (type: string) => {
    switch (type) {
      case 'TASK_COMPLETE':
        return <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0" />;
      case 'TASK_DELETE':
        return <span className="w-2.5 h-2.5 rounded-full bg-primary-red flex-shrink-0" />;
      case 'PROJECT_CREATE':
      case 'TASK_CREATE':
        return <span className="w-2.5 h-2.5 bg-primary-blue flex-shrink-0" />;
      default:
        return <span className="w-2.5 h-2.5 bg-primary-yellow flex-shrink-0" />;
    }
  };

  const formatActivityText = (log: ActivityLog) => {
    switch (log.type) {
      case 'PROJECT_CREATE':
        return `Created project "${log.metadata.projectName || 'Untitled'}"`;
      case 'PROJECT_MEMBER_ADD':
        return `Added ${log.metadata.memberName || 'a member'} to "${log.metadata.projectName || 'project'}"`;
      case 'TASK_CREATE':
        return `Created task "${log.metadata.taskTitle || 'Untitled'}"`;
      case 'TASK_STATUS_CHANGE':
        return `Moved "${log.metadata.taskTitle || 'task'}" to ${log.metadata.newValue || 'new status'}`;
      case 'TASK_PRIORITY_CHANGE':
        return `Updated priority of "${log.metadata.taskTitle || 'task'}" to ${log.metadata.newValue}`;
      case 'TASK_ASSIGN':
        return `Assigned "${log.metadata.taskTitle || 'task'}" to ${log.metadata.assigneeName || 'team member'}`;
      case 'TASK_DELETE':
        return `Deleted task "${log.metadata.taskTitle || 'task'}"`;
      case 'COMMENT_ADD':
        return `Commented on "${log.metadata.taskTitle || 'task'}"`;
      case 'INVITATION_SEND':
        return `Sent invitation to ${log.metadata.memberName || 'user'}`;
      case 'INVITATION_ACCEPT':
        return `Accepted project invitation`;
      default:
        return `Updated workspace activity`;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="flex gap-3 items-end mb-4">
          <div className="w-3.5 h-3.5 rounded-full bg-primary-red animate-bounce" />
          <div className="w-3.5 h-3.5 bg-primary-yellow animate-bounce [animation-delay:0.15s]" />
          <div className="w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-b-[12px] border-b-primary-blue animate-bounce [animation-delay:0.3s]" />
        </div>
        <span className="font-bold text-sm text-canvas-fg">Loading workspace profile...</span>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <Card className="p-8 max-w-md mx-auto text-center border-4 bg-card-bg text-canvas-fg" accent="red" shadow="lg">
        <h3 className="text-xl font-bold tracking-tight text-canvas-fg">Profile not found</h3>
        <p className="text-xs text-text-secondary font-medium mt-2">
          The requested workspace user profile could not be loaded.
        </p>
        <Button variant="outline" size="sm" onClick={() => navigate('/app/dashboard')} className="mt-6 mx-auto">
          Back to dashboard
        </Button>
      </Card>
    );
  }

  // Calc metrics
  const activeTasksCount = assignedTasks.filter(t => t.status !== 'COMPLETED').length;
  const completedTasksCount = assignedTasks.filter(t => t.status === 'COMPLETED').length;

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-8 animate-fade-in">
      {/* Profile Header Card */}
      <Card className="bg-card-bg border-2 border-border p-8 relative overflow-hidden text-canvas-fg" shadow="lg" accent="blue">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
            <div className="w-20 h-20 border-4 border-border bg-gradient-to-br from-primary-blue to-indigo-600 text-white flex items-center justify-center font-black text-3xl shadow-md select-none">
              {userProfile.displayName.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-3 justify-center sm:justify-start">
                <h1 className="text-3xl font-black tracking-tight text-canvas-fg">
                  {userProfile.displayName}
                </h1>
                {userProfile.isPro && (
                  <span className="px-2 py-0.5 border text-[10px] font-black bg-primary-yellow text-canvas-fg border-border shadow-2xs">
                    PRO
                  </span>
                )}
                {isMe && (
                  <span className="px-2 py-0.5 border text-[10px] font-bold bg-canvas-bg text-canvas-fg border-border">
                    You
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs font-semibold text-text-secondary mt-2">
                <span className="flex items-center gap-1.5 bg-canvas-bg px-2.5 py-1 border border-border">
                  <Mail className="w-3.5 h-3.5 text-primary-red" />
                  {userProfile.email}
                </span>
                <span className="flex items-center gap-1.5 bg-canvas-bg px-2.5 py-1 border border-border">
                  <Calendar className="w-3.5 h-3.5 text-primary-blue" />
                  Joined {userProfile.createdAt ? new Date(userProfile.createdAt.toMillis()).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Recently'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-center flex-shrink-0">
            {isMe ? (
              <Button variant="outline" size="sm" onClick={() => navigate('/app/settings')}>
                <Edit3 className="w-4 h-4 text-primary-blue" />
                <span>Edit profile</span>
              </Button>
            ) : (
              <Button variant="primary" size="sm" onClick={handleSendMessage}>
                <MessageSquare className="w-4 h-4" />
                <span>Send message</span>
              </Button>
            )}
          </div>
        </div>

        {/* Bio Section */}
        <div className="mt-8 border-t-2 border-border pt-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-2 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-primary-yellow" />
            <span>Biography</span>
          </h3>
          <p className="text-sm font-medium text-canvas-fg bg-canvas-bg p-4 border-2 border-dashed border-border leading-relaxed">
            {userProfile.bio || 'No biography details provided.'}
          </p>
        </div>
      </Card>

      {/* Grid Statistics Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="p-6 bg-card-bg border-2 border-border hover:-translate-y-[1px] transition-all" shadow="md" accent="red">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">Assigned tasks</span>
            <div className="p-2 border border-primary-red/30 bg-primary-red/10 text-primary-red">
              <CheckSquare className="w-5 h-5" />
            </div>
          </div>
          <span className="text-4xl font-black mt-3 text-canvas-fg block">{assignedTasks.length}</span>
        </Card>

        <Card className="p-6 bg-card-bg border-2 border-border hover:-translate-y-[1px] transition-all" shadow="md" accent="blue">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">Current active</span>
            <div className="p-2 border border-primary-blue/30 bg-primary-blue/10 text-primary-blue">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <span className="text-4xl font-black mt-3 text-canvas-fg block">{activeTasksCount}</span>
        </Card>

        <Card className="p-6 bg-card-bg border-2 border-border hover:-translate-y-[1px] transition-all" shadow="md" accent="green">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">Completed work</span>
            <div className="p-2 border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckSquare className="w-5 h-5" />
            </div>
          </div>
          <span className="text-4xl font-black mt-3 text-canvas-fg block">{completedTasksCount}</span>
        </Card>
      </div>

      {/* Main Split: Projects and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Active Projects list */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b-2 border-border pb-2">
            <h2 className="text-xl font-bold tracking-tight text-canvas-fg flex items-center gap-2">
              <Folder className="w-5 h-5 text-primary-blue" />
              <span>Active projects</span>
            </h2>
            <span className="text-xs font-bold bg-primary-blue/10 border border-primary-blue px-2 py-0.5 text-primary-blue">
              {projects.length}
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {projects.length === 0 ? (
              <Card className="p-6 text-center bg-card-bg border-2" shadow="sm">
                <div className="text-xs text-text-secondary font-medium">
                  Not a member of any projects
                </div>
              </Card>
            ) : (
              projects.map(proj => (
                <Card 
                  key={proj.id} 
                  accent="indigo"
                  className="bg-card-bg border-2 border-border hover:-translate-x-[1px] hover:-translate-y-[1px] cursor-pointer hover:shadow-md transition-all p-4" 
                  shadow="sm"
                  onClick={() => navigate(`/app/projects/${proj.id}`)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-xs text-canvas-fg truncate">
                      {proj.name}
                    </span>
                    <span className={`text-[10px] border px-2 py-0.5 font-bold ${
                      proj.ownerId === userId 
                        ? 'bg-primary-yellow text-canvas-fg border-border' 
                        : 'bg-canvas-bg text-text-secondary border-border'
                    }`}>
                      {proj.ownerId === userId ? 'Owner' : 'Member'}
                    </span>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Activity feed */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b-2 border-border pb-2">
            <h2 className="text-xl font-bold tracking-tight text-canvas-fg flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary-red" />
              <span>Workspace activity</span>
            </h2>
            <span className="text-xs font-bold bg-primary-red/10 border border-primary-red px-2 py-0.5 text-primary-red">
              {activities.length} entries
            </span>
          </div>

          <Card className="p-5 bg-card-bg border-2 border-border" shadow="sm">
            <div className="flex flex-col gap-3.5 max-h-[420px] overflow-y-auto pr-1">
              {activities.length === 0 ? (
                <div className="text-xs text-text-secondary font-medium py-8 text-center">
                  No activity recorded yet in workspace projects
                </div>
              ) : (
                activities.map(log => (
                  <div 
                    key={log.id} 
                    className="text-xs text-canvas-fg font-medium border-b border-border/60 pb-3 last:border-b-0 last:pb-0 flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {getActivityBadge(log.type)}
                      <span className="truncate group-hover:text-primary-blue transition-colors font-semibold">
                        {formatActivityText(log)}
                      </span>
                    </div>
                    <span className="text-[11px] text-text-secondary font-medium flex-shrink-0 bg-canvas-bg px-2 py-0.5 border border-border">
                      {log.createdAt ? (
                        <>
                          {new Date(log.createdAt.toMillis()).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}{' '}
                          {new Date(log.createdAt.toMillis()).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </>
                      ) : 'Just now'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
