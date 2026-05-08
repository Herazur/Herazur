import React, { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from './SupabaseAuthContext';
import { toast } from '@/components/ui/use-toast';
import { Star, PartyPopper } from 'lucide-react';
import { subDays } from 'date-fns';
import { sanitizeSearchQuery, sanitizeSocialLinks } from '@/lib/sanitize';

const DataContext = createContext();
export const useData = () => useContext(DataContext);

const PROFILE_FIELDS = [
  'name',
  'username',
  'tagline',
  'bio',
  'tags',
  'links',
  'gender',
  'country',
  'avatar_url',
  'banner_url',
  'referred_by',
];

const cleanProfilePayload = (profileData = {}, options = {}) => {
  const payload = {};
  const allowedFields = options.allowReferral === false
    ? PROFILE_FIELDS.filter((field) => field !== 'referred_by')
    : PROFILE_FIELDS;

  allowedFields.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(profileData, field)) {
      payload[field] = profileData[field];
    }
  });

  payload.links = sanitizeSocialLinks(payload.links || []);
  return payload;
};

export const hasPremiumFeatures = (profile, activeBoosts = []) => {
  if (!profile) return false;
  
  const tier = Number(profile?.super_tier ?? 0);
  
  const hasMonthlySpotlight = activeBoosts.some(boost => 
    String(boost.boost_type_id || '').toLowerCase().includes('monthly_spotlight')
  );
  const hasUltimatePresence = activeBoosts.some(boost => 
    String(boost.boost_type_id || '').toLowerCase().includes('ultimate_presence')
  );
  
  if (tier >= 2) return true;
  if (hasMonthlySpotlight || hasUltimatePresence) return true;
  
  return false;
};

