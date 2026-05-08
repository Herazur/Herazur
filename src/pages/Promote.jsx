import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Seo from '@/components/Seo';
import { motion } from 'framer-motion';
import {
  Star, Zap, Crown, Check, PartyPopper, Gem, Loader2, Settings, ArrowRight
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useData } from '@/contexts/DataContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { Skeleton } from '@/components/ui/skeleton';

import { formatDistanceToNow } from 'date-fns';
import { enUS } from 'date-fns/locale';

/* --------------------------------- Utils -------------------------------- */
const cn = (...classes) => classes.filter(Boolean).join(' ');

const getPriceKey = (plan) => {
  const id = (plan.id || '').toLowerCase();
  if (id.includes('quick')) return 'quick_boost';
  if (id.includes('monthly') || id.includes('spotlight')) return 'monthly_spotlight';
  if (id.includes('ultimate') || id.includes('presence')) return 'ultimate_presence';
  return '';
};

const isSubscriptionPlan = (planId) => {
  const id = String(planId || '').toLowerCase();
  return id.includes('spotlight') || id.includes('presence');
};

/* ----------------------------- Helpers & UI ----------------------------- */
const Countdown = React.memo(({ to }) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!to) return;
    const tick = () => {
      const distance = formatDistanceToNow(new Date(to), { addSuffix: true, locale: enUS });
      setTimeLeft(distance.replace('about ', ''));
    };
    tick();
    const timer = setInterval(tick, 60_000);
    return () => clearInterval(timer);
  }, [to]);

  return <span className="font-semibold">{timeLeft}</span>;
});

const PlanCardSkeleton = React.memo(() => (
  <Card className="w-full flex flex-col">
    <CardHeader className="text-center pb-4">
      <Skeleton className="w-16 h-16 rounded-full mx-auto mb-4" />
      <Skeleton className="h-7 w-3/4 mx-auto mb-2" />
      <Skeleton className="h-8 w-1/2 mx-auto mb-1" />
      <Skeleton className="h-4 w-1/3 mx-auto" />
    </CardHeader>
    <CardContent className="pt-0 flex flex-col flex-grow">
      <div className="space-y-3 mb-6 flex-grow">
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-5/6" />
      </div>
      <Skeleton className="h-10 w-full" />
    </CardContent>
  </Card>
));

/* ------------------------------ Static Data ----------------------------- */
const coinPacks = [
  {
    id: 'starter_pack',
    name: 'Spark Pack',
    description: 'Kickstart your journey with a pocket of coins for boosts & gifts.',
    price: '$3.99',
    coins: 100,
    bonus: 0,
    image: 'https://horizons-cdn.hostinger.com/5282b176-8f74-4659-a4e9-aade9fc3d869/db0b534cdd60c7afb2e3351e2ed01097.png',
  },
  {
    id: 'adventurer_pack',
    name: 'Hero Pack',
    description: 'A bigger pouch packed with extra coins to boost your profile faster.',
    price: '$12.99',
    coins: 400,
    bonus: 50,
    bonusText: '12% bonus',
    isPopular: true,
    image: 'https://horizons-cdn.hostinger.com/5282b176-8f74-4659-a4e9-aade9fc3d869/b9d2fd02f96d5a8e0cf767d2cd0d4d88.png',
  },
  {
    id: 'legendary_pack',
    name: 'Mythic Chest',
    description: 'Unlock legendary power with a massive coin chest and bonus rewards.',
    price: '$39.99',
    coins: 1500,
    bonus: 300,
    bonusText: '20% bonus',
    image: 'https://horizons-cdn.hostinger.com/5282b176-8f74-4659-a4e9-aade9fc3d869/6ac779c46e5f71d93141cc3ef0699336.png',
  },
];

const priceForKey = {
  quick_boost: '$6.99 USD',
  monthly_spotlight: '$24.99 USD / month',
  ultimate_presence: '$69.99 USD / 3 months',
};

