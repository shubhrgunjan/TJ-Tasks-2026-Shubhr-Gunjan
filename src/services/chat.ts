import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  getDocs, 
  onSnapshot, 
  Timestamp,
  getDoc,
  orderBy
} from 'firebase/firestore';
import { db } from './firebase';
import { ChatConversation, ChatMessage } from '../types';
import { createNotification } from './notifications';

export const createOrGetDMConversation = async (
  uid1: string,
  uid2: string
): Promise<string> => {
  const conversationsColl = collection(db, 'conversations');
  const q = query(
    conversationsColl,
    where('participantIds', 'array-contains', uid1)
  );

  const snap = await getDocs(q);
  let conversationId = '';

  snap.forEach((doc) => {
    const data = doc.data() as ChatConversation;
    if (data.participantIds.includes(uid2)) {
      conversationId = doc.id;
    }
  });

  if (conversationId) return conversationId;

  // Create new conversation
  const newConvRef = doc(conversationsColl);
  const newConversation: ChatConversation = {
    id: newConvRef.id,
    participantIds: [uid1, uid2],
    lastMessageText: 'Conversation started',
    lastMessageAt: Timestamp.now()
  };

  await setDoc(newConvRef, newConversation);
  return newConvRef.id;
};

export const subscribeConversations = (
  userId: string,
  callback: (conversations: ChatConversation[]) => void,
  onError?: (error: any) => void
) => {
  const q = query(
    collection(db, 'conversations'),
    where('participantIds', 'array-contains', userId)
  );

  return onSnapshot(q, (snapshot) => {
    const list: ChatConversation[] = [];
    snapshot.forEach((doc) => {
      list.push(doc.data() as ChatConversation);
    });
    // Sort in memory
    const sorted = list.sort((a, b) => b.lastMessageAt.toMillis() - a.lastMessageAt.toMillis());
    callback(sorted);
  }, (err) => {
    console.error('Error listening to conversations:', err);
    if (onError) onError(err);
  });
};

export const subscribeMessages = (
  type: 'DM' | 'PROJECT',
  targetId: string,
  callback: (messages: ChatMessage[]) => void,
  onError?: (error: any) => void
) => {
  const messagesColl = type === 'DM'
    ? collection(db, 'conversations', targetId, 'messages')
    : collection(db, 'projects', targetId, 'messages');

  return onSnapshot(messagesColl, (snapshot) => {
    const list: ChatMessage[] = [];
    snapshot.forEach((doc) => {
      list.push(doc.data() as ChatMessage);
    });
    const sorted = list.sort((a, b) => a.createdAt.toMillis() - b.createdAt.toMillis());
    callback(sorted);
  }, (err) => {
    console.error('Error listening to messages:', err);
    if (onError) onError(err);
  });
};

export const sendMessage = async (
  type: 'DM' | 'PROJECT',
  targetId: string,
  senderId: string,
  senderName: string,
  text: string,
  replyTo: ChatMessage['replyTo'] = null,
  taskRef: ChatMessage['taskRef'] = null
): Promise<string> => {
  const messagesColl = type === 'DM'
    ? collection(db, 'conversations', targetId, 'messages')
    : collection(db, 'projects', targetId, 'messages');

  const msgRef = doc(messagesColl);
  const messageId = msgRef.id;

  const newMessage: ChatMessage = {
    id: messageId,
    senderId,
    senderName,
    text,
    createdAt: Timestamp.now(),
    editedAt: null,
    reactions: {},
    replyTo,
    taskRef
  };

  await setDoc(msgRef, newMessage);

  // Update last message in DM conversation
  if (type === 'DM') {
    const convRef = doc(db, 'conversations', targetId);
    await updateDoc(convRef, {
      lastMessageText: text,
      lastMessageAt: Timestamp.now()
    });

    // Notify other participant
    const convSnap = await getDoc(convRef);
    if (convSnap.exists()) {
      const conv = convSnap.data() as ChatConversation;
      const otherId = conv.participantIds.find(uid => uid !== senderId);
      if (otherId) {
        await createNotification({
          recipientId: otherId,
          senderId,
          senderName,
          type: 'DIRECT_MESSAGE',
          title: `Message from ${senderName}`,
          body: text.substring(0, 80),
          link: `/app/chat?conv=${targetId}`
        });
      }
    }
  }

  // Handle Mentions (e.g. "@Username") in Project chat
  if (type === 'PROJECT') {
    const mentions = text.match(/@\[?([^\]@\s]+)\]?/g);
    if (mentions) {
      const usersColl = collection(db, 'users');
      const processedNames = new Set<string>();

      for (const mention of mentions) {
        const targetName = mention.replace('@', '').replace('[', '').replace(']', '').trim();
        if (processedNames.has(targetName)) continue;
        processedNames.add(targetName);

        const q = query(usersColl, where('displayName', '==', targetName));
        const snap = await getDocs(q);

        if (!snap.empty) {
          const targetUserId = snap.docs[0].id;
          if (targetUserId !== senderId) {
            // Get project name
            const projSnap = await getDoc(doc(db, 'projects', targetId));
            const projName = projSnap.exists() ? projSnap.data().name : 'Project';

            await createNotification({
              recipientId: targetUserId,
              senderId,
              senderName,
              type: 'MENTION',
              title: `Mentioned in ${projName}`,
              body: `${senderName} mentioned you in project chat: "${text.substring(0, 50)}..."`,
              link: `/app/projects/${targetId}/chat`
            });
          }
        }
      }
    }
  }

  return messageId;
};

export const updateMessage = async (
  type: 'DM' | 'PROJECT',
  targetId: string,
  messageId: string,
  text: string
): Promise<void> => {
  const msgRef = type === 'DM'
    ? doc(db, 'conversations', targetId, 'messages', messageId)
    : doc(db, 'projects', targetId, 'messages', messageId);

  await updateDoc(msgRef, {
    text,
    editedAt: Timestamp.now()
  });
};

export const deleteMessage = async (
  type: 'DM' | 'PROJECT',
  targetId: string,
  messageId: string
): Promise<void> => {
  const msgRef = type === 'DM'
    ? doc(db, 'conversations', targetId, 'messages', messageId)
    : doc(db, 'projects', targetId, 'messages', messageId);

  await deleteDoc(msgRef);
};

export const addReactionToMessage = async (
  type: 'DM' | 'PROJECT',
  targetId: string,
  messageId: string,
  reaction: string,
  userId: string
): Promise<void> => {
  const msgRef = type === 'DM'
    ? doc(db, 'conversations', targetId, 'messages', messageId)
    : doc(db, 'projects', targetId, 'messages', messageId);

  const snap = await getDoc(msgRef);
  if (!snap.exists()) return;

  const msgData = snap.data() as ChatMessage;
  const currentReactions = msgData.reactions || {};
  const currentReactionUsers = currentReactions[reaction] || [];

  let updatedUsers: string[];
  if (currentReactionUsers.includes(userId)) {
    // Remove reaction
    updatedUsers = currentReactionUsers.filter(uid => uid !== userId);
  } else {
    // Add reaction
    updatedUsers = [...currentReactionUsers, userId];
  }

  const updatedReactions = {
    ...currentReactions,
    [reaction]: updatedUsers
  };

  // Clean empty reactions
  if (updatedUsers.length === 0) {
    delete updatedReactions[reaction];
  }

  await updateDoc(msgRef, {
    reactions: updatedReactions
  });
};
