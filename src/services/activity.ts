import { collection, doc, setDoc, query, where, getDocs, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db } from './firebase';
import { ActivityLog } from '../types';

export const logActivity = async (activity: Omit<ActivityLog, 'id' | 'createdAt'>) => {
  try {
    const activityRef = doc(collection(db, 'activity'));
    const newActivity: ActivityLog = {
      ...activity,
      id: activityRef.id,
      createdAt: Timestamp.now(),
    };
    await setDoc(activityRef, newActivity);
  } catch (err) {
    console.error('Error logging activity:', err);
  }
};

export const getProjectActivity = async (projectId: string, maxItems: number = 30): Promise<ActivityLog[]> => {
  try {
    const activityColl = collection(db, 'activity');
    const q = query(
      activityColl,
      where('projectId', '==', projectId),
      orderBy('createdAt', 'desc'),
      limit(maxItems)
    );
    const snap = await getDocs(q);
    const list: ActivityLog[] = [];
    snap.forEach((doc) => {
      list.push(doc.data() as ActivityLog);
    });
    return list;
  } catch (err) {
    console.warn('Error fetching activity with index, trying fallback in-memory sort:', err);
    // Fallback: Query by projectId and sort in memory
    const activityColl = collection(db, 'activity');
    const q = query(activityColl, where('projectId', '==', projectId));
    const snap = await getDocs(q);
    const list: ActivityLog[] = [];
    snap.forEach((doc) => {
      list.push(doc.data() as ActivityLog);
    });
    return list.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis()).slice(0, maxItems);
  }
};
