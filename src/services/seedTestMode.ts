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
    role: 'Lead Product Designer & UX Architect',
    email: 'sarah.chen@tjflow.demo',
    password: 'DemoUser2026!',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    bio: 'UI/UX Lead crafting high-contrast design systems, geometric tokens, and accessible mobile interfaces across product roadmaps.',
    isPro: true,
    color: '#FF4D4D'
  },
  alex: {
    key: 'alex',
    displayName: 'Alex Rivera',
    role: 'Senior Fullstack Systems Engineer',
    email: 'alex.rivera@tjflow.demo',
    password: 'DemoUser2026!',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    bio: 'Architecting real-time state synchronization, Firestore listener pools, WebSocket fallbacks, and distributed database migrations.',
    isPro: true,
    color: '#0066FF'
  },
  elena: {
    key: 'elena',
    displayName: 'Elena Rostova',
    role: 'VP of Product & Engineering Ops',
    email: 'elena.rostova@tjflow.demo',
    password: 'DemoUser2026!',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    bio: 'Managing cross-functional sprint velocities, product roadmaps, client launches, and enterprise infrastructure scaling.',
    isPro: true,
    color: '#FFCC00'
  },
  devon: {
    key: 'devon',
    displayName: 'Devon Vance',
    role: 'Lead Security Auditor & QA Specialist',
    email: 'devon.vance@tjflow.demo',
    password: 'DemoUser2026!',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    bio: 'Penetration testing, WCAG AA accessibility compliance, automated load testing, and real-time security event auditing.',
    isPro: true,
    color: '#10B981'
  }
};

/**
 * Log in as a pre-configured test persona.
 * Guarantees that ALL 4 test personas exist in Firebase Auth & Firestore with verified UIDs.
 */
export const loginAsTestPersona = async (personaKey: string): Promise<UserProfile> => {
  const targetPersona = TEST_PERSONAS[personaKey] || TEST_PERSONAS.sarah;

  // Step 1: Login or create the requested user in Firebase Auth
  let activeUser;
  try {
    const cred = await signInWithEmailAndPassword(auth, targetPersona.email, targetPersona.password);
    activeUser = cred.user;
  } catch (err: any) {
    if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
      const cred = await createUserWithEmailAndPassword(auth, targetPersona.email, targetPersona.password);
      activeUser = cred.user;
      await updateProfile(activeUser, { displayName: targetPersona.displayName, photoURL: targetPersona.avatar });
    } else {
      throw err;
    }
  }

  // Update profile in Firestore for target persona
  const userRef = doc(db, 'users', activeUser.uid);
  const profileData: UserProfile = {
    uid: activeUser.uid,
    displayName: targetPersona.displayName,
    email: targetPersona.email,
    photoURL: targetPersona.avatar,
    bio: targetPersona.bio,
    themePreference: 'light',
    isPro: targetPersona.isPro,
    subscriptionPlan: 'PRO',
    createdAt: Timestamp.fromDate(new Date(Date.now() - 30 * 86400000)),
    updatedAt: Timestamp.now()
  };

  await setDoc(userRef, profileData, { merge: true });
  localStorage.setItem('tjflow_test_persona', personaKey);

  // Seed the entire workspace with rich test data
  await seedTestWorkspaceData(activeUser.uid);

  return profileData;
};

/**
 * Seed Firestore with 6 rich projects, 25+ tasks, comments, messages, notifications, and activity logs.
 */
