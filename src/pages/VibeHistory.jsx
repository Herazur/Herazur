import React, { useState, useEffect, useCallback } from 'react';
import Seo from '@/components/Seo';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Smile, BarChart2, Sparkles } from 'lucide-react';
import VibeCheckin from '@/components/vibe/VibeCheckin';
import VibeHistoryDashboard from '@/components/vibe/VibeHistoryDashboard';
import VibeInsights from '@/components/vibe/VibeInsights';

const VibeHistory = () => {
  const { user } = useAuth();
  const [vibeData, setVibeData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('check-in');

  const fetchVibeHistory = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('vibe_history')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) throw error;
      setVibeData(data || []);
    } catch (err) {
      setError('Could not fetch your vibe history. Please try again later.');
      console.error('Error fetching vibe history:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchVibeHistory();
  }, [fetchVibeHistory]);

  const handleVibeAdded = (newVibe) => {
    setVibeData(prevData => {
      const existingIndex = prevData.findIndex(v => v.date === newVibe.date);
      if (existingIndex > -1) {
        const updatedData = [...prevData];
        updatedData[existingIndex] = newVibe;
        return updatedData.sort((a, b) => new Date(b.date) - new Date(a.date));
      }
      return [newVibe, ...prevData].sort((a, b) => new Date(b.date) - new Date(a.date));
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-12 w-1/3 mb-4" />
        <Skeleton className="h-10 w-full mb-8" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const motionProps = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.3 },
  };

  return (
    <>
      <Seo
        title="Vibe History"
        description="Track and visualize your daily mood and energy levels on Herazur."
        noindex
      />
      <div className="container mx-auto px-2 sm:px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2 gradient-text">Vibe History</h1>
          <p className="text-lg text-muted-foreground mb-8">Track your mood, discover your patterns.</p>
        </motion.div>

        <Tabs defaultValue="check-in" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="check-in">
              <Smile className="w-4 h-4 mr-2" />
              Check-in Today
            </TabsTrigger>
            <TabsTrigger value="history">
              <BarChart2 className="w-4 h-4 mr-2" />
              History
            </TabsTrigger>
            <TabsTrigger value="insights">
              <Sparkles className="w-4 h-4 mr-2" />
              Insights
            </TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            <motion.div key={activeTab} {...motionProps}>
              <TabsContent value="check-in" forceMount={activeTab === 'check-in'}>
                <VibeCheckin vibeData={vibeData} onVibeAdded={handleVibeAdded} />
              </TabsContent>
              <TabsContent value="history" forceMount={activeTab === 'history'}>
                <VibeHistoryDashboard vibeData={vibeData} onVibeAdded={handleVibeAdded} />
              </TabsContent>
              <TabsContent value="insights" forceMount={activeTab === 'insights'}>
                <VibeInsights vibeData={vibeData} />
              </TabsContent>
            </motion.div>
          </AnimatePresence>
        </Tabs>
      </div>
    </>
  );
};

export default VibeHistory;
