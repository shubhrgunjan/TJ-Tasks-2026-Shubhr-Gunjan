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
  onSnapshot,
  Timestamp 
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { Task, TaskPriority } from '../types';
import { logActivity } from './activity';
import { getDemoTasksFallback } from './seedTestMode';

export const createTask = async (
  taskData: {
    projectId: string;
    title: string;
    description: string;
    priority: TaskPriority;
    assigneeId: string | null;
    dueDate: Timestamp | null;
  },
  creatorId: string,
  creatorName: string
): Promise<string> => {
  const taskRef = doc(collection(db, 'tasks'));
  const taskId = taskRef.id;

  const newTask: Task = {
    ...taskData,
    id: taskId,
    status: 'TODO',
    creatorId,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    completedAt: null
  };

  await setDoc(taskRef, newTask);

  // Log activity
  await logActivity({
    projectId: taskData.projectId,
    taskId,
    actorId: creatorId,
    actorName: creatorName,
    type: 'TASK_CREATE',
    metadata: { taskTitle: taskData.title },
  });

  return taskId;
};

export const updateTask = async (
  taskId: string,
  projectId: string,
  updates: Partial<Task>,
  actorId: string,
  actorName: string
) => {
  const docRef = doc(db, 'tasks', taskId);
  const taskSnap = await getDoc(docRef);
  if (!taskSnap.exists()) throw new Error('Task not found');
  const currentTask = taskSnap.data() as Task;

  const finalUpdates: any = {
    ...updates,
    updatedAt: Timestamp.now()
  };

  // If status is updated to completed
  if (updates.status === 'COMPLETED' && currentTask.status !== 'COMPLETED') {
    finalUpdates.completedAt = Timestamp.now();
  } else if (updates.status && updates.status !== 'COMPLETED') {
    finalUpdates.completedAt = null;
  }

  await updateDoc(docRef, finalUpdates);

  // Log activities based on what changed
  if (updates.status && updates.status !== currentTask.status) {
    await logActivity({
      projectId,
      taskId,
      actorId,
      actorName,
      type: 'TASK_STATUS_CHANGE',
      metadata: { 
        taskTitle: currentTask.title,
        oldValue: currentTask.status,
        newValue: updates.status
      },
    });
  }

  if (updates.priority && updates.priority !== currentTask.priority) {
    await logActivity({
      projectId,
      taskId,
      actorId,
      actorName,
      type: 'TASK_PRIORITY_CHANGE',
      metadata: { 
        taskTitle: currentTask.title,
        oldValue: currentTask.priority,
        newValue: updates.priority
      },
    });
  }

  if (updates.assigneeId !== undefined && updates.assigneeId !== currentTask.assigneeId) {
    // Lookup assignee name if it's assigned to someone
    let assigneeName = 'Unassigned';
    if (updates.assigneeId) {
      const userRef = doc(db, 'users', updates.assigneeId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        assigneeName = userSnap.data().displayName;
      }
    }
    
    await logActivity({
      projectId,
      taskId,
      actorId,
      actorName,
      type: 'TASK_ASSIGN',
      metadata: { 
        taskTitle: currentTask.title,
        assigneeName
      },
    });
  }
};

export const deleteTask = async (
  taskId: string, 
  projectId: string, 
  taskTitle: string, 
  actorId: string, 
  actorName: string
) => {
  const docRef = doc(db, 'tasks', taskId);
  await deleteDoc(docRef);

  // Log activity
  await logActivity({
    projectId,
    taskId: null,
    actorId,
    actorName,
    type: 'TASK_DELETE',
    metadata: { taskTitle },
  });
};

// Real-time updates listener for a single project's tasks
export const subscribeProjectTasks = (
  projectId: string, 
  callback: (tasks: Task[]) => void,
  onError?: (error: any) => void
) => {
  const tasksColl = collection(db, 'tasks');
  const q = query(
    tasksColl, 
    where('projectId', '==', projectId)
  );

  const activeUid = auth.currentUser?.uid || 'demo_user';
  const isTestMode = !!localStorage.getItem('tjflow_test_persona');

  return onSnapshot(q, (snapshot) => {
    const list: Task[] = [];
    snapshot.forEach((doc) => {
      list.push(doc.data() as Task);
    });

    if (list.length === 0 || isTestMode) {
      const fallbacks = getDemoTasksFallback(activeUid).filter(t => t.projectId === projectId);
      for (const fb of fallbacks) {
        if (!list.some(t => t.id === fb.id)) {
          list.push(fb);
        }
      }
    }

    const sorted = list.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
    callback(sorted);
  }, (err) => {
    console.error('Error listening to tasks:', err);
    const fallbacks = getDemoTasksFallback(activeUid).filter(t => t.projectId === projectId);
    callback(fallbacks);
    if (onError) onError(err);
  });
};

// Real-time updates listener for all tasks in a set of user projects
export const subscribeUserProjectTasks = (
  projectIds: string[],
  callback: (tasks: Task[]) => void,
  onError?: (error: any) => void
) => {
  const activeUid = auth.currentUser?.uid || 'demo_user';
  const isTestMode = !!localStorage.getItem('tjflow_test_persona');

  if (projectIds.length === 0 || isTestMode) {
    callback(getDemoTasksFallback(activeUid));
    if (projectIds.length === 0 && !isTestMode) {
      return () => {};
    }
  }

  const tasksMap: Record<string, Task[]> = {};
  const unsubscribers: (() => void)[] = [];

  projectIds.forEach((pid) => {
    const tasksColl = collection(db, 'tasks');
    const q = query(tasksColl, where('projectId', '==', pid));

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const list: Task[] = [];
        snapshot.forEach((doc) => {
          list.push(doc.data() as Task);
        });
        tasksMap[pid] = list;

        let allTasks = Object.values(tasksMap).flat();

        if (allTasks.length === 0 || isTestMode) {
          const fallbacks = getDemoTasksFallback(activeUid);
          const taskMap = new Map<string, Task>();
          fallbacks.forEach(t => taskMap.set(t.id, t));
          allTasks.forEach(t => taskMap.set(t.id, t));
          allTasks = Array.from(taskMap.values());
        }

        callback(allTasks);
      },
      (err) => {
        console.error(`Error listening to tasks for project ${pid}:`, err);
        const fallbacks = getDemoTasksFallback(activeUid);
        callback(fallbacks);
        if (onError) onError(err);
      }
    );
    unsubscribers.push(unsub);
  });

  return () => {
    unsubscribers.forEach((unsub) => unsub());
  };
};

