import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { Loader2, CheckCircle } from 'lucide-react';

const VIBE_OPTIONS = {
  energetic: { emoji: '🔥', text: 'Energetic', description: "I can conquer the world", color: '#FF6B6B' },
  zen: { emoji: '🧘', text: 'Zen', description: "Calm and balanced", color: '#4ECDC4' },
  creative: { emoji: '💡', text: 'Creative', description: "Ideas are flowing", color: '#FFE66D' },
  social: { emoji: '💬', text: 'Social', description: "Want to talk with people", color: '#A8E6CF' },
  focused: { emoji: '📚', text: 'Focused', description: "Deep work mode", color: '#6C5CE7' },
  melancholic: { emoji: '🌧️', text: 'Melancholic', description: "A bit withdrawn", color: '#95A5A6' },
  chaotic: { emoji: '🎭', text: 'Chaotic', description: "Everything's too fast", color: '#FD79A8' },
  drained: { emoji: '😴', text: 'Drained', description: "Battery at 5%", color: '#B8B8D1' },
};

const VibeCheckin = ({ vibeData, onVibeAdded }) => {
  const { user } = useAuth();
  const [selectedVibe, setSelectedVibe] = useState(null);
  const [intensity, setIntensity] = useState(5);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const hasCheckedInToday = useMemo(() => {
    return vibeData.some(v => v.date === today);
  }, [vibeData, today]);

  const handleVibeSelect = (vibeKey) => {
    if (hasCheckedInToday) return;
    setSelectedVibe(vibeKey);
  };

  const handleSubmit = async () => {
    if (!selectedVibe || !user) return;
    setIsSubmitting(true);

    const newVibe = {
      user_id: user.id,
      date: today,
      vibe: selectedVibe,
      emoji: VIBE_OPTIONS[selectedVibe].emoji,
      intensity,
      note,
    };

    try {
      const { data, error } = await supabase
        .from('vibe_history')
        .upsert(newVibe, { onConflict: 'user_id, date' })
        .select()
        .single();

      if (error) throw error;

      onVibeAdded(data);
      toast({
        title: 'Vibe Checked In!',
        description: `Today you're feeling ${selectedVibe}.`,
      });
      setSelectedVibe(null);
      setNote('');
      setIntensity(5);
    } catch (err) {
      console.error('Error submitting vibe:', err);
      toast({
        title: 'Error',
        description: 'Could not save your vibe. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedVibeColor = selectedVibe ? VIBE_OPTIONS[selectedVibe].color : 'hsl(var(--background))';

  return (
    <motion.div
      className="relative w-full min-h-[60vh] flex flex-col items-center justify-center p-4 overflow-hidden rounded-2xl border"
      style={{
        background: `radial-gradient(circle at center, ${selectedVibeColor}33, hsl(var(--background)) 70%)`,
        transition: 'background 0.5s ease-out',
      }}
    >
      {hasCheckedInToday ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center p-8 bg-card/50 backdrop-blur-sm rounded-2xl"
        >
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold">Already checked in today ✓</h2>
          <p className="text-muted-foreground mt-2">Come back tomorrow to log your next vibe!</p>
        </motion.div>
      ) : (
        <>
          <div className="relative w-80 h-80 sm:w-96 sm:h-96 mb-8">
            {Object.entries(VIBE_OPTIONS).map(([key, vibe], index, arr) => {
              const angle = (index / arr.length) * 2 * Math.PI;
              const radius = 140; // sm:160
              const x = Math.cos(angle) * radius;
              const y = Math.sin(angle) * radius;

              return (
                <motion.button
                  key={key}
                  onClick={() => handleVibeSelect(key)}
                  className="absolute top-1/2 left-1/2 w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center text-4xl sm:text-5xl bg-card/50 backdrop-blur-sm border transition-all duration-300"
                  style={{
                    x: '-50%',
                    y: '-50%',
                    borderColor: selectedVibe === key ? vibe.color : 'hsl(var(--border))',
                    boxShadow: selectedVibe === key ? `0 0 20px ${vibe.color}` : 'none',
                  }}
                  initial={{ transform: 'translate(-50%, -50%) scale(0)' }}
                  animate={{ transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(1)` }}
                  transition={{ type: 'spring', stiffness: 260, damping: 20, delay: index * 0.05 }}
                  whileHover={{ scale: 1.15, zIndex: 10 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {vibe.emoji}
                </motion.button>
              );
            })}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center w-40">
              <AnimatePresence mode="wait">
                {selectedVibe ? (
                  <motion.div
                    key={selectedVibe}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <p className="text-2xl font-bold" style={{ color: VIBE_OPTIONS[selectedVibe].color }}>
                      {VIBE_OPTIONS[selectedVibe].text}
                    </p>
                    <p className="text-sm text-muted-foreground">{VIBE_OPTIONS[selectedVibe].description}</p>
                  </motion.div>
                ) : (
                  <motion.p
                    key="placeholder"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-lg text-muted-foreground"
                  >
                    How are you feeling?
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </div>

          <AnimatePresence>
            {selectedVibe && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ delay: 0.2 }}
                className="w-full max-w-md"
              >
                <Card className="bg-card/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle>Add details (optional)</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <label htmlFor="intensity" className="text-sm font-medium">Intensity: {intensity}</label>
                      <Slider
                        id="intensity"
                        min={1}
                        max={10}
                        step={1}
                        value={[intensity]}
                        onValueChange={(val) => setIntensity(val[0])}
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="note" className="text-sm font-medium">Note</label>
                      <Textarea
                        id="note"
                        placeholder="Any thoughts? (max 100 chars)"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        maxLength={100}
                        className="bg-background/50"
                      />
                    </div>
                    <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full">
                      {isSubmitting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        'Save Vibe'
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </motion.div>
  );
};

export default VibeCheckin;