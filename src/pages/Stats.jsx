import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Seo from '@/components/Seo';
import { motion } from 'framer-motion';
import { useData } from '@/contexts/DataContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, Trophy, Eye, BarChart, MessageSquare, ThumbsUp, Clock, Loader2, Smile, PieChart as PieIcon } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/customSupabaseClient';
import { format, parseISO } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const nf = new Intl.NumberFormat('en-US', { notation: 'compact' });

const VIBE_COLORS = {
  energetic: '#FF6B6B', zen: '#4ECDC4', creative: '#FFE66D', social: '#A8E6CF',
  focused: '#6C5CE7', melancholic: '#95A5A6', chaotic: '#FD79A8', drained: '#B8B8D1', default: '#9E9E9E'
};

const VIBE_EMOJIS = {
  energetic: '🔥', zen: '🧘', creative: '💡', social: '💬',
  focused: '📚', melancholic: '🌧️', chaotic: '🎭', drained: '😴', default: '🤔'
};

const StatsCard = ({ title, value, icon, description, gradient }) => {
    const displayValue = Number.isFinite(value) ? nf.format(value) : value;
    return (
        <Card className={`bg-muted/30 border-border/50 backdrop-blur-lg flex flex-col ${gradient ? `bg-gradient-to-br ${gradient} text-primary-foreground` : ''}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                {icon}
            </CardHeader>
            <CardContent className="flex-grow">
                <div className={`text-4xl font-bold ${!gradient && 'gradient-text'}`}>{value !== null && value !== undefined ? displayValue : <Skeleton className="h-10 w-20 bg-muted-foreground/20" />}</div>
                {description && <p className="text-xs opacity-80">{description}</p>}
            </CardContent>
        </Card>
    );
};

const InteractionsChart = ({ data, loading }) => (
    <Card className="col-span-1 lg:col-span-2 bg-muted/30 border-border/50 backdrop-blur-lg">
        <CardHeader>
            <CardTitle>Interactions (Last 30 Days)</CardTitle>
            <CardDescription>Views and Upvotes trend on your profile.</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
            {loading ? <Skeleton className="w-full h-full" /> : (
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(str) => format(parseISO(str), 'MMM d')} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <RechartsTooltip
                            contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                            labelFormatter={(label) => format(parseISO(label), 'PPP')}
                        />
                        <Line type="monotone" dataKey="views" stroke="hsl(var(--primary))" strokeWidth={2} name="Views" dot={false} />
                        <Line type="monotone" dataKey="upvotes" stroke="hsl(var(--accent-foreground))" strokeWidth={2} name="Upvotes" dot={false} />
                    </LineChart>
                </ResponsiveContainer>
            )}
        </CardContent>
    </Card>
);

const VibeSummaryCard = ({ vibeData, loading }) => {
    const vibeDistribution = useMemo(() => {
        if (!vibeData || vibeData.length === 0) return [];
        const counts = vibeData.reduce((acc, v) => {
          acc[v.vibe] = (acc[v.vibe] || 0) + 1;
          return acc;
        }, {});
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
      }, [vibeData]);
    
    const mostFrequentVibe = useMemo(() => {
        if (vibeDistribution.length === 0) return null;
        return vibeDistribution.reduce((max, mood) => (mood.value > max.value ? mood : max), vibeDistribution[0]);
    }, [vibeDistribution]);

    if(loading) return <Skeleton className="h-full w-full col-span-1" />
    if(vibeData.length < 3) return (
        <Card className="col-span-1 flex flex-col items-center justify-center text-center p-6 bg-muted/30">
            <Smile className="h-8 w-8 text-muted-foreground mb-4"/>
            <CardTitle>Vibe Summary</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">Check in your vibe for a few more days to see your summary here!</p>
            <Button asChild variant="link" className="mt-2">
                <Link to="/vibe-history">Go to Vibe History</Link>
            </Button>
        </Card>
    );

    return (
         <Card className="col-span-1 lg:col-span-1 bg-muted/30 border-border/50 backdrop-blur-lg">
            <CardHeader>
                <CardTitle>Vibe Summary</CardTitle>
                <CardDescription>Your emotional patterns at a glance.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-40">
                     <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={vibeDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} fill="#8884d8">
                                {vibeDistribution.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={VIBE_COLORS[entry.name] || VIBE_COLORS.default} />
                                ))}
                            </Pie>
                            <RechartsTooltip formatter={(value, name) => [`${value} days`, name]} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                {mostFrequentVibe && (
                    <div className="text-center mt-4">
                        <p className="text-sm text-muted-foreground">Your most frequent vibe is</p>
                        <p className="text-xl font-bold capitalize flex items-center justify-center gap-2">
                             <span className="text-2xl">{VIBE_EMOJIS[mostFrequentVibe.name]}</span>
                            {mostFrequentVibe.name}
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

const StatsSkeleton = () => (
    <div className="space-y-12">
        <div>
            <Skeleton className="h-7 w-48 mb-6" />
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <Card key={i} className="bg-muted/30"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-6 w-6 rounded-full" /></CardHeader><CardContent><Skeleton className="h-10 w-20 mb-2" /><Skeleton className="h-3 w-40" /></CardContent></Card>
                ))}
            </div>
        </div>
        <div>
            <Skeleton className="h-7 w-48 mb-6" />
            <div className="grid gap-6 lg:grid-cols-3">
                <Skeleton className="h-96 lg:col-span-2" />
                <Skeleton className="h-96 lg:col-span-1" />
            </div>
        </div>
    </div>
);


const Stats = () => {
    const { user, profile: currentUserProfile, loading: authLoading } = useAuth();
    const { getProfileStats, getProfileInteractionsTimeseries } = useData();
    const [stats, setStats] = useState(null);
    const [interactions, setInteractions] = useState([]);
    const [vibeData, setVibeData] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async (profileId, signal) => {
        if (!profileId) {
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            const [profileStats, interactionsData, userVibes] = await Promise.all([
                getProfileStats(profileId, { signal }),
                getProfileInteractionsTimeseries(profileId, 30),
                supabase.from('vibe_history').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(30)
            ]);
            
            if (!signal.aborted) {
                setStats(profileStats);
                setInteractions(interactionsData);
                setVibeData(userVibes.data || []);
            }
        } catch (e) {
            if (e.name !== 'AbortError') console.error(e);
        } finally {
            if (!signal.aborted) setLoading(false);
        }
    }, [getProfileStats, getProfileInteractionsTimeseries, user]);

    useEffect(() => {
        if (authLoading || !currentUserProfile?.id || !user?.id) {
            if (!authLoading) setLoading(false);
            return;
        }
        
        const controller = new AbortController();
        fetchData(currentUserProfile.id, controller.signal);

        return () => controller.abort();
    }, [currentUserProfile?.id, user?.id, authLoading, fetchData]);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 },
    };
    
    if (authLoading) {
        return (
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center flex justify-center items-center min-h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }
    
    if (!user) {
        return (
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
                <h1 className="text-2xl font-bold mb-4">View Statistics</h1>
                <p className="text-muted-foreground mb-6">Please log in or create an account to see your profile statistics.</p>
                <Button asChild>
                    <Link to="/auth">Log In</Link>
                </Button>
            </div>
        )
    }
    
    if (user && !currentUserProfile && !authLoading) {
        return (
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
                <h1 className="text-2xl font-bold mb-4">No Profile Found</h1>
                <p className="text-muted-foreground mb-6">You must create a profile first to see your statistics.</p>
                <Button asChild>
                    <Link to="/create">Create Profile</Link>
                </Button>
            </div>
        )
    }

    const safeRank = Number.isFinite(stats?.rank) ? `#${stats.rank}` : '—';
    const uv24 = Number.isFinite(stats?.upvotes_24h) ? stats.upvotes_24h : 0;
    const cm24 = Number.isFinite(stats?.comments_24h) ? stats.comments_24h : 0;

    return (
        <>
            <Seo
                title="Profile Statistics"
                description="Track your profile performance, score, and community engagement."
                noindex
            />
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <motion.div initial="hidden" animate="visible" variants={containerVariants} className="space-y-12">
                    <motion.div variants={itemVariants}>
                        <h1 className="text-3xl font-bold tracking-tight">Profile Statistics</h1>
                        <p className="text-muted-foreground">An overview of your performance.</p>
                    </motion.div>

                    {loading ? <StatsSkeleton /> : (
                        <>
                            <motion.div variants={containerVariants}>
                                <motion.h2 variants={itemVariants} className="text-2xl font-semibold tracking-tight mb-6">Performance Snapshot</motion.h2>
                                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                                    <motion.div variants={itemVariants}><StatsCard title="Overall Rank" value={safeRank} icon={<Trophy className="h-5 w-5 text-muted-foreground" />} description="Your position in overall ranking" /></motion.div>
                                    <motion.div variants={itemVariants}><StatsCard title="Total Score" value={currentUserProfile?.score ?? 0} icon={<BarChart className="h-5 w-5 text-muted-foreground" />} description="All-time engagement score" /></motion.div>
                                    <motion.div variants={itemVariants}><StatsCard title="Upvotes (24h)" value={uv24} icon={<ThumbsUp className="h-5 w-5 text-muted-foreground" />} description="Recent upvotes" /></motion.div>
                                    <motion.div variants={itemVariants}><StatsCard title="Comments (24h)" value={cm24} icon={<MessageSquare className="h-5 w-5 text-muted-foreground" />} description="Recent comments" /></motion.div>
                                </div>
                            </motion.div>
                            <motion.div variants={containerVariants}>
                                <motion.h2 variants={itemVariants} className="text-2xl font-semibold tracking-tight mb-6 flex items-center gap-2">Insights</motion.h2>
                                <div className="grid gap-6 lg:grid-cols-3">
                                    <motion.div variants={itemVariants} className="lg:col-span-2">
                                        <InteractionsChart data={interactions} loading={loading} />
                                    </motion.div>
                                    <motion.div variants={itemVariants} className="lg:col-span-1">
                                        <VibeSummaryCard vibeData={vibeData} loading={loading} />
                                    </motion.div>
                                </div>
                            </motion.div>
                            <motion.div variants={itemVariants}>
                                <Card className="bg-gradient-to-br from-primary/80 to-purple-600/80 text-primary-foreground">
                                    <CardHeader>
                                        <CardTitle>Ready to Boost Your Visibility?</CardTitle>
                                        <CardDescription className="text-primary-foreground/80">Promote your profile to reach a wider audience and climb the ranks faster!</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Button asChild variant="secondary" size="lg">
                                            <Link to="/promote">
                                                <TrendingUp className="mr-2 h-5 w-5" />
                                                Promote Now
                                            </Link>
                                        </Button>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </>
                    )}
                </motion.div>
            </div>
        </>
    );
};

export default Stats;
