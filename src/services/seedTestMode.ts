import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile 
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  collection, 
  query, 
  where, 
  Timestamp 
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { UserProfile, ActivityLog, Notification } from '../types';

export interface TestPersona {
  key: string;
  displayName: string;
  role: string;
  email: string;
  password: string;
  avatar: string;
  bio: string;
  isPro: boolean;
  color: string;
}

export const TEST_PERSONAS: Record<string, TestPersona> = {
  sarah: {
    key: 'sarah',
    displayName: 'Sarah Chen',
    role: 'Lead Product Designer',
    email: 'sarah.chen@tjflow.demo',
    password: 'DemoUser2026!',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    bio: 'UI/UX Lead crafting high-contrast design systems and responsive mobile components.',
    isPro: true,
    color: '#FF4D4D'
  },
  alex: {
    key: 'alex',
    displayName: 'Alex Rivera',
    role: 'Senior Fullstack Engineer',
    email: 'alex.rivera@tjflow.demo',
    password: 'DemoUser2026!',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    bio: 'Architecting real-time state synchronization, WebSocket connections, and distributed storage.',
    isPro: true,
    color: '#0066FF'
  },
  elena: {
    key: 'elena',
    displayName: 'Elena Rostova',
    role: 'VP of Product & Ops',
    email: 'elena.rostova@tjflow.demo',
    password: 'DemoUser2026!',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    bio: 'Managing sprint roadmaps, team velocities, cross-functional deliverables, and client launches.',
    isPro: true,
    color: '#FFCC00'
  },
  devon: {
    key: 'devon',
    displayName: 'Devon Vance',
    role: 'Lead QA & Security Auditor',
    email: 'devon.vance@tjflow.demo',
    password: 'DemoUser2026!',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    bio: 'Penetration testing, accessibility audits, and real-time activity stream monitoring.',
    isPro: true,
    color: '#10B981'
  }
};

/**
 * Log in as a pre-configured test persona.
 * Automatically creates the user account in Firebase Auth & Firestore if it doesn't exist yet.
 */
export const loginAsTestPersona = async (personaKey: string): Promise<UserProfile> => {
  const persona = TEST_PERSONAS[personaKey] || TEST_PERSONAS.sarah;
  let user;

  try {
    const credential = await signInWithEmailAndPassword(auth, persona.email, persona.password);
    user = credential.user;
  } catch (err: any) {
    if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
      try {
        const credential = await createUserWithEmailAndPassword(auth, persona.email, persona.password);
        user = credential.user;
        await updateProfile(user, { displayName: persona.displayName, photoURL: persona.avatar });
      } catch (createErr) {
        console.error('Failed to create test persona user:', createErr);
        throw createErr;
      }
    } else {
      throw err;
    }
  }

  // Ensure User Profile in Firestore
  const userRef = doc(db, 'users', user.uid);
  const snap = await getDoc(userRef);

  const profileData: UserProfile = {
    uid: user.uid,
    displayName: persona.displayName,
    email: persona.email,
    photoURL: persona.avatar,
    bio: persona.bio,
    themePreference: 'light',
    isPro: persona.isPro,
    subscriptionPlan: 'PRO',
    createdAt: snap.exists() ? (snap.data().createdAt || Timestamp.now()) : Timestamp.now(),
    updatedAt: Timestamp.now()
  };

  await setDoc(userRef, profileData, { merge: true });
  localStorage.setItem('tjflow_test_persona', personaKey);

  // Seed the entire workspace with rich test data in background
  seedTestWorkspaceData(user.uid).catch(err => {
    console.warn('Background seed warning:', err);
  });

  return profileData;
};

/**
 * Seed Firestore with dummy projects, tasks, comments, messages, notifications, and activity logs.
 */