export const DataProvider = ({ children }) => {
  const { user, profile: currentUserProfile, loading: authLoading, refreshProfile } = useAuth();
  const [profiles, setProfiles] = useState([]);
  const [leaderboardProfiles, setLeaderboardProfiles] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [coins, setCoins] = useState(0);
  const lastTimescaleRef = useRef(null);

  // Helpers for activeWithin
  const _now = () => Date.now();
  const _isActiveWithin = (ts, days) => {
    if (!ts || !days || days === 'any') return true;
    const t = new Date(ts).getTime();
    if (!Number.isFinite(t)) return false;
    const cutoff = _now() - Number(days) * 24 * 60 * 60 * 1000;
    return t >= cutoff;
  };

  // fetchInitialData: cleanup DÖNDÜRME
  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const [profilesResult, tagsResult] = await Promise.all([
        supabase.rpc('get_leaderboard', { p_timescale: 'trending' }),
        supabase.rpc('get_popular_tags', { p_limit: 20 })
      ]);

      if (profilesResult.error) {
        console.error('Error fetching profiles:', profilesResult.error);
        setProfiles([]);
      } else {
        setProfiles(profilesResult.data || []);
      }

      if (tagsResult.error) {
        console.error('Error fetching tags:', tagsResult.error);
        setTags(Array.isArray(tagsResult.data) ? tagsResult.data : []);
      } else {
        setTags(Array.isArray(tagsResult.data) ? tagsResult.data : []);
      }
    } catch (error) {
      console.error('Error fetching initial data:', error);
      setProfiles([]);
      setTags([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCoins = useCallback(async () => {
    if (!currentUserProfile) return;
    const { data, error } = await supabase
      .from('profiles')
      .select('coins')
      .eq('id', currentUserProfile.id)
      .single();

    if (error) {
      console.error('Error fetching coins:', error);
      setCoins(0);
    } else {
      setCoins(data?.coins ?? 0);
    }
  }, [currentUserProfile]);

  useEffect(() => {
    if (authLoading) return;
    let alive = true;
    (async () => {
      try {
        await fetchInitialData();
      } finally {
        // nothing
      }
    })();
    return () => { alive = false; };
  }, [authLoading, fetchInitialData]);

  useEffect(() => {
    if (currentUserProfile) {
      fetchCoins();
    } else {
      setCoins(0);
    }
  }, [currentUserProfile, fetchCoins]);

  const getLeaderboard = useCallback(async (category = 'score', timescale = 'trending') => {
    setLoading(true);
    let rpcName;
    let params = { p_limit: 100 };

    switch (category) {
      case 'views':
        rpcName = 'get_leaderboard_by_views';
        break;
      case 'gifts':
        rpcName = 'get_top_gifters';
        break;
      case 'likes':
        rpcName = 'get_leaderboard_by_likes';
        break;
      case 'score':
      default:
        rpcName = 'get_leaderboard';
        params = { p_timescale: timescale };
        break;
    }

    const { data, error } = await supabase.rpc(rpcName, params);

    if (error) {
      console.error(`Error fetching ${category} leaderboard:`, error);
      toast({
        title: "Error",
        description: "Could not load leaderboard data.",
        variant: "destructive",
      });
      setLeaderboardProfiles([]);
    } else {
      setLeaderboardProfiles(data || []);
    }
    lastTimescaleRef.current = timescale;
    setLoading(false);
  }, []);

  const handleVote = async (profileId, voteType) => {
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase.rpc('handle_vote', {
      p_profile_id: profileId,
      p_vote_type: voteType,
    });

    if (error) throw error;

    if (data?.vote_action_occurred) {
      await getLeaderboard('score', lastTimescaleRef.current || 'trending');
    }

    return data;
  };

  const getProfileVotes = async (profileId) => {
    const [upvotesRes, downvotesRes] = await Promise.all([
      supabase
        .from('profile_votes')
        .select('id', { count: 'exact', head: true })
        .eq('profile_id', profileId)
        .eq('vote_type', 1),
      supabase
        .from('profile_votes')
        .select('id', { count: 'exact', head: true })
        .eq('profile_id', profileId)
        .eq('vote_type', -1),
    ]);

    if (upvotesRes.error || downvotesRes.error) {
      console.error('Error fetching total votes:', upvotesRes.error || downvotesRes.error);
      return { userVote: 0, totalVotes: { upvotes: 0, downvotes: 0 } };
    }

    const upvotes = upvotesRes.count ?? 0;
    const downvotes = downvotesRes.count ?? 0;

    let userVote = 0;
    if (user) {
      const { data: userVoteData, error: userVoteError } = await supabase
        .from('profile_votes')
        .select('vote_type')
        .eq('profile_id', profileId)
        .eq('voter_id', user.id)
        .maybeSingle();

      if (!userVoteError && userVoteData) {
        userVote = userVoteData.vote_type;
      }
    }

    return { userVote, totalVotes: { upvotes, downvotes } };
  };

  const getProfileByUsername = async (username) => {
    const { data, error } = await supabase
      .from('profiles_ranked_v3_enhanced')
      .select('*')
      .eq('username', username)
      .single();
    if (error) {
      console.error('Error fetching profile by username:', error);
      return null;
    }
    return data;
  };

  const createProfile = async (profileData) => {
    if (!user) throw new Error("User not authenticated");

    const payload = {
      ...cleanProfilePayload(profileData),
      user_id: user.id,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('profiles')
      .upsert(payload, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) throw error;
    await getLeaderboard('score', lastTimescaleRef.current || 'trending');
    return data;
  };

  const updateProfile = async (profileId, profileData) => {
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from('profiles')
      .update({ ...cleanProfilePayload(profileData, { allowReferral: false }), updated_at: new Date().toISOString() })
      .eq('id', profileId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;
    await getLeaderboard('score', lastTimescaleRef.current || 'trending');
    return data;
  };

  const incrementViews = async (profileId) => {
    const { data, error } = await supabase.rpc('increment_profile_view', {
      p_profile_id: profileId,
      p_viewer_id: user?.id ?? null,
    });

    if (error) {
      console.error('Error incrementing views:', error);
      return null;
    }
    // data 123 (number) veya { views: 123 } olabilir
    if (typeof data === 'number') return { views: data };
    if (data && typeof data.views === 'number') return { views: data.views };
    return null;
  };

  const incrementShares = async (profileId) => {
    const { error } = await supabase.rpc('increment_profile_share', {
      p_profile_id: profileId,
      p_sharer_id: user?.id,
    });
    if (error) console.error('Error incrementing shares:', error);
  };

  const getRelatedProfiles = (currentProfile) => {
    if (!currentProfile) return profiles.slice(0, 3);
    const currentTags = Array.isArray(currentProfile.tags) ? currentProfile.tags : [];
    if (currentTags.length === 0) {
      return profiles.filter(p => p.id !== currentProfile.id).slice(0, 3);
    }

    const related = profiles
      .filter(p => p.id !== currentProfile.id)
      .map(p => {
        const pTags = Array.isArray(p.tags) ? p.tags : [];
        const commonTags = pTags.filter(tag => currentTags.includes(tag));
        return { ...p, commonTagsCount: commonTags.length };
      })
      .filter(p => p.commonTagsCount > 0)
      .sort((a, b) => {
        if (b.commonTagsCount !== a.commonTagsCount) return b.commonTagsCount - a.commonTagsCount;
        return (b.trending_score ?? 0) - (a.trending_score ?? 0);
      });

    if (related.length < 3) {
      const otherProfiles = profiles.filter(p => p.id !== currentProfile.id && !related.some(rp => rp.id === p.id));
      return [...related, ...otherProfiles.slice(0, 3 - related.length)];
    }
    return related.slice(0, 3);
  };

  const getActiveBoostsForProfile = async (profileId) => {
    const { data, error } = await supabase.rpc('get_active_boosts', { p_profile_id: profileId });
    if (error) {
      console.error("Error fetching active boosts:", error);
      return null;
    }
    return data;
  };

  const getNotifications = async () => {
    if (!user) return [];
    
    const sevenDaysAgo = subDays(new Date(), 7).toISOString();

    const { data, error } = await supabase
      .from('activity')
      .select(`
        *,
        actor_profile:profile_id (
          name,
          username,
          avatar_url
        )
      `)
      .eq('target_user_id', user.id)
      .gte('created_at', sevenDaysAgo)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
    return data;
  };

  const markNotificationsAsRead = async (notificationIds) => {
    if (!user || notificationIds.length === 0) return false;
    const { error } = await supabase
      .from('activity')
      .update({ is_read: true })
      .in('id', notificationIds)
      .eq('target_user_id', user.id);

    if (error) {
      console.error('Error marking notifications as read:', error);
      return false;
    }
    return true;
  };

  const getProfileStats = async (profileId, options = {}) => {
    const { signal } = options ?? {};
    const { data, error } = await supabase
      .rpc('get_profile_stats', { p_profile_id: profileId }, { signal })
      .single();

    if (error) {
      if (error.name !== 'AbortError') {
        console.error('Error fetching profile stats:', error);
      }
      throw error;
    }
    return data;
  };

  const sendMessage = async (receiverUserId, content, parentCommentId = null) => {
    if (!user) throw new Error("User not authenticated");

    // 1) Mesajı ekle ve satırı döndür
    const { data: msg, error: insErr } = await supabase
      .from('messages')
      .insert({
        sender_id: user.id,            // auth users.id
        receiver_id: receiverUserId,   // hedef users.id
        content,
        parent_comment_id: parentCommentId,
      })
      .select('id, content, created_at, parent_comment_id, receiver_id, sender_id')
      .single();

    if (insErr) throw insErr;

    // 2) Yazar profilini user_id üzerinden getir
    const { data: author, error: profErr } = await supabase
      .from('profiles')
      .select('name, username, avatar_url')
      .eq('user_id', msg.sender_id)
      .maybeSingle();

    if (profErr) {
      // Profili alamazsak yine de mesajı döndür (UI fallback'lerin çalışır)
      console.warn('author profile fetch failed:', profErr);
    }

    // normalizeComment ile uyumlu alanlar
    return {
      id: msg.id,
      content: msg.content,
      created_at: msg.created_at,
      parent_comment_id: msg.parent_comment_id,
      receiver_id: msg.receiver_id,
      author_id: msg.sender_id,
      author_name: author?.name ?? 'Unknown',
      author_username: author?.username ?? '',
      author_avatar_url: author?.avatar_url ?? '',
      super_tier: 0,
    };
  };

  const getCommentsForProfile = async (profileUserId) => {
    const { data, error } = await supabase
      .from('comments_with_author')
      .select('*')
      .eq('profile_user_id', profileUserId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching comments:', error);
      return [];
    }
    return data;
  };

  // GERİ EKLENDİ: kullanıyorsun
  const getPremiumProfiles = (limit) => {
    return profiles
      .filter(p => p.is_premium || p.has_active_boost)
      .sort((a, b) => (b.trending_score ?? 0) - (a.trending_score ?? 0))
      .slice(0, limit);
  };

  // GERİ EKLENDİ: searchProfiles için yardımcı
  const applyRecencyOrdering = (qb, asc) => {
    return qb
      .order('sort_ts', { ascending: asc, nulls: 'last' })
      .order('id', { ascending: asc });
  };

  // GÜNCEL: gelişmiş filtreler + Most Generous sıralaması
  const searchProfiles = useCallback(async (filters) => {
    const {
      query,
      tags,
      sort,
      gender,
      country,
      boostedOnly,
      // Discover'dan gelen yeni filtreler
      giftsMin = 0,
      followersMin = 0,
      activeWithin = 'any', // 'any' | '7' | '30' | '90'
    } = filters ?? {};

    const table = 'profiles_ranked_v3_enhanced';
    let qb = supabase.from(table).select(`
      *,
      gifts_sent_count:user_gifts!sender_id(count)
    `);

    const safeQuery = sanitizeSearchQuery(query);

    if (safeQuery) {
      qb = qb.or(`name.ilike.%${safeQuery}%,username.ilike.%${safeQuery}%,bio.ilike.%${safeQuery}%`);
    }

    if (tags && tags.length > 0) {
      qb = qb.filter('tags', 'cs', JSON.stringify(tags));
    }

    if (gender && gender !== 'all') qb = qb.eq('gender', gender);
    if (country && country !== 'all') qb = qb.eq('country', country);
    if (boostedOnly) qb = qb.eq('has_active_boost', true);

    // Sunucu tarafı sıralama
    switch (sort) {
      case 'newest':
        qb = applyRecencyOrdering(qb, false);
        break;
      case 'oldest':
        qb = applyRecencyOrdering(qb, true);
        break;
      case 'popular':
        qb = qb
          .order('followers_count', { ascending: false, nulls: 'last' })
          .order('trending_score', { ascending: false, nulls: 'last' })
          .order('id', { ascending: false });
        break;
      case 'most_viewed':
        qb = qb
          .order('views_last_7_days', { ascending: false, nulls: 'last' })
          .order('trending_score', { ascending: false, nulls: 'last' })
          .order('id', { ascending: false });
        break;
      case 'most_generous':
        // Aggregate alias ile DB tarafında sıralama yapmıyoruz; istemci tarafında yapacağız.
        break;
      default: // 'trending'
        qb = qb
          .order('trending_score', { ascending: false, nulls: 'last' })
          .order('followers_count', { ascending: false, nulls: 'last' })
          .order('id', { ascending: false });
        break;
    }

    const { data, error } = await qb.limit(100);

    if (error) {
      console.error('Error searching profiles:', error);
      toast({
        title: "Search Error",
        description: "Could not fetch profiles. Please try again later.",
        variant: "destructive",
      });
      return [];
    }

    // Normalize aggregate
    let rows = (data ?? []).map(p => ({
      ...p,
      gifts_sent_count: p?.gifts_sent_count?.[0]?.count ?? 0
    }));

    // İstemci tarafı filtreler
    if (Number(giftsMin) > 0) {
      rows = rows.filter(p => (p.gifts_sent_count ?? 0) >= Number(giftsMin));
    }
    if (Number(followersMin) > 0) {
      rows = rows.filter(p => (p.followers_count ?? 0) >= Number(followersMin));
    }
    if (activeWithin && activeWithin !== 'any') {
      rows = rows.filter(p =>
        _isActiveWithin(
          p.last_active_at ?? p.sort_ts ?? p.updated_at,
          activeWithin
        )
      );
    }
    if (boostedOnly) {
      rows = rows.filter(p => !!p?.has_active_boost);
    }

    // İstemci tarafı "Most Generous" sıralaması
    if (sort === 'most_generous') {
      rows.sort((a, b) => {
        const ga = a?.gifts_sent_count ?? 0;
        const gb = b?.gifts_sent_count ?? 0;
        if (gb !== ga) return gb - ga;
        const fa = a?.followers_count ?? 0;
        const fb = b?.followers_count ?? 0;
        if (fb !== fa) return fb - fa;
        const ta = a?.trending_score ?? 0;
        const tb = b?.trending_score ?? 0;
        if (tb !== ta) return tb - ta;
        return String(b?.id || '').localeCompare(String(a?.id || ''));
      });
    }

    return rows;
  }, []);

  const getTopTags = useCallback(async (limit) => {
    const { data, error } = await supabase.rpc('get_popular_tags', { p_limit: limit });
    if (error) {
      console.error('Error fetching top tags:', error);
      return [];
    }
    if (Array.isArray(data)) {
      return data.map((row) => {
        if (typeof row === 'string') return { name: row, usage_count: 0 };
        return { name: row.name ?? '', usage_count: row.usage_count ?? 0 };
      });
    }
    return [];
  }, []);

  const getGifts = useCallback(async () => {
    const { data, error } = await supabase.from('gifts').select('*').order('cost', { ascending: true });
    if (error) {
      console.error('Error fetching gifts:', error);
      return [];
    }
    return data;
  }, []);

  const sendGift = useCallback(async (senderProfileId, receiverProfileId, giftId) => {
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase.rpc('send_gift', {
      p_sender_profile_id: senderProfileId,
      p_receiver_profile_id: receiverProfileId,
      p_gift_id: giftId,
    });
    if (error) throw error;

    if (data?.leveled_up) {
        toast({
            title: (
                <div className="flex items-center gap-2">
                    <PartyPopper className="h-6 w-6 text-yellow-400" />
                    <span className="font-bold">Level Up!</span>
                </div>
            ),
            description: `Congratulations! You've reached Gift Level ${data.new_level}!`,
            duration: 5000,
        });
    }
    
    // Refresh user's profile data in the auth context to reflect new level/xp
    await refreshProfile();
    await fetchCoins();

    return data;
  }, [user, refreshProfile, fetchCoins]);

  const getReceivedGifts = useCallback(async (profileId) => {
    const { data, error } = await supabase.rpc('get_received_gifts', { p_profile_id: profileId });
    if (error) {
      console.error('Error fetching received gifts:', error);
      return [];
    }
    return data;
  }, []);

  const getCloseUsers = useCallback(async (profileId) => {
    const { data: closeUsersData, error: rpcError } = await supabase.rpc('get_close_users', { p_profile_id: profileId });
    if (rpcError) {
      console.error('Error fetching close users:', rpcError);
      return [];
    }
    if (!closeUsersData || closeUsersData.length === 0) {
      return [];
    }

    const closeUserIds = closeUsersData.map(u => u.profile_id);
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles_ranked_v3_enhanced')
      .select('*')
      .in('id', closeUserIds);

    if (profilesError) {
      console.error('Error fetching profiles for close users:', profilesError);
      return [];
    }

    return closeUsersData.map(closeUser => {
      const profile = profilesData.find(p => p.id === closeUser.profile_id);
      // Ensure that even if profile data is not found, we return an object with at least the ID
      // to prevent 'Cannot read properties of null (reading 'id')' errors in the UI.
      return profile ? { ...profile, closeness_score: closeUser.closeness_score } : { id: closeUser.profile_id, closeness_score: closeUser.closeness_score, name: 'Unknown', username: 'unknown', avatar_url: '' };
    }).filter(Boolean);
  }, []);

  const checkFollowStatus = useCallback(async (targetUserId) => {
    if (!user) return { is_following: false, is_followed_by: false };

    const { data, error } = await supabase.rpc('check_follow_status', {
      p_target_user_id: targetUserId,
    });

    if (error) {
      console.error('Error checking follow status:', error);
      return { is_following: false, is_followed_by: false };
    }

    const row = (Array.isArray(data) ? data[0] : data) || {};
    return {
      is_following: row.is_following ?? row.isFollowing ?? false,
      is_followed_by: row.is_followed_by ?? row.isFollowedBy ?? false,
    };
  }, [user]);

  const followUser = useCallback(async (targetUserId) => {
    if (!user) throw new Error("User not authenticated");
    const { error } = await supabase.rpc('follow_user', { p_following_id: targetUserId });
    if (error) throw error;
  }, [user]);

  const unfollowUser = useCallback(async (targetUserId) => {
    if (!user) throw new Error("User not authenticated");
    const { error } = await supabase.rpc('unfollow_user', { p_following_id: targetUserId });
    if (error) throw error;
  }, [user]);

  const getFollowing = useCallback(async (userId) => {
    const { data, error } = await supabase.rpc('get_following', { p_user_id: userId });
    if (error) {
      console.error('Error fetching following list:', error);
      return [];
    }
    return data;
  }, []);

  const getFollowers = useCallback(async (userId) => {
    const { data, error } = await supabase.rpc('get_followers', { p_user_id: userId });
    if (error) {
      console.error('Error fetching followers list:', error);
      return [];
    }
    return data;
  }, []);

  const getFollowCounts = useCallback(async (userId) => {
    const { data, error } = await supabase
      .from('follow_counts')
      .select('following_count, followers_count')
      .eq('user_id', userId)
      .single();
    if (error) {
      console.error('Error fetching follow counts:', error);
      return { following: 0, followers: 0 };
    }
    return {
      following: data?.following_count || 0,
      followers: data?.followers_count || 0,
    };
  }, []);

  const getEvents = useCallback(async () => {
    const { data: eventsData, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .eq('is_active', true)
      .order('end_date', { ascending: true });

    if (eventsError) {
      console.error('Error fetching events:', eventsError);
      return { activeEvents: [], userEvents: [] };
    }

    let userEventsData = [];
    if (user) {
      const { data, error: userEventsError } = await supabase
        .from('user_events')
        .select('*')
        .eq('user_id', user.id);

      if (userEventsError) {
        console.error('Error fetching user events:', userEventsError);
      } else {
        userEventsData = data || [];
      }
    }

    return { activeEvents: eventsData || [], userEvents: userEventsData };
  }, [user]);

  const requestHalloweenParticipation = useCallback(async () => {
    if (!user) throw new Error("User not authenticated");
    const { error } = await supabase.rpc('request_halloween_participation', { p_user_id: user.id });
    if (error) throw error;
  }, [user]);

  const getEarnedBadges = useCallback(async (userId) => {
    const { data, error } = await supabase
      .from('user_badges')
      .select('*, badge:badges(*)')
      .eq('user_id', userId);
    if (error) {
      console.error('Error fetching earned badges:', error);
      return [];
    }
    return (data || []).map(ub => ub.badge);
  }, []);

  const reportProfile = useCallback(async (reportedUserId, reason) => {
    if (!user) throw new Error("User not authenticated");
    if (!reportedUserId || !reason) throw new Error("Reported user and reason are required.");

    const { error } = await supabase.from('reports').insert({
      reporter_user_id: user.id,
      reported_user_id: reportedUserId,
      reason: reason,
    });

    if (error) throw error;
  }, [user]);

    const getProfileInteractionsTimeseries = useCallback(async (profileId, days = 30) => {
        if (!profileId) return [];
        const { data, error } = await supabase.rpc('get_profile_interactions_timeseries', {
            p_profile_id: profileId,
            p_days: days,
        });

        if (error) {
            console.error('Error fetching interactions timeseries:', error);
            return [];
        }
        return data;
    }, []);

  const value = {
    profiles,
    leaderboardProfiles,
    tags,
    loading,
    coins,
    fetchCoins,
    fetchProfiles: fetchInitialData,
    handleVote,
    getProfileVotes,
    getProfileByUsername,
    createProfile,
    updateProfile,
    incrementViews,
    incrementShares,
    getRelatedProfiles,
    getActiveBoostsForProfile,
    getNotifications,
    markNotificationsAsRead,
    getProfileStats,
    sendMessage,
    getCommentsForProfile,
    getPremiumProfiles,
    searchProfiles,
    getTopTags,
    getGifts,
    sendGift,
    getReceivedGifts,
    getCloseUsers,
    checkFollowStatus,
    followUser,
unfollowUser,
    getFollowing,
    getFollowers,
    getFollowCounts,
    getEvents,
    requestHalloweenParticipation,
    getEarnedBadges,
    getLeaderboard,
    reportProfile,
    getProfileInteractionsTimeseries,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};
