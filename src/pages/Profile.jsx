import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Seo from '@/components/Seo';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Users, Star, Eye, MessageSquare, Share2, Edit, Settings, Gift, Copy, Check, Loader2, Heart, HeartCrack, Coins, Trophy, Calendar, MapPin, UserPlus, UserCheck, MoreHorizontal, BarChart2, Shield, Mail, Crown, Zap, Sparkles
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import SocialIcon from '@/components/SocialIcon';
import GiftSheet from '@/components/GiftSheet';
import FollowersList from '@/components/FollowersList';
import FollowingList from '@/components/FollowingList';
import { countries } from '@/lib/countries';
import { supabase } from '@/lib/customSupabaseClient';
import { cn, optimizeSupabaseImageUrl, buildSupabaseSrcSet } from '@/lib/utils';
import { SITE_URL } from '@/lib/seo';
import { formatDistanceToNow } from 'date-fns';
import { normalizeExternalUrl } from '@/lib/sanitize';

const ProfileHeaderSkeleton = () => (
  <div className="relative">
    <Skeleton className="h-48 sm:h-64 w-full rounded-t-lg" />
    <div className="absolute bottom-0 left-6 transform translate-y-1/2">
      <Skeleton className="h-24 w-24 sm:h-32 sm:w-32 rounded-full border-4 border-background" />
    </div>
  </div>
);

const ProfileInfoSkeleton = () => (
  <div className="pt-16 px-6 pb-6 space-y-4">
    <Skeleton className="h-8 w-1/2" />
    <Skeleton className="h-5 w-1/3" />
    <div className="flex flex-wrap gap-2">
      <Skeleton className="h-6 w-20 rounded-full" />
      <Skeleton className="h-6 w-24 rounded-full" />
      <Skeleton className="h-6 w-16 rounded-full" />
    </div>
    <Skeleton className="h-12 w-full" />
  </div>
);

const StatCard = ({ icon, label, value, isLoading }) => (
  <Card className="text-center flex flex-col items-center justify-center p-4">
    {isLoading ? (
      <>
        <Skeleton className="h-8 w-8 rounded-full mb-2" />
        <Skeleton className="h-6 w-12 mb-1" />
        <Skeleton className="h-4 w-20" />
      </>
    ) : (
      <>
        {icon}
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </>
    )}
  </Card>
);

const GiftLevelProgress = ({ profile }) => {
  if (!profile || typeof profile.gift_level === 'undefined' || typeof profile.gift_xp === 'undefined') {
    return null;
  }

  const { gift_level, gift_xp } = profile;
  const xpForNextLevel = gift_level * 1000;
  const progressPercentage = (gift_xp / xpForNextLevel) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-pink-500" />
          Gift Level
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-2">
          <Badge variant="secondary">Level {gift_level}</Badge>
          <span className="text-sm text-muted-foreground">
            {gift_xp.toLocaleString()} / {xpForNextLevel.toLocaleString()} XP
          </span>
        </div>
        <Progress value={progressPercentage} className="w-full" />
        <p className="text-xs text-muted-foreground mt-2 text-center">
          {xpForNextLevel - gift_xp > 0
            ? `${(xpForNextLevel - gift_xp).toLocaleString()} XP to Level ${gift_level + 1}`
            : "Max level reached for now!"}
        </p>
      </CardContent>
    </Card>
  );
};


