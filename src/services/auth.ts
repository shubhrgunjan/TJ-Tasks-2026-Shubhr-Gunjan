import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import { UserProfile } from '../types';

export const registerUser = async (email: string, password: string, displayName: string) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // Set the Auth display name
  await updateProfile(user, { displayName });

  // Create the Firestore user profile document
  const profile: UserProfile = {
    uid: user.uid,
    displayName,
    email,
    photoURL: '',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  await setDoc(doc(db, 'users', user.uid), profile);
  return userCredential;
};

export const loginUser = async (email: string, password: string) => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  const user = result.user;

  // Ensure user profile document exists in Firestore
  const userRef = doc(db, 'users', user.uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) {
    const profile: UserProfile = {
      uid: user.uid,
      displayName: user.displayName || user.email?.split('@')[0] || 'User',
      email: user.email || '',
      photoURL: user.photoURL || '',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    await setDoc(userRef, profile);
  }
  return result;
};

export const logoutUser = async () => {
  return signOut(auth);
};

export const resetPassword = async (email: string) => {
  return sendPasswordResetEmail(auth, email);
};
