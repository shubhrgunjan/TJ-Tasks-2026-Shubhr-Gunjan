import { collection, doc, getDocs, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from './firebase';
import { UserProfile } from '../types';

export const getAllUsers = async (): Promise<UserProfile[]> => {
  const usersColl = collection(db, 'users');
  const snap = await getDocs(usersColl);
  const list: UserProfile[] = [];
  snap.forEach((doc) => {
    list.push(doc.data() as UserProfile);
  });
  return list;
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const docRef = doc(db, 'users', uid);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    return snap.data() as UserProfile;
  }
  return null;
};

export const updateUserProfile = async (uid: string, updates: Partial<UserProfile>) => {
  const docRef = doc(db, 'users', uid);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: Timestamp.now()
  });
};
