import React, { useState, useEffect, useCallback } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

const ActivityFeed = () => {
  const { getNotifications, markNotificationsAsRead } = useData();
  const { user } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const recomputeUnread = useCallback((list) => {
    setUnreadCount(list.filter((n) => !n.is_read).length);
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    const data = await getNotifications();
    setNotifications(data || []);
    recomputeUnread(data || []);
    setLoading(false);
  }, [user, getNotifications, recomputeUnread]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60_000); // her dakika yenile
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleMarkAllAsRead = async (e) => {
    // Menü kapanmasın / focus kaybı olmasın
    e?.preventDefault?.();
    e?.stopPropagation?.();

    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
    if (unreadIds.length === 0) return;

    // optimistic update
    const prev = notifications;
    const next = notifications.map((n) => (unreadIds.includes(n.id) ? { ...n, is_read: true } : n));
    setNotifications(next);
    setUnreadCount(0);

    const success = await markNotificationsAsRead(unreadIds);
    if (!success) {
      // rollback
      setNotifications(prev);
      recomputeUnread(prev);
    }
  };

  const getNotificationMessage = (notification) => {
    const actor = notification.actor_profile || {};
    const actorName = actor.name || actor.username || 'Someone';
    const actorSlug = actor.username || '';
    const actorLink = (
      <Link to={actorSlug ? `/u/${actorSlug}` : '#'} className="font-bold hover:underline">
        {actorName}
      </Link>
    );

    switch (notification.event_type) {
      case 'upvote':
        return (
          <>
            {actorLink} upvoted your profile.
          </>
        );
      case 'comment':
        return (
          <>
            {actorLink} commented on your profile.
          </>
        );
      case 'reply':
        return (
          <>
            {actorLink} replied to your comment.
          </>
        );
      case 'follow':
        return (
          <>
            {actorLink} started following you.
          </>
        );
      case 'gift': {
        const giftName = notification.metadata?.gift_name || 'a gift';
        const coinsEarned = notification.metadata?.coins_earned;
        return (
          <>
            {actorLink} sent you {giftName}! {coinsEarned ? `You earned ${coinsEarned} coins.` : ''}
          </>
        );
      }
      default:
        return <>New activity: {notification.event_type}</>;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 justify-center rounded-full p-0 text-xs"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-80" align="end">
        <DropdownMenuLabel className="flex justify-between items-center">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="h-auto px-2 py-1"
              aria-label="Mark all as read"
            >
              <CheckCheck className="h-4 w-4 mr-1" />
              Mark all as read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-2">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))
          ) : notifications.length > 0 ? (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`p-2 ${!notification.is_read ? 'bg-muted/50' : ''} focus:bg-muted`}
              >
                <div className="flex items-start gap-3 w-full">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={notification.actor_profile?.avatar_url || ''} />
                    <AvatarFallback>
                      {notification.actor_profile?.name?.charAt(0) ||
                        notification.actor_profile?.username?.charAt(0) ||
                        '?'}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 text-sm break-words">
                    <p>{getNotificationMessage(notification)}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </DropdownMenuItem>
            ))
          ) : (
            <div className="text-center text-sm text-muted-foreground p-4">You're all caught up!</div>
          )}
        </div>

        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/activity" className="w-full justify-center">
            View full activity
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ActivityFeed;
