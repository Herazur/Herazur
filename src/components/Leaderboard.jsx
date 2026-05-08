import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Crown } from 'lucide-react';

const avatarFor = (p) => {
  const url = p?.avatar_url || '';
  const canUseGif = !!p?.can_use_gif;
  if (!url) return '';
  // .gif ise ve GIF kullanamıyorsa ilk kareyi göster (varsa mevcut query’i koruyarak)
  if (!canUseGif && /\.gif($|\?)/i.test(url)) {
    const [base, q = ''] = url.split('?');
    return `${base}?frame=1${q ? `&${q}` : ''}`;
  }
  return url;
};

const LeaderboardSkeleton = () => (
  <div className="space-y-3">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="flex items-center gap-3">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="flex-1 space-y-1">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    ))}
  </div>
);

const rankColor = (rank) => {
  if (rank === 0) return 'text-yellow-400';
  if (rank === 1) return 'text-gray-400';
  if (rank === 2) return 'text-amber-600';
  return 'text-muted-foreground';
};

const safePoints = (score) => {
  const n = Number.isFinite(score) ? score : 0;
  return Math.round(n).toLocaleString();
};

const Leaderboard = () => {
  const { profiles = [], loading } = useData();

  const topProfiles = useMemo(() => {
    if (!Array.isArray(profiles)) return [];
    return [...profiles]
      .sort((a, b) => (Number(b?.trending_score) || 0) - (Number(a?.trending_score) || 0))
      .slice(0, 100);
  }, [profiles]);

  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Crown className="h-5 w-5 text-primary" />
        Leaderboard
      </h3>

      {loading ? (
        <LeaderboardSkeleton />
      ) : topProfiles.length === 0 ? (
        <p className="text-sm text-muted-foreground">Henüz listelenecek kullanıcı yok.</p>
      ) : (
        <div className="space-y-3 pr-2">
          {topProfiles.map((p, index) => (
            <Link
              key={p.id ?? `${p.username}-${index}`}
              to={`/u/${p.username}`}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
              aria-label={`${index + 1}. ${p.name}`}
            >
              <span className={`font-bold w-6 text-center ${rankColor(index)}`}>
                {index + 1}
              </span>

              <Avatar className="h-8 w-8">
                <AvatarImage src={avatarFor(p)} alt={p?.name || 'User'} />
                <AvatarFallback>{p?.name?.charAt(0) ?? '?'}</AvatarFallback>
              </Avatar>

              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-semibold truncate">{p?.name || 'Unknown'}</p>
                <p className="text-xs text-muted-foreground">
                  {safePoints(p?.trending_score)} points
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Leaderboard;