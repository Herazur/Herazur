import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useData } from '@/contexts/DataContext';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

export default function FollowButton({ targetUserId, onFollowChange, className }) {
  const { user } = useAuth();
  const { checkFollowStatus, followUser, unfollowUser } = useData();

  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const workingRef = useRef(false); // hızlı çift tıklamayı engelle

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchStatus = useCallback(async () => {
    if (!targetUserId) {
      if (mountedRef.current) {
        setIsFollowing(false);
        setLoading(false);
      }
      return null;
    }
    // oturum yoksa: butonu gizlemek yerine durumu netleştir
    if (!user?.id) {
      if (mountedRef.current) {
        setIsFollowing(false);
        setLoading(false);
      }
      return null;
    }

    if (!mountedRef.current) return null;
    setLoading(true);
    try {
      const status = await checkFollowStatus(targetUserId);
      if (mountedRef.current) setIsFollowing(!!status?.is_following);
      return status;
    } catch (err) {
      console.error('checkFollowStatus error:', err);
      if (mountedRef.current) {
        toast({ variant: 'destructive', title: 'Could not load follow status.' });
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
    return null;
  }, [user?.id, targetUserId, checkFollowStatus]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const toggleFollow = async () => {
    if (!user?.id) {
      toast({ variant: 'destructive', title: 'You must be logged in to follow.' });
      return;
    }
    if (!targetUserId) return;
    if (workingRef.current) return; // re-entrancy guard
    workingRef.current = true;

    // İyimser güncelleme
    const prev = isFollowing;
    setIsFollowing(!prev);
    setLoading(true);

    try {
      if (prev) {
        await unfollowUser(targetUserId);
        toast({ title: 'Unfollowed!' });
      } else {
        await followUser(targetUserId);
        toast({ title: 'Followed!' });
      }
      // opsiyonel: server kaynağını tekrar doğrula
      await fetchStatus();
      onFollowChange?.();
    } catch (err) {
      console.error('toggleFollow error:', err);
      // geri al
      setIsFollowing(prev);
      toast({
        variant: 'destructive',
        title: 'Action failed',
        description: err?.message || 'Please try again.',
      });
    } finally {
      setLoading(false);
      workingRef.current = false;
    }
  };

  // Kendi profilinde veya hedef yoksa butonu gösterme
  if (!targetUserId || user?.id === targetUserId) return null;

  return (
    <Button
      onClick={toggleFollow}
      disabled={loading}
      aria-pressed={isFollowing}
      aria-label={isFollowing ? 'Unfollow user' : 'Follow user'}
      variant={isFollowing ? 'secondary' : 'default'}
      className={cn(className)}
    >
      {loading ? '...' : isFollowing ? 'Unfollow' : 'Follow'}
    </Button>
  );
}