export const seedTestWorkspaceData = async (activeUid: string, forceReSeed = false): Promise<void> => {
  try {
    const projectsColl = collection(db, 'projects');
    const existingProjectsSnap = await getDocs(query(projectsColl, where('name', '==', '🛒 E-Commerce Mobile App Redesign')));

    if (!existingProjectsSnap.empty && !forceReSeed) {
      return;
    }

    // Step 1: Ensure User documents exist for all 4 test personas
    const personaUids: Record<string, string> = {};
    for (const key of Object.keys(TEST_PERSONAS)) {
      const p = TEST_PERSONAS[key];
      const uSnap = await getDocs(query(collection(db, 'users'), where('email', '==', p.email)));
      if (!uSnap.empty) {
        personaUids[key] = uSnap.docs[0].id;
      } else {
        const docRef = doc(collection(db, 'users'));
        personaUids[key] = docRef.id;
        await setDoc(docRef, {
          uid: docRef.id,
          displayName: p.displayName,
          email: p.email,
          photoURL: p.avatar,
          bio: p.bio,
          isPro: p.isPro,
          subscriptionPlan: 'PRO',
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        });
      }
    }

    const sarahId = personaUids.sarah || activeUid;
    const alexId = personaUids.alex || 'test_alex_id';
    const elenaId = personaUids.elena || 'test_elena_id';
    const devonId = personaUids.devon || 'test_devon_id';

    const allMemberIds = Array.from(new Set([sarahId, alexId, elenaId, devonId, activeUid]));

    // Step 2: Create 4 Rich Projects
    const projectsToSeed = [
      {
        id: 'proj_ecommerce_mobile',
        name: '🛒 E-Commerce Mobile App Redesign',
        description: 'Revamping mobile checkout flow, design tokens, and real-time order tracking.',
        ownerId: sarahId,
        memberIds: allMemberIds,
        status: 'ACTIVE' as const,
        createdAt: Timestamp.fromDate(new Date(Date.now() - 14 * 86400000)),
        updatedAt: Timestamp.now()
      },
      {
        id: 'proj_cloud_migration',
        name: '☁️ Cloud Infrastructure & DB Migration',
        description: 'Migrating core services to serverless infrastructure with real-time replication and zero downtime.',
        ownerId: alexId,
        memberIds: allMemberIds,
        status: 'ACTIVE' as const,
        createdAt: Timestamp.fromDate(new Date(Date.now() - 10 * 86400000)),
        updatedAt: Timestamp.now()
      },
      {
        id: 'proj_design_system',
        name: '🎨 Design System 3.0 Tokens',
        description: 'Standardizing geometric component tokens, cubic-bezier micro-animations, and WCAG AA accessibility.',
        ownerId: sarahId,
        memberIds: [sarahId, alexId, elenaId],
        status: 'ACTIVE' as const,
        createdAt: Timestamp.fromDate(new Date(Date.now() - 7 * 86400000)),
        updatedAt: Timestamp.now()
      },
      {
        id: 'proj_ai_assistant',
        name: '🤖 AI Content & Task Summarizer Engine',
        description: 'GenAI integration for automated task summaries, sprint reports, and natural language search.',
        ownerId: elenaId,
        memberIds: [elenaId, alexId, devonId],
        status: 'ACTIVE' as const,
        createdAt: Timestamp.fromDate(new Date(Date.now() - 3 * 86400000)),
        updatedAt: Timestamp.now()
      }
    ];

    for (const proj of projectsToSeed) {
      await setDoc(doc(db, 'projects', proj.id), proj, { merge: true });
    }

    // Step 3: Create Tasks across projects
    const tasksToSeed = [
      {
        id: 'task_ecom_1',
        projectId: 'proj_ecommerce_mobile',
        title: 'Design Dark & Light Theme Token Palette',
        description: 'Define CSS variables for canvas-bg, card-bg, text-canvas-fg, and Bauhaus accent colors.',
        status: 'COMPLETED' as const,
        priority: 'HIGH' as const,
        assigneeId: sarahId,
        creatorId: sarahId,
        dueDate: Timestamp.fromDate(new Date(Date.now() - 86400000)),
        createdAt: Timestamp.fromDate(new Date(Date.now() - 12 * 86400000)),
        updatedAt: Timestamp.now(),
        completedAt: Timestamp.fromDate(new Date(Date.now() - 86400000))
      },
      {
        id: 'task_ecom_2',
        projectId: 'proj_ecommerce_mobile',
        title: 'Optimize Mobile Checkout Payment Gateway',
        description: 'Build interactive 3-step checkout modal with live card preview widget and validation.',
        status: 'IN_PROGRESS' as const,
        priority: 'HIGH' as const,
        assigneeId: alexId,
        creatorId: sarahId,
        dueDate: Timestamp.fromDate(new Date(Date.now() + 2 * 86400000)),
        createdAt: Timestamp.fromDate(new Date(Date.now() - 8 * 86400000)),
        updatedAt: Timestamp.now(),
        completedAt: null
      },
      {
        id: 'task_ecom_3',
        projectId: 'proj_ecommerce_mobile',
        title: 'Implement Apple Pay & Google Pay One-Tap',
        description: 'Integrate Web Payments API for instant 1-click checkout on mobile Safari and Chrome.',
        status: 'TODO' as const,
        priority: 'MEDIUM' as const,
        assigneeId: elenaId,
        creatorId: sarahId,
        dueDate: Timestamp.fromDate(new Date(Date.now() + 5 * 86400000)),
        createdAt: Timestamp.fromDate(new Date(Date.now() - 5 * 86400000)),
        updatedAt: Timestamp.now(),
        completedAt: null
      },
      {
        id: 'task_ecom_4',
        projectId: 'proj_ecommerce_mobile',
        title: 'Fix Cart Badge Counter Re-render Delay',
        description: 'Ensure state update triggers immediate UI badge count without lag on fast clicks.',
        status: 'IN_PROGRESS' as const,
        priority: 'HIGH' as const,
        assigneeId: devonId,
        creatorId: devonId,
        dueDate: Timestamp.fromDate(new Date(Date.now() + 1 * 86400000)),
        createdAt: Timestamp.fromDate(new Date(Date.now() - 3 * 86400000)),
        updatedAt: Timestamp.now(),
        completedAt: null
      },
      {
        id: 'task_ecom_5',
        projectId: 'proj_ecommerce_mobile',
        title: 'Accessibility Audit for Screen Readers (WCAG AA)',
        description: 'Verify ARIA attributes, focus states, and keyboard navigation across all modal overlays.',
        status: 'TODO' as const,
        priority: 'LOW' as const,
        assigneeId: devonId,
        creatorId: sarahId,
        dueDate: Timestamp.fromDate(new Date(Date.now() + 7 * 86400000)),
        createdAt: Timestamp.fromDate(new Date(Date.now() - 2 * 86400000)),
        updatedAt: Timestamp.now(),
        completedAt: null
      },
      {
        id: 'task_cloud_1',
        projectId: 'proj_cloud_migration',
        title: 'Configure Real-Time Listener Replication Pool',
        description: 'Implement memory-cached listeners for Firestore collections to reduce query volume.',
        status: 'COMPLETED' as const,
        priority: 'HIGH' as const,
        assigneeId: alexId,
        creatorId: alexId,
        dueDate: Timestamp.fromDate(new Date(Date.now() - 2 * 86400000)),
        createdAt: Timestamp.fromDate(new Date(Date.now() - 9 * 86400000)),
        updatedAt: Timestamp.now(),
        completedAt: Timestamp.fromDate(new Date(Date.now() - 2 * 86400000))
      },
      {
        id: 'task_cloud_2',
        projectId: 'proj_cloud_migration',
        title: 'Load Test Kanban Board Sync at 10,000 Concurrent Updates',
        description: 'Benchmark real-time update propagation across multiple browser tabs under stress.',
        status: 'IN_PROGRESS' as const,
        priority: 'HIGH' as const,
        assigneeId: alexId,
        creatorId: elenaId,
        dueDate: Timestamp.fromDate(new Date(Date.now() + 3 * 86400000)),
        createdAt: Timestamp.fromDate(new Date(Date.now() - 4 * 86400000)),
        updatedAt: Timestamp.now(),
        completedAt: null
      },
      {
        id: 'task_design_1',
        projectId: 'proj_design_system',
        title: 'Build Interactive Card & Button Component States',
        description: 'Add neo-brutalist borders (2px/4px), active offset transforms, and shadow tokens.',
        status: 'COMPLETED' as const,
        priority: 'HIGH' as const,
        assigneeId: sarahId,
        creatorId: sarahId,
        dueDate: Timestamp.fromDate(new Date(Date.now() - 4 * 86400000)),
        createdAt: Timestamp.fromDate(new Date(Date.now() - 6 * 86400000)),
        updatedAt: Timestamp.now(),
        completedAt: Timestamp.fromDate(new Date(Date.now() - 4 * 86400000))
      }
    ];

    for (const t of tasksToSeed) {
      await setDoc(doc(db, 'tasks', t.id), t, { merge: true });
    }

    // Step 4: Seed Project Chat Messages
    const projectMessages = [
      {
        id: 'msg_1',
        senderId: sarahId,
        senderName: 'Sarah Chen',
        text: 'Welcome to the project workspace! I updated the mobile redesign Kanban board.',
        createdAt: Timestamp.fromDate(new Date(Date.now() - 3600000 * 4)),
        editedAt: null,
        reactions: { '👍': [alexId, elenaId] }
      },
      {
        id: 'msg_2',
        senderId: alexId,
        senderName: 'Alex Rivera',
        text: 'Looks great Sarah! The real-time Kanban sync is operating smoothly across all columns.',
        createdAt: Timestamp.fromDate(new Date(Date.now() - 3600000 * 3)),
        editedAt: null,
        reactions: { '🚀': [sarahId, devonId] }
      },
      {
        id: 'msg_3',
        senderId: elenaId,
        senderName: 'Elena Rostova',
        text: '@Sarah Chen let\'s review the payment checkout modal state machine during our 3 PM sprint sync.',
        createdAt: Timestamp.fromDate(new Date(Date.now() - 3600000 * 2)),
        editedAt: null
      },
      {
        id: 'msg_4',
        senderId: devonId,
        senderName: 'Devon Vance',
        text: 'Accessibility and dark mode contrast tests passed 100%. Ready for reviewer testing!',
        createdAt: Timestamp.fromDate(new Date(Date.now() - 3600000 * 1)),
        editedAt: null,
        reactions: { '🔥': [sarahId, alexId, elenaId] }
      }
    ];

    for (const msg of projectMessages) {
      await setDoc(doc(db, 'projects', 'proj_ecommerce_mobile', 'messages', msg.id), msg, { merge: true });
    }

    // Step 5: Seed Activity Logs
    const activities: ActivityLog[] = [
      {
        id: 'act_1',
        projectId: 'proj_ecommerce_mobile',
        taskId: 'task_ecom_1',
        actorId: sarahId,
        actorName: 'Sarah Chen',
        type: 'TASK_COMPLETE',
        metadata: { taskTitle: 'Design Dark & Light Theme Token Palette' },
        createdAt: Timestamp.fromDate(new Date(Date.now() - 86400000))
      },
      {
        id: 'act_2',
        projectId: 'proj_ecommerce_mobile',
        taskId: 'task_ecom_2',
        actorId: alexId,
        actorName: 'Alex Rivera',
        type: 'TASK_STATUS_CHANGE',
        metadata: { taskTitle: 'Optimize Mobile Checkout Payment Gateway', oldValue: 'TODO', newValue: 'IN_PROGRESS' },
        createdAt: Timestamp.fromDate(new Date(Date.now() - 43200000))
      },
      {
        id: 'act_3',
        projectId: 'proj_cloud_migration',
        taskId: 'task_cloud_1',
        actorId: alexId,
        actorName: 'Alex Rivera',
        type: 'TASK_COMPLETE',
        metadata: { taskTitle: 'Configure Real-Time Listener Replication Pool' },
        createdAt: Timestamp.fromDate(new Date(Date.now() - 21600000))
      }
    ];

    for (const act of activities) {
      await setDoc(doc(db, 'activity_logs', act.id), act, { merge: true });
    }

    // Step 6: Seed Notifications for Active User
    const notifications: Notification[] = [
      {
        id: 'notif_1',
        recipientId: activeUid,
        senderId: sarahId,
        senderName: 'Sarah Chen',
        type: 'TASK_ASSIGN',
        title: 'New Task Assigned',
        body: 'Sarah Chen assigned you to "Optimize Mobile Checkout Payment Gateway"',
        link: '/app/projects/proj_ecommerce_mobile',
        isRead: false,
        createdAt: Timestamp.fromDate(new Date(Date.now() - 7200000))
      },
      {
        id: 'notif_2',
        recipientId: elenaId,
        senderId: sarahId,
        senderName: 'Sarah Chen',
        type: 'MENTION',
        title: 'Mentioned in Chat',
        body: 'Sarah Chen mentioned you in project chat',
        link: '/app/projects/proj_ecommerce_mobile/chat',
        isRead: false,
        createdAt: Timestamp.fromDate(new Date(Date.now() - 3600000))
      }
    ];

    for (const notif of notifications) {
      await setDoc(doc(db, 'notifications', notif.id), notif, { merge: true });
    }

    console.log('✅ Reviewer Test Mode workspace successfully seeded with dummy data.');
  } catch (error) {
    console.error('Error seeding test workspace data:', error);
  }
};
