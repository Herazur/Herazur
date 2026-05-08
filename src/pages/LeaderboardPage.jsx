import React, { useEffect, useCallback, useMemo } from 'react';
import Seo from '@/components/Seo';
import { motion } from 'framer-motion';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useData } from '@/contexts/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, Eye, ThumbsUp, Gem, Zap, Crown } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { SITE_URL } from '@/lib/seo';

/* --------------------------------- consts -------------------------------- */

const CATEGORY_DETAILS = {
  score: { unit: 'Score' },
  views: { unit: 'Views' },
  likes: { unit: 'Likes' },
  gifts: { unit: 'Gifts' },
};

/* --------------------------------- Helpers -------------------------------- */

const formatValue = (category, value) => {
  const n = Number(value || 0);
  if (category === 'views') {
    return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(n);
  }
  return n.toLocaleString();
};

const getMetricValue = (category, profile) => {
  switch (category) {
    case 'score':
      return Math.round(profile?.trending_score || 0);
    case 'views':
      return profile?.views_last_7_days || 0;
    case 'likes':
      return profile?.upvotes_count || 0;
    case 'gifts':
      return profile?.gifts_sent_count || 0;
    default:
      return 0;
  }
};

const getRankColor = (idx) => {
  if (idx === 0) return 'text-yellow-400';
  if (idx === 1) return 'text-slate-300';
  if (idx === 2) return 'text-amber-700';
  return 'text-muted-foreground';
};

const getRankIcon = (idx) => {
  if (idx === 0) return <Crown className="h-5 w-5 fill-yellow-400 text-yellow-400" aria-hidden />;
  if (idx === 1) return <Crown className="h-5 w-5 fill-slate-300 text-slate-300" aria-hidden />;
  if (idx === 2) return <Crown className="h-5 w-5 fill-amber-700 text-amber-700" aria-hidden />;
  return null;
};

const LeaderboardItem = React.memo(({ profile, index, category }) => {
  const safeName = profile?.name || 'Unknown';
  const safeUsername = profile?.username || 'unknown';
  const { unit } = CATEGORY_DETAILS[category];
  const value = getMetricValue(category, profile);
  const isPremium = !!profile?.is_premium;
  const hasActiveBoost = !!profile?.has_active_boost;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Link
        to={`/u/${safeUsername}`}
        className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
        aria-label={`${safeName} profilini aç`}
      >
        <div className="w-8 text-center font-bold text-lg flex items-center justify-center">
          {getRankIcon(index) || <span className={getRankColor(index)}>{index + 1}</span>}
        </div>

        <Avatar className="h-12 w-12 border-2 border-primary/20">
          <AvatarImage src={profile?.avatar_url || undefined} alt={safeName} />
          <AvatarFallback>{safeName.charAt(0)}</AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-lg">{safeName}</span>

            {hasActiveBoost ? (
              <Tooltip>
                <TooltipTrigger aria-label="Boost Active">
                  <Zap className="h-4 w-4 text-purple-500 fill-purple-500" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Boost Active</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              isPremium && (
                <Tooltip>
                  <TooltipTrigger aria-label="Premium Member">
                    <Zap className="h-4 w-4 text-[hsl(var(--premium-start))] fill-[hsl(var(--premium-start))]" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Premium Member</p>
                  </TooltipContent>
                </Tooltip>
              )
            )}
          </div>
          <p className="text-sm text-muted-foreground">@{safeUsername}</p>
        </div>

        <div className="text-right">
          <p className="text-lg font-bold text-primary">{formatValue(category, value)}</p>
          <p className="text-xs text-muted-foreground">{unit}</p>
        </div>
      </Link>
    </motion.div>
  );
});

const LeaderboardSkeleton = () => (
  <div className="space-y-4">
    {Array.from({ length: 10 }).map((_, i) => (
      <div key={i} className="flex items-center gap-4 p-3 rounded-lg">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <div className="text-right space-y-2">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-3 w-10" />
        </div>
      </div>
    ))}
  </div>
);

/* --------------------------------- Page --------------------------------- */

const LeaderboardPage = () => {
  const { user } = useAuth(); // hazırda kullanılmıyor; ileride "benim sıram" v.b. için sakla
  const { leaderboardProfiles, getLeaderboard, loading: dataLoading } = useData();
  const location = useLocation();
  const navigate = useNavigate();

  const queryParams = new URLSearchParams(location.search);
  const activeCategory = queryParams.get('category') || 'score';
  const leaderboardSchema = useMemo(() => {
    if (!Array.isArray(leaderboardProfiles) || leaderboardProfiles.length === 0) return null;

    const itemListElement = leaderboardProfiles.slice(0, 10).map((profile, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: profile?.name || profile?.username || 'User',
      url: profile?.username ? `${SITE_URL}/u/${profile.username}` : SITE_URL,
    }));

    return {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: `Herazur ${activeCategory} Leaderboard`,
      itemListElement,
    };
  }, [leaderboardProfiles, activeCategory]);

  useEffect(() => {
    getLeaderboard(activeCategory);
  }, [activeCategory, getLeaderboard]);

  const handleCategoryChange = (category) => {
    const next = new URLSearchParams(location.search);
    next.set('category', category);
    // relative push → /leaderboard?category=...
    navigate(`?${next.toString()}`, { replace: false });
  };

  return (
    <>
      <Seo
        title="Leaderboard"
        description="See the top-ranked profiles on Herazur by score, views, likes, and gifts."
        schema={leaderboardSchema}
      />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-3">
            <span className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
              Herazur Leaderboard
            </span>{' '}
            🏆
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover the most influential and popular profiles on Herazur. Who will claim the top spot?
          </p>
        </motion.div>

        <TooltipProvider delayDuration={200}>
          <Tabs value={activeCategory} onValueChange={handleCategoryChange} className="w-full max-w-3xl mx-auto">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="score">
                <Trophy className="h-4 w-4 mr-2" /> Score
              </TabsTrigger>
              <TabsTrigger value="views">
                <Eye className="h-4 w-4 mr-2" /> Views
              </TabsTrigger>
              <TabsTrigger value="likes">
                <ThumbsUp className="h-4 w-4 mr-2" /> Likes
              </TabsTrigger>
              <TabsTrigger value="gifts">
                <Gem className="h-4 w-4 mr-2" /> Gifts
              </TabsTrigger>
            </TabsList>

            {['score', 'views', 'likes', 'gifts'].map((cat) => (
              <TabsContent key={cat} value={cat} className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>
                      {cat === 'score' && 'Top Profiles by Score'}
                      {cat === 'views' && 'Top Profiles by Views (Last 7 Days)'}
                      {cat === 'likes' && 'Top Profiles by Likes'}
                      {cat === 'gifts' && 'Top Profiles by Gifts Sent'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {dataLoading ? (
                      <LeaderboardSkeleton />
                    ) : leaderboardProfiles && leaderboardProfiles.length > 0 ? (
                      leaderboardProfiles.map((profile, index) => (
                        <LeaderboardItem key={profile.id ?? `${cat}-${index}`} profile={profile} index={index} category={cat} />
                      ))
                    ) : (
                      <p className="text-center text-muted-foreground py-8">
                        No profiles found for this category.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </TooltipProvider>
      </div>
    </>
  );
};

export default LeaderboardPage;
