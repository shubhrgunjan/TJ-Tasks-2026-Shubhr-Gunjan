import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  subscribeNotifications, 
  markNotificationRead, 
  markAllNotificationsRead 
} from '../services/notifications';
import { Notification } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Bell, Check, Inbox, MessageSquare, Calendar, UserPlus, User, AlertTriangle } from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    setError(null);
    const unsubscribe = subscribeNotifications(profile.uid, (data) => {
      setNotifications(data);
      setLoading(false);
    }, (err: any) => {
      console.error(err);
      setError('Database access error. Please ensure you have deployed firestore.rules to Firebase.');
      setLoading(false);
    });
    return () => unsubscribe();
  }, [profile]);

  const handleMarkRead = async (notifId: string, link: string) => {
    await markNotificationRead(notifId);
    navigate(link);
  };

  const handleMarkAllRead = async () => {
    if (profile) {
      await markAllNotificationsRead(profile.uid);
    }
  };

  const formatRelativeTime = (timestamp: any) => {
    if (!timestamp) return '';
    const diff = Date.now() - timestamp.toMillis();
    const secs = Math.floor(diff / 1000);
    const mins = Math.floor(secs / 60);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);

    if (secs < 60) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return 'Yesterday';
    return new Date(timestamp.toMillis()).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'TASK_ASSIGN':
        return <Inbox className="w-4 h-4 text-primary-red" />;
      case 'MENTION':
        return <MessageSquare className="w-4 h-4 text-primary-yellow" />;
      case 'PROJECT_INVITE':
        return <UserPlus className="w-4 h-4 text-primary-blue" />;
      case 'TASK_DEADLINE':
        return <Calendar className="w-4 h-4 text-primary-red" />;
      case 'MEMBER_CHANGE':
        return <User className="w-4 h-4 text-canvas-fg" />;
      case 'DIRECT_MESSAGE':
        return <MessageSquare className="w-4 h-4 text-primary-blue" />;
      default:
        return <Bell className="w-4 h-4 text-canvas-fg" />;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="flex gap-3 items-end mb-4">
          <div className="w-3 h-3 rounded-full bg-primary-red animate-bounce" />
          <div className="w-3 h-3 bg-primary-yellow animate-bounce [animation-delay:0.15s]" />
          <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[10px] border-b-primary-blue animate-bounce [animation-delay:0.3s]" />
        </div>
        <span className="font-medium text-sm text-text-secondary">Loading notifications...</span>
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b-2 border-border pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-canvas-fg">Notifications</h1>
          <p className="text-sm font-medium text-text-secondary mt-1">
            You have {unreadCount} unread message{unreadCount !== 1 ? 's' : ''}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
            <Check className="w-4 h-4" />
            <span>Mark all read</span>
          </Button>
        )}
      </div>

      {error && (
        <Card className="bg-primary-red/10 border-4 p-6 select-none" shadow="md" accent="red">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-primary-red flex-shrink-0" />
            <div>
              <h3 className="font-bold text-sm text-canvas-fg">Firebase Rules Configuration Required</h3>
              <p className="text-xs text-text-secondary mt-1">
                Firestore permission was denied. You need to deploy your project's security rules. In your terminal, run:
              </p>
              <pre className="bg-card-bg border-2 border-border p-2 text-[10px] font-mono mt-2 select-all w-fit text-canvas-fg">
                firebase deploy --only firestore:rules
              </pre>
            </div>
          </div>
        </Card>
      )}

      <div className="flex flex-col gap-4">
        {notifications.length === 0 && !error ? (
          <Card className="p-12 text-center bg-card-bg border-2 flex flex-col items-center justify-center gap-4" shadow="sm">
            <div className="w-12 h-12 border-2 border-border bg-canvas-bg flex items-center justify-center">
              <Bell className="w-6 h-6 text-text-secondary" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-canvas-fg">Inbox clear</h3>
              <p className="text-xs text-text-secondary font-medium mt-1">
                You're all caught up with no new alerts.
              </p>
            </div>
          </Card>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleMarkRead(notif.id, notif.link)}
              className={`bg-card-bg border-2 border-border p-4 shadow-sm hover:shadow-md cursor-pointer hover:-translate-x-[1px] hover:-translate-y-[1px] transition-all duration-100 flex items-start gap-4 relative overflow-hidden select-none ${
                !notif.isRead ? 'border-l-8 border-l-primary-red' : ''
              }`}
            >
              <div className="w-10 h-10 border-2 border-border bg-canvas-bg flex items-center justify-center flex-shrink-0">
                {getIcon(notif.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-xs text-canvas-fg truncate">
                    {notif.title}
                  </span>
                  <span className="text-[11px] text-text-secondary flex-shrink-0">
                    {formatRelativeTime(notif.createdAt)}
                  </span>
                </div>
                <p className="text-xs font-normal text-text-secondary mt-1">
                  {notif.body}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
