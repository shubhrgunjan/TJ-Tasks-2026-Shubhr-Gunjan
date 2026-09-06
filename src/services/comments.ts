import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  onSnapshot, 
  Timestamp,
  getDocs,
  where,
  getDoc
} from 'firebase/firestore';
import { db } from './firebase';
import { TaskComment, Task } from '../types';
import { logActivity } from './activity';
import { createNotification } from './notifications';

export const addTaskComment = async (
  taskId: string,
  projectId: string,
  taskTitle: string,
  authorId: string,
  authorName: string,
  text: string
): Promise<string> => {
  const commentsColl = collection(db, 'tasks', taskId, 'comments');
  const commentRef = doc(commentsColl);
  const commentId = commentRef.id;

  const newComment: TaskComment = {
    id: commentId,
    taskId,
    authorId,
    authorName,
    text,
    createdAt: Timestamp.now(),
    editedAt: null
  };

  await setDoc(commentRef, newComment);

  // Log activity
  await logActivity({
    projectId,
    taskId,
    actorId: authorId,
    actorName: authorName,
    type: 'COMMENT_ADD',
    metadata: { taskTitle, newValue: text }
  });

  // Handle Mentions (e.g., "@Username")
  const mentions = text.match(/@\[?([^\]@\s]+)\]?/g);
  if (mentions) {
    const usersColl = collection(db, 'users');
    const processedNames = new Set<string>();

    for (const mention of mentions) {
      const targetName = mention.replace('@', '').replace('[', '').replace(']', '').trim();
      if (processedNames.has(targetName)) continue;
      processedNames.add(targetName);

      // Look up user by name
      const q = query(usersColl, where('displayName', '==', targetName));
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        const targetUserId = snap.docs[0].id;
        if (targetUserId !== authorId) {
          await createNotification({
            recipientId: targetUserId,
            senderId: authorId,
            senderName: authorName,
            type: 'MENTION',
            title: 'Mentioned in Task',
            body: `${authorName} mentioned you in a comment on "${taskTitle}": "${text.substring(0, 50)}..."`,
            link: `/app/projects/${projectId}?task=${taskId}`
          });
        }
      }
    }
  }

  return commentId;
};

export const updateTaskComment = async (
  taskId: string,
  commentId: string,
  text: string
): Promise<void> => {
  const commentRef = doc(db, 'tasks', taskId, 'comments', commentId);
  await updateDoc(commentRef, {
    text,
    editedAt: Timestamp.now()
  });
};

export const deleteTaskComment = async (
  taskId: string,
  commentId: string
): Promise<void> => {
  const commentRef = doc(db, 'tasks', taskId, 'comments', commentId);
  await deleteDoc(commentRef);
};

export const subscribeTaskComments = (
  taskId: string,
  callback: (comments: TaskComment[]) => void
) => {
  const commentsColl = collection(db, 'tasks', taskId, 'comments');
  
  return onSnapshot(commentsColl, (snapshot) => {
    const list: TaskComment[] = [];
    snapshot.forEach((doc) => {
      list.push(doc.data() as TaskComment);
    });
    // Sort in memory by createdAt ascending
    const sorted = list.sort((a, b) => a.createdAt.toMillis() - b.createdAt.toMillis());
    callback(sorted);
  }, (err) => {
    console.error('Error listening to comments:', err);
  });
};