const planFeatures = {
  quick_boost: [
    'Ability to upload Animated GIF Avatar & Banner',
    'Exclusive Premium Badge ⚡️ on your profile',
  ],
  monthly_spotlight: [
    'Ability to upload Animated GIF Avatar & Banner',
    'Exclusive Premium Badge ⚡️ on your profile',
    '1.5x Score Multiplier on all your interactions',
    'Golden username and profile card frame',
    'Golden gradient tagline'
  ],
  ultimate_presence: [
    'Ability to upload Animated GIF Avatar & Banner',
    'Exclusive Premium Badge ⚡️ on your profile',
    '1.5x Score Multiplier on all your interactions',
    'Golden username and profile card frame',
    'Golden gradient tagline',
    '👑 VIP priority in rankings',
  ],
};

/* ----------------------- Crystal Coins explainer ----------------------- */
const CrystalCoinsInfo = React.memo(() => (
  <div className="max-w-3xl mx-auto text-center mb-10">
    <h2 className="text-2xl sm:text-3xl font-bold mb-3">
      Crystal Coins 💎 <span className="gradient-text">Gift & Connect</span>
    </h2>
    <p className="text-white/70 text-sm sm:text-base">
      Crystal Coins are Herazur’s in-app currency. Use them to purchase gifts 🎁 and send them to other users.
      Gifting is the easiest way to show appreciation, break the ice, and{' '}
      <span className="font-semibold">build real connections</span>.
    </p>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
      <div className="rounded-xl border border-border/50 bg-card/60 p-4">
        <p className="text-sm font-semibold mb-1">1) Buy Coins</p>
        <p className="text-xs text-white/70">Choose a pack and top up your balance.</p>
      </div>
      <div className="rounded-xl border border-border/50 bg-card/60 p-4">
        <p className="text-sm font-semibold mb-1">2) Pick a Gift</p>
        <p className="text-xs text-white/70">Select from fun and unique gift options.</p>
      </div>
      <div className="rounded-xl border border-border/50 bg-card/60 p-4">
        <p className="text-sm font-semibold mb-1">3) Send & Engage</p>
        <p className="text-xs text-white/70">Your gift is delivered instantly with a notification.</p>
      </div>
    </div>
    <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-border/50 bg-card/60 px-4 py-2">
      <span className="text-sm">Tip:</span>
      <span className="text-sm text-white/80">
        The more gifts you send, the more visible and discoverable your profile becomes.
      </span>
    </div>
  </div>
));

