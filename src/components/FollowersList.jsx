import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Users } from 'lucide-react';

const avatarFor = (p) => {
  const url = p?.avatar_url || '';
  if (!url) return '';
  const canUseGif = !!p?.can_use_gif;
  if (!canUseGif && /\.gif($|\?)/i.test(url)) {
    const [base, q = ''] = url.split('?');
    return `${base}?frame=1${q ? `&${q}` : ''}`;
  }
  return url;
};

export default function FollowersList({ userId, refreshKey }) {
  const { getFollowers } = useData();
  const [followers, setFollowers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchFollowers = useCallback(async () => {
    if (!userId) {
      setFollowers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    let alive = true;

    try {
      const data = await getFollowers(userId);
      if (!alive) return;
      setFollowers(Array.isArray(data) ? data : []);
    } catch (err) {
      if (!alive) return;
      console.error('Error fetching followers:', err);
      setError('Failed to load followers');
      setFollowers([]);
    } finally {
      if (alive) setLoading(false);
    }

    return () => { alive = false; };
  }, [userId, getFollowers]);

  useEffect(() => {
    const cleanup = fetchFollowers();
    return typeof cleanup === 'function' ? cleanup : undefined;
  }, [fetchFollowers, refreshKey]);

  const list = useMemo(() => {
    if (!Array.isArray(followers)) return [];

    return followers
      .filter(p => p && (p.user_id || p.id || p.username)) // Geçerli profilleri filtrele
      .map((p, index) => ({
        id: p?.user_id ?? p?.id ?? p?.username ?? `follower-${index}`,
        name: p?.name?.trim() || 'Unknown User',
        username: p?.username?.trim() || 'unknown',
        avatar: avatarFor(p),
      }));
  }, [followers]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2 w-full">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <Users className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">Error Loading Followers</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {error}
        </p>
        <button
          onClick={fetchFollowers}
          className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (list.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">No Followers Yet</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          This user doesn&apos;t have any followers right now.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-4">Followers ({list.length})</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {list.map((p) => (
          <Link
            key={p.id}
            to={`/u/${p.username}`}
            aria-label={`Open profile of ${p.name}`}
            className="block"
          >
            <Card className="p-4 flex items-center gap-4 hover:bg-muted/80 transition-colors cursor-pointer">
              <Avatar className="h-12 w-12 flex-shrink-0">
                <AvatarImage
                  src={p.avatar}
                  alt={`${p.name}'s avatar`}
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.src = '';
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <AvatarFallback className="text-sm font-medium">
                  {p.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold truncate" title={p.name}>
                  {p.name}
                </p>
                <p className="text-xs text-muted-foreground truncate" title={`@${p.username}`}>
                  @{p.username}
                </p>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}