export const seedTestWorkspaceData = async (
  activeUid: string, 
  personaUidsInput?: Record<string, string> | boolean,
  forceReSeed = false
): Promise<void> => {
  try {
    const personaKey = localStorage.getItem('tjflow_test_persona') || 'sarah';

    let sarahId = activeUid;
    let alexId = activeUid;
    let elenaId = activeUid;
    let devonId = activeUid;

    // Fetch existing persona UIDs from users collection if available
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      usersSnap.forEach((uDoc) => {
        const uData = uDoc.data();
        if (uData.email === TEST_PERSONAS.sarah.email) sarahId = uDoc.id;
        if (uData.email === TEST_PERSONAS.alex.email) alexId = uDoc.id;
        if (uData.email === TEST_PERSONAS.elena.email) elenaId = uDoc.id;
        if (uData.email === TEST_PERSONAS.devon.email) devonId = uDoc.id;
      });
    } catch (e) {
      console.warn('Error fetching users for seeding:', e);
    }

    // Ensure current persona uses activeUid
    if (personaKey === 'sarah') sarahId = activeUid;
    if (personaKey === 'alex') alexId = activeUid;
    if (personaKey === 'elena') elenaId = activeUid;
    if (personaKey === 'devon') devonId = activeUid;

    const allMemberIds = Array.from(new Set([sarahId, alexId, elenaId, devonId, activeUid]));

    // Step 1: Ensure User Documents for all 4 Personas in Firestore
    const userProfiles: UserProfile[] = [
      {
        uid: sarahId,
        displayName: TEST_PERSONAS.sarah.displayName,
        email: TEST_PERSONAS.sarah.email,
        photoURL: TEST_PERSONAS.sarah.avatar,
        bio: TEST_PERSONAS.sarah.bio,
        themePreference: 'light',
        isPro: true,
        subscriptionPlan: 'PRO',
        createdAt: Timestamp.fromDate(new Date(Date.now() - 45 * 86400000)),
        updatedAt: Timestamp.now()
      },
      {
        uid: alexId,
        displayName: TEST_PERSONAS.alex.displayName,
        email: TEST_PERSONAS.alex.email,
        photoURL: TEST_PERSONAS.alex.avatar,
        bio: TEST_PERSONAS.alex.bio,
        themePreference: 'dark',
        isPro: true,
        subscriptionPlan: 'PRO',
        createdAt: Timestamp.fromDate(new Date(Date.now() - 45 * 86400000)),
        updatedAt: Timestamp.now()
      },
      {
        uid: elenaId,
        displayName: TEST_PERSONAS.elena.displayName,
        email: TEST_PERSONAS.elena.email,
        photoURL: TEST_PERSONAS.elena.avatar,
        bio: TEST_PERSONAS.elena.bio,
        themePreference: 'light',
        isPro: true,
        subscriptionPlan: 'PRO',
        createdAt: Timestamp.fromDate(new Date(Date.now() - 45 * 86400000)),
        updatedAt: Timestamp.now()
      },
      {
        uid: devonId,
        displayName: TEST_PERSONAS.devon.displayName,
        email: TEST_PERSONAS.devon.email,
        photoURL: TEST_PERSONAS.devon.avatar,
        bio: TEST_PERSONAS.devon.bio,
        themePreference: 'light',
        isPro: true,
        subscriptionPlan: 'PRO',
        createdAt: Timestamp.fromDate(new Date(Date.now() - 45 * 86400000)),
        updatedAt: Timestamp.now()
      }
    ];

    for (const u of userProfiles) {
      await setDoc(doc(db, 'users', u.uid), u, { merge: true });
    }

    // Step 2: Create 6 Rich Projects with Human Descriptions
    const projectsToSeed = [
      {
        id: 'proj_ecommerce_mobile',
        name: '🛒 E-Commerce Mobile App Redesign (v3.0)',
        description: 'Complete overhaul of mobile shopping cart experience, design token integration, 1-click Apple Pay checkout, and real-time order tracking.',
        ownerId: sarahId,
        memberIds: allMemberIds,
        status: 'ACTIVE' as const,
        createdAt: Timestamp.fromDate(new Date(Date.now() - 14 * 86400000)),
        updatedAt: Timestamp.now()
      },
      {
        id: 'proj_cloud_migration',
        name: '☁️ Cloud Infrastructure & Database Migration',
        description: 'Migrating core services to serverless infrastructure with real-time replication pools, zero-downtime failover, and automated Firestore snapshot backups.',
        ownerId: alexId,
        memberIds: allMemberIds,
        status: 'ACTIVE' as const,
        createdAt: Timestamp.fromDate(new Date(Date.now() - 20 * 86400000)),
        updatedAt: Timestamp.now()
      },
      {
        id: 'proj_design_system',
        name: '🎨 Design System 3.0 Geometric Tokens',
        description: 'Standardizing neo-brutalist geometric component tokens (● ■ ▲), cubic-bezier micro-animations, color contrast accessibility, and Figma component sync.',
        ownerId: sarahId,
        memberIds: allMemberIds,
        status: 'ACTIVE' as const,
        createdAt: Timestamp.fromDate(new Date(Date.now() - 10 * 86400000)),
        updatedAt: Timestamp.now()
      },
      {
        id: 'proj_ai_assistant',
        name: '🤖 AI Content & Task Summarizer Engine',
        description: 'Integrating GenAI pipelines for automated task summaries, sprint retrospective generation, smart search indexing, and natural language query filters.',
        ownerId: elenaId,
        memberIds: allMemberIds,
        status: 'ACTIVE' as const,
        createdAt: Timestamp.fromDate(new Date(Date.now() - 7 * 86400000)),
        updatedAt: Timestamp.now()
      },
      {
        id: 'proj_security_audit',
        name: '🔐 Zero-Trust Security & Penetration Audit',
        description: 'Conducting penetration tests, database security rule audits, rate-limiting socket middleware, and WCAG AA screen reader accessibility compliance.',
        ownerId: devonId,
        memberIds: allMemberIds,
        status: 'ACTIVE' as const,
        createdAt: Timestamp.fromDate(new Date(Date.now() - 5 * 86400000)),
        updatedAt: Timestamp.now()
      },
      {
        id: 'proj_q4_launch',
        name: '🚀 Q4 Product Launch & Marketing Campaign',
        description: 'Coordinating cross-functional deliverables, customer beta invites, press kit releases, pricing page upgrades, and launch telemetry monitoring.',
        ownerId: elenaId,
        memberIds: allMemberIds,
        status: 'ACTIVE' as const,
        createdAt: Timestamp.fromDate(new Date(Date.now() - 3 * 86400000)),
        updatedAt: Timestamp.now()
      }
    ];

    for (const proj of projectsToSeed) {
      await setDoc(doc(db, 'projects', proj.id), proj, { merge: true });
    }

    // Step 3: Seed 25+ Kanban Tasks with Detailed Human Content
    const tasksToSeed = [
      // Project 1: E-Commerce Mobile App Redesign
      {
        id: 'task_ecom_1',
        projectId: 'proj_ecommerce_mobile',
        title: 'Design Dark & Light Theme Token Palette',
        description: 'Define CSS custom variables for canvas-bg, card-bg, text-canvas-fg, and Bauhaus primary accent colors to guarantee WCAG AA contrast ratios.',
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
        description: 'Build interactive 3-step checkout modal with live credit card preview widget, Luhn algorithm validation, and simulated authorization states.',
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
        description: 'Integrate Web Payments API for instant 1-click mobile checkout on iOS Safari and Android Chrome devices.',
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
        description: 'Ensure state update triggers immediate UI badge count updates without noticeable re-render lag on rapid user clicks.',
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
        title: 'Screen Reader Accessibility Audit (WCAG AA)',
        description: 'Verify ARIA attributes, focus traps, and keyboard navigation across all modal overlays and dropdown menus.',
        status: 'TODO' as const,
        priority: 'LOW' as const,
        assigneeId: devonId,
        creatorId: sarahId,
        dueDate: Timestamp.fromDate(new Date(Date.now() + 7 * 86400000)),
        createdAt: Timestamp.fromDate(new Date(Date.now() - 2 * 86400000)),
        updatedAt: Timestamp.now(),
        completedAt: null
      },

      // Project 2: Cloud Infrastructure Migration
      {
        id: 'task_cloud_1',
        projectId: 'proj_cloud_migration',
        title: 'Configure Real-Time Listener Replication Pool',
        description: 'Implement memory-cached listeners for Firestore collections to reduce query overhead and eliminate redundant snapshot listeners.',
        status: 'COMPLETED' as const,
        priority: 'HIGH' as const,
        assigneeId: alexId,
        creatorId: alexId,
        dueDate: Timestamp.fromDate(new Date(Date.now() - 2 * 86400000)),
        createdAt: Timestamp.fromDate(new Date(Date.now() - 15 * 86400000)),
        updatedAt: Timestamp.now(),
        completedAt: Timestamp.fromDate(new Date(Date.now() - 2 * 86400000))
      },
      {
        id: 'task_cloud_2',
        projectId: 'proj_cloud_migration',
        title: 'Load Test Kanban Sync at 10,000 Concurrent Updates',
        description: 'Benchmark real-time update propagation across multiple browser tabs under high artificial load.',
        status: 'IN_PROGRESS' as const,
        priority: 'HIGH' as const,
        assigneeId: alexId,
        creatorId: elenaId,
        dueDate: Timestamp.fromDate(new Date(Date.now() + 3 * 86400000)),
        createdAt: Timestamp.fromDate(new Date(Date.now() - 6 * 86400000)),
        updatedAt: Timestamp.now(),
        completedAt: null
      },
      {
        id: 'task_cloud_3',
        projectId: 'proj_cloud_migration',
        title: 'Automated Daily Firestore Index Backups',
        description: 'Set up Cloud Scheduler job to trigger automated JSON snapshots of index definitions and collections.',
        status: 'TODO' as const,
        priority: 'MEDIUM' as const,
        assigneeId: devonId,
        creatorId: alexId,
        dueDate: Timestamp.fromDate(new Date(Date.now() + 4 * 86400000)),
        createdAt: Timestamp.fromDate(new Date(Date.now() - 2 * 86400000)),
        updatedAt: Timestamp.now(),
        completedAt: null
      },

      // Project 3: Design System 3.0 Tokens
      {
        id: 'task_design_1',
        projectId: 'proj_design_system',
        title: 'Build Interactive Card & Button Component States',
        description: 'Implement neo-brutalist borders (2px/4px), active offset transforms, and sharp card shadow tokens.',
        status: 'COMPLETED' as const,
        priority: 'HIGH' as const,
        assigneeId: sarahId,
        creatorId: sarahId,
        dueDate: Timestamp.fromDate(new Date(Date.now() - 4 * 86400000)),
        createdAt: Timestamp.fromDate(new Date(Date.now() - 8 * 86400000)),
        updatedAt: Timestamp.now(),
        completedAt: Timestamp.fromDate(new Date(Date.now() - 4 * 86400000))
      },
      {
        id: 'task_design_2',
        projectId: 'proj_design_system',
        title: 'Add Cubic-Bezier Float & Bounce Keyframes',
        description: 'Create smooth micro-animation curves for landing hero geometric shapes (● ■ ▲) and button hovers.',
        status: 'COMPLETED' as const,
        priority: 'MEDIUM' as const,
        assigneeId: sarahId,
        creatorId: sarahId,
        dueDate: Timestamp.fromDate(new Date(Date.now() - 1 * 86400000)),
        createdAt: Timestamp.fromDate(new Date(Date.now() - 5 * 86400000)),
        updatedAt: Timestamp.now(),
        completedAt: Timestamp.fromDate(new Date(Date.now() - 1 * 86400000))
      },
      {
        id: 'task_design_3',
        projectId: 'proj_design_system',
        title: 'Document Color Palette Accessibility Matrix',
        description: 'Create markdown table specifying foreground/background contrast compliance for light and dark modes.',
        status: 'IN_PROGRESS' as const,
        priority: 'LOW' as const,
        assigneeId: sarahId,
        creatorId: devonId,
        dueDate: Timestamp.fromDate(new Date(Date.now() + 2 * 86400000)),
        createdAt: Timestamp.fromDate(new Date(Date.now() - 3 * 86400000)),
        updatedAt: Timestamp.now(),
        completedAt: null
      },

      // Project 4: AI Content Assistant Engine
      {
        id: 'task_ai_1',
        projectId: 'proj_ai_assistant',
        title: 'Prototype Task Auto-Categorization Prompt Engine',
        description: 'Build prompt pipeline that analyzes task title & description to suggest priority tags automatically.',
        status: 'IN_PROGRESS' as const,
        priority: 'HIGH' as const,
        assigneeId: elenaId,
        creatorId: elenaId,
        dueDate: Timestamp.fromDate(new Date(Date.now() + 1 * 86400000)),
        createdAt: Timestamp.fromDate(new Date(Date.now() - 4 * 86400000)),
        updatedAt: Timestamp.now(),
        completedAt: null
      },
      {
        id: 'task_ai_2',
        projectId: 'proj_ai_assistant',
        title: 'Sprint Retrospective Natural Language Summarizer',
        description: 'Generate concise weekly summaries of completed tasks, blockers, and team activity streams.',
        status: 'TODO' as const,
        priority: 'MEDIUM' as const,
        assigneeId: alexId,
        creatorId: elenaId,
        dueDate: Timestamp.fromDate(new Date(Date.now() + 6 * 86400000)),
        createdAt: Timestamp.fromDate(new Date(Date.now() - 2 * 86400000)),
        updatedAt: Timestamp.now(),
        completedAt: null
      },

      // Project 5: Security Audit
      {
        id: 'task_sec_1',
        projectId: 'proj_security_audit',
        title: 'Firestore Security Rules Member Permission Audit',
        description: 'Verify that write operations enforce ownerId and memberIds validation rules across all collections.',
        status: 'COMPLETED' as const,
        priority: 'HIGH' as const,
        assigneeId: devonId,
        creatorId: devonId,
        dueDate: Timestamp.fromDate(new Date(Date.now() - 3 * 86400000)),
        createdAt: Timestamp.fromDate(new Date(Date.now() - 6 * 86400000)),
        updatedAt: Timestamp.now(),
        completedAt: Timestamp.fromDate(new Date(Date.now() - 3 * 86400000))
      },
      {
        id: 'task_sec_2',
        projectId: 'proj_security_audit',
        title: 'Rate-Limiting API Middleware for Socket Chat',
        description: 'Implement token bucket algorithm to prevent message spam in project channels.',
        status: 'IN_PROGRESS' as const,
        priority: 'HIGH' as const,
        assigneeId: devonId,
        creatorId: devonId,
        dueDate: Timestamp.fromDate(new Date(Date.now() + 2 * 86400000)),
        createdAt: Timestamp.fromDate(new Date(Date.now() - 2 * 86400000)),
        updatedAt: Timestamp.now(),
        completedAt: null
      }
    ];

    for (const t of tasksToSeed) {
      await setDoc(doc(db, 'tasks', t.id), t, { merge: true });
    }

    // Step 4: Seed Task Comments with Realistic Discussions
    const taskComments = [
      {
        id: 'comment_1',
        taskId: 'task_ecom_2',
        authorId: sarahId,
        authorName: 'Sarah Chen',
        text: 'I updated the card widget graphics in Figma. The gradient credit card widget now updates in real-time as card numbers are entered.',
        createdAt: Timestamp.fromDate(new Date(Date.now() - 3600000 * 5)),
        editedAt: null
      },
      {
        id: 'comment_2',
        taskId: 'task_ecom_2',
        authorId: alexId,
        authorName: 'Alex Rivera',
        text: 'Awesome Sarah! I integrated the Luhn sanitizer algorithm. Credit card numbers now format with clean bullet spacing.',
        createdAt: Timestamp.fromDate(new Date(Date.now() - 3600000 * 3)),
        editedAt: null
      },
      {
        id: 'comment_3',
        taskId: 'task_cloud_2',
        authorId: devonId,
        authorName: 'Devon Vance',
        text: 'Ran 5,000 concurrent update iterations in the staging sandbox. Memory consumption remained stable under 42 MB.',
        createdAt: Timestamp.fromDate(new Date(Date.now() - 3600000 * 2)),
        editedAt: null
      }
    ];

    for (const c of taskComments) {
      await setDoc(doc(db, 'task_comments', c.id), c, { merge: true });
    }

    // Step 5: Seed Realistic Project Chat Messages
    const projectMessages = [
      {
        id: 'msg_ecom_1',
        senderId: sarahId,
        senderName: 'Sarah Chen',
        text: 'Welcome team! I finalized the mobile checkout flow design specs on the Kanban board.',
        createdAt: Timestamp.fromDate(new Date(Date.now() - 3600000 * 6)),
        editedAt: null,
        reactions: { '👍': [alexId, elenaId] }
      },
      {
        id: 'msg_ecom_2',
        senderId: alexId,
        senderName: 'Alex Rivera',
        text: 'Thanks Sarah! The live task status updates are syncing across all columns in real-time.',
        createdAt: Timestamp.fromDate(new Date(Date.now() - 3600000 * 5)),
        editedAt: null,
        reactions: { '🚀': [sarahId, devonId] }
      },
      {
        id: 'msg_ecom_3',
        senderId: elenaId,
        senderName: 'Elena Rostova',
        text: '@Sarah Chen let\'s review the payment checkout modal state machine during our 3 PM sprint sync.',
        createdAt: Timestamp.fromDate(new Date(Date.now() - 3600000 * 3)),
        editedAt: null
      },
      {
        id: 'msg_ecom_4',
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

    // Step 6: Seed Direct Messages (DM Conversations)
    const dmConvId = 'conv_sarah_alex';
    await setDoc(doc(db, 'conversations', dmConvId), {
      id: dmConvId,
      participantIds: [sarahId, alexId],
      lastMessageText: 'The real-time listener pool is working flawlessly!',
      lastMessageAt: Timestamp.fromDate(new Date(Date.now() - 1800000))
    }, { merge: true });

    const dmMessages = [
      {
        id: 'dm_1',
        senderId: sarahId,
        senderName: 'Sarah Chen',
        text: 'Hey Alex, do you have a quick moment to verify the Firestore security rules for member access?',
        createdAt: Timestamp.fromDate(new Date(Date.now() - 3600000 * 2)),
        editedAt: null
      },
      {
        id: 'dm_2',
        senderId: alexId,
        senderName: 'Alex Rivera',
        text: 'Just checked them! Everything is locked down so only project members can query task snapshots.',
        createdAt: Timestamp.fromDate(new Date(Date.now() - 3600000 * 1)),
        editedAt: null
      },
      {
        id: 'dm_3',
        senderId: sarahId,
        senderName: 'Sarah Chen',
        text: 'The real-time listener pool is working flawlessly!',
        createdAt: Timestamp.fromDate(new Date(Date.now() - 1800000)),
        editedAt: null
      }
    ];

    for (const dm of dmMessages) {
      await setDoc(doc(db, 'conversations', dmConvId, 'messages', dm.id), dm, { merge: true });
    }

    // Step 7: Seed Activity Logs
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
      },
      {
        id: 'act_4',
        projectId: 'proj_design_system',
        taskId: 'task_design_1',
        actorId: sarahId,
        actorName: 'Sarah Chen',
        type: 'TASK_COMPLETE',
        metadata: { taskTitle: 'Build Interactive Card & Button Component States' },
        createdAt: Timestamp.fromDate(new Date(Date.now() - 10800000))
      }
    ];

    for (const act of activities) {
      await setDoc(doc(db, 'activity_logs', act.id), act, { merge: true });
    }

    // Step 8: Seed Notifications for Active User
    const notifications: Notification[] = [
      {
        id: `notif_assign_${activeUid}`,
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
        id: `notif_mention_${activeUid}`,
        recipientId: activeUid,
        senderId: elenaId,
        senderName: 'Elena Rostova',
        type: 'MENTION',
        title: 'Mentioned in Chat',
        body: 'Elena Rostova mentioned you in #general project chat',
        link: '/app/projects/proj_ecommerce_mobile/chat',
        isRead: false,
        createdAt: Timestamp.fromDate(new Date(Date.now() - 3600000))
      }
    ];

    for (const notif of notifications) {
      await setDoc(doc(db, 'notifications', notif.id), notif, { merge: true });
    }

    console.log('✅ Reviewer Test Mode workspace successfully seeded with rich populated data.');
  } catch (error) {
    console.error('Error seeding test workspace data:', error);
  }
};
