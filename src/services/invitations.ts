import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  Timestamp, 
  arrayUnion,
  deleteDoc
} from 'firebase/firestore';
import { db } from './firebase';
import { Invitation, Project } from '../types';
import { logActivity } from './activity';
import { createNotification } from './notifications';

export const sendInvitation = async (
  projectId: string,
  inviteeEmail: string,
  inviterId: string,
  inviterName: string
): Promise<string> => {
  const emailClean = inviteeEmail.trim().toLowerCase();
  
  // 1. Get project details
  const projRef = doc(db, 'projects', projectId);
  const projSnap = await getDoc(projRef);
  if (!projSnap.exists()) throw new Error('Project not found');
  const project = projSnap.data() as Project;

  // 2. Check if user with this email is owner
  const usersColl = collection(db, 'users');
  const userQ = query(usersColl, where('email', '==', emailClean));
  const userSnap = await getDocs(userQ);
  
  let inviteeId: string | null = null;
  if (!userSnap.empty) {
    const userDoc = userSnap.docs[0].data();
    const uid = userDoc.uid as string;
    inviteeId = uid;
    if (project.ownerId === uid) {
      throw new Error('This user is the owner of this project');
    }
    if (project.memberIds.includes(uid)) {
      throw new Error('This user is already a member of this project');
    }
  }

  // 3. Check for existing pending invitation
  const inviteColl = collection(db, 'invitations');
  const inviteQ = query(
    inviteColl, 
    where('projectId', '==', projectId),
    where('inviteeEmail', '==', emailClean),
    where('status', '==', 'PENDING')
  );
  const inviteSnap = await getDocs(inviteQ);
  if (!inviteSnap.empty) {
    throw new Error('An invitation is already pending for this email');
  }

  // 4. Create Invitation
  const inviteRef = doc(collection(db, 'invitations'));
  const invitation: Invitation = {
    id: inviteRef.id,
    projectId,
    projectName: project.name,
    inviteeEmail: emailClean,
    inviterId,
    inviterName,
    status: 'PENDING',
    createdAt: Timestamp.now()
  };

  await setDoc(inviteRef, invitation);

  // 5. Send Notification if user already exists
  if (inviteeId) {
    await createNotification({
      recipientId: inviteeId,
      senderId: inviterId,
      senderName: inviterName,
      type: 'PROJECT_INVITE',
      title: 'Project Invitation',
      body: `${inviterName} invited you to join the project "${project.name}".`,
      link: `/app/dashboard`
    });
  }

  // 6. Log Activity
  await logActivity({
    projectId,
    taskId: null,
    actorId: inviterId,
    actorName: inviterName,
    type: 'INVITATION_SEND',
    metadata: { memberName: emailClean, projectName: project.name }
  });

  return inviteRef.id;
};

export const acceptInvitation = async (
  invitationId: string,
  inviteeId: string,
  inviteeName: string
): Promise<void> => {
  const inviteRef = doc(db, 'invitations', invitationId);
  const inviteSnap = await getDoc(inviteRef);
  if (!inviteSnap.exists()) throw new Error('Invitation not found');
  const invite = inviteSnap.data() as Invitation;

  if (invite.status !== 'PENDING') {
    throw new Error('This invitation has already been processed or canceled');
  }

  // 1. Update project members
  const projectRef = doc(db, 'projects', invite.projectId);
  await updateDoc(projectRef, {
    memberIds: arrayUnion(inviteeId),
    updatedAt: Timestamp.now()
  });

  // 2. Update invitation status
  await updateDoc(inviteRef, {
    status: 'ACCEPTED'
  });

  // 3. Send Notification to inviter
  await createNotification({
    recipientId: invite.inviterId,
    senderId: inviteeId,
    senderName: inviteeName,
    type: 'MEMBER_CHANGE',
    title: 'Invitation Accepted',
    body: `${inviteeName} accepted your invite to join "${invite.projectName}".`,
    link: `/app/projects/${invite.projectId}`
  });

  // 4. Log Activity
  await logActivity({
    projectId: invite.projectId,
    taskId: null,
    actorId: inviteeId,
    actorName: inviteeName,
    type: 'INVITATION_ACCEPT',
    metadata: { memberName: inviteeName, projectName: invite.projectName }
  });
};

export const declineInvitation = async (invitationId: string): Promise<void> => {
  const inviteRef = doc(db, 'invitations', invitationId);
  await updateDoc(inviteRef, {
    status: 'DECLINED'
  });
};

export const cancelInvitation = async (invitationId: string): Promise<void> => {
  const inviteRef = doc(db, 'invitations', invitationId);
  await deleteDoc(inviteRef);
};

export const getPendingInvitationsForUser = async (email: string): Promise<Invitation[]> => {
  const q = query(
    collection(db, 'invitations'),
    where('inviteeEmail', '==', email.trim().toLowerCase()),
    where('status', '==', 'PENDING')
  );
  const snap = await getDocs(q);
  const list: Invitation[] = [];
  snap.forEach((doc) => {
    list.push(doc.data() as Invitation);
  });
  return list;
};

export const getProjectInvitations = async (projectId: string): Promise<Invitation[]> => {
  const q = query(
    collection(db, 'invitations'),
    where('projectId', '==', projectId),
    where('status', '==', 'PENDING')
  );
  const snap = await getDocs(q);
  const list: Invitation[] = [];
  snap.forEach((doc) => {
    list.push(doc.data() as Invitation);
  });
  return list;
};
