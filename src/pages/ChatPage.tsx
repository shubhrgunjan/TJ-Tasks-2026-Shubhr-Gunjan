import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAllUsers } from '../services/users';
import { getUserProjects } from '../services/projects';
import { 
  createOrGetDMConversation, 
  subscribeConversations, 
  subscribeMessages, 
  sendMessage, 
  updateMessage, 
  deleteMessage, 
  addReactionToMessage 
} from '../services/chat';
import { ChatConversation, ChatMessage, UserProfile, Project, Task } from '../types';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { 
  Search, MessageSquare, Send, Reply, Edit3, Trash2, 
  CornerDownRight, Hash, Link as LinkIcon, User, Plus, X, AlertTriangle 
} from 'lucide-react';

export const ChatPage: React.FC = () => {
  const { profile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const activeConvId = searchParams.get('conv');
  const activeProjectId = searchParams.get('project');

  // Sidebar List State
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);

  // Errors
  const [convsError, setConvsError] = useState<string | null>(null);
  const [messagesError, setMessagesError] = useState<string | null>(null);

  // Search/Filters
  const [userSearchText, setUserSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);

  // Chat Panel State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [activePartner, setActivePartner] = useState<UserProfile | null>(null);
  const [activeProjectObj, setActiveProjectObj] = useState<Project | null>(null);

  // Edit / Reply / Task Ref drafts
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [replyContext, setReplyContext] = useState<ChatMessage | null>(null);
  const [selectedTaskRef, setSelectedTaskRef] = useState<Task | null>(null);
  const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
  const [showTaskSelector, setShowTaskSelector] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load sidebar data & list all users
  useEffect(() => {
    if (!profile) return;

    const loadSidebarData = async () => {
      try {
        const userProjects = await getUserProjects(profile.uid);
        setProjects(userProjects);
        const usersList = await getAllUsers();
        setAllUsers(usersList.filter(u => u.uid !== profile.uid));
      } catch (e) {
        console.error(e);
      }
    };
    loadSidebarData();

    // Subscribe to DM conversations list with error handling
    setConvsError(null);
    const unsubscribeConversations = subscribeConversations(profile.uid, (convList) => {
      setConversations(convList);
    }, (err) => {
      console.error(err);
      setConvsError('Database permission error. Please make sure firestore.rules are deployed.');
    });

    return () => unsubscribeConversations();
  }, [profile]);

  // Handle query params on load
  useEffect(() => {
    const handleUserIdParam = async () => {
      const contactUserId = searchParams.get('userId');
      if (contactUserId && profile) {
        searchParams.delete('userId');
        setSearchParams(searchParams);

        try {
          const convId = await createOrGetDMConversation(profile.uid, contactUserId);
          setSearchParams({ conv: convId });
        } catch (e) {
          console.error(e);
        }
      }
    };
    handleUserIdParam();
  }, [searchParams, profile]);

  // Subscribe to messages when active chat changes
  useEffect(() => {
    let unsubscribeMessages: () => void = () => {};

    const syncActiveChatDetails = async () => {
      setMessages([]);
      setActivePartner(null);
      setActiveProjectObj(null);
      setReplyContext(null);
      setSelectedTaskRef(null);
      setMessagesError(null);

      if (activeConvId && profile) {
        const activeConv = conversations.find(c => c.id === activeConvId);
        if (activeConv) {
          const partnerId = activeConv.participantIds.find(uid => uid !== profile.uid);
          if (partnerId) {
            const foundUser = allUsers.find(u => u.uid === partnerId) || await getUserProfileFallback(partnerId);
            setActivePartner(foundUser);
          }
        }
        
        unsubscribeMessages = subscribeMessages('DM', activeConvId, (msgList) => {
          setMessages(msgList);
          setMessagesError(null);
          scrollToBottom();
        }, (err) => {
          console.error(err);
          setMessagesError('Access denied. Please check your firestore.rules configurations.');
        });
      } else if (activeProjectId && profile) {
        const foundProj = projects.find(p => p.id === activeProjectId);
        if (foundProj) {
          setActiveProjectObj(foundProj);
          loadProjectTasks(activeProjectId);
        }

        unsubscribeMessages = subscribeMessages('PROJECT', activeProjectId, (msgList) => {
          setMessages(msgList);
          setMessagesError(null);
          scrollToBottom();
        }, (err) => {
          console.error(err);
          setMessagesError('Access denied to project channel chat. Check firestore.rules.');
        });
      }
    };

    syncActiveChatDetails();
    return () => unsubscribeMessages();
  }, [activeConvId, activeProjectId, conversations, projects, allUsers, profile]);

  const loadProjectTasks = async (pId: string) => {
    try {
      const tasksColl = collection(db, 'tasks');
      const q = query(tasksColl, where('projectId', '==', pId));
      const snap = await getDocs(q);
      const list: Task[] = [];
      snap.forEach((doc) => {
        list.push(doc.data() as Task);
      });
      setAvailableTasks(list);
    } catch (e) {
      console.error(e);
    }
  };

  const getUserProfileFallback = async (uid: string): Promise<UserProfile | null> => {
    try {
      const snap = await getDocs(query(collection(db, 'users'), where('uid', '==', uid)));
      return snap.empty ? null : snap.docs[0].data() as UserProfile;
    } catch (e) {
      return null;
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Search users to start new chat
  useEffect(() => {
    if (!userSearchText.trim()) {
      setSearchResults([]);
      return;
    }
    const q = userSearchText.toLowerCase();
    const matches = allUsers.filter(
      u => u.displayName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
    setSearchResults(matches);
  }, [userSearchText, allUsers]);

  const handleStartDM = async (targetUser: UserProfile) => {
    if (!profile) return;
    setUserSearchText('');
    setSearchResults([]);
    try {
      const convId = await createOrGetDMConversation(profile.uid, targetUser.uid);
      setSearchParams({ conv: convId });
    } catch (e) {
      console.error(e);
    }
  };

  // Send Message Action
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    if (!inputText.trim()) return;

    const chatType = activeConvId ? 'DM' : 'PROJECT';
    const targetId = activeConvId || activeProjectId || '';

    try {
      const draftReply = replyContext ? {
        messageId: replyContext.id,
        text: replyContext.text,
        senderName: replyContext.senderName
      } : null;

      const draftTaskRef = selectedTaskRef ? {
        taskId: selectedTaskRef.id,
        taskTitle: selectedTaskRef.title
      } : null;

      await sendMessage(
        chatType,
        targetId,
        profile.uid,
        profile.displayName,
        inputText.trim(),
        draftReply,
        draftTaskRef
      );

      setInputText('');
      setReplyContext(null);
      setSelectedTaskRef(null);
      scrollToBottom();
    } catch (err) {
      console.error(err);
      alert('Failed to send message: ' + (err instanceof Error ? err.message : 'Permission Denied'));
    }
  };

  const handleSaveEdit = async (msgId: string) => {
    if (!editText.trim()) return;
    const chatType = activeConvId ? 'DM' : 'PROJECT';
    const targetId = activeConvId || activeProjectId || '';
    try {
      await updateMessage(chatType, targetId, msgId, editText.trim());
      setEditingMessageId(null);
      setEditText('');
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (msgId: string) => {
    const chatType = activeConvId ? 'DM' : 'PROJECT';
    const targetId = activeConvId || activeProjectId || '';
    if (confirm('Delete this message permanently?')) {
      try {
        await deleteMessage(chatType, targetId, msgId);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleReact = async (msgId: string, reactionEmoji: string) => {
    if (!profile) return;
    const chatType = activeConvId ? 'DM' : 'PROJECT';
    const targetId = activeConvId || activeProjectId || '';
    try {
      await addReactionToMessage(chatType, targetId, msgId, reactionEmoji, profile.uid);
    } catch (e) {
      console.error(e);
    }
  };

  const highlightMentions = (text: string) => {
    if (!profile) return text;
    const mentionToken = `@${profile.displayName}`;
    if (text.includes(mentionToken)) {
      const parts = text.split(mentionToken);
      return (
        <span>
          {parts[0]}
          <span className="bg-primary-yellow text-canvas-fg font-black px-1.5 py-0.5 border border-border select-all select-none">
            {mentionToken}
          </span>
          {parts[1]}
        </span>
      );
    }
    return text;
  };

  const getPartnerName = (conv: ChatConversation) => {
    if (!profile) return 'Teammate';
    const otherId = conv.participantIds.find(uid => uid !== profile.uid);
    if (!otherId) return 'Teammate';
    const found = allUsers.find(u => u.uid === otherId);
    return found ? found.displayName : 'Teammate';
  };

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-100px)] flex flex-col md:flex-row border-2 border-border bg-card-bg overflow-hidden select-none animate-fade-in shadow-md">
      {/* 1. LEFT COLUMN: SIDEBAR */}
      <aside className="w-full md:w-80 border-b-2 md:border-b-0 md:border-r-2 border-border flex flex-col h-1/3 md:h-full bg-canvas-bg">
        {/* Search Header */}
        <div className="p-4 border-b-2 border-border bg-card-bg flex flex-col gap-2 relative">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input
              type="text"
              value={userSearchText}
              onChange={(e) => setUserSearchText(e.target.value)}
              className="w-full pl-9 py-1.5 text-xs font-medium shadow-none border-2 border-border bg-canvas-bg text-canvas-fg"
              placeholder="Search user to DM..."
            />
          </div>

          {searchResults.length > 0 && (
            <div className="absolute top-[52px] left-4 right-4 bg-card-bg border-2 border-border z-20 shadow-md flex flex-col max-h-48 overflow-y-auto">
              {searchResults.map(user => (
                <button
                  key={user.uid}
                  onClick={() => handleStartDM(user)}
                  className="w-full px-3 py-2 text-left text-xs font-bold hover:bg-surface-hover border-b last:border-b-0 border-border flex items-center gap-2 text-canvas-fg"
                >
                  <div className="w-5 h-5 border border-border bg-primary-blue text-white flex items-center justify-center font-bold text-[9px]">
                    {user.displayName.substring(0,2).toUpperCase()}
                  </div>
                  <span>{user.displayName}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar Channels & Conversations List */}
        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-5">
          {convsError && (
            <div className="p-2 border border-primary-red bg-primary-red/10 text-[10px] font-bold text-primary-red select-none">
              {convsError}
            </div>
          )}

          {/* Projects/Channels */}
          <div>
            <div className="text-[10px] font-bold tracking-wider text-text-secondary mb-2 px-2">Project channels</div>
            <div className="flex flex-col gap-1">
              {projects.length === 0 ? (
                <span className="text-[10px] text-text-secondary font-medium px-2">No projects found.</span>
              ) : (
                projects.map(proj => (
                  <button
                    key={proj.id}
                    onClick={() => {
                      setSearchParams({ project: proj.id });
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold border-2 text-left transition-colors ${
                      activeProjectId === proj.id
                        ? 'bg-primary-yellow border-border text-canvas-fg shadow-sm'
                        : 'border-transparent hover:bg-surface-hover text-canvas-fg'
                    }`}
                  >
                    <Hash className="w-3.5 h-3.5" />
                    <span className="truncate">{proj.name}</span>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* DM conversations */}
          <div>
            <div className="text-[10px] font-bold tracking-wider text-text-secondary mb-2 px-2">Direct messages</div>
            <div className="flex flex-col gap-1">
              {conversations.length === 0 ? (
                <span className="text-[10px] text-text-secondary font-medium px-2">No active DM chats.</span>
              ) : (
                conversations.map(conv => (
                  <button
                    key={conv.id}
                    onClick={() => {
                      setSearchParams({ conv: conv.id });
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold border-2 text-left transition-colors ${
                      activeConvId === conv.id
                        ? 'bg-primary-blue border-border text-white shadow-sm'
                        : 'border-transparent hover:bg-surface-hover text-canvas-fg'
                    }`}
                  >
                    <div className={`w-5 h-5 border flex items-center justify-center font-bold text-[9px] ${
                      activeConvId === conv.id ? 'bg-white text-primary-blue border-transparent' : 'bg-primary-red text-white border-border'
                    }`}>
                      {getPartnerName(conv).substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="truncate">{getPartnerName(conv)}</div>
                      <div className={`text-[10px] truncate font-normal mt-0.5 ${
                        activeConvId === conv.id ? 'text-white/80' : 'text-text-secondary'
                      }`}>
                        {conv.lastMessageText}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* 2. RIGHT COLUMN: CHAT INTERFACE PANEL */}
      <section className="flex-1 flex flex-col h-2/3 md:h-full">
        {(!activeConvId && !activeProjectId) ? (
          <div className="flex-1 flex flex-col items-center justify-center bg-canvas-bg p-8 select-none">
            <div className="w-16 h-16 border-2 border-border bg-card-bg flex items-center justify-center mb-4">
              <MessageSquare className="w-8 h-8 text-text-secondary" />
            </div>
            <h3 className="font-bold text-xl tracking-tight text-canvas-fg">Select a chat</h3>
            <p className="text-xs text-text-secondary font-medium mt-1 text-center max-w-sm leading-relaxed">
              Teammate channels and direct messages are listed on the left. Click one to start collaborating.
            </p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-between overflow-hidden bg-card-bg">
            {/* Active Header details */}
            <div className="p-4 border-b-2 border-border flex items-center justify-between bg-canvas-bg flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 border-2 border-border bg-primary-red text-white flex items-center justify-center font-bold text-xs">
                  {activePartner ? activePartner.displayName.substring(0, 2).toUpperCase() : (activeProjectObj?.name.substring(0,2).toUpperCase() || 'PR')}
                </div>
                <div>
                  {activePartner ? (
                    <Link to={`/app/profile/${activePartner.uid}`} className="font-bold text-sm text-canvas-fg hover:underline">
                      {activePartner.displayName}
                    </Link>
                  ) : (
                    <Link to={`/app/projects/${activeProjectId}`} className="font-bold text-sm text-canvas-fg hover:underline flex items-center gap-1">
                      <Hash className="w-3.5 h-3.5" />
                      {activeProjectObj?.name}
                    </Link>
                  )}
                  <p className="text-[10px] text-text-secondary font-medium">
                    {activePartner ? 'Direct message participant' : 'Project workspace channel'}
                  </p>
                </div>
              </div>

              {activeProjectId && (
                <Link to={`/app/projects/${activeProjectId}`}>
                  <Button variant="outline" size="sm">
                    View board
                  </Button>
                </Link>
              )}
            </div>

            {/* Error alerts inside message container */}
            {messagesError && (
              <div className="m-4 p-4 border-4 border-border bg-primary-red/10 text-canvas-fg flex flex-col gap-1.5 select-none">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-primary-red flex-shrink-0" />
                  <h3 className="font-bold text-xs text-canvas-fg">Firebase Rules Required</h3>
                </div>
                <p className="text-[11px] text-text-secondary">
                  {messagesError} Deploy rules from your console or run:
                </p>
                <pre className="bg-card-bg border-2 border-border p-2 text-[9px] font-mono select-all w-fit text-canvas-fg">
                  firebase deploy --only firestore:rules
                </pre>
              </div>
            )}

            {/* Scrollable messages container */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-card-bg">
              {messages.length === 0 && !messagesError ? (
                <div className="text-center py-12 text-xs font-medium text-text-secondary select-none">
                  No messages yet. Send one to start the conversation!
                </div>
              ) : (
                messages.map((msg) => {
                  const isSentByMe = msg.senderId === profile?.uid;
                  return (
                    <div key={msg.id} className="flex flex-col gap-1 max-w-[85%] self-start" style={{ alignSelf: isSentByMe ? 'flex-end' : 'flex-start' }}>
                      
                      {msg.replyTo && (
                        <div className="flex items-center gap-1 bg-canvas-bg border-l-2 border-border px-2 py-1 text-[10px] text-text-secondary font-medium mb-1 select-none">
                          <Reply className="w-3 h-3 text-text-secondary flex-shrink-0" />
                          <span>Replying to {msg.replyTo.senderName}:</span>
                          <span className="truncate max-w-[150px] italic">"{msg.replyTo.text}"</span>
                        </div>
                      )}

                      <div className={`p-3 border-2 border-border shadow-sm flex flex-col gap-1.5 group relative hover:shadow-md ${
                        isSentByMe ? 'bg-primary-blue/10 border-primary-blue/30 text-canvas-fg' : 'bg-canvas-bg text-canvas-fg'
                      }`}>
                        
                        {!isSentByMe && (
                          <span className="text-[10px] font-bold text-text-secondary block mb-0.5">
                            {msg.senderName}
                          </span>
                        )}

                        {editingMessageId === msg.id ? (
                          <div className="flex flex-col gap-2 min-w-[200px]">
                            <textarea
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              className="w-full text-xs font-normal py-1 px-2 border-2 border-border bg-card-bg text-canvas-fg"
                              rows={2}
                            />
                            <div className="flex justify-end gap-2 text-[10px]">
                              <button onClick={() => setEditingMessageId(null)} className="font-medium text-text-secondary hover:underline">Cancel</button>
                              <button onClick={() => handleSaveEdit(msg.id)} className="font-bold text-primary-red hover:underline">Save</button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs font-normal leading-relaxed break-words whitespace-pre-wrap select-text">
                            {highlightMentions(msg.text)}
                          </p>
                        )}

                        {msg.taskRef && (
                          <Link 
                            to={`/app/projects/${activeProjectId || 'board'}?task=${msg.taskRef.taskId}`}
                            className="flex items-center gap-1.5 bg-primary-blue/15 border border-primary-blue px-2.5 py-1 text-[10px] text-primary-blue font-bold mt-1 w-fit hover:underline"
                          >
                            <LinkIcon className="w-3 h-3" />
                            <span>Task: {msg.taskRef.taskTitle}</span>
                          </Link>
                        )}

                        {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1 border-t border-border pt-1.5 select-none">
                            {Object.entries(msg.reactions).map(([emoji, usersArr]) => (
                              <button
                                key={emoji}
                                onClick={() => handleReact(msg.id, emoji)}
                                className={`flex items-center gap-1 px-1.5 py-0.5 border text-[10px] font-bold ${
                                  usersArr.includes(profile?.uid || '') ? 'bg-primary-blue/10 border-primary-blue text-primary-blue' : 'bg-canvas-bg border-border text-canvas-fg'
                                }`}
                              >
                                <span>{emoji}</span>
                                <span>{usersArr.length}</span>
                              </button>
                            ))}
                          </div>
                        )}

                        <div className="opacity-0 group-hover:opacity-100 absolute -top-3.5 right-2 flex items-center gap-1 bg-card-bg border border-border px-1 py-0.5 z-10 shadow-sm select-none">
                          <button onClick={() => setReplyContext(msg)} title="Reply" className="p-0.5 text-text-secondary hover:text-primary-blue hover:bg-surface-hover"><Reply className="w-3 h-3" /></button>
                          
                          <div className="flex items-center border-l pl-1 ml-1 border-border gap-0.5">
                            {['👍', '❤️', '🔥', '😂'].map(em => (
                              <button key={em} onClick={() => handleReact(msg.id, em)} className="hover:scale-125 text-[11px] px-0.5 transition-transform">{em}</button>
                            ))}
                          </div>

                          {isSentByMe && (
                            <div className="flex items-center border-l pl-1 ml-1 border-border gap-0.5">
                              <button onClick={() => { setEditingMessageId(msg.id); setEditText(msg.text); }} title="Edit" className="p-0.5 text-text-secondary hover:text-primary-yellow"><Edit3 className="w-3 h-3" /></button>
                              <button onClick={() => handleDelete(msg.id)} title="Delete" className="p-0.5 text-text-secondary hover:text-primary-red"><Trash2 className="w-3 h-3" /></button>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <span className={`text-[10px] text-text-secondary font-medium px-1 mt-0.5 select-none ${
                        isSentByMe ? 'self-end' : 'self-start'
                      }`}>
                        {new Date(msg.createdAt.toMillis()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {msg.editedAt && ' (edited)'}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Draft context details */}
            {(replyContext || selectedTaskRef) && (
              <div className="px-4 py-2 border-t-2 border-border bg-canvas-bg flex items-center justify-between text-xs font-medium border-dashed flex-shrink-0 select-none">
                <div className="flex flex-col gap-1">
                  {replyContext && (
                    <div className="flex items-center gap-1.5 text-text-secondary">
                      <CornerDownRight className="w-3.5 h-3.5 text-text-secondary" />
                      <span>Replying to {replyContext.senderName}: </span>
                      <span className="truncate max-w-[200px] italic text-canvas-fg">"{replyContext.text}"</span>
                    </div>
                  )}
                  {selectedTaskRef && (
                    <div className="flex items-center gap-1.5 text-primary-blue">
                      <LinkIcon className="w-3.5 h-3.5" />
                      <span>Attached task: "{selectedTaskRef.title}"</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  {replyContext && <button onClick={() => setReplyContext(null)} className="text-[11px] text-primary-red hover:underline">Cancel reply</button>}
                  {selectedTaskRef && <button onClick={() => setSelectedTaskRef(null)} className="text-[11px] text-primary-red hover:underline">Cancel reference</button>}
                </div>
              </div>
            )}

            {/* Input Form Box */}
            <form onSubmit={handleSend} className="p-4 border-t-2 border-border flex gap-3 items-center flex-shrink-0 bg-canvas-bg">
              {activeProjectId && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowTaskSelector(!showTaskSelector)}
                    title="Reference Task"
                    className="p-2 border-2 border-border bg-card-bg hover:bg-surface-hover active:translate-y-[1px] shadow-sm flex items-center justify-center cursor-pointer text-canvas-fg"
                  >
                    <LinkIcon className="w-4 h-4 text-canvas-fg" />
                  </button>

                  {showTaskSelector && (
                    <div className="absolute bottom-12 left-0 bg-card-bg border-2 border-border shadow-md z-20 w-64 max-h-48 overflow-y-auto flex flex-col">
                      <div className="p-2 text-[11px] font-bold text-text-secondary border-b border-border flex items-center justify-between">
                        <span>Select task reference</span>
                        <button type="button" onClick={() => setShowTaskSelector(false)}><X className="w-3 h-3 text-text-secondary" /></button>
                      </div>
                      {availableTasks.length === 0 ? (
                        <div className="p-3 text-xs text-center text-text-secondary font-medium">No tasks available</div>
                      ) : (
                        availableTasks.map(t => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => {
                              setSelectedTaskRef(t);
                              setShowTaskSelector(false);
                            }}
                            className="w-full text-left p-2.5 text-xs font-medium border-b last:border-b-0 border-border hover:bg-surface-hover truncate text-canvas-fg"
                          >
                            {t.title}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 py-2 px-3 text-xs font-medium border-2 border-border bg-card-bg text-canvas-fg"
                placeholder={activePartner ? `Message ${activePartner.displayName}...` : "Post in channel..."}
              />
              <Button type="submit" variant="primary" className="py-2.5">
                <Send className="w-4 h-4" />
                <span>Send</span>
              </Button>
            </form>
          </div>
        )}
      </section>
    </div>
  );
};
