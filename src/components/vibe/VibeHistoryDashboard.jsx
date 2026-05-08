import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { format, startOfWeek, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, parseISO } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { PlusCircle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const VIBE_COLORS = {
  energetic: '#FF6B6B',
  zen: '#4ECDC4',
  creative: '#FFE66D',
  social: '#A8E6CF',
  focused: '#6C5CE7',
  melancholic: '#95A5A6',
  chaotic: '#FD79A8',
  drained: '#B8B8D1',
};

const VIBE_EMOJIS = {
  energetic: '🔥', zen: '🧘', creative: '💡', social: '💬',
  focused: '📚', melancholic: '🌧️', chaotic: '🎭', drained: '😴',
};

const WeeklyCalendarView = ({ vibeData, onAddVibe }) => {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly Calendar</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2 text-center">
          {weekDays.map(day => {
            const vibe = vibeData.find(v => isSameDay(parseISO(v.date), day));
            return (
              <TooltipProvider key={day.toString()}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className="flex flex-col items-center p-2 rounded-lg border aspect-square justify-center cursor-pointer transition-colors"
                      style={{ backgroundColor: vibe ? `${VIBE_COLORS[vibe.vibe]}33` : 'transparent' }}
                      onClick={() => !vibe && onAddVibe(day)}
                    >
                      <span className="text-xs text-muted-foreground">{format(day, 'EEE')}</span>
                      <span className="text-lg font-bold">{format(day, 'd')}</span>
                      <span className="text-2xl mt-1">{vibe ? vibe.emoji : <PlusCircle className="w-6 h-6 text-muted-foreground" />}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    {vibe ? (
                      <div className="space-y-1">
                        <p className="font-bold">{format(parseISO(vibe.created_at), 'PPpp')}</p>
                        <p>Intensity: {vibe.intensity}</p>
                        {vibe.note && <p className="max-w-xs">Note: "{vibe.note}"</p>}
                      </div>
                    ) : (
                      <p>Add vibe for {format(day, 'PPP')}</p>
                    )}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

const MonthlyHeatmap = ({ vibeData, onAddVibe }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const firstDayOfMonth = monthStart.getDay();
  const startingDayIndex = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Heatmap - {format(currentMonth, 'MMMM yyyy')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
            <div key={day} className="text-xs text-center text-muted-foreground">{day}</div>
          ))}
          {Array.from({ length: startingDayIndex }).map((_, i) => <div key={`empty-${i}`} />)}
          {daysInMonth.map(day => {
            const vibe = vibeData.find(v => isSameDay(parseISO(v.date), day));
            return (
              <TooltipProvider key={day.toString()}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className="w-full aspect-square rounded-sm cursor-pointer flex items-center justify-center"
                      style={{ backgroundColor: vibe ? VIBE_COLORS[vibe.vibe] : 'hsl(var(--muted))' }}
                      onClick={() => !vibe && onAddVibe(day)}
                    >
                      {!vibe && isSameMonth(day, new Date()) && !isSameDay(day, new Date()) && day < new Date() && <PlusCircle className="w-4 h-4 text-muted-foreground/50" />}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{format(day, 'PPP')}</p>
                    {vibe && <p>Vibe: {vibe.vibe}</p>}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

const StatisticsSection = ({ vibeData }) => {
  const moodDistribution = useMemo(() => {
    if (vibeData.length === 0) return [];
    const counts = vibeData.reduce((acc, v) => {
      acc[v.vibe] = (acc[v.vibe] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [vibeData]);

  const mostFrequentMood = useMemo(() => {
    if (moodDistribution.length === 0) return null;
    return moodDistribution.reduce((max, mood) => (mood.value > max.value ? mood : max), moodDistribution[0]);
  }, [moodDistribution]);

  const trendData = useMemo(() => {
    return vibeData
      .map(v => ({ date: format(parseISO(v.date), 'MMM d'), intensity: v.intensity }))
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-30); // Last 30 entries
  }, [vibeData]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader><CardTitle>Mood Distribution</CardTitle></CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={moodDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {moodDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={VIBE_COLORS[entry.name]} />
                ))}
              </Pie>
              <RechartsTooltip formatter={(value, name) => [`${((value / vibeData.length) * 100).toFixed(0)}%`, VIBE_EMOJIS[name]]} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Mood Intensity Trend (Last 30 Days)</CardTitle></CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis domain={[0, 10]} stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <RechartsTooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} />
              <Line type="monotone" dataKey="intensity" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      {mostFrequentMood && (
        <Card className="flex flex-col items-center justify-center text-center p-6">
          <CardTitle className="mb-2">Most Frequent Mood</CardTitle>
          <Badge variant="default" className="text-lg px-4 py-2" style={{ backgroundColor: VIBE_COLORS[mostFrequentMood.name], color: '#000' }}>
            <span className="text-2xl mr-2">{VIBE_EMOJIS[mostFrequentMood.name]}</span>
            {mostFrequentMood.name}
          </Badge>
        </Card>
      )}
    </div>
  );
};

const VibeHistoryDashboard = ({ vibeData, onVibeAdded }) => {
  const handleAddVibe = (date) => {
    toast({
      title: "🚧 This feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀",
      description: "Adding vibes for past dates isn't available yet.",
    });
  };

  if (vibeData.length === 0) {
    return (
      <div className="text-center py-16">
        <h3 className="text-xl font-semibold">No Vibe History Yet</h3>
        <p className="text-muted-foreground mt-2">Start by checking in your vibe for today!</p>
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ staggerChildren: 0.1 }}
    >
      <motion.div variants={{ initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } }}>
        <WeeklyCalendarView vibeData={vibeData} onAddVibe={handleAddVibe} />
      </motion.div>
      <motion.div variants={{ initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } }}>
        <MonthlyHeatmap vibeData={vibeData} onAddVibe={handleAddVibe} />
      </motion.div>
      <motion.div variants={{ initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } }}>
        <StatisticsSection vibeData={vibeData} />
      </motion.div>
    </motion.div>
  );
};

export default VibeHistoryDashboard;