import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Seo from '@/components/Seo';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Bell, CheckCheck, Gift, Heart, MessageSquare, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';

const ActivityIcon = ({ type }) => {
  const iconClasses = "h-5 w-5";
  switch (type) {
    case 'upvote': return <Heart className={cn(iconClasses, "text-red-500")} />;
    case 'comment': return <MessageSquare className={cn(iconClasses, "text-blue-500")} />;
    case 'reply': return <MessageSquare className={cn(iconClasses, "text-blue-400")} />;
    case 'follow': return <UserPlus className={cn(iconClasses, "text-green-500")} />;
    case 'gift': return <Gift className={cn(iconClasses, "text-pink-500")} />;
    default: return <Bell className={cn(iconClasses, "text-gray-500")} />;
  }
};

const ActivityItem = ({ notification }) => {
  const actor = notification.actor_profile || {};
  const actorName = actor.name || actor.username || 'Someone';
  const actorSlug = actor.username || '';
  const actorLink = (
    <Link to={actorSlug ? `/u/${actorSlug}` : '#'} className="font-bold hover:underline">
      {actorName}
    </Link>
  );

  let message;
  switch (notification.event_type) {
    case 'upvote':
      message = <>{actorLink} upvoted your profile.</>;
      break;
    case 'comment':
      message = <>{actorLink} commented on your profile.</>;
      break;
    case 'reply':
      message = <>{actorLink} replied to your comment.</>;
      break;
    case 'follow':
      message = <>{actorLink} started following you.</>;
      break;
    case 'gift': {
      const giftName = notification.metadata?.gift_name || 'a gift';
      const coinsEarned = notification.metadata?.coins_earned;
      message = <>{actorLink} sent you {giftName}! {coinsEarned ? `You earned ${coinsEarned} coins.` : ''}</>;
      break;
    }
    default:
      message = <>New activity: {notification.event_type}</>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex items-start gap-4 p-4 transition-colors",
        !notification.is_read && "bg-primary/5"
      )}
    >
      <Link to={actorSlug ? `/u/${actorSlug}` : '#'}>
        <Avatar className="h-10 w-10 border">
          <AvatarImage src={actor.avatar_url} alt={actorName} />
          <AvatarFallback>{actorName.charAt(0)}</AvatarFallback>
        </Avatar>
      </Link>
      <div className="flex-grow">
        <p className="text-sm">{message}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
        </p>
      </div>
      <ActivityIcon type={notification.event_type} />
    </motion.div>
  );
};

const ActivityPage = () => {
  const { user } = useAuth();
  const { getNotifications, markNotificationsAsRead } = useData();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const unreadCount = useMemo(() => notifications.filter(n => !n.is_read).length, [notifications]);

  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const data = await getNotifications();
    setNotifications(data || []);
    setLoading(false);
  }, [user, getNotifications]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
    if (unreadIds.length === 0) return;

    const prevNotifications = [...notifications];
    setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    
    const success = await markNotificationsAsRead(unreadIds);
    if (!success) {
      setNotifications(prevNotifications);
    }
  };

  const groupedNotifications = useMemo(() => {
    return notifications.reduce((acc, notification) => {
      const date = new Date(notification.created_at);
      let groupTitle;
      if (isToday(date)) {
        groupTitle = 'Today';
      } else if (isYesterday(date)) {
        groupTitle = 'Yesterday';
      } else {
        groupTitle = format(date, 'MMMM d, yyyy');
      }

      if (!acc[groupTitle]) {
        acc[groupTitle] = [];
      }
      acc[groupTitle].push(notification);
      return acc;
    }, {});
  }, [notifications]);

  return (
    <>
      <Seo
        title="Activity Feed"
        description="View your recent activity and notifications on Herazur from the last 7 days."
        noindex
      />
      <div className="container mx-auto max-w-2xl py-12 px-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Activity Feed</CardTitle>
              <CardDescription>Your notifications from the last 7 days.</CardDescription>
            </div>
            {unreadCount > 0 && (
              <Button onClick={handleMarkAllAsRead} size="sm" disabled={loading}>
                <CheckCheck className="mr-2 h-4 w-4" />
                Mark all as read
              </Button>
            )}
          </CardHeader>
          <CardContent className="p-0">
            <div>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 border-b">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-grow space-y-2">
                      <Skeleton className="h-4 w-4/5" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                  </div>
                ))
              ) : Object.keys(groupedNotifications).length > 0 ? (
                Object.entries(groupedNotifications).map(([groupTitle, groupNotifications]) => (
                  <div key={groupTitle}>
                    <h3 className="text-sm font-semibold text-muted-foreground px-4 py-2 bg-muted/50 border-b border-t">{groupTitle}</h3>
                    <div className="divide-y">
                      {groupNotifications.map(notification => (
                        <ActivityItem key={notification.id} notification={notification} />
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-16">
                  <Bell className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">No activity in the last 7 days</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Things are a bit quiet. Try interacting with some profiles!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default ActivityPage;