const ReportDialog = ({ profile, onOpenChange }) => {
  const { reportProfile } = useData();
  const { toast } = useToast();
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      toast({
        title: 'Reason required',
        description: 'Please provide a reason for reporting this profile.',
        variant: 'destructive',
      });
      return;
    }
    setIsSubmitting(true);
    try {
      await reportProfile(profile.user_id, reason);
      toast({
        title: 'Report Submitted',
        description: `Thank you for reporting ${profile.name}. We will review it shortly.`,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting report:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit report. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DialogContent>
      <form onSubmit={handleSubmit}>
        <DialogHeader>
          <DialogTitle>Report {profile.name}</DialogTitle>
          <DialogDescription>
            Please provide a reason for reporting this profile. Your report is anonymous.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Label htmlFor="report-reason" className="sr-only">
            Reason
          </Label>
          <Textarea
            id="report-reason"
            placeholder="e.g., spam, inappropriate content, impersonation..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            required
          />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Cancel
            </Button>
          </DialogClose>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Report
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
};

const Profile = () => {
  const { username } = useParams();
  const { user, profile: currentUserProfile } = useAuth();
  const {
    getProfileByUsername,
    incrementViews,
    handleVote,
    getProfileVotes,
    getRelatedProfiles,
    getActiveBoostsForProfile,
    getProfileStats,
    sendMessage,
    getCommentsForProfile,
    getReceivedGifts,
    getCloseUsers,
    checkFollowStatus,
    followUser,
    unfollowUser,
    getFollowCounts,
    getEarnedBadges,
  } = useData();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [votes, setVotes] = useState({ userVote: 0, totalVotes: { upvotes: 0, downvotes: 0 } });
  const [relatedProfiles, setRelatedProfiles] = useState([]);
  const [activeBoosts, setActiveBoosts] = useState([]);
  const [stats, setStats] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isGiftSheetOpen, setGiftSheetOpen] = useState(false);
  const [receivedGifts, setReceivedGifts] = useState([]);
  const [closeUsers, setCloseUsers] = useState([]);
  const [followStatus, setFollowStatus] = useState({ is_following: false, is_followed_by: false });
  const [followCounts, setFollowCounts] = useState({ following: 0, followers: 0 });
  const [isFollowersListOpen, setFollowersListOpen] = useState(false);
  const [isFollowingListOpen, setFollowingListOpen] = useState(false);
  const [earnedBadges, setEarnedBadges] = useState([]);
  const [referralCode, setReferralCode] = useState(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isReportDialogOpen, setReportDialogOpen] = useState(false);
  const [canUseGif, setCanUseGif] = useState(false);

  const isOwnProfile = useMemo(() => currentUserProfile?.username === username, [currentUserProfile, username]);
  const canMessageProfile = Boolean(user && !isOwnProfile && followStatus.is_following);

  const normalizeComment = useCallback((raw, fallbackProfile) => {
    if (!raw) return null;

    const isOptimistic = !!raw.tempId;
    const isFromDb = !!raw.author_name;

    let finalAuthorName = 'User';
    let finalAuthorUsername = '';
    let finalAuthorAvatarUrl = null;

    if (isOptimistic) {
      finalAuthorName = fallbackProfile?.name ?? 'You';
      finalAuthorUsername = fallbackProfile?.username ?? '';
      finalAuthorAvatarUrl = fallbackProfile?.avatar_url ?? null;
    } else if (isFromDb) {
      finalAuthorName = raw.author_name;
      finalAuthorUsername = raw.author_username;
      finalAuthorAvatarUrl = raw.author_avatar_url;
    }

    return {
      id: raw.id ?? raw.tempId,
      content: raw.content,
      created_at: raw.created_at,
      parent_comment_id: raw.parent_comment_id,
      receiver_id: raw.receiver_id,
      sender_id: raw.sender_id,
      super_tier: raw.super_tier,
      author_name: finalAuthorName,
      author_username: finalAuthorUsername,
      author_avatar_url: finalAuthorAvatarUrl,
    };
  }, []);

  const fetchProfileData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const profileData = await getProfileByUsername(username);
      if (!profileData) {
        setError('Profile not found.');
        setLoading(false);
        return;
      }
      setProfile(profileData);

      const results = await Promise.allSettled([
        getProfileVotes(profileData.id),
        getActiveBoostsForProfile(profileData.id),
        getProfileStats(profileData.id),
        getCommentsForProfile(profileData.user_id),
        getReceivedGifts(profileData.id),
        getCloseUsers(profileData.id),
        checkFollowStatus(profileData.user_id),
        getFollowCounts(profileData.user_id),
        getEarnedBadges(profileData.user_id),
      ]);

      const pick = (res, fallback, label) => {
        if (res.status === 'rejected') {
          console.error(`Error loading ${label}:`, res.reason);
          return fallback;
        }
        return res.value ?? fallback;
      };

      const votesData = pick(results[0], { userVote: 0, totalVotes: { upvotes: 0, downvotes: 0 } }, 'votes');
      const boostsData = pick(results[1], [], 'boosts');
      const statsData = pick(results[2], null, 'stats');
      const commentsData = pick(results[3], [], 'comments');
      const giftsData = pick(results[4], [], 'gifts');
      const closeUsersData = pick(results[5], [], 'close users');
      const followStatusData = pick(results[6], { is_following: false, is_followed_by: false }, 'follow status');
      const followCountsData = pick(results[7], { following: 0, followers: 0 }, 'follow counts');
      const badgesData = pick(results[8], [], 'badges');

      const validBoosts = boostsData || [];
      const hasActiveGifPermission = validBoosts.some(boost =>
        (boost.boost_type_id?.includes('ultimate_presence_90d') ||
          boost.boost_type_id?.includes('monthly_spotlight_30d') ||
          boost.boost_type_id?.includes('quick_boost_12h'))
      );
      setCanUseGif(hasActiveGifPermission);

      const normalizedComments = (commentsData || [])
        .map(c => normalizeComment(c, currentUserProfile))
        .filter(Boolean);

      setComments(normalizedComments);

      setVotes(votesData);
      setActiveBoosts(validBoosts);
      setStats(statsData);
      setReceivedGifts(giftsData || []);
      setCloseUsers(closeUsersData || []);
      setFollowStatus(followStatusData);
      setFollowCounts(followCountsData);
      setEarnedBadges(badgesData || []);

      if (!isOwnProfile && profileData?.id) {
        const key = `viewed_${profileData.id}`;
        const last = Number(localStorage.getItem(key) || 0);

        if (Date.now() - last > 6 * 60 * 60 * 1000) {
          try {
            const res = await incrementViews(profileData.id);
            if (res?.views != null) {
              setProfile(p => ({ ...p, views: res.views }));
            } else {
              setProfile(p => ({ ...p, views: (p?.views || 0) + 1 }));
            }
            localStorage.setItem(key, String(Date.now()));
          } catch (err) {
            console.error('incrementViews error:', err);
          }
        }
      }

    } catch (err) {
      console.error('Error fetching profile data:', err);
      setError('Failed to load profile data.');
    } finally {
      setLoading(false);
    }
  }, [
    username,
    getProfileByUsername,
    incrementViews,
    getProfileVotes,
    isOwnProfile,
    getActiveBoostsForProfile,
    getProfileStats,
    getCommentsForProfile,
    getReceivedGifts,
    getCloseUsers,
    checkFollowStatus,
    getFollowCounts,
    getEarnedBadges,
    currentUserProfile,
    normalizeComment,
  ]);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  useEffect(() => {
    if (profile) {
      setRelatedProfiles(getRelatedProfiles(profile));
    }
  }, [profile, getRelatedProfiles]);

  useEffect(() => {
    if (isOwnProfile && profile?.user_id) {
      const fetchReferralCode = async () => {
        const { data, error } = await supabase.rpc('get_or_create_referral_code', {
          p_user_id: profile.user_id,
        });
        if (error) {
          console.error('Error fetching referral code:', error);
        } else {
          setReferralCode(data);
        }
      };
      fetchReferralCode();
    }
  }, [isOwnProfile, profile?.user_id]);

  const processImageUrl = (url) => {
    if (!url) return null;
    if (!url.toLowerCase().endsWith('.gif')) return url;
    if (canUseGif) return url;
    const baseUrl = url.split('?')[0];
    return `${baseUrl}?frame=1&static=true`;
  };

  const optimizeAvatarUrl = (url, size = 128) =>
    optimizeSupabaseImageUrl(processImageUrl(url), {
      width: size,
      height: size,
      resize: 'cover',
      quality: 80,
    });

  const optimizeBannerUrl = (url, width = 1600) =>
    optimizeSupabaseImageUrl(processImageUrl(url), {
      width,
      quality: 80,
    });

  const handleVoteClick = async (voteType) => {
    if (!user) {
      toast({ title: 'Login Required', description: 'You must be logged in to vote.' });
      return;
    }
    if (isOwnProfile) {
      toast({ title: 'Oops!', description: "You can't vote for yourself." });
      return;
    }
    try {
      const { userVote: newUserVote } = await handleVote(profile.id, voteType);
      const currentUpvotes = votes.totalVotes.upvotes;
      const currentDownvotes = votes.totalVotes.downvotes;
      let newUpvotes = currentUpvotes;
      let newDownvotes = currentDownvotes;

      if (votes.userVote === 1) newUpvotes--;
      if (votes.userVote === -1) newDownvotes--;

      if (newUserVote === 1) newUpvotes++;
      if (newUserVote === -1) newDownvotes++;

      setVotes({
        userVote: newUserVote,
        totalVotes: { upvotes: newUpvotes, downvotes: newDownvotes },
      });
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleFollow = async () => {
    if (!user) {
      toast({ title: 'Login Required', description: 'You must be logged in to follow.' });
      return;
    }
    if (isOwnProfile) return;

    try {
      await followUser(profile.user_id);
      setFollowStatus(prev => ({ ...prev, is_following: true }));
      setFollowCounts(prev => ({ ...prev, followers: prev.followers + 1 }));
      toast({ title: 'Followed!', description: `You are now following ${profile.name}.` });
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleUnfollow = async () => {
    if (!user) return;
    try {
      await unfollowUser(profile.user_id);
      setFollowStatus(prev => ({ ...prev, is_following: false }));
      setFollowCounts(prev => ({ ...prev, followers: prev.followers - 1 }));
      toast({ title: 'Unfollowed', description: `You are no longer following ${profile.name}.` });
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !user || !profile || !currentUserProfile) return;
    if (!canMessageProfile) {
      toast({
        title: 'Follow required',
        description: `Follow ${profile.name} before sending a message.`,
        variant: 'destructive',
      });
      return;
    }

    setIsSubmittingComment(true);
    const tempId = `temp-${Date.now()}`;
    const optimisticComment = normalizeComment({
      tempId: tempId,
      sender_id: user.id,
      receiver_id: profile.user_id,
      content: newComment.trim(),
      created_at: new Date().toISOString(),
      parent_comment_id: null,
      super_tier: currentUserProfile?.is_premium ? 1 : 0,
    }, currentUserProfile);

    setComments(prev => [optimisticComment, ...prev]);
    setNewComment('');

    try {
      const newDbComment = await sendMessage(profile.user_id, optimisticComment.content);
      const normalizedNew = normalizeComment(newDbComment, currentUserProfile);
      setComments(prev => prev.map(c => c.id === tempId ? normalizedNew : c));
      toast({ title: 'Success', description: 'Your message has been sent.' });
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      setComments(prev => prev.filter(c => c.id !== tempId));
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.share({
        title: `${profile.name}'s Profile on Herazur`,
        text: `Check out ${profile.name}'s profile!`,
        url,
      });
      toast({ title: 'Shared!', description: 'Profile link shared successfully.' });
    } catch (err) {
      await navigator.clipboard.writeText(url);
      toast({ title: 'Copied!', description: 'Profile link copied to clipboard.' });
    }
  };

  const handleCopyReferral = () => {
    if (!referralCode) return;
    navigator.clipboard.writeText(referralCode);
    setIsCopied(true);
    toast({ title: 'Copied!', description: 'Your referral code is copied to the clipboard.' });
    setTimeout(() => setIsCopied(false), 2000);
  };

  const countryName = useMemo(() => {
    if (!profile?.country) return null;
    const country = countries.find(c => c.code === profile.country);
    return country ? country.name : null;
  }, [profile?.country]);

  if (loading) {
    return (
      <div className="container mx-auto max-w-4xl py-8 px-4">
        <Card>
          <ProfileHeaderSkeleton />
          <ProfileInfoSkeleton />
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <>
        <Seo title="Profile Not Found" noindex />
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold">Profile Not Found</h2>
          <p className="text-muted-foreground">The user you are looking for does not exist.</p>
          <Button asChild className="mt-4">
            <Link to="/discover">Discover other profiles</Link>
          </Button>
        </div>
      </>
    );
  }

  const votePercentage =
    votes.totalVotes.upvotes + votes.totalVotes.downvotes > 0
      ? (votes.totalVotes.upvotes / (votes.totalVotes.upvotes + votes.totalVotes.downvotes)) * 100
      : 50;

  const rawBannerUrl = processImageUrl(profile.banner_url);
  const finalAvatarUrl = optimizeAvatarUrl(profile.avatar_url, 256);
  const finalBannerUrl = optimizeBannerUrl(profile.banner_url, 1600);
  const bannerSrcSet = rawBannerUrl
    ? buildSupabaseSrcSet(rawBannerUrl, [640, 960, 1280, 1600], { quality: 80 })
    : '';
  const profileUrl = profile?.username ? `${SITE_URL}/u/${profile.username}` : SITE_URL;
  const profileSeoImage = optimizeSupabaseImageUrl(
    processImageUrl(profile.banner_url || profile.avatar_url),
    { width: 1200, height: 630, resize: 'cover', quality: 80 }
  );
  const profileSchema = profile
    ? {
        '@context': 'https://schema.org',
        '@type': 'ProfilePage',
        mainEntity: {
          '@type': 'Person',
          name: profile.name,
          alternateName: profile.username,
          description: profile.bio || undefined,
          url: profileUrl,
          image: [profile.avatar_url, profile.banner_url].filter(Boolean),
          sameAs: Array.isArray(profile.links)
            ? profile.links.map((link) => link?.url).filter(Boolean)
            : undefined,
        },
      }
    : null;
  const breadcrumbSchema = profile?.username
    ? {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Profile', item: profileUrl },
        ],
      }
    : null;
  const combinedSchema = [profileSchema, breadcrumbSchema].filter(Boolean);

  return (
    <>
      <Seo
        title={`${profile.name} (@${profile.username})`}
        description={profile.bio || `Check out ${profile.name}'s profile on Herazur.`}
        image={profileSeoImage || profile.avatar_url}
        url={profileUrl}
        canonical={profileUrl}
        type="profile"
        schema={combinedSchema}
      />

      <Dialog open={isReportDialogOpen} onOpenChange={setReportDialogOpen}>
        <div className="container mx-auto max-w-4xl py-8 px-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            <Card className="overflow-hidden">
              <div className="relative">
                <div className="h-48 sm:h-64 bg-muted">
                  {finalBannerUrl && (
                    <img
                      src={finalBannerUrl}
                      alt={`${profile.name}'s banner`}
                      className="h-full w-full object-cover"
                      loading="eager"
                      decoding="async"
                      fetchPriority="high"
                      srcSet={bannerSrcSet || undefined}
                      sizes="(max-width: 1024px) 100vw, 896px"
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (rawBannerUrl && target.src !== rawBannerUrl) {
                          target.src = rawBannerUrl;
                        }
                      }}
                    />
                  )}
                </div>
                <div className="absolute bottom-0 left-6 transform translate-y-1/2">
                  <Avatar className="h-24 w-24 sm:h-32 sm:w-32 rounded-full border-4 border-background bg-background shadow-lg">
                    <AvatarImage
                      src={finalAvatarUrl}
                      alt={`${profile.name}'s avatar`}
                      loading="eager"
                      decoding="async"
                      fetchPriority="high"
                    />
                    <AvatarFallback className="text-4xl">
                      {profile.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="absolute top-4 right-4 flex items-center gap-2">
                  {isOwnProfile ? (
                    <>
                      <Button asChild variant="secondary" size="sm">
                        <Link to="/edit-profile">
                          <Edit className="mr-2 h-4 w-4" /> Edit Profile
                        </Link>
                      </Button>
                      <Button asChild variant="secondary" size="sm">
                        <Link to="/promote">
                          <Star className="mr-2 h-4 w-4" /> Promote
                        </Link>
                      </Button>
                    </>
                  ) : (
                    <>
                      {followStatus.is_following ? (
                        <Button onClick={handleUnfollow} variant="secondary" size="sm">
                          <UserCheck className="mr-2 h-4 w-4" /> Following
                        </Button>
                      ) : (
                        <Button onClick={handleFollow} size="sm">
                          <UserPlus className="mr-2 h-4 w-4" /> Follow
                        </Button>
                      )}
                      <Button onClick={() => setGiftSheetOpen(true)} variant="secondary" size="sm">
                        <Gift className="mr-2 h-4 w-4" /> Gift
                      </Button>
                    </>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={handleShare}>
                        <Share2 className="mr-2 h-4 w-4" /> Share Profile
                      </DropdownMenuItem>
                      {/* Removed Settings link from profile dropdown as it's not in the sidebar anymore */}
                      {!isOwnProfile && user && (
                        <DropdownMenuItem onSelect={() => setReportDialogOpen(true)}>
                          <Shield className="mr-2 h-4 w-4" /> Report
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div className="pt-16 px-6 pb-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                  <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                      {profile.name}
                      {profile.is_premium && <Star className="h-6 w-6 text-yellow-400 fill-current" />}
                    </h1>
                    <p className="text-muted-foreground">@{profile.username}</p>
                    {profile.tagline && <p className="text-lg mt-1">{profile.tagline}</p>}
                  </div>
                  <div className="flex items-center gap-4 mt-4 sm:mt-0">
                    {profile.links?.map((link, index) => {
                      const safeUrl = normalizeExternalUrl(link.url);
                      if (!safeUrl) return null;
                      return (
                        <a
                          key={index}
                          href={safeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <SocialIcon platform={link.platform} className="h-6 w-6" />
                        </a>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {profile.tags?.map((tag, index) => (
                    <Badge key={index} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>

                {profile.bio && <p className="mt-4 text-foreground/80">{profile.bio}</p>}

                <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                  {countryName && (
                    <div className="flex items-center">
                      <MapPin className="mr-2 h-4 w-4" /> {countryName}
                    </div>
                  )}
                  <div className="flex items-center">
                    <Calendar className="mr-2 h-4 w-4" /> Joined{' '}
                    {new Date(profile.created_at).toLocaleDateString('en-US', {
                      month: 'long',
                      year: 'numeric',
                    })}
                  </div>
                </div>
              </div>
            </Card>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
              <div
                className="cursor-pointer"
                onClick={() => setFollowersListOpen(true)}
              >
                <StatCard
                  icon={<Users className="h-6 w-6 mb-2 text-primary" />}
                  label="Followers"
                  value={followCounts.followers}
                  isLoading={loading}
                />
              </div>
              <div
                className="cursor-pointer"
                onClick={() => setFollowingListOpen(true)}
              >
                <StatCard
                  icon={<UserCheck className="h-6 w-6 mb-2 text-primary" />}
                  label="Following"
                  value={followCounts.following}
                  isLoading={loading}
                />
              </div>
              <StatCard
                icon={<Eye className="h-6 w-6 mb-2 text-primary" />}
                label="Profile Views"
                value={profile.views || 0}
                isLoading={loading}
              />
            </div>

            {isOwnProfile && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Profile Stats</CardTitle>
                  <CardDescription>Your performance metrics.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <StatCard
                    icon={<Trophy className="h-6 w-6 mb-2 text-yellow-500" />}
                    label="Leaderboard Rank"
                    value={stats ? `#${stats.rank}` : 'N/A'}
                    isLoading={!stats}
                  />
                  <StatCard
                    icon={<Heart className="h-6 w-6 mb-2 text-red-500" />}
                    label="Upvotes (24h)"
                    value={stats ? stats.upvotes_24h : '0'}
                    isLoading={!stats}
                  />
                  <StatCard
                    icon={<MessageSquare className="h-6 w-6 mb-2 text-blue-500" />}
                    label="Comments (24h)"
                    value={stats ? stats.comments_24h : '0'}
                    isLoading={!stats}
                  />
                </CardContent>
                <div className="p-4 border-t">
                  <Button asChild variant="link" className="w-full">
                    <Link to="/stats">
                      <BarChart2 className="mr-2 h-4 w-4" /> View Detailed Stats
                    </Link>
                  </Button>
                </div>
              </Card>
            )}

            {!isOwnProfile && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Rate This Profile</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-4">
                  <div className="flex w-full items-center gap-4">
                    <Button
                      variant={votes.userVote === 1 ? 'default' : 'outline'}
                      size="lg"
                      className="flex-1"
                      onClick={() => handleVoteClick(1)}
                    >
                      <Heart className="mr-2 h-5 w-5" /> Upvote ({votes.totalVotes.upvotes})
                    </Button>
                    <Button
                      variant={votes.userVote === -1 ? 'destructive' : 'outline'}
                      size="lg"
                      className="flex-1"
                      onClick={() => handleVoteClick(-1)}
                    >
                      <HeartCrack className="mr-2 h-5 w-5" /> Downvote ({votes.totalVotes.downvotes})
                    </Button>
                  </div>
                  <div className="w-full">
                    <Progress value={votePercentage} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>{votes.totalVotes.downvotes} Downvotes</span>
                      <span>{votes.totalVotes.upvotes} Upvotes</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {isOwnProfile && profile.user_id && (
              <Card className="mt-6 bg-gradient-to-r from-purple-500/10 to-blue-500/10">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-center sm:text-left">
                      <p className="font-semibold">Invite a friend – when they purchase a package, you both earn 1,000 Crystal Coins!</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="secondary" className="text-lg font-mono tracking-widest">
                        {referralCode || '...'}
                      </Badge>
                      <Button size="icon" onClick={handleCopyReferral} disabled={!referralCode || isCopied}>
                        {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
              <div className="lg:col-span-2 space-y-6">
                <GiftLevelProgress profile={profile} />

                {earnedBadges.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Badges</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-4">
                      {earnedBadges.map(badge => (
                        <div key={badge.id} className="flex flex-col items-center text-center w-20">
                          <img src={badge.image_url} alt={badge.name} className="h-16 w-16" loading="lazy" decoding="async" />
                          <span className="text-xs mt-1 font-semibold">{badge.name}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {receivedGifts.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Gifts Received</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-4">
                      {receivedGifts.map(gift => (
                        <div key={gift.gift_id} className="flex flex-col items-center text-center w-20">
                          <div className="relative">
                          <img src={gift.image_url} alt={gift.name} className="h-16 w-16" loading="lazy" decoding="async" />
                            <Badge className="absolute -top-2 -right-2">{gift.gift_count}</Badge>
                          </div>
                          <span className="text-xs mt-1 font-semibold">{gift.name}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle>Messages</CardTitle>
                    <CardDescription>
                      {isOwnProfile
                        ? 'Messages from other users.'
                        : `Leave a message for ${profile.name}.`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {!isOwnProfile && user && !followStatus.is_following && (
                      <div className="mb-6 rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                        Follow {profile.name} to send a message.
                      </div>
                    )}
                    {canMessageProfile && (
                      <form onSubmit={handleCommentSubmit} className="flex items-start gap-4 mb-6">
                        <Avatar>
                          <AvatarImage src={optimizeAvatarUrl(currentUserProfile?.avatar_url, 96)} />
                          <AvatarFallback>
                            {currentUserProfile?.name?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-grow">
                          <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder={`Send a message to ${profile.name}...`}
                            className="w-full p-2 border rounded-md bg-background"
                            rows="2"
                          />
                          <Button type="submit" size="sm" className="mt-2" disabled={isSubmittingComment}>
                            {isSubmittingComment ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Mail className="mr-2 h-4 w-4" />
                            )}
                            Send
                          </Button>
                        </div>
                      </form>
                    )}
                    <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                      {comments.length > 0 ? (
                        comments.map((comment) => {
                          const tier = Number(comment?.super_tier ?? 0);
                          const showGoldenUsername = tier >= 2;

                          return (
                            <div key={comment.id} className="flex items-start gap-3">
                              <Link to={`/u/${comment.author_username}`}>
                                <Avatar className="h-9 w-9">
                                  <AvatarImage src={optimizeAvatarUrl(comment.author_avatar_url, 96)} alt={comment.author_name} />
                                  <AvatarFallback>{comment.author_name?.charAt(0)}</AvatarFallback>
                                </Avatar>
                              </Link>

                              <div className="rounded-2xl px-4 py-2 max-w-[80%] border bg-muted/50">
                                <div className="flex items-center gap-2 mb-1">
                                  <Link
                                    to={`/u/${comment.author_username}`}
                                    className={cn(
                                      "text-sm hover:underline font-medium",
                                      showGoldenUsername ? "golden-username" : "text-foreground"
                                    )}
                                  >
                                    {comment.author_name}
                                  </Link>

                                  {tier >= 2 && (
                                    <span className={cn(
                                      "text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wide inline-flex items-center gap-1",
                                      tier === 3
                                        ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-black"
                                        : "bg-fuchsia-600 text-white"
                                    )}>
                                      {tier === 3 ? <Crown className="h-3 w-3" /> : <Zap className="h-3 w-3" />}
                                      Super Chat
                                    </span>
                                  )}
                                </div>

                                <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap break-words">
                                  {comment.content}
                                </p>

                                <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                                  {tier >= 2 && <Sparkles className="h-3 w-3 text-yellow-400" />}
                                  {comment.created_at && (
                                    <span>{formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-center text-muted-foreground">
                          {isOwnProfile ? 'No messages yet.' : `Be the first to leave a message!`}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                {activeBoosts.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Active Boosts</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {activeBoosts.map(boost => (
                        <div key={boost.boost_type_id} className="text-sm">
                          <p className="font-semibold">{boost.name} ({boost.multiplier}x Score)</p>
                          <p className="text-xs text-muted-foreground">
                            Ends in {new Date(boost.ends_at).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {closeUsers.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Close Friends</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {closeUsers.filter(p => p && p.id).map(p => (
                        <Link to={`/u/${p.username}`} key={p.id} className="flex items-center gap-3 hover:bg-muted/50 p-2 rounded-lg">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={optimizeAvatarUrl(p.avatar_url, 96)} />
                            <AvatarFallback>{p.name?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-grow">
                            <p className="font-semibold">{p.name}</p>
                            <p className="text-sm text-muted-foreground">@{p.username}</p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {Math.round(p.closeness_score)}
                          </Badge>
                        </Link>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {relatedProfiles.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Related Profiles</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {relatedProfiles.filter(p => p && p.id).map(p => (
                        <Link to={`/u/${p.username}`} key={p.id} className="flex items-center gap-3 hover:bg-muted/50 p-2 rounded-lg">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={optimizeAvatarUrl(p.avatar_url, 96)} />
                            <AvatarFallback>{p.name?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold">{p.name}</p>
                            <p className="text-sm text-muted-foreground">@{p.username}</p>
                          </div>
                        </Link>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </motion.div>
        </div>
        {profile && <ReportDialog profile={profile} onOpenChange={setReportDialogOpen} />}
      </Dialog>

      {!isOwnProfile && profile && (
        <GiftSheet
          isOpen={isGiftSheetOpen}
          onOpenChange={setGiftSheetOpen}
          receiverProfile={profile}
        />
      )}

      {profile && (
        <>
          <FollowersList
            isOpen={isFollowersListOpen}
            onOpenChange={setFollowersListOpen}
            userId={profile.user_id}
          />
          <FollowingList
            isOpen={isFollowingListOpen}
            onOpenChange={setFollowingListOpen}
            userId={profile.user_id}
          />
        </>
      )}
    </>
  );
};

export default Profile;
