import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { format, parseISO, differenceInDays } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, TrendingUp, TrendingDown, AlertTriangle, Sparkles } from 'lucide-react';

const POSITIVE_VIBES = ['energetic', 'zen', 'creative', 'social', 'focused'];

const VibeInsights = ({ vibeData }) => {
  const sortedVibes = useMemo(() => 
    [...vibeData].sort((a, b) => new Date(a.date) - new Date(b.date)), 
  [vibeData]);

  const insights = useMemo(() => {
    if (sortedVibes.length < 3) return [];

    const newInsights = [];

    // Most frequent mood on a specific day of the week
    const dayOfWeekCounts = sortedVibes.reduce((acc, v) => {
      const day = format(parseISO(v.date), 'EEEE');
      if (!acc[day]) acc[day] = {};
      acc[day][v.vibe] = (acc[day][v.vibe] || 0) + 1;
      return acc;
    }, {});

    for (const day in dayOfWeekCounts) {
      const mostFrequent = Object.entries(dayOfWeekCounts[day]).reduce((a, b) => b[1] > a[1] ? b : a);
      if (mostFrequent[1] > 2) { // At least 3 occurrences
        newInsights.push({
          icon: Award,
          color: 'text-yellow-400',
          title: `Your ${day} Vibe`,
          text: `You often feel ${mostFrequent[0]} on ${day}s! 🎉`,
        });
      }
    }

    // Current streak
    let currentStreak = 0;
    if (sortedVibes.length > 0) {
      const today = new Date();
      let lastDate = today;
      for (let i = sortedVibes.length - 1; i >= 0; i--) {
        const vibeDate = parseISO(sortedVibes[i].date);
        if (differenceInDays(lastDate, vibeDate) <= 1) {
          currentStreak++;
          lastDate = vibeDate;
        } else {
          break;
        }
      }
    }
    if (currentStreak > 2) {
      newInsights.push({
        icon: TrendingUp,
        color: 'text-green-400',
        title: 'Consistency is Key',
        text: `You've been consistent for ${currentStreak} days! Keep it up! 🔥`,
      });
    }

    // Longest positive streak
    let longestPositiveStreak = 0;
    let currentPositiveStreak = 0;
    for (const vibe of sortedVibes) {
      if (POSITIVE_VIBES.includes(vibe.vibe)) {
        currentPositiveStreak++;
      } else {
        longestPositiveStreak = Math.max(longestPositiveStreak, currentPositiveStreak);
        currentPositiveStreak = 0;
      }
    }
    longestPositiveStreak = Math.max(longestPositiveStreak, currentPositiveStreak);
    if (longestPositiveStreak > 3) {
      newInsights.push({
        icon: Sparkles,
        color: 'text-pink-400',
        title: 'Positive Streak!',
        text: `Your longest positive mood streak was ${longestPositiveStreak} days!`,
      });
    }

    // Drained warning
    let drainedStreak = 0;
    for (let i = sortedVibes.length - 1; i >= 0; i--) {
      if (sortedVibes[i].vibe === 'drained') {
        drainedStreak++;
      } else {
        break;
      }
    }
    if (drainedStreak >= 3) {
      newInsights.push({
        icon: AlertTriangle,
        color: 'text-blue-400',
        title: 'Take Care',
        text: `You've felt drained for ${drainedStreak} days straight. Remember to rest! 💙`,
      });
    }

    // Lowest energy day
    const dayEnergy = {};
    sortedVibes.forEach(v => {
        const day = format(parseISO(v.date), 'EEEE');
        if(!dayEnergy[day]) dayEnergy[day] = { total: 0, count: 0 };
        dayEnergy[day].total += v.intensity;
        dayEnergy[day].count++;
    });
    const avgDayEnergy = Object.entries(dayEnergy).map(([day, {total, count}]) => ({ day, avg: total/count }));
    if(avgDayEnergy.length > 2) {
        const lowestDay = avgDayEnergy.reduce((min, day) => day.avg < min.avg ? day : min);
        newInsights.push({
            icon: TrendingDown,
            color: 'text-red-400',
            title: 'Energy Pattern',
            text: `${lowestDay.day}s tend to be your lowest energy day.`,
        });
    }

    return newInsights.slice(0, 4); // Limit to 4 insights
  }, [sortedVibes]);

  if (vibeData.length < 3) {
    return (
      <div className="text-center py-16">
        <h3 className="text-xl font-semibold">Not Enough Data for Insights</h3>
        <p className="text-muted-foreground mt-2">Keep checking in daily to unlock your personal vibe patterns!</p>
      </div>
    );
  }

  return (
    <motion.div 
      className="grid grid-cols-1 md:grid-cols-2 gap-6"
      initial="hidden"
      animate="visible"
      variants={{
        visible: {
          transition: {
            staggerChildren: 0.1
          }
        }
      }}
    >
      {insights.map((insight, index) => (
        <motion.div
          key={index}
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 }
          }}
        >
          <Card className="h-full bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center gap-4 space-y-0">
              <insight.icon className={`w-8 h-8 ${insight.color}`} />
              <CardTitle>{insight.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg text-foreground">{insight.text}</p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
};

export default VibeInsights;