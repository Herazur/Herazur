import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Sun, Zap, Sparkles, CloudRain, BrainCircuit } from 'lucide-react';

const VIBE_DETAILS = {
  energetic: { emoji: '⚡️', description: "An energetic and productive day for the community!", color: "from-amber-400 to-orange-500", icon: Zap },
  zen: { emoji: '🧘', description: "A wave of calm is washing over the community.", color: "from-teal-400 to-cyan-500", icon: Sun },
  creative: { emoji: '🎨', description: "Creativity is in the air! Lots of ideas flowing.", color: "from-purple-400 to-pink-500", icon: Sparkles },
  social: { emoji: '💬', description: "It's a talkative day! The community is feeling chatty.", color: "from-blue-400 to-indigo-500", icon: Users },
  focused: { emoji: '🎯', description: "Deep work mode is activated across the platform.", color: "from-sky-400 to-blue-600", icon: BrainCircuit },
  melancholic: { emoji: '😔', description: "A bit of a quiet, introspective day for many.", color: "from-gray-400 to-slate-500", icon: CloudRain },
  default: { emoji: '🤔', description: "The community's vibe is a mix of everything today.", color: "from-slate-500 to-gray-600", icon: Zap },
};


const VibeWeather = () => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVibeWeather = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.rpc('get_vibe_weather');
        if (error) throw error;
        setWeather(data);
      } catch (error) {
        console.error("Error fetching vibe weather:", error);
        setWeather(null);
      } finally {
        setLoading(false);
      }
    };

    fetchVibeWeather();
  }, []);

  if (loading) {
    return <VibeWeatherSkeleton />;
  }

  if (!weather || weather.checkin_count < 1) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Vibe Weather</CardTitle>
          <CardDescription>The community's emotional climate report.</CardDescription>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground py-8">
          <p>Not enough data to determine the vibe weather yet. Check in with your vibe to contribute!</p>
        </CardContent>
      </Card>
    );
  }

  const dominantVibeDetails = VIBE_DETAILS[weather.dominant_vibe] || VIBE_DETAILS.default;
  const distribution = weather.distribution || [];
  const totalVotes = distribution.reduce((sum, vibe) => sum + vibe.count, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="bg-gradient-to-br from-indigo-900/20 via-black/30 to-purple-900/10 backdrop-blur-lg border border-indigo-500/20 overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            Vibe Weather
          </CardTitle>
          <CardDescription>Today's community emotional climate.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="flex flex-col items-center text-center">
            <motion.div
              className="text-8xl"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.2 }}
            >
              {dominantVibeDetails.emoji}
            </motion.div>
            <h3 className={`text-3xl font-bold capitalize mt-4 bg-clip-text text-transparent bg-gradient-to-r ${dominantVibeDetails.color}`}>
              {weather.dominant_vibe}
            </h3>
            <p className="text-muted-foreground mt-2">{dominantVibeDetails.description}</p>
             <div className="flex items-center gap-2 mt-4" title="Total Check-ins">
                <Users className="w-5 h-5 text-cyan-400" />
                <span className="font-semibold">{weather.checkin_count}</span>
                <span className="text-muted-foreground">Check-ins Today</span>
              </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4 text-center md:text-left">Vibe Distribution</h4>
            <div className="space-y-3">
              {distribution.sort((a, b) => b.count - a.count).map((vibe, index) => {
                const percentage = totalVotes > 0 ? (vibe.count / totalVotes) * 100 : 0;
                const vibeDetails = VIBE_DETAILS[vibe.vibe] || VIBE_DETAILS.default;
                const Icon = vibeDetails.icon;
                return (
                  <motion.div 
                    key={vibe.vibe}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <Icon className={`w-5 h-5 bg-clip-text text-transparent bg-gradient-to-r ${vibeDetails.color}`} />
                    <div className="flex-1">
                      <div className="flex justify-between items-baseline mb-1">
                        <span className="text-sm font-medium capitalize">{vibe.vibe}</span>
                        <span className="text-xs font-bold text-muted-foreground">{percentage.toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-muted/30 rounded-full h-2.5">
                        <motion.div
                          className={`h-2.5 rounded-full bg-gradient-to-r ${vibeDetails.color}`}
                          initial={{ width: '0%' }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 0.5, ease: "easeOut", delay: 0.5 + index * 0.1 }}
                        />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const VibeWeatherSkeleton = () => (
  <Card>
    <CardHeader>
      <Skeleton className="h-7 w-36" />
      <Skeleton className="h-4 w-48 mt-1" />
    </CardHeader>
    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="flex flex-col items-center text-center space-y-3">
            <Skeleton className="w-24 h-24 rounded-full" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-5 w-24" />
        </div>
        <div>
            <Skeleton className="h-6 w-1/2 mb-4" />
            <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                        <Skeleton className="w-5 h-5 rounded-full" />
                        <div className="flex-1 space-y-2">
                             <Skeleton className="h-2.5 w-full" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </CardContent>
  </Card>
);

export default VibeWeather;