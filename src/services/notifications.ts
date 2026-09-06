import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  getDocs,
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { Notification } from '../types';

export const createNotification = async (notificationData: Omit<Notification, 'id' | 'isRead' | 'createdAt'>) => {
  try {
    const notifRef = doc(collection(db, 'notifications'));
    const notification: Notification = {
      ...notificationData,
      id: notifRef.id,
      isRead: false,
      createdAt: Timestamp.now()
    };
    await setDoc(notifRef, notification);
  } catch (err) {
    console.error('Error creating notification:', err);
  }
};

export const subscribeNotifications = (
  userId: string,
  callback: (notifications: Notification[]) => void,
  onError?: (error: any) => void
) => {
  const q = query(
    collection(db, 'notifications'),
    where('recipientId', '==', userId)
  );

  return onSnapshot(q, (snapshot) => {
    const list: Notification[] = [];
    snapshot.forEach((doc) => {
      list.push(doc.data() as Notification);
    });
    // Sort in memory by createdAt descending to avoid indexing issues
    const sorted = list.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
    callback(sorted);
  }, (err) => {
    console.error('Error listening to notifications:', err);
    if (onError) onError(err);
  });
};

export const markNotificationRead = async (notificationId: string) => {
  try {
    const notifRef = doc(db, 'notifications', notificationId);
    await updateDoc(notifRef, {
      isRead: true
    });
  } catch (err) {
    console.error('Error marking notification as read:', err);
  }
};

export const markAllNotificationsRead = async (userId: string) => {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('recipientId', '==', userId),
      where('isRead', '==', false)
    );
    const snap = await getDocs(q);
    const promises = snap.docs.map(d => updateDoc(d.ref, { isRead: true }));
    await Promise.all(promises);
  } catch (err) {
    console.error('Error marking all notifications as read:', err);
  }
};
