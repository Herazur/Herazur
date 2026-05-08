import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn, optimizeSupabaseImageUrl, buildSupabaseSrcSet } from '@/lib/utils';
import { Zap, Share2, Download, MoreVertical, Loader2, Gift } from 'lucide-react';
import SocialIcon from '@/components/SocialIcon';
import { useData, hasPremiumFeatures } from '@/contexts/DataContext';
import { toPng } from 'html-to-image';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { supabase } from '@/lib/customSupabaseClient';
import { normalizeExternalUrl } from '@/lib/sanitize';

const ProfileCard = ({ profile, onCardClick, giftsSentCount }) => {
  const { getActiveBoostsForProfile } = useData();
  const [activeBoosts, setActiveBoosts] = useState([]);
  const [isGoldenPremium, setIsGoldenPremium] = useState(false);
  const [canUseGif, setCanUseGif] = useState(false);
  const cardRef = useRef(null);
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const fetchBoostsAndCheckPremium = async () => {
      if (profile?.id) {
        try {
          const { data: boosts, error } = await supabase
            .from('user_boosts')
            .select('boost_type_id, end_at')
            .eq('profile_id', profile.id)
            .gte('end_at', new Date().toISOString());

          if (isMounted) {
            if (error) {
              throw error;
            }

            const validBoosts = boosts || [];
            setActiveBoosts(validBoosts);
            const hasFeatures = hasPremiumFeatures(profile, validBoosts);
            setIsGoldenPremium(hasFeatures);

            const hasActiveGifPermission = validBoosts.some(boost =>
            (boost.boost_type_id?.includes('ultimate_presence_90d') ||
              boost.boost_type_id?.includes('monthly_spotlight_30d') ||
              boost.boost_type_id?.includes('quick_boost_12h'))
            );
            setCanUseGif(hasActiveGifPermission);
          }
        } catch (error) {
          console.error('Error fetching boosts:', error);
          if (isMounted) {
            setActiveBoosts([]);
            setIsGoldenPremium(false);
            setCanUseGif(false);
          }
        }
      } else {
        if (isMounted) {
          setActiveBoosts([]);
          setIsGoldenPremium(false);
          setCanUseGif(false);
        }
      }
    };

    fetchBoostsAndCheckPremium();

    return () => {
      isMounted = false;
    };
  }, [profile]);

  const getMultiplierFromBoostType = (boostType) => {
    if (!boostType) return 1;
    if (boostType.includes('ultimate_presence_90d')) return 5;
    if (boostType.includes('monthly_spotlight_30d')) return 3;
    if (boostType.includes('quick_boost_12h')) return 2;
    return 1;
  };

  const processImageUrl = (url) => {
    if (!url) return null;

    if (!url.toLowerCase().endsWith('.gif')) {
      return url;
    }

    if (canUseGif) {
      return url;
    }

    const baseUrl = url.split('?')[0];
    return `${baseUrl}?frame=1&static=true`;
  };

  const generateImage = async () => {
    if (!cardRef.current) return null;
    setIsProcessing(true);
    try {
      return await toPng(cardRef.current, {
        quality: 0.95,
        backgroundColor: 'transparent',
        pixelRatio: 2,
      });
    } catch (error) {
      console.error('Image generation failed:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not generate the profile card image.",
      });
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  const handleShare = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!navigator.share) {
      toast({
        variant: "destructive",
        title: "Not Supported",
        description: "Your browser does not support the Web Share API.",
      });
      return;
    }

    const dataUrl = await generateImage();
    if (!dataUrl) return;

    try {
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `${profile.username}-card.png`, { type: 'image/png' });

      await navigator.share({
        files: [file],
        title: `Check out ${profile.name}'s profile on Herazur!`,
        text: `Discover ${profile.name} (@${profile.username}) on Herazur. #herazur #HerazurHalloween`,
      });
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Share failed:', error);
        toast({
          variant: "destructive",
          title: "Share Failed",
          description: "Could not share the profile card.",
        });
      }
    }
  };

  const handleDownload = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const dataUrl = await generateImage();
    if (!dataUrl) return;

    try {
      const link = document.createElement('a');
      link.download = `${profile.username}-card.png`;
      link.href = dataUrl;
      link.click();
      link.remove();
    } catch (error) {
      console.error('Download failed:', error);
      toast({
        variant: "destructive",
        title: "Download Failed",
        description: "Could not download the profile card.",
      });
    }
  };

  if (!profile) {
    return null;
  }

  const hasActiveBoost = profile.has_active_boost;

  const highestMultiplierBoost = activeBoosts.length > 0
    ? activeBoosts.reduce((max, boost) => {
      const currentMultiplier = getMultiplierFromBoostType(boost.boost_type_id);
      const maxMultiplier = getMultiplierFromBoostType(max.boost_type_id);
      return currentMultiplier > maxMultiplier ? boost : max;
    }, activeBoosts[0])
    : null;

  const rawAvatarUrl = processImageUrl(profile.avatar_url);
  const rawBannerUrl = processImageUrl(profile.banner_url);
  const finalAvatarUrl = optimizeSupabaseImageUrl(rawAvatarUrl, {
    width: 160,
    height: 160,
    resize: 'cover',
    quality: 80,
  });
  const finalBannerUrl = optimizeSupabaseImageUrl(rawBannerUrl, {
    width: 800,
    quality: 75,
  });
  const bannerSrcSet = rawBannerUrl
    ? buildSupabaseSrcSet(rawBannerUrl, [320, 480, 640, 800], { quality: 75 })
    : '';

  const avatarPlaceholder = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || 'H')}&background=1A1A1A&color=fff&size=128`;
  const bannerPlaceholder = `https://source.unsplash.com/random/800x450?abstract,gradient,${profile.tags?.[0] || 'dark'}`;

  const getBoostBadgeVariant = (multiplier) => {
    if (multiplier >= 5) return 'boost-high';
    if (multiplier >= 3) return 'boost-mid';
    if (multiplier >= 2) return 'boost-low';
    return 'secondary';
  };

  return (
    <motion.div
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={cn(
        "h-full w-full rounded-2xl",
        isGoldenPremium && "effect-golden",
        hasActiveBoost && !isGoldenPremium && "effect-boosted",
        !hasActiveBoost && !isGoldenPremium && profile.is_premium && "effect-premium"
      )}
      onClick={() => onCardClick ? onCardClick(profile) : navigate(`/u/${profile.username}`)}
    >
      <div
        ref={cardRef}
        className="card-3d relative h-full w-full flex flex-col overflow-hidden rounded-[14px] shadow-lg bg-transparent text-card-foreground border border-border/20"
        style={{
          background: 'transparent',
          backdropFilter: 'none'
        }}
      >
        {/* Main content with semi-transparent background */}
        <div className="flex flex-col flex-grow bg-gradient-to-br from-indigo-900/20 to-black/30 backdrop-blur-md rounded-[14px] border border-indigo-500/20">
          <div className="relative h-32 w-full flex-shrink-0">
            <img
              src={finalBannerUrl || bannerPlaceholder}
              alt={`${profile.name}'s banner`}
              className="absolute top-0 left-0 w-full h-full object-cover object-center rounded-t-[14px]"
              loading="lazy"
              decoding="async"
              srcSet={finalBannerUrl ? bannerSrcSet || undefined : undefined}
              sizes="(max-width: 640px) 100vw, 420px"
              onError={(e) => {
                const target = e.currentTarget;
                target.onerror = null;
                if (rawBannerUrl && target.src !== rawBannerUrl) {
                  target.src = rawBannerUrl;
                  return;
                }
                if (bannerPlaceholder && target.src !== bannerPlaceholder) {
                  target.src = bannerPlaceholder;
                }
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-black/10 to-transparent rounded-t-[14px]" />

            <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
              {giftsSentCount > 0 && (
                <Badge variant="destructive" className="shadow-lg backdrop-blur-sm bg-pink-500/80 text-white border-none">
                  <Gift className="h-3.5 w-3.5 mr-1" />
                  {giftsSentCount}
                </Badge>
              )}
              {highestMultiplierBoost ? (
                <Badge variant={getBoostBadgeVariant(getMultiplierFromBoostType(highestMultiplierBoost.boost_type_id))} className="shadow-lg backdrop-blur-sm">
                  <Zap className="h-3.5 w-3.5 mr-1" />
                  {`${getMultiplierFromBoostType(highestMultiplierBoost.boost_type_id)}x`}
                </Badge>
              ) : hasActiveBoost ? (
                <Badge className="bg-gradient-to-r from-blue-400 to-indigo-500 text-primary-foreground border-none shadow-lg">
                  <Zap className="h-3.5 w-3.5" />
                </Badge>
              ) : profile.is_premium ? (
                <Badge className="bg-gradient-to-r from-[hsl(var(--premium-start))] to-[hsl(var(--premium-end))] text-primary-foreground border-none shadow-lg">
                  <Zap className="h-3.5 w-3.5" />
                </Badge>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col p-4 flex-grow bg-transparent">
            <div className="flex items-center gap-4 -mt-14 mb-3">
              <Link to={`/u/${profile.username}`} className="block" onClick={(e) => e.stopPropagation()}>
                <Avatar className="h-20 w-20 flex-shrink-0 shadow-lg rounded-full border-2 border-white/20">
                  <AvatarImage
                    src={finalAvatarUrl || avatarPlaceholder}
                    alt={profile.name}
                    loading="lazy"
                    decoding="async"
                  />
                  <AvatarFallback className="text-2xl font-bold bg-muted">
                    {profile.name ? profile.name.charAt(0).toUpperCase() : 'U'}
                  </AvatarFallback>
                </Avatar>
              </Link>
              <div className="flex-grow min-w-0 pt-10">
                <Link to={`/u/${profile.username}`} className="block" onClick={(e) => e.stopPropagation()}>
                  <h3 className={cn(
                    "text-lg font-bold truncate text-foreground hover:underline flex items-center gap-1.5",
                    isGoldenPremium && "golden-username"
                  )}>
                    {profile.name}
                    {hasActiveBoost && <Zap className="h-4 w-4 text-yellow-400 fill-yellow-400" />}
                  </h3>
                  <p className="text-sm text-muted-foreground truncate">@{profile.username}</p>
                </Link>
              </div>
            </div>

            {profile.tagline && (
              <p className={cn(
                "text-sm italic text-muted-foreground line-clamp-2 font-semibold",
                isGoldenPremium && "golden-tagline"
              )}>
                "{profile.tagline}"
              </p>
            )}
            {profile.bio && <p className="mt-2 text-sm text-foreground/80 line-clamp-2">{profile.bio}</p>}

            <div className="flex-grow" />

            <div className="mt-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {profile.links && Array.isArray(profile.links) && profile.links.slice(0, 4).map((link) => {
                  const safeUrl = normalizeExternalUrl(link.url);
                  if (!safeUrl) return null;
                  return (
                    <a
                      key={link.platform}
                      href={safeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-muted-foreground transition-colors duration-300 hover:text-primary"
                    >
                      <SocialIcon platform={link.platform} className="h-4 w-4" />
                    </a>
                  );
                })}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" disabled={isProcessing} className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20" onClick={(e) => e.stopPropagation()}>
                    {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreVertical className="h-4 w-4" />}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenuItem onClick={handleShare}>
                    <Share2 className="mr-2 h-4 w-4" />
                    <span>Share</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDownload}>
                    <Download className="mr-2 h-4 w-4" />
                    <span>Download</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {Array.isArray(profile.tags) && profile.tags.slice(0, 5).map((tag) => (
                <Link to={`/discover?tags=${encodeURIComponent(tag)}`} key={tag} onClick={(e) => e.stopPropagation()}>
                  <Badge
                    variant="secondary"
                    className="cursor-pointer hover:bg-primary/20 transition-colors bg-white/10 text-foreground border-white/20"
                  >
                    {tag}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export const ProfileCardSkeleton = () => (
  <div className="card-3d relative w-full flex flex-col overflow-hidden rounded-2xl border border-border/20 shadow-lg bg-transparent">
    <div className="flex flex-col flex-grow bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
      <Skeleton className="h-32 w-full flex-shrink-0 rounded-t-2xl bg-white/20" />
      <div className="flex flex-col p-4">
        <div className="-mt-14 mb-3">
          <Skeleton className="h-20 w-20 rounded-full border-4 border-white/20 bg-white/20" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-5 w-3/4 bg-white/20" />
          <Skeleton className="h-4 w-1/2 bg-white/20" />
        </div>
        <div className="mt-2 space-y-1">
          <Skeleton className="h-4 w-full bg-white/20" />
          <Skeleton className="h-4 w-5/6 bg-white/20" />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Skeleton className="h-6 w-16 rounded-full bg-white/20" />
          <Skeleton className="h-6 w-20 rounded-full bg-white/20" />
          <Skeleton className="h-6 w-14 rounded-full bg-white/20" />
        </div>
      </div>
    </div>
  </div>
);

export default ProfileCard;
