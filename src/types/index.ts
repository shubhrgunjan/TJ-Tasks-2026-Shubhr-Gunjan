import { Timestamp } from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  bio?: string;
  themePreference?: 'light' | 'dark';
  isPro?: boolean;
  subscriptionPlan?: 'FREE' | 'PRO' | 'ENTERPRISE';
  subscriptionRenewsAt?: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type ProjectStatus = 'ACTIVE' | 'ARCHIVED';

export interface Project {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  memberIds: string[];
  status: ProjectStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type ProjectRole = 'owner' | 'member';

export interface ProjectMember {
  projectId: string;
  userId: string;
  role: ProjectRole;
  joinedAt: Timestamp;
}

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED';
export type TaskPriority = 'HIGH' | 'MEDIUM' | 'LOW';

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string | null;
  creatorId: string;
  dueDate: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  completedAt: Timestamp | null;
}

export type ActivityType = 
  | 'PROJECT_CREATE' 
  | 'PROJECT_UPDATE' 
  | 'PROJECT_MEMBER_ADD'
  | 'PROJECT_MEMBER_REMOVE'
  | 'TASK_CREATE' 
  | 'TASK_UPDATE' 
  | 'TASK_STATUS_CHANGE' 
  | 'TASK_PRIORITY_CHANGE'
  | 'TASK_ASSIGN' 
  | 'TASK_DELETE'
  | 'TASK_COMPLETE'
  | 'COMMENT_ADD'
  | 'INVITATION_SEND'
  | 'INVITATION_ACCEPT';

export interface ActivityLog {
  id: string;
  projectId: string;
  taskId: string | null;
  actorId: string;
  actorName: string;
  type: ActivityType;
  metadata: {
    taskTitle?: string;
    projectName?: string;
    oldValue?: string;
    newValue?: string;
    assigneeName?: string;
    memberName?: string;
  };
  createdAt: Timestamp;
}

export interface Invitation {
  id: string;
  projectId: string;
  projectName: string;
  inviteeEmail: string;
  inviterId: string;
  inviterName: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELED';
  createdAt: Timestamp;
}

export interface Notification {
  id: string;
  recipientId: string;
  senderId: string;
  senderName: string;
  type: 'TASK_ASSIGN' | 'MENTION' | 'PROJECT_INVITE' | 'TASK_DEADLINE' | 'MEMBER_CHANGE' | 'DIRECT_MESSAGE';
  title: string;
  body: string;
  link: string;
  isRead: boolean;
  createdAt: Timestamp;
}

export interface ChatConversation {
  id: string;
  participantIds: string[];
  lastMessageText: string;
  lastMessageAt: Timestamp;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: Timestamp;
  editedAt: Timestamp | null;
  reactions?: { [reaction: string]: string[] }; // Map reaction to array of user uids
  replyTo?: { messageId: string; text: string; senderName: string } | null;
  taskRef?: { taskId: string; taskTitle: string } | null;
}

export interface TaskComment {
  id: string;
  taskId: string;
  authorId: string;
  authorName: string;
  text: string;
  createdAt: Timestamp;
  editedAt: Timestamp | null;
}