/* --------------------------------- Page --------------------------------- */
const Promote = () => {
  const { user, profile: currentUserProfile, loading: authLoading } = useAuth();
  const { coins } = useData();
  const navigate = useNavigate();

  const [plans, setPlans] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(null);

  // memo helpers
  const getPlanIcon = useCallback((planId) => {
    const id = planId.toLowerCase();
    if (id.includes('ultimate')) return Crown;
    if (id.includes('monthly') || id.includes('spotlight')) return Star;
    return Zap;
  }, []);

  const getPlanColor = useCallback((planId) => {
    const id = planId.toLowerCase();
    if (id.includes('quick')) return 'from-blue-500 to-indigo-400';
    if (id.includes('monthly') || id.includes('spotlight')) return 'from-purple-500 to-pink-400';
    if (id.includes('ultimate') || id.includes('presence')) return 'from-yellow-400 to-amber-500';
    return 'from-sky-500 to-indigo-500';
  }, []);

  // load data
  const fetchData = useCallback(async () => {
    try {
      setPageLoading(true);
      const plansPromise = supabase
        .from('boost_types')
        .select('*')
        .order('multiplier', { ascending: true });

      const subsPromise = currentUserProfile?.id
        ? supabase
          .from('subscriptions')
          .select('*')
          .in('status', ['active', 'trialing'])
          .eq('profile_id', currentUserProfile.id)
        : Promise.resolve({ data: [], error: null });

      const [{ data: boostData, error: boostError }, { data: subsData, error: subsError }] =
        await Promise.all([plansPromise, subsPromise]);

      if (boostError) {
        console.error('Error fetching boost plans:', boostError);
        toast({ title: 'Failed to load plans', variant: 'destructive' });
        setPlans([]);
      } else {
        const filtered = (boostData || []).filter(
          (p) => String(p.id || '').toLowerCase() !== 'premium_monthly'
        );
        setPlans(filtered);
      }

      if (subsError) {
        console.error('Error fetching subscriptions:', subsError);
      }
      setSubscriptions(subsData || []);
    } finally {
      setPageLoading(false);
    }
  }, [currentUserProfile?.id]);

  useEffect(() => {
    if (!authLoading) void fetchData();
  }, [authLoading, fetchData]);

  // actions
  // Promote.jsx dosyasında handleSelectPlan fonksiyonunu güncelleyin:

	const handleSelectPlan = useCallback(
		async (plan, isCoin = false) => {
			if (!user) {
				toast({ title: 'Authentication Required', variant: 'destructive' });
				navigate('/auth');
				return;
			}

			// KRİTİK DÜZELTME: Coin satın alırken de profile ID gerekiyor
			if (!currentUserProfile) {
				toast({ title: 'Profile Not Found', variant: 'destructive' });
				navigate('/create');
				return;
			}

				if (!isCoin && !plan.stripe_price_id) {
				toast({
					title: "🚧 This option isn't wired to Stripe yet. Tell me and I'll hook it up next!",
				});
				return;
			}

				setCheckoutLoading(plan.id);

				try {
					const payload = {
						planId: plan.id,
						profileId: currentUserProfile.id,
						purchaseType: isCoin ? 'coin_pack' : 'boost',
					};

					const { data, error } = await supabase.functions.invoke('create-checkout-session', {
						body: payload,
					});

				if (error) {
					console.error('Supabase function error:', error);
					throw new Error(error.message || 'Function invocation failed');
				}

				if (data?.error) {
					console.error('Function returned error:', data.error);
					throw new Error(data.error);
				}

					if (!data?.checkoutUrl) {
						console.error('No checkout URL received:', data);
						throw new Error('Checkout URL not received from server.');
					}

					window.location.href = data.checkoutUrl;
			} catch (err) {
				console.error('Checkout Error Details:', err);
				toast({
					title: 'Checkout Error',
					description: err?.message || 'Failed to initiate checkout. Please try again.',
					variant: 'destructive',
				});
				setCheckoutLoading(null);
			}
		},
		[user, currentUserProfile, navigate]
	);

  const handleManageBilling = useCallback(async () => {
    setCheckoutLoading('portal');
    try {
      const { data, error } = await supabase.functions.invoke('create-portal-session');
      if (error) throw error;
      if (!data?.url) throw new Error('Could not retrieve billing portal URL.');
      window.location.href = data.url;
    } catch (err) {
      toast({ title: 'Error', description: err?.message, variant: 'destructive' });
      setCheckoutLoading(null);
    }
  }, []);

  const recommendedPlan = useMemo(() => {
    if (!plans.length) return null;
    return plans.find((p) => String(p.id).toLowerCase().includes('monthly')) || plans[0];
  }, [plans]);

  /* --------------------------------- Render -------------------------------- */
  return (
    <>
      <Seo
        title="Promote Your Profile"
        description="Increase your visibility and get discovered by more people with our promotion plans."
        noindex
      />

      {/* Background */}
      <div className="relative min-h-screen overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-indigo-950 via-purple-950 to-black" />
        <div className="pointer-events-none absolute -top-24 left-1/2 h-[540px] w-[540px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(168,85,247,0.35),transparent_60%)] blur-3xl" />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-6 py-3 backdrop-blur-md shadow-lg shadow-purple-500/10 mb-6">
              <motion.span
                aria-hidden
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="inline-flex"
              >
                <Gem className="h-5 w-5 text-cyan-400" />
              </motion.span>
              <span className="text-sm font-medium text-white/80">Balance</span>
              <span className="text-base font-bold text-cyan-400">
                {Number(coins || 0).toLocaleString()} Crystal Coins
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-3">
              <span className="bg-gradient-to-r from-cyan-300 via-fuchsia-300 to-amber-200 bg-clip-text text-transparent">
                Increase Your
              </span>{' '}
              Visibility 🚀
            </h1>
            <p className="text-lg text-white/70 max-w-3xl mx-auto">
              Join thousands already boosting their profiles. Don’t get left behind!
            </p>
          </motion.div>

          {/* Plans */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7 mb-14">
            {pageLoading
              ? [...Array(3)].map((_, i) => <PlanCardSkeleton key={i} />)
              : plans.map((plan, index) => {
                const Icon = getPlanIcon(String(plan.id));
                const color = getPlanColor(String(plan.id));
                const idStr = String(plan.id).toLowerCase();

                const isMonthly = idStr.includes('monthly') || idStr.includes('spotlight');
                const isUltimate = idStr.includes('ultimate') || idStr.includes('presence');

                const activeSub = subscriptions.find((s) => s.plan_id === plan.id);
                const priceLabel = priceForKey[getPriceKey(plan)] ?? 'TBD';
                const subscription = isSubscriptionPlan(plan.id);

                return (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, y: 20, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.1 + index * 0.08 }}
                    className="relative"
                  >
                    {/* Badges */}
                    {!activeSub && (
                      <>
                        {isMonthly && (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                            <Badge className="rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white border-none shadow-md shadow-pink-500/30">
                              Most Popular
                            </Badge>
                          </div>
                        )}
                        {isUltimate && (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                            <Badge className="rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 text-black border-none shadow-md shadow-yellow-500/30">
                              Best Value
                            </Badge>
                          </div>
                        )}
                      </>
                    )}

                    <Card
                      className={cn(
                        'group w-full h-full flex flex-col border-white/10 bg-white/5 backdrop-blur-md hover:border-white/20 transition-all duration-300 shadow-[0_20px_60px_-20px_rgba(139,92,246,0.35)]',
                        isMonthly && 'ring-2 ring-purple-500/50'
                      )}
                    >
                      <CardHeader className="text-center pb-3 space-y-2">
                        <CardTitle className="text-2xl tracking-tight">{plan.name}</CardTitle>
                        <div
                          className={cn(
                            'mx-auto grid place-items-center rounded-2xl p-4 bg-gradient-to-br',
                            color
                          )}
                        >
                          <Icon className="h-8 w-8 text-white drop-shadow" aria-label={plan.name} />
                        </div>
                        <CardDescription className="text-white/60">for {plan.duration}</CardDescription>
                      </CardHeader>

                      <CardContent className="pt-0 flex flex-col flex-grow">
                        <ul className="space-y-2.5 mb-5 flex-grow text-sm">
                          <li className="flex items-start gap-2.5">
                            <Check className="h-5 w-5 text-emerald-400 shrink-0" />
                            <span>{plan.multiplier}x profile visibility boost</span>
                          </li>
                          <li className="flex items-start gap-2.5">
                            <Check className="h-5 w-5 text-emerald-400 shrink-0" />
                            <span>Higher ranking in search results</span>
                          </li>
                          {planFeatures[getPriceKey(plan)]?.map((text) => (
                            <li key={text} className="flex items-start gap-2.5">
                              <Check className="h-5 w-5 text-emerald-400 shrink-0" />
                              <span>{text}</span>
                            </li>
                          ))}
                        </ul>

                        <div className="text-center mb-3">
                          <p className="text-3xl font-extrabold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                            {priceLabel}
                          </p>
                        </div>

                        {activeSub ? (
                          <div className="text-center p-3 rounded-lg bg-emerald-500/15 border border-emerald-500/20">
                            <p className="font-bold text-emerald-300 flex items-center justify-center gap-2">
                              <PartyPopper className="h-5 w-5" /> Active
                            </p>
                            {activeSub.current_period_end && (
                              <p className="text-xs text-white/60 mt-1">
                                Renews <Countdown to={activeSub.current_period_end} />
                              </p>
                            )}

                            <Button
                              onClick={handleManageBilling}
                              disabled={checkoutLoading === 'portal'}
                              className="mt-2"
                              variant="outline"
                              size="sm"
                            >
                              {checkoutLoading === 'portal' ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <Settings className="mr-2 h-4 w-4" />
                              )}
                              Manage Billing
                            </Button>
                          </div>
                        ) : (
                          <Button
                            onClick={() => handleSelectPlan(plan)}
                            disabled={checkoutLoading === plan.id || !plan.stripe_price_id}
                            className={cn(
                              'w-full transition-transform group-hover:-translate-y-px',
                              isMonthly && cn('bg-gradient-to-r', color, 'text-white')
                            )}
                          >
                            {checkoutLoading === plan.id ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Redirecting...
                              </>
                            ) : (
                              <>
                                {subscription ? '👑 Go Premium' : '🚀 Boost Now'}
                                <ArrowRight className="h-4 w-4 ml-2" />
                              </>
                            )}
                          </Button>
                        )}

                        {subscription && !activeSub && (
                          <p className="text-[11px] text-white/50 text-center mt-2">
                            Auto-renews. Cancel anytime.
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
          </div>


          {/* Comparison */}
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-center mb-6">Compare Plans</h2>
            <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/5 backdrop-blur-md">
              <table className="w-full text-center text-sm">
                <thead>
                  <tr className="bg-white/5 text-white/80">
                    <th className="p-3 font-semibold">Feature</th>
                    <th className="p-3 font-semibold">Quick Boost</th>
                    <th className="p-3 font-semibold">Monthly Spotlight</th>
                    <th className="p-3 font-semibold">Ultimate Presence</th>
                  </tr>
                </thead>
                <tbody className="[&>tr:nth-child(even)]:bg-white/5">
                  <tr>
                    <td className="p-3 text-white/80">Visibility Boost</td>
                    <td className="p-3">2x</td>
                    <td className="p-3">3x</td>
                    <td className="p-3">5x</td>
                  </tr>
                  <tr>
                    <td className="p-3 text-white/80">Premium Badge</td>
                    <td className="p-3">✔</td>
                    <td className="p-3">✔</td>
                    <td className="p-3">✔</td>
                  </tr>
                  <tr>
                    <td className="p-3 text-white/80">Golden Frame & Name</td>
                    <td className="p-3">–</td>
                    <td className="p-3">✔</td>
                    <td className="p-3">✔</td>
                  </tr>
                  <tr>
                    <td className="p-3 text-white/80">VIP Priority</td>
                    <td className="p-3">–</td>
                    <td className="p-3">–</td>
                    <td className="p-3">✔</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Crystal coins explainer */}
          <CrystalCoinsInfo />

          {/* Coin packs */}
          <h2 className="text-3xl font-bold text-center mb-6">Buy Crystal Coins</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-7 mb-24">
            {coinPacks.map((pack) => (
              <Card
                key={pack.id}
                className="text-center border-white/10 bg-white/5 backdrop-blur-md hover:shadow-xl hover:shadow-cyan-500/10 hover:-translate-y-0.5 transition-all"
              >
                <CardHeader className="pb-3">
                  <img
                    src={pack.image}
                    alt={pack.name}
                    className="w-28 h-28 mx-auto mb-3 object-contain"
                    loading="lazy"
                  />
                  <CardTitle className="text-xl">{pack.name}</CardTitle>
                  <CardDescription className="text-white/60">{pack.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-extrabold text-cyan-400 mb-1">
                    {pack.coins.toLocaleString()}
                  </p>
                  {pack.bonus > 0 && (
                    <p className="text-emerald-400 font-semibold text-sm mb-2">
                      🎁 +{pack.bonus.toLocaleString()} Bonus! {pack.bonusText ? `(${pack.bonusText})` : ''}
                    </p>
                  )}

                  <Button
                    onClick={() => handleSelectPlan(pack, true)}
                    disabled={checkoutLoading === pack.id}
                    className={cn('w-full', pack.isPopular && 'bg-gradient-to-r from-purple-500 to-pink-500 text-white')}
                  >
                    {checkoutLoading === pack.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Redirecting...
                      </>
                    ) : (
                      <>{pack.price} - Buy Now</>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Sticky CTA (mobile) */}
        {!pageLoading && plans.length > 0 && recommendedPlan && (
          <div className="fixed bottom-3 left-0 right-0 z-40 px-4 md:hidden">
            {(() => {
              const best = recommendedPlan;
              const color = getPlanColor(String(best.id));
              return (
                <div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-white/10 backdrop-blur-md p-3 shadow-xl shadow-purple-500/20">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-left">
                      <p className="text-xs text-white/60">Recommended</p>
                      <p className="text-sm font-semibold">{best.name}</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleSelectPlan(best)}
                      className={cn('bg-gradient-to-r text-white', color)}
                    >
                      Boost Now
                    </Button>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </>
  );
};

export default Promote;
