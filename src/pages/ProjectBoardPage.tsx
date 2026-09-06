import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link, useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProject } from '../context/ProjectContext';
import { getProject } from '../services/projects';
import { removeProjectMember } from '../services/projects';
import { sendInvitation, getProjectInvitations, cancelInvitation } from '../services/invitations';
import { createTask, updateTask, deleteTask, subscribeProjectTasks } from '../services/tasks';
import { getProjectActivity } from '../services/activity';
import { getAllUsers } from '../services/users';
import { 
  addTaskComment, 
  updateTaskComment, 
  deleteTaskComment, 
  subscribeTaskComments 
} from '../services/comments';
import { 
  subscribeMessages, 
  sendMessage 
} from '../services/chat';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { PriorityBadge } from '../components/ui/PriorityBadge';
import { Task, TaskStatus, TaskPriority, UserProfile, ActivityLog, Invitation, TaskComment, ChatMessage } from '../types';
import { Timestamp } from 'firebase/firestore';
import { 
  Plus, Search, UserPlus, Filter, Calendar, 
  Trash2, X, Info, ChevronRight, CheckSquare, Clock, User, 
  MessageSquare, Edit3, Send, Shield, Users, ArrowLeft, Trash, AlertTriangle
} from 'lucide-react';

export const ProjectBoardPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { profile } = useAuth();
  const { currentProject, setCurrentProjectId, refreshCurrentProject } = useProject();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const location = useLocation();

  // Active Workspace tab: 'board' | 'chat' | 'activity' | 'members'
  const [activeTab, setActiveTab] = useState<'board' | 'chat' | 'activity' | 'members'>('board');

  useEffect(() => {
    if (location.pathname.endsWith('/chat')) {
      setActiveTab('chat');
    } else if (location.pathname.endsWith('/activity')) {
      setActiveTab('activity');
    } else if (location.pathname.endsWith('/members')) {
      setActiveTab('members');
    } else {
      setActiveTab('board');
    }
  }, [location.pathname]);

  const handleTabClick = (tab: 'board' | 'chat' | 'activity' | 'members') => {
    if (tab === 'board') {
      navigate(`/app/projects/${projectId}`);
    } else {
      navigate(`/app/projects/${projectId}/${tab}`);
    }
  };

  // Tasks & Users State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [boardError, setBoardError] = useState<string | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('ALL');
  const [filterAssignee, setFilterAssignee] = useState<string>('ALL');

  // Drag and drop hover indicators
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);

  // Create Task Modal State
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPriority, setTaskPriority] = useState<TaskPriority>('MEDIUM');
  const [taskAssignee, setTaskAssignee] = useState<string>('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskSubmitting, setTaskSubmitting] = useState(false);

  // Members Management State
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
  const [projectInvites, setProjectInvites] = useState<Invitation[]>([]);

  // Task Details Drawer State
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editPriority, setEditPriority] = useState<TaskPriority>('MEDIUM');
  const [editAssignee, setEditAssignee] = useState<string>('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editStatus, setEditStatus] = useState<TaskStatus>('TODO');
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Task Comments State
  const [taskComments, setTaskComments] = useState<TaskComment[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');

  // Delete Confirmation State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Project Chat panel sidebar state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInputText, setChatInputText] = useState('');
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);

  // Sync Project Context & load data
  useEffect(() => {
    if (projectId) {
      setCurrentProjectId(projectId);
      loadStaticData();
      setBoardError(null);
      
      // Subscribe to real-time task updates
      const unsubscribe = subscribeProjectTasks(projectId, (updatedTasks) => {
        setTasks(updatedTasks);
        setLoading(false);

        // Check if "?task=ID" parameter matches on load
        const targetTaskId = searchParams.get('task');
        if (targetTaskId) {
          const matched = updatedTasks.find(t => t.id === targetTaskId);
          if (matched && (!selectedTask || selectedTask.id !== targetTaskId)) {
            handleOpenTaskDetails(matched);
          }
        }
      }, (err) => {
        console.error(err);
        setBoardError('Database permissions denied. Please make sure firestore.rules are deployed to Firebase.');
        setLoading(false);
      });

      // Load activity log
      loadActivities();

      // Subscribe to project chat messages
      const unsubscribeChat = subscribeMessages('PROJECT', projectId, (msgs) => {
        setChatMessages(msgs);
        scrollChatToBottom();
      });

      return () => {
        unsubscribe();
        unsubscribeChat();
      };
    }
  }, [projectId, searchParams, location.pathname]);

  const loadStaticData = async () => {
    try {
      const allUsers = await getAllUsers();
      setUsers(allUsers);

      if (projectId) {
        const invites = await getProjectInvitations(projectId);
        setProjectInvites(invites);
      }
    } catch (e) {
      console.error('Error loading users:', e);
    }
  };

  const loadActivities = async () => {
    if (projectId) {
      const logs = await getProjectActivity(projectId);
      setActivities(logs);
    }
  };

  // Subscribe to task comments when task drawer opens
  useEffect(() => {
    if (selectedTask) {
      const unsubscribeComments = subscribeTaskComments(selectedTask.id, (commentsList) => {
        setTaskComments(commentsList);
      });
      return () => unsubscribeComments();
    } else {
      setTaskComments([]);
    }
  }, [selectedTask]);

  // Drag and Drop Mechanics (HTML5)
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDragOver = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    if (dragOverColumn !== status) {
      setDragOverColumn(status);
    }
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault();
    setDragOverColumn(null);
    const taskId = e.dataTransfer.getData('text/plain');
    if (!taskId || !projectId || !profile) return;

    const task = tasks.find(t => t.id === taskId);
    if (!task || task.status === targetStatus) return;

    try {
      await updateTask(taskId, projectId, { status: targetStatus }, profile.uid, profile.displayName);
      await loadActivities();
    } catch (err) {
      console.error('Error dragging task status:', err);
    }
  };

  // Create Task Form Submit
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !projectId) return;
    if (!taskTitle.trim()) return;

    setTaskSubmitting(true);
    try {
      const dueDateTimestamp = taskDueDate ? Timestamp.fromDate(new Date(taskDueDate)) : null;
      await createTask({
        projectId,
        title: taskTitle.trim(),
        description: taskDesc.trim(),
        priority: taskPriority,
        assigneeId: taskAssignee || null,
        dueDate: dueDateTimestamp
      }, profile.uid, profile.displayName);

      setTaskTitle('');
      setTaskDesc('');
      setTaskPriority('MEDIUM');
      setTaskAssignee('');
      setTaskDueDate('');
      setShowCreateTask(false);
      await loadActivities();
    } catch (err) {
      console.error(err);
    } finally {
      setTaskSubmitting(false);
    }
  };

  // Project invitation handling
  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !projectId || !currentProject) return;
    if (!inviteEmail.trim()) return;

    setInviteLoading(true);
    setInviteError(null);
    setInviteSuccess(null);

    try {
      await sendInvitation(
        projectId,
        inviteEmail.trim(),
        profile.uid,
        profile.displayName
      );
      setInviteSuccess('Project invitation sent successfully!');
      setInviteEmail('');
      loadStaticData();
      await loadActivities();
    } catch (err: any) {
      console.error(err);
      setInviteError(err.message || 'Failed to send invitation.');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    try {
      await cancelInvitation(inviteId);
      loadStaticData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleRemoveMember = async (userId: string, userName: string) => {
    if (!projectId || !profile) return;
    if (confirm(`Remove member ${userName} from the project?`)) {
      try {
        await removeProjectMember(projectId, userId, userName, profile.uid, profile.displayName);
        await refreshCurrentProject();
        loadStaticData();
        await loadActivities();
      } catch (e) {
        console.error(e);
      }
    }
  };

  // Open Task Drawer Details
  const handleOpenTaskDetails = (task: Task) => {
    setSelectedTask(task);
    setEditTitle(task.title);
    setEditDesc(task.description);
    setEditPriority(task.priority);
    setEditAssignee(task.assigneeId || '');
    setEditStatus(task.status);
    
    if (task.dueDate) {
      const d = new Date(task.dueDate.toMillis());
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      setEditDueDate(`${year}-${month}-${day}`);
    } else {
      setEditDueDate('');
    }
    setEditMode(false);
    setSearchParams({ task: task.id });
  };

  const handleCloseTaskDetails = () => {
    setSelectedTask(null);
    setEditMode(false);
    searchParams.delete('task');
    setSearchParams(searchParams);
  };

  // Save Task Updates
  const handleSaveTaskEdits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !profile || !projectId) return;

    setEditSubmitting(true);
    try {
      const dueDateTimestamp = editDueDate ? Timestamp.fromDate(new Date(editDueDate)) : null;
      
      const updates = {
        title: editTitle.trim(),
        description: editDesc.trim(),
        priority: editPriority,
        assigneeId: editAssignee || null,
        status: editStatus,
        dueDate: dueDateTimestamp
      };

      await updateTask(selectedTask.id, projectId, updates, profile.uid, profile.displayName);
      
      setSelectedTask({
        ...selectedTask,
        ...updates
      });

      setEditMode(false);
      await loadActivities();
    } catch (err) {
      console.error(err);
    } finally {
      setEditSubmitting(false);
    }
  };

  // Delete Task Submit
  const handleDeleteTask = async () => {
    if (!selectedTask || !profile || !projectId) return;
    try {
      await deleteTask(selectedTask.id, projectId, selectedTask.title, profile.uid, profile.displayName);
      handleCloseTaskDetails();
      setShowDeleteConfirm(false);
      await loadActivities();
    } catch (err) {
      console.error(err);
    }
  };

  // Task comments actions
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !profile || !projectId || !newCommentText.trim()) return;

    try {
      await addTaskComment(
        selectedTask.id,
        projectId,
        selectedTask.title,
        profile.uid,
        profile.displayName,
        newCommentText.trim()
      );
      setNewCommentText('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveCommentEdit = async (commentId: string) => {
    if (!selectedTask || !editingCommentText.trim()) return;
    try {
      await updateTaskComment(selectedTask.id, commentId, editingCommentText.trim());
      setEditingCommentId(null);
      setEditingCommentText('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!selectedTask) return;
    if (confirm('Delete this comment permanently?')) {
      try {
        await deleteTaskComment(selectedTask.id, commentId);
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Project Chat send action
  const handleSendChatMsg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !profile || !chatInputText.trim()) return;

    try {
      await sendMessage('PROJECT', projectId, profile.uid, profile.displayName, chatInputText.trim());
      setChatInputText('');
      scrollChatToBottom();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateTaskFromChat = (msgText: string) => {
    setTaskTitle('Task from Chat');
    setTaskDesc(msgText);
    setShowCreateTask(true);
  };

  const scrollChatToBottom = () => {
    setTimeout(() => {
      chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const toggleChatPanel = () => {
    if (activeTab === 'chat') {
      navigate(`/app/projects/${projectId}`);
    } else {
      navigate(`/app/projects/${projectId}/chat`);
    }
  };

  // Map user ID to displayName
  const getUserName = (uid: string | null) => {
    if (!uid) return 'Unassigned';
    const found = users.find(u => u.uid === uid);
    return found ? found.displayName : 'Unknown';
  };

  const formatRelativeTime = (timestamp: any) => {
    if (!timestamp) return '';
    const diff = Date.now() - timestamp.toMillis();
    const secs = Math.floor(diff / 1000);
    const mins = Math.floor(secs / 60);
    const hours = Math.floor(mins / 60);

    if (secs < 60) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return new Date(timestamp.toMillis()).toLocaleDateString();
  };

  // Filter Tasks list
  const filteredTasks = tasks.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = filterPriority === 'ALL' || t.priority === filterPriority;
    const matchesAssignee = filterAssignee === 'ALL' || 
      (filterAssignee === 'UNASSIGNED' && !t.assigneeId) || 
      t.assigneeId === filterAssignee;
    return matchesSearch && matchesPriority && matchesAssignee;
  });

  const getColumnTasks = (status: TaskStatus) => {
    return filteredTasks.filter(t => t.status === status);
  };

  // Clickable logs link parsing component
  const ActivityLogRow: React.FC<{ log: ActivityLog }> = ({ log }) => {
    const actorLink = <Link to={`/app/profile/${log.actorId}`} className="text-canvas-fg hover:underline font-bold">{log.actorName}</Link>;
    
    const taskLink = log.taskId ? (
      <button 
        onClick={() => {
          const taskObj = tasks.find(t => t.id === log.taskId);
          if (taskObj) handleOpenTaskDetails(taskObj);
        }} 
        className="text-primary-red hover:underline font-bold cursor-pointer inline"
      >
        "{log.metadata.taskTitle}"
      </button>
    ) : (
      <span className="font-semibold text-text-secondary">"{log.metadata.taskTitle || 'Task'}"</span>
    );

    const getLogText = () => {
      switch (log.type) {
        case 'PROJECT_CREATE':
          return <span> created project "{log.metadata.projectName}"</span>;
        case 'PROJECT_MEMBER_ADD':
          return <span> added member {log.metadata.memberName}</span>;
        case 'PROJECT_MEMBER_REMOVE':
          return <span> removed member {log.metadata.memberName}</span>;
        case 'TASK_CREATE':
          return <span> created task {taskLink}</span>;
        case 'TASK_STATUS_CHANGE':
          return <span> moved {taskLink} to {log.metadata.newValue}</span>;
        case 'TASK_PRIORITY_CHANGE':
          return <span> updated priority of {taskLink} to {log.metadata.newValue}</span>;
        case 'TASK_ASSIGN':
          return <span> assigned {taskLink} to {log.metadata.assigneeName}</span>;
        case 'TASK_DELETE':
          return <span> deleted task "{log.metadata.taskTitle}"</span>;
        case 'COMMENT_ADD':
          return <span> commented on {taskLink}</span>;
        case 'INVITATION_SEND':
          return <span> invited member {log.metadata.memberName}</span>;
        case 'INVITATION_ACCEPT':
          return <span> joined project via invitation</span>;
        default:
          return <span> triggered a system log</span>;
      }
    };

    return (
      <div className="text-xs text-canvas-fg font-medium tracking-wide border-b border-border pb-3 last:border-b-0 last:pb-0 flex items-center justify-between gap-4 select-none">
        <div className="flex items-center gap-2 truncate">
          <span className="w-1.5 h-1.5 bg-primary-blue rounded-full flex-shrink-0" />
          <span className="truncate">
            {actorLink}
            {getLogText()}
          </span>
        </div>
        <span className="text-[11px] text-text-secondary flex-shrink-0">
          {new Date(log.createdAt.toMillis()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    );
  };

  if (loading || !currentProject) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="flex gap-3 items-end mb-4">
          <div className="w-3 h-3 rounded-full bg-primary-red animate-bounce" />
          <div className="w-3 h-3 bg-primary-yellow animate-bounce [animation-delay:0.15s]" />
          <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[10px] border-b-primary-blue animate-bounce [animation-delay:0.3s]" />
        </div>
        <span className="font-medium text-sm text-text-secondary">Syncing board...</span>
      </div>
    );
  }

  const isOwner = currentProject.ownerId === profile?.uid;

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto h-full overflow-hidden">
      
      {/* Board Header Details */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b-2 border-border pb-4 select-none flex-shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-canvas-fg">{currentProject.name}</h1>
          <p className="text-sm text-text-secondary mt-1">{currentProject.description || 'No description provided.'}</p>
        </div>
        
        <div className="flex gap-3 items-center flex-wrap">
          <div 
            onClick={() => setActiveTab('members')}
            className="flex -space-x-2 mr-2 cursor-pointer hover:opacity-80 transition-opacity"
            title="Manage Workspace Members"
          >
            <div className="w-8 h-8 rounded-full border-2 border-border bg-primary-red text-white flex items-center justify-center text-xs font-bold">
              {getUserName(currentProject.ownerId).substring(0,2).toUpperCase()}
            </div>
            {currentProject.memberIds.slice(0, 4).map((mid) => (
              <div 
                key={mid}
                className="w-8 h-8 rounded-full border-2 border-border bg-card-bg flex items-center justify-center text-xs font-bold text-canvas-fg"
              >
                {getUserName(mid).substring(0,2).toUpperCase()}
              </div>
            ))}
            {currentProject.memberIds.length > 4 && (
              <div className="w-8 h-8 rounded-full border-2 border-border bg-card-bg flex items-center justify-center text-xs font-bold text-canvas-fg">
                +{currentProject.memberIds.length - 4}
              </div>
            )}
          </div>

          <Button variant="outline" size="sm" onClick={() => handleTabClick('members')} className={activeTab === 'members' ? 'bg-primary-blue text-white shadow-sm' : ''}>
            <Users className="w-4 h-4" />
            <span>Teammates</span>
          </Button>

          <Button variant="outline" size="sm" onClick={toggleChatPanel} className={activeTab === 'chat' ? 'bg-primary-yellow text-canvas-fg shadow-sm' : ''}>
            <MessageSquare className="w-4 h-4" />
            <span>Chat</span>
          </Button>

          <Button variant="primary" size="sm" onClick={() => setShowCreateTask(true)}>
            <Plus className="w-4 h-4" />
            <span>Add Task</span>
          </Button>
        </div>
      </div>

      {/* View Tabs Selector */}
      <div className="flex border-b-2 border-border select-none bg-card-bg flex-shrink-0">
        <button
          onClick={() => handleTabClick('board')}
          className={`px-5 py-2.5 text-xs font-bold border-r-2 border-border active:translate-y-[1px] cursor-pointer transition-colors ${
            activeTab === 'board' ? 'bg-primary-blue text-white' : 'text-canvas-fg hover:bg-surface-hover'
          }`}
        >
          Kanban Board
        </button>
        <button
          onClick={() => handleTabClick('chat')}
          className={`px-5 py-2.5 text-xs font-bold border-r-2 border-border active:translate-y-[1px] cursor-pointer transition-colors ${
            activeTab === 'chat' ? 'bg-primary-blue text-white' : 'text-canvas-fg hover:bg-surface-hover'
          }`}
        >
          Project Chat
        </button>
        <button
          onClick={() => handleTabClick('activity')}
          className={`px-5 py-2.5 text-xs font-bold border-r-2 border-border active:translate-y-[1px] cursor-pointer transition-colors ${
            activeTab === 'activity' ? 'bg-primary-blue text-white' : 'text-canvas-fg hover:bg-surface-hover'
          }`}
        >
          Board Activity
        </button>
        <button
          onClick={() => handleTabClick('members')}
          className={`px-5 py-2.5 text-xs font-bold active:translate-y-[1px] cursor-pointer transition-colors ${
            activeTab === 'members' ? 'bg-primary-blue text-white' : 'text-canvas-fg hover:bg-surface-hover'
          }`}
        >
          Teammates & Invites
        </button>
      </div>

      {boardError && (
        <Card className="bg-primary-red/10 border-4 p-6 select-none flex-shrink-0" shadow="md" accent="red">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-primary-red flex-shrink-0" />
            <div>
              <h3 className="font-bold text-sm text-canvas-fg">Firebase Rules Required</h3>
              <p className="text-xs text-text-secondary mt-1">
                {boardError} Deploy rules from your console or run:
              </p>
              <pre className="bg-card-bg border-2 border-border p-2 text-[10px] font-mono mt-2 select-all w-fit text-canvas-fg">
                firebase deploy --only firestore:rules
              </pre>
            </div>
          </div>
        </Card>
      )}

      {/* Main Split container: Active Tab View / Chat Panel */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 items-stretch overflow-hidden pb-4">
        
        {/* LEFT COMPONENT: Depends on activeTab */}
        <div className="flex-1 min-w-0 flex flex-col gap-6 overflow-hidden">
          
          {/* TAB 1: KANBAN BOARD */}
          {activeTab === 'board' && (
            <div className="flex-1 flex flex-col gap-4 overflow-hidden animate-fade-in">
              {/* Search and Filters Bar */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center bg-card-bg border-2 border-border p-4 shadow-sm select-none flex-shrink-0">
                <div className="md:col-span-2 relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 py-1.5 text-xs font-medium shadow-none border-2 bg-canvas-bg text-canvas-fg"
                    placeholder="Search by task title..."
                  />
                </div>

                <div>
                  <select
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value)}
                    className="w-full py-1.5 text-xs font-medium shadow-none border-2 bg-canvas-bg text-canvas-fg"
                  >
                    <option value="ALL">All priorities</option>
                    <option value="HIGH">High priority</option>
                    <option value="MEDIUM">Medium priority</option>
                    <option value="LOW">Low priority</option>
                  </select>
                </div>

                <div>
                  <select
                    value={filterAssignee}
                    onChange={(e) => setFilterAssignee(e.target.value)}
                    className="w-full py-1.5 text-xs font-medium shadow-none border-2 bg-canvas-bg text-canvas-fg"
                  >
                    <option value="ALL">All assignees</option>
                    <option value="UNASSIGNED">Unassigned</option>
                    {users.map(u => (
                      <option key={u.uid} value={u.uid}>{u.displayName}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Kanban columns - Side-by-side flex layout with viewport bounding */}
              <div className="flex-1 flex flex-col md:flex-row gap-6 overflow-x-auto overflow-y-hidden items-stretch h-[480px]">
                
                {/* TODO COLUMN */}
                <div 
                  className={`flex-1 flex flex-col border-2 border-t-4 border-t-indigo-600 p-4 bg-card-bg min-w-[250px] transition-colors duration-150 ${
                    dragOverColumn === 'TODO' ? 'border-primary-yellow bg-primary-yellow/5 border-dashed border-4' : 'border-border'
                  }`}
                  onDragOver={(e) => handleDragOver(e, 'TODO')}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, 'TODO')}
                >
                  <div className="flex items-center justify-between border-b-2 border-border pb-2 mb-3 select-none flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="text-indigo-600 font-black text-sm">●</span>
                      <h3 className="font-bold text-sm text-canvas-fg">To do</h3>
                    </div>
                    <span className="bg-canvas-bg px-2 py-0.5 border text-xs font-bold text-indigo-600 dark:text-indigo-400 border-indigo-600/30">
                      {getColumnTasks('TODO').length}
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3 scrollbar-thin">
                    {getColumnTasks('TODO').length === 0 ? (
                      <div className="text-center py-12 text-xs font-medium text-text-secondary select-none border-2 border-dashed border-border flex-1 flex items-center justify-center">
                        No tasks here yet
                      </div>
                    ) : (
                      getColumnTasks('TODO').map(task => (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, task.id)}
                          onClick={() => handleOpenTaskDetails(task)}
                          className="bg-canvas-bg border-2 border-border border-l-4 border-l-indigo-500 p-3 shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing hover:-translate-x-[1px] hover:-translate-y-[1px] transition-all duration-100 flex flex-col gap-2 flex-shrink-0"
                        >
                          <h4 className="font-bold text-xs text-canvas-fg line-clamp-2 select-all select-none">
                            {task.title}
                          </h4>
                          <div className="flex justify-between items-center text-[11px] text-text-secondary pt-2 border-t border-border select-none">
                            <PriorityBadge priority={task.priority} showText={false} />
                            <div className="flex items-center gap-1.5">
                              <User className="w-3 h-3 text-indigo-500" />
                              <span className="max-w-[100px] truncate">
                                {getUserName(task.assigneeId)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* IN_PROGRESS COLUMN */}
                <div 
                  className={`flex-1 flex flex-col border-2 border-t-4 border-t-amber-500 p-4 bg-card-bg min-w-[250px] transition-colors duration-150 ${
                    dragOverColumn === 'IN_PROGRESS' ? 'border-primary-yellow bg-primary-yellow/5 border-dashed border-4' : 'border-border'
                  }`}
                  onDragOver={(e) => handleDragOver(e, 'IN_PROGRESS')}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, 'IN_PROGRESS')}
                >
                  <div className="flex items-center justify-between border-b-2 border-border pb-2 mb-3 select-none flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="text-amber-500 font-black text-sm">■</span>
                      <h3 className="font-bold text-sm text-canvas-fg">In progress</h3>
                    </div>
                    <span className="bg-canvas-bg px-2 py-0.5 border text-xs font-bold text-amber-600 dark:text-amber-400 border-amber-500/30">
                      {getColumnTasks('IN_PROGRESS').length}
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3 scrollbar-thin">
                    {getColumnTasks('IN_PROGRESS').length === 0 ? (
                      <div className="text-center py-12 text-xs font-medium text-text-secondary select-none border-2 border-dashed border-border flex-1 flex items-center justify-center">
                        No tasks here yet
                      </div>
                    ) : (
                      getColumnTasks('IN_PROGRESS').map(task => (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, task.id)}
                          onClick={() => handleOpenTaskDetails(task)}
                          className="bg-canvas-bg border-2 border-border border-l-4 border-l-amber-500 p-3 shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing hover:-translate-x-[1px] hover:-translate-y-[1px] transition-all duration-100 flex flex-col gap-2 flex-shrink-0"
                        >
                          <h4 className="font-bold text-xs text-canvas-fg line-clamp-2 select-all select-none">
                            {task.title}
                          </h4>
                          <div className="flex justify-between items-center text-[11px] text-text-secondary pt-2 border-t border-border select-none">
                            <PriorityBadge priority={task.priority} showText={false} />
                            <div className="flex items-center gap-1.5">
                              <User className="w-3 h-3 text-amber-500" />
                              <span className="max-w-[100px] truncate">
                                {getUserName(task.assigneeId)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* COMPLETED COLUMN */}
                <div 
                  className={`flex-1 flex flex-col border-2 border-t-4 border-t-emerald-500 p-4 bg-card-bg min-w-[250px] transition-colors duration-150 ${
                    dragOverColumn === 'COMPLETED' ? 'border-primary-yellow bg-primary-yellow/5 border-dashed border-4' : 'border-border'
                  }`}
                  onDragOver={(e) => handleDragOver(e, 'COMPLETED')}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, 'COMPLETED')}
                >
                  <div className="flex items-center justify-between border-b-2 border-border pb-2 mb-3 select-none flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-500 font-black text-sm">▲</span>
                      <h3 className="font-bold text-sm text-canvas-fg">Completed</h3>
                    </div>
                    <span className="bg-canvas-bg px-2 py-0.5 border text-xs font-bold text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                      {getColumnTasks('COMPLETED').length}
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3 scrollbar-thin">
                    {getColumnTasks('COMPLETED').length === 0 ? (
                      <div className="text-center py-12 text-xs font-medium text-text-secondary select-none border-2 border-dashed border-border flex-1 flex items-center justify-center">
                        No tasks here yet
                      </div>
                    ) : (
                      getColumnTasks('COMPLETED').map(task => (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, task.id)}
                          onClick={() => handleOpenTaskDetails(task)}
                          className="bg-canvas-bg border-2 border-border border-l-4 border-l-emerald-500 p-3 shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing hover:-translate-x-[1px] hover:-translate-y-[1px] transition-all duration-100 flex flex-col gap-2 flex-shrink-0 opacity-75"
                        >
                          <h4 className="font-bold text-xs text-canvas-fg line-clamp-2 line-through select-all select-none">
                            {task.title}
                          </h4>
                          <div className="flex justify-between items-center text-[11px] text-text-secondary pt-2 border-t border-border select-none">
                            <PriorityBadge priority={task.priority} showText={false} />
                            <div className="flex items-center gap-1.5">
                              <User className="w-3 h-3 text-emerald-500" />
                              <span className="max-w-[100px] truncate">
                                {getUserName(task.assigneeId)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 2: BOARD HISTORY */}
          {activeTab === 'activity' && (
            <div className="flex-1 overflow-hidden flex flex-col gap-4 animate-fade-in">
              <h2 className="text-xl font-bold tracking-tight text-canvas-fg select-none">Activity log history</h2>
              <Card className="flex-1 bg-card-bg border-2 p-6 overflow-y-auto flex flex-col gap-4" shadow="md">
                {activities.length === 0 ? (
                  <div className="text-xs text-text-secondary font-medium py-8 text-center select-none">
                    No activity logs recorded yet
                  </div>
                ) : (
                  activities.map((log) => (
                    <ActivityLogRow key={log.id} log={log} />
                  ))
                )}
              </Card>
            </div>
          )}

          {/* TAB 3: TEAMMATES & INVITATIONS */}
          {activeTab === 'members' && (
            <div className="flex-1 overflow-hidden flex flex-col gap-4 animate-fade-in">
              <h2 className="text-xl font-bold tracking-tight text-canvas-fg select-none">Teammates</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto max-h-full pb-4">
                
                {/* Active Teammates list */}
                <Card className="bg-card-bg border-2 p-6 flex flex-col gap-4" shadow="md">
                  <h3 className="font-bold text-xs tracking-wider text-text-secondary border-b pb-2 select-none border-border">Active members</h3>
                  
                  <div className="flex flex-col gap-3">
                    {/* Owner */}
                    <div className="border-2 border-border p-3 bg-canvas-bg flex justify-between items-center select-none">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-primary-red text-white flex items-center justify-center font-bold text-[10px] border border-border">
                          {getUserName(currentProject.ownerId).substring(0, 2).toUpperCase()}
                        </div>
                        <Link to={`/app/profile/${currentProject.ownerId}`} className="text-xs font-bold text-canvas-fg hover:underline">
                          {getUserName(currentProject.ownerId)}
                        </Link>
                      </div>
                      <span className="text-[10px] bg-primary-yellow border border-border px-2 py-0.5 font-bold text-canvas-fg flex items-center gap-1">
                        <Shield className="w-3 h-3" />
                        <span>Owner</span>
                      </span>
                    </div>

                    {/* Member list */}
                    {currentProject.memberIds.length === 0 ? (
                      <span className="text-xs text-text-secondary font-medium mt-2 select-none">No teammates added yet. Invite someone on the right!</span>
                    ) : (
                      currentProject.memberIds.map(mid => (
                        <div key={mid} className="border-2 border-border p-3 bg-canvas-bg flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-primary-blue text-white flex items-center justify-center font-bold text-[10px] border border-border">
                              {getUserName(mid).substring(0, 2).toUpperCase()}
                            </div>
                            <Link to={`/app/profile/${mid}`} className="text-xs font-bold text-canvas-fg hover:underline">
                              {getUserName(mid)}
                            </Link>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] bg-card-bg border border-border px-2 py-0.5 font-semibold text-text-secondary select-none">Teammate</span>
                            {isOwner && (
                              <button 
                                onClick={() => handleRemoveMember(mid, getUserName(mid))}
                                className="p-1 border border-border text-primary-red bg-card-bg hover:bg-primary-red hover:text-white active:translate-y-[1px] cursor-pointer"
                                title="Remove Teammate"
                              >
                                <Trash className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </Card>

                {/* Invite & Pending Invitations section */}
                <div className="flex flex-col gap-6">
                  {/* Invitation form */}
                  {isOwner && (
                    <Card className="bg-card-bg border-2 p-6 select-none" shadow="md" accent="yellow">
                      <h3 className="font-bold text-xs tracking-wider text-text-secondary border-b pb-2 mb-4 border-border">Send project invitation</h3>
                      <form onSubmit={handleSendInvite} className="flex gap-2">
                        <input
                          type="email"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          className="flex-1 py-1.5 px-3 text-xs font-medium bg-canvas-bg text-canvas-fg border-2 border-border"
                          placeholder="teammate@company.com"
                          required
                          disabled={inviteLoading}
                        />
                        <Button variant="attention" size="sm" type="submit" disabled={inviteLoading}>
                          {inviteLoading ? 'Sending...' : 'Invite'}
                        </Button>
                      </form>

                      {inviteError && <div className="mt-2 text-xs font-bold text-primary-red">{inviteError}</div>}
                      {inviteSuccess && <div className="mt-2 text-xs font-bold text-primary-blue">{inviteSuccess}</div>}
                    </Card>
                  )}

                  {/* Pending lists */}
                  <Card className="bg-card-bg border-2 p-6" shadow="md">
                    <h3 className="font-bold text-xs tracking-wider text-text-secondary border-b pb-2 mb-4 border-border select-none">Pending invitations</h3>
                    <div className="flex flex-col gap-2">
                      {projectInvites.length === 0 ? (
                        <span className="text-xs text-text-secondary font-medium select-none">No pending invitations.</span>
                      ) : (
                        projectInvites.map(invite => (
                          <div key={invite.id} className="border-2 border-dashed border-border p-2.5 bg-canvas-bg flex justify-between items-center select-none">
                            <span className="text-xs font-medium text-canvas-fg truncate max-w-[180px]">{invite.inviteeEmail}</span>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="text-[9px] font-bold text-text-secondary tracking-wider">Pending</span>
                              {isOwner && (
                                <button 
                                  onClick={() => handleCancelInvite(invite.id)}
                                  className="p-1 border border-border bg-card-bg text-primary-red hover:bg-primary-red/10 active:translate-y-[1px] cursor-pointer"
                                  title="Cancel Invitation"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </Card>
                </div>

              </div>
            </div>
          )}
          {/* TAB 4: PROJECT CHAT */}
          {activeTab === 'chat' && (
            <div className="flex-1 overflow-hidden flex flex-col border-2 border-border bg-card-bg h-[480px] animate-fade-in">
              <div className="p-3 border-b-2 border-border bg-canvas-bg flex justify-between items-center flex-shrink-0 select-none">
                <span className="font-bold text-xs text-canvas-fg flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-primary-blue" />
                  <span>Project chat channel</span>
                </span>
              </div>

              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-card-bg">
                {chatMessages.length === 0 ? (
                  <div className="text-center py-12 text-xs font-medium text-text-secondary select-none">No chat history</div>
                ) : (
                  chatMessages.map(msg => (
                    <div key={msg.id} className="flex flex-col gap-0.5 max-w-[85%] self-start" style={{ alignSelf: msg.senderId === profile?.uid ? 'flex-end' : 'flex-start' }}>
                      <div className={`p-3 border-2 border-border flex flex-col gap-1 relative group shadow-sm ${
                        msg.senderId === profile?.uid ? 'bg-primary-blue/10 border-primary-blue/30' : 'bg-canvas-bg'
                      }`}>
                        <span className="text-[11px] font-bold text-text-secondary">{msg.senderName}</span>
                        <p className="text-xs font-normal leading-relaxed break-words whitespace-pre-wrap select-text text-canvas-fg">{msg.text}</p>
                        
                        <div className="opacity-0 group-hover:opacity-100 absolute -top-3.5 right-2 bg-card-bg border border-border px-1.5 py-0.5 shadow-sm text-[10px] font-bold z-10 select-none">
                          <button onClick={() => handleCreateTaskFromChat(msg.text)} className="text-primary-blue hover:underline cursor-pointer">Create task</button>
                        </div>
                      </div>
                      <span className="text-[10px] text-text-secondary font-medium px-0.5" style={{ alignSelf: msg.senderId === profile?.uid ? 'flex-end' : 'flex-start' }}>
                        {new Date(msg.createdAt.toMillis()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                )}
                <div ref={chatMessagesEndRef} />
              </div>

              <form onSubmit={handleSendChatMsg} className="p-4 border-t-2 border-border flex gap-3 items-center flex-shrink-0 bg-canvas-bg">
                <input
                  type="text"
                  value={chatInputText}
                  onChange={(e) => setChatInputText(e.target.value)}
                  placeholder="Type message here..."
                  className="flex-grow py-2 px-3 text-xs font-medium border-2 border-border bg-card-bg text-canvas-fg"
                />
                <button type="submit" className="px-4 py-2 border-2 border-border bg-primary-red text-white hover:opacity-90 active:translate-y-[1px] flex-shrink-0 font-bold text-xs cursor-pointer">
                  Send
                </button>
              </form>
            </div>
          )}

        </div>
      </div>

      {/* CREATE TASK MODAL */}
      {showCreateTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setShowCreateTask(false)} />
          
          <Card className="relative w-full max-w-md bg-card-bg border-4 p-8 z-10 animate-fade-in" shadow="lg">
            <h3 className="text-2xl font-bold tracking-tight mb-2 text-canvas-fg">Create task</h3>
            <p className="text-xs text-text-secondary font-medium mb-6">Append a new task item to this board</p>

            <form onSubmit={handleCreateTask} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-canvas-fg">Task title</label>
                <input
                  type="text"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full text-sm font-medium bg-canvas-bg text-canvas-fg border-2 border-border p-2"
                  placeholder="e.g. Integrate auth hooks"
                  required
                  disabled={taskSubmitting}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-canvas-fg">Description</label>
                <textarea
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  className="w-full text-sm font-medium bg-canvas-bg text-canvas-fg border-2 border-border p-2 resize-none h-20"
                  placeholder="Task details and constraints..."
                  disabled={taskSubmitting}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-canvas-fg">Priority</label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as TaskPriority)}
                    className="w-full text-sm font-medium bg-canvas-bg text-canvas-fg border-2 border-border p-2"
                    disabled={taskSubmitting}
                  >
                    <option value="HIGH">High (Circle)</option>
                    <option value="MEDIUM">Medium (Square)</option>
                    <option value="LOW">Low (Triangle)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-canvas-fg">Assignee</label>
                  <select
                    value={taskAssignee}
                    onChange={(e) => setTaskAssignee(e.target.value)}
                    className="w-full text-sm font-medium bg-canvas-bg text-canvas-fg border-2 border-border p-2"
                    disabled={taskSubmitting}
                  >
                    <option value="">Unassigned</option>
                    {users.map(u => (
                      <option key={u.uid} value={u.uid}>{u.displayName}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-canvas-fg">Due date</label>
                <input
                  type="date"
                  value={taskDueDate}
                  onChange={(e) => setTaskDueDate(e.target.value)}
                  className="w-full text-sm font-medium bg-canvas-bg text-canvas-fg border-2 border-border p-2"
                  disabled={taskSubmitting}
                />
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setShowCreateTask(false)}
                  disabled={taskSubmitting}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="primary"
                  disabled={taskSubmitting}
                >
                  {taskSubmitting ? 'Creating...' : 'Create'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* TASK DETAIL SIDE DRAWER */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/55 backdrop-blur-xs" onClick={handleCloseTaskDetails} />
          
          {/* Sliding Panel */}
          <div className="relative w-full max-w-lg bg-card-bg border-l-4 border-border h-full z-10 flex flex-col p-8 overflow-y-auto animate-slide-in">
            <button 
              onClick={handleCloseTaskDetails}
              className="absolute top-6 right-6 p-1.5 border-2 border-border bg-canvas-bg text-canvas-fg shadow-sm active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {!editMode ? (
              <div className="flex flex-col h-full justify-between pt-8">
                <div className="flex flex-col gap-6">
                  <div>
                    <div className="flex gap-2 items-center mb-2 select-none">
                      <span className={`px-2 py-0.5 border text-[10px] font-bold ${
                        selectedTask.status === 'COMPLETED' ? 'bg-primary-blue text-white' : 
                        selectedTask.status === 'IN_PROGRESS' ? 'bg-primary-yellow text-canvas-fg' : 'bg-canvas-bg border-border text-canvas-fg'
                      }`}>
                        {selectedTask.status === 'COMPLETED' ? 'Completed' : selectedTask.status === 'IN_PROGRESS' ? 'In progress' : 'To do'}
                      </span>
                      <PriorityBadge priority={selectedTask.priority} showText />
                    </div>
                    <h3 className="text-2xl font-bold tracking-tight text-canvas-fg select-text">
                      {selectedTask.title}
                    </h3>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <h4 className="text-xs font-bold text-text-secondary select-none">Description</h4>
                    <p className="text-sm font-normal text-canvas-fg bg-canvas-bg p-3 border-2 border-dashed border-border min-h-24 whitespace-pre-wrap select-text">
                      {selectedTask.description || 'No description provided.'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-6 bg-canvas-bg p-4 border-2 border-border select-none">
                    <div className="flex flex-col">
                      <span className="text-[11px] font-semibold text-text-secondary">Assignee</span>
                      {selectedTask.assigneeId ? (
                        <Link to={`/app/profile/${selectedTask.assigneeId}`} className="font-bold text-xs text-canvas-fg hover:underline mt-1 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5" />
                          {getUserName(selectedTask.assigneeId)}
                        </Link>
                      ) : (
                        <span className="font-medium text-xs text-text-secondary mt-1 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5" />
                          Unassigned
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col">
                      <span className="text-[11px] font-semibold text-text-secondary">Creator</span>
                      <Link to={`/app/profile/${selectedTask.creatorId}`} className="font-bold text-xs text-canvas-fg hover:underline mt-1 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5" />
                        {getUserName(selectedTask.creatorId)}
                      </Link>
                    </div>
                  </div>

                  {/* COMMENTS SYSTEM */}
                  <div className="flex flex-col gap-4 border-t-2 border-border pt-6">
                    <h4 className="text-xs font-bold text-text-secondary select-none">Task discussion</h4>
                    
                    <div className="flex flex-col gap-3 max-h-56 overflow-y-auto pr-1 select-text">
                      {taskComments.length === 0 ? (
                        <div className="text-xs text-text-secondary font-medium py-2 select-none">No discussion entries recorded yet.</div>
                      ) : (
                        taskComments.map(comment => (
                          <div key={comment.id} className="border border-border p-2.5 bg-canvas-bg flex flex-col gap-1 relative group">
                            
                            <div className="flex items-center justify-between gap-2 text-[10px] font-bold text-text-secondary select-none">
                              <Link to={`/app/profile/${comment.authorId}`} className="text-canvas-fg hover:underline">{comment.authorName}</Link>
                              <span>{formatRelativeTime(comment.createdAt)}</span>
                            </div>

                            {editingCommentId === comment.id ? (
                              <div className="flex flex-col gap-1.5 mt-1 select-none">
                                <input
                                  type="text"
                                  value={editingCommentText}
                                  onChange={(e) => setEditingCommentText(e.target.value)}
                                  className="w-full py-1 px-2 text-xs border border-border bg-card-bg text-canvas-fg"
                                />
                                <div className="flex justify-end gap-2 text-[10px]">
                                  <button onClick={() => setEditingCommentId(null)} className="font-medium text-text-secondary hover:underline">Cancel</button>
                                  <button onClick={() => handleSaveCommentEdit(comment.id)} className="font-bold text-primary-red hover:underline">Save</button>
                                </div>
                              </div>
                            ) : (
                              <p className="text-xs font-normal text-canvas-fg whitespace-pre-wrap">{comment.text}</p>
                            )}

                            {comment.authorId === profile?.uid && editingCommentId !== comment.id && (
                              <div className="opacity-0 group-hover:opacity-100 absolute top-2 right-2 flex items-center gap-1 bg-card-bg border border-border px-1.5 py-0.5 shadow-sm text-[10px] font-bold select-none z-10">
                                <button onClick={() => { setEditingCommentId(comment.id); setEditingCommentText(comment.text); }} className="text-primary-yellow hover:underline">Edit</button>
                                <button onClick={() => handleDeleteComment(comment.id)} className="text-primary-red hover:underline ml-1">Delete</button>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>

                    <form onSubmit={handleAddComment} className="flex gap-2 mt-2 select-none">
                      <input
                        type="text"
                        value={newCommentText}
                        onChange={(e) => setNewCommentText(e.target.value)}
                        placeholder="Post an update (use @name to mention)..."
                        className="flex-1 py-1 px-2 text-xs font-medium border-2 border-border bg-canvas-bg text-canvas-fg"
                      />
                      <button type="submit" className="px-3 py-1 border-2 border-border bg-card-bg text-canvas-fg font-bold text-xs hover:bg-surface-hover active:translate-y-[1px] shadow-sm flex items-center justify-center cursor-pointer">Post</button>
                    </form>
                  </div>
                </div>

                <div className="flex justify-between items-center border-t-2 border-border pt-6 mt-8 select-none">
                  <Button 
                    variant="ghost" 
                    className="text-primary-red flex items-center gap-2 hover:bg-primary-red/10"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete task</span>
                  </Button>

                  <Button variant="outline" onClick={() => setEditMode(true)}>
                    Edit task
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSaveTaskEdits} className="flex flex-col h-full justify-between pt-8 select-none">
                <div className="flex flex-col gap-5">
                  <h3 className="text-xl font-bold tracking-tight text-canvas-fg">Edit task</h3>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-canvas-fg">Task title</label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full text-sm font-medium bg-canvas-bg text-canvas-fg border-2 border-border p-2"
                      required
                      disabled={editSubmitting}
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-canvas-fg">Description</label>
                    <textarea
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      className="w-full text-sm font-medium bg-canvas-bg text-canvas-fg border-2 border-border p-2 resize-none h-24"
                      disabled={editSubmitting}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-canvas-fg">Status</label>
                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value as TaskStatus)}
                        className="w-full text-sm font-medium bg-canvas-bg text-canvas-fg border-2 border-border p-2"
                        disabled={editSubmitting}
                      >
                        <option value="TODO">To do</option>
                        <option value="IN_PROGRESS">In progress</option>
                        <option value="COMPLETED">Completed</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-canvas-fg">Priority</label>
                      <select
                        value={editPriority}
                        onChange={(e) => setEditPriority(e.target.value as TaskPriority)}
                        className="w-full text-sm font-medium bg-canvas-bg text-canvas-fg border-2 border-border p-2"
                        disabled={editSubmitting}
                      >
                        <option value="HIGH">High (Circle)</option>
                        <option value="MEDIUM">Medium (Square)</option>
                        <option value="LOW">Low (Triangle)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-canvas-fg">Assignee</label>
                      <select
                        value={editAssignee}
                        onChange={(e) => setEditAssignee(e.target.value)}
                        className="w-full text-sm font-medium bg-canvas-bg text-canvas-fg border-2 border-border p-2"
                        disabled={editSubmitting}
                      >
                        <option value="">Unassigned</option>
                        {users.map(u => (
                          <option key={u.uid} value={u.uid}>{u.displayName}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-canvas-fg">Due date</label>
                      <input
                        type="date"
                        value={editDueDate}
                        onChange={(e) => setEditDueDate(e.target.value)}
                        className="w-full text-sm font-medium bg-canvas-bg text-canvas-fg border-2 border-border p-2"
                        disabled={editSubmitting}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-8 border-t-2 border-border pt-6">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={() => setEditMode(false)}
                    disabled={editSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    variant="primary"
                    disabled={editSubmitting}
                  >
                    {editSubmitting ? 'Saving...' : 'Save changes'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60" onClick={() => setShowDeleteConfirm(false)} />
          
          <Card className="relative w-full max-w-sm bg-card-bg border-4 p-6 z-10 animate-fade-in" shadow="lg" accent="red">
            <h3 className="text-xl font-bold tracking-tight mb-2 text-canvas-fg select-none">Confirm deletion</h3>
            <p className="text-xs text-text-secondary font-medium mb-6 select-none">
              Are you sure you want to permanently delete this task? This action is irreversible.
            </p>

            <div className="flex justify-end gap-3 select-none">
              <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleDeleteTask}>
                Delete
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
