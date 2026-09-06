import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  Timestamp, 
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { db } from './firebase';
import { Project } from '../types';
import { logActivity } from './activity';

export const createProject = async (name: string, description: string, ownerId: string, ownerName: string): Promise<string> => {
  const projectRef = doc(collection(db, 'projects'));
  const projectId = projectRef.id;

  const newProject: Project = {
    id: projectId,
    name,
    description,
    ownerId,
    memberIds: [],
    status: 'ACTIVE',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  await setDoc(projectRef, newProject);

  // Log activity
  await logActivity({
    projectId,
    taskId: null,
    actorId: ownerId,
    actorName: ownerName,
    type: 'PROJECT_CREATE',
    metadata: { projectName: name },
  });

  return projectId;
};

export const getProject = async (projectId: string): Promise<Project | null> => {
  const docRef = doc(db, 'projects', projectId);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    return snap.data() as Project;
  }
  return null;
};

export const getUserProjects = async (userId: string): Promise<Project[]> => {
  const projectsColl = collection(db, 'projects');
  
  // We query all projects where ownerId == userId
  const ownerQuery = query(projectsColl, where('ownerId', '==', userId));
  const ownerSnap = await getDocs(ownerQuery);
  const projectsMap = new Map<string, Project>();
  
  ownerSnap.forEach((doc) => {
    projectsMap.set(doc.id, doc.data() as Project);
  });

  // We query all projects where memberIds contains userId
  const memberQuery = query(projectsColl, where('memberIds', 'array-contains', userId));
  const memberSnap = await getDocs(memberQuery);
  
  memberSnap.forEach((doc) => {
    projectsMap.set(doc.id, doc.data() as Project);
  });

  return Array.from(projectsMap.values()).sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
};

export const updateProject = async (projectId: string, updates: Partial<Project>, actorId: string, actorName: string) => {
  const docRef = doc(db, 'projects', projectId);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: Timestamp.now()
  });

  // Log activity
  await logActivity({
    projectId,
    taskId: null,
    actorId,
    actorName,
    type: 'PROJECT_UPDATE',
    metadata: { projectName: updates.name },
  });
};

export const deleteProject = async (projectId: string) => {
  // Delete all tasks in the project first to keep database clean
  const tasksColl = collection(db, 'tasks');
  const q = query(tasksColl, where('projectId', '==', projectId));
  const tasksSnap = await getDocs(q);
  const deletePromises = tasksSnap.docs.map(doc => deleteDoc(doc.ref));
  await Promise.all(deletePromises);

  // Delete project
  const docRef = doc(db, 'projects', projectId);
  await deleteDoc(docRef);
};

export const addProjectMemberByEmail = async (
  projectId: string, 
  email: string, 
  actorId: string, 
  actorName: string
): Promise<string> => {
  // Find user by email
  const usersColl = collection(db, 'users');
  const q = query(usersColl, where('email', '==', email.trim().toLowerCase()));
  const snap = await getDocs(q);

  if (snap.empty) {
    throw new Error(`No user found with email "${email}"`);
  }

  const memberUser = snap.docs[0].data();
  const memberId = memberUser.uid;
  const memberName = memberUser.displayName;

  const project = await getProject(projectId);
  if (!project) throw new Error('Project not found');

  if (project.ownerId === memberId) {
    throw new Error('This user is the owner of the project');
  }

  if (project.memberIds.includes(memberId)) {
    throw new Error('This user is already a member of this project');
  }

  // Update project
  const projectRef = doc(db, 'projects', projectId);
  await updateDoc(projectRef, {
    memberIds: arrayUnion(memberId),
    updatedAt: Timestamp.now()
  });

  // Log activity
  await logActivity({
    projectId,
    taskId: null,
    actorId,
    actorName,
    type: 'PROJECT_MEMBER_ADD',
    metadata: { memberName, projectName: project.name },
  });

  return memberName;
};

export const removeProjectMember = async (
  projectId: string,
  userId: string,
  userName: string,
  actorId: string,
  actorName: string
) => {
  const projectRef = doc(db, 'projects', projectId);
  await updateDoc(projectRef, {
    memberIds: arrayRemove(userId),
    updatedAt: Timestamp.now()
  });

  await logActivity({
    projectId,
    taskId: null,
    actorId,
    actorName,
    type: 'PROJECT_MEMBER_REMOVE',
    metadata: { memberName: userName }
  });
};

