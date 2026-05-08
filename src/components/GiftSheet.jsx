import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from '@/components/ui/use-toast';
import { Gem, Loader2, Send, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate, Link } from 'react-router-dom';

// PROPS İSİMLERİNİ DÜZELTİN: open yerine isOpen kullanın veya tam tersi
const GiftSheet = ({ isOpen, onOpenChange, receiverProfile }) => { // open yerine isOpen
  const { getGifts, sendGift, coins, fetchCoins } = useData();
  const { profile: senderProfile } = useAuth();
  const navigate = useNavigate();

  const [gifts, setGifts] = useState([]);
  const [loadingGifts, setLoadingGifts] = useState(true);
  const [sendingGiftId, setSendingGiftId] = useState(null);

  const calculateXpGain = (cost) => {
    const level = senderProfile?.gift_level || 1;
    const base_xp = cost;
    const bonus_xp = cost * (level - 1) * 0.05;
    return Math.floor(base_xp + bonus_xp);
  };

  const loadData = useCallback(async () => {
    setLoadingGifts(true);
    try {
      const data = await getGifts();
      setGifts(Array.isArray(data) ? data : []);
      await fetchCoins?.();
    } catch (e) {
      console.error(e);
      setGifts([]);
    } finally {
      setLoadingGifts(false);
    }
  }, [getGifts, fetchCoins]);

  useEffect(() => {
    if (isOpen) loadData(); // open yerine isOpen
  }, [isOpen, loadData]);

  const handleSendGift = async (gift) => {
    if (!senderProfile) {
      toast({ title: 'You must be logged in', variant: 'destructive' });
      navigate('/auth');
      return;
    }

    if (!receiverProfile) {
      toast({ title: 'Error', description: 'Receiver not found.', variant: 'destructive' });
      return;
    }

    if (senderProfile.id === receiverProfile.id) {
      toast({ title: "Oops", description: "You can't send a gift to yourself.", variant: 'destructive' });
      return;
    }

    if (coins < gift.cost) {
      toast({
        title: 'Insufficient Balance',
        description: 'You do not have enough Crystal Coins to send this gift.',
        variant: 'destructive'
      });
      return;
    }

    setSendingGiftId(gift.id);
    try {
      await sendGift(senderProfile.id, receiverProfile.id, gift.id);
      toast({
        title: 'Gift Sent!',
        description: `You sent a ${gift.name} to ${receiverProfile.name}.`
      });
      await fetchCoins?.();
    } catch (error) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to send gift.',
        variant: 'destructive'
      });
    } finally {
      setSendingGiftId(null);
    }
  };

  if (!receiverProfile) return null;

  const notEnoughCoins = (cost) => (Number(coins || 0) < Number(cost));

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}> {/* open yerine isOpen */}
      <SheetContent className="w-full sm:max-w-md p-0 bg-card/80 backdrop-blur-xl border-border/50">
        <SheetHeader className="p-6 pb-4">
          <SheetTitle className="text-2xl font-bold">Send a Gift</SheetTitle>
          <SheetDescription>
            Show your appreciation by sending a gift to {receiverProfile?.name}.
          </SheetDescription>
        </SheetHeader>

        <div className="p-6 border-t border-b border-border/50 flex justify-between items-center">
          <span className="text-muted-foreground">Your Balance:</span>
          <div className="flex items-center gap-2 font-bold text-lg" aria-live="polite">
            <Gem className="h-5 w-5 text-cyan-400" />
            <span className="text-cyan-400">{Number(coins || 0).toLocaleString()}</span>
          </div>
        </div>

        <div className="p-6 h-[calc(100%-160px)] overflow-y-auto">
          {loadingGifts ? (
            <div className="grid grid-cols-2 gap-4">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center gap-2 p-4 rounded-lg bg-muted/50 animate-pulse"
                  aria-hidden="true"
                >
                  <div className="w-20 h-20 bg-muted rounded-md" />
                  <div className="h-4 w-16 bg-muted rounded" />
                  <div className="h-4 w-12 bg-muted rounded" />
                </div>
              ))}
            </div>
          ) : gifts.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-12">
              No gifts available right now.
            </div>
          ) : (
            <motion.div
              className="grid grid-cols-2 gap-4"
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
            >
              {gifts.map((gift) => {
                const disabled = sendingGiftId === gift.id || notEnoughCoins(gift.cost);
                return (
                  <motion.div
                    key={gift.id}
                    variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                    className={cn(
                      'flex flex-col items-center gap-2 p-4 rounded-lg bg-muted/50 border border-transparent transition-all duration-300',
                      !disabled ? 'hover:bg-muted hover:border-primary/50' : 'opacity-60'
                    )}
                  >
                    <img
                      src={gift.image_url}
                      alt={gift.name || 'Gift'}
                      className="w-20 h-20 object-contain"
                      loading="lazy"
                    />
                    <p className="font-semibold text-center text-sm">{gift.name}</p>
                    <div className="flex items-center gap-1.5 text-cyan-400" aria-label={`${gift.cost} coins`}>
                      <Gem className="h-3.5 w-3.5" />
                      <span className="font-bold text-sm">{gift.cost}</span>
                    </div>
                     <div className="flex items-center gap-1.5 text-yellow-400 text-xs" aria-label={`+${calculateXpGain(gift.cost)} XP`}>
                      <Star className="h-3 w-3" />
                      <span>+{calculateXpGain(gift.cost)} XP</span>
                    </div>

                    {!notEnoughCoins(gift.cost) ? (
                      <Button
                        size="sm"
                        className="w-full mt-2"
                        onClick={() => handleSendGift(gift)}
                        disabled={disabled}
                        aria-label={`Send ${gift.name}`}
                      >
                        {sendingGiftId === gift.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    ) : (
                      <Button asChild size="sm" variant="secondary" className="w-full mt-2">
                        <Link to="/promote">Top Up Coins</Link>
                      </Button>
                    )}
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default GiftSheet;