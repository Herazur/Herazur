import React, { useMemo, useState, useEffect } from 'react';
import Seo from '@/components/Seo';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarDays, Gift, Heart, Flower, Sun, Sparkles, Clipboard, Check } from 'lucide-react';

// ---------- small utility ----------
const cn = (...args) => args.filter(Boolean).join(' ');
const SITE_URL = import.meta.env.VITE_PUBLIC_SITE_URL || import.meta.env.VITE_SITE_URL || window.location.origin;

// ---------- event helpers ----------
const buildEvent = ({ key, title, start, end, overview, task, reward, extra, requirements = [], steps = [], proof, prizes = [], icon, gradient }) => ({
  key,
  title,
  start: new Date(start),
  end: new Date(end),
  overview,
  task,
  reward,
  extra,
  requirements,
  steps,
  proof,
  prizes,
  icon,
  gradient,
});

const eventsData = [
  buildEvent({
    key: 'halloween-2025',
    title: '🎃 Herazur Halloween',
    start: '2025-10-15T00:00:00+03:00',
    end: '2025-10-31T23:59:59+03:00',
    overview: 'Share your profile card with the official hashtags and join the Halloween wave.',
    task: 'Share your profile card and use #herazur #HerazurHalloween.',
    reward: 'Pumpkin Badge + +50 Score',
    extra: 'Top 10 most creative posts → 500 Crystal Coins',
    requirements: [
      'Download your profile card as PNG',
      'Post on X / Instagram / TikTok',
      'Include #herazur and #HerazurHalloween',
    ],
    steps: [
      'Create or update your profile card',
      'Post it on your social media with the hashtags',
      'Submit your post URL inside the event form',
    ],
    proof: 'Public post link is required for review.',
    prizes: ['🎃 Halloween Pumpkin Badge', '+50 Score', 'Top 10: 500 Crystal Coins'],
    gradient: 'from-orange-500 to-yellow-400',
  }),
  buildEvent({
    key: 'winter-2025',
    title: '🎄 Winter Wonderland',
    start: '2025-12-10T00:00:00+03:00',
    end: '2025-12-31T23:59:59+03:00',
    overview: 'Spread cheer by gifting the community.',
    task: 'Send gifts to at least 3 people.',
    reward: 'Snowflake Badge + +100 Score',
    extra: 'Top gifter → Spotlight Boost',
    requirements: ['Have at least 3 unique gift recipients during the event window'],
    steps: ['Open any profile', 'Send a gift using Crystal Coins', 'Repeat for 3 different users'],
    proof: 'No manual proof needed. We verify via gift events.',
    prizes: ['❄️ Snowflake Badge', '+100 Score', 'Top gifter: Spotlight Boost'],
    gradient: 'from-blue-400 to-cyan-300',
  }),
  buildEvent({
    key: 'valentine-2026',
    title: '❤️ Valentine’s Connect',
    start: '2026-02-07T00:00:00+03:00',
    end: '2026-02-14T23:59:59+03:00',
    overview: 'Share a heartfelt moment and connect.',
    task: 'Share your “favorite moment” on your profile.',
    reward: 'Heart Jewel Badge + +50 Score',
    extra: 'Top 5 by engagement → 1 month Premium',
    requirements: ['Public profile required', 'Moment must be visible on profile'],
    steps: ['Edit profile → Add Favorite Moment', 'Keep it public during the event'],
    proof: 'We will review your public profile snapshot.',
    prizes: ['❤️ Heart Jewel Badge', '+50 Score', 'Top 5: 1 month Premium'],
    gradient: 'from-red-500 to-pink-500',
  }),
  buildEvent({
    key: 'spring-2026',
    title: '🌸 Spring Blossom Event',
    start: '2026-04-01T00:00:00+03:00',
    end: '2026-04-15T23:59:59+03:00',
    overview: 'Celebrate spring by spreading positivity.',
    task: 'Leave comments on at least 5 profiles.',
    reward: 'Blossom Badge + +50 Score',
    extra: 'Top 10 users → 200 Crystal Coins',
    requirements: ['Comments must be positive and relevant', 'No spam; duplicate users don’t count'],
    steps: ['Discover → Open profiles', 'Leave thoughtful comments', 'Reach 5 unique profiles'],
    proof: 'Verified automatically from comment activity.',
    prizes: ['🌸 Blossom Badge', '+50 Score', 'Top 10: 200 Crystal Coins'],
    gradient: 'from-pink-400 to-purple-400',
  }),
  buildEvent({
    key: 'summer-2026',
    title: '☀️ Summer Vibes Challenge',
    start: '2026-06-15T00:00:00+03:00',
    end: '2026-06-30T23:59:59+03:00',
    overview: 'Invite friends and grow together.',
    task: 'Invite a friend — both of you get rewards.',
    reward: 'Summer Badge + +100 Score',
    extra: 'Top inviter → 3 months Premium',
    requirements: ['New users must verify their account', 'Successful sign-up via your invite link'],
    steps: ['Share your invite code/link', 'Friend completes sign-up', 'Both accounts get credited'],
    proof: 'Tracked automatically via referral link.',
    prizes: ['☀️ Summer Badge', '+100 Score', 'Top inviter: 3 months Premium'],
    gradient: 'from-yellow-400 to-orange-400',
  }),
  buildEvent({
    key: 'starlight-2026',
    title: '🌌 Starlight Festival',
    start: '2026-08-10T00:00:00+03:00',
    end: '2026-08-25T23:59:59+03:00',
    overview: 'Build consistency with daily activity.',
    task: 'Stay active every day for a week.',
    reward: 'Starlight Badge + +150 Score',
    extra: 'Raffle → 1,000 Crystal Coins',
    requirements: ['Log in daily and perform at least one interaction'],
    steps: ['Log in', 'Comment, gift, or message', 'Keep streak for 7 consecutive days'],
    proof: 'Verified automatically via activity logs.',
    prizes: ['🌌 Starlight Badge', '+150 Score', 'Raffle: 1,000 Crystal Coins'],
    gradient: 'from-purple-500 to-indigo-500',
  }),
];

const now = () => new Date();
const getStatus = (start, end) => {
  const t = now().getTime();
  if (t < start.getTime()) return 'upcoming';
  if (t > end.getTime()) return 'ended';
  return 'ongoing';
};
const formatRange = (start, end) => {
  const opts = { day: '2-digit', month: 'long' };
  const s = start.toLocaleDateString('en-US', opts);
  const e = end.toLocaleDateString('en-US', opts);
  return `${s} – ${e}`;
};
const countdown = (end) => {
  const ms = end.getTime() - now().getTime();
  if (ms <= 0) return 'Ended';
  const d = Math.floor(ms / (1000 * 60 * 60 * 24));
  const h = Math.floor((ms / (1000 * 60 * 60)) % 24);
  const m = Math.floor((ms / (1000 * 60)) % 60);
  if (d > 0) return `${d}d ${h}h left`;
  if (h > 0) return `${h}h ${m}m left`;
  return `${m}m left`;
};
const statusBadge = (status) => {
  if (status === 'ongoing') return { label: 'Ongoing', className: 'bg-green-500/15 text-green-600 border-green-500/20' };
  if (status === 'upcoming') return { label: 'Upcoming', className: 'bg-amber-500/15 text-amber-600 border-amber-500/20' };
  return { label: 'Ended', className: 'bg-gray-500/15 text-gray-600 border-gray-500/20' };
};

// ---------- components ----------
const MoreInfo = ({ overview, requirements, steps, proof, prizes }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-3">
      <Button variant="outline" size="sm" className="rounded-full" onClick={() => setOpen((v) => !v)}>
        {open ? 'Hide details' : 'More info'}
      </Button>
      {open && (
        <div className="mt-3 space-y-3 text-sm">
          {overview && (
            <div>
              <p className="font-medium">Overview</p>
              <p className="text-muted-foreground">{overview}</p>
            </div>
          )}
          {requirements?.length > 0 && (
            <div>
              <p className="font-medium">Requirements</p>
              <ul className="list-disc pl-5 text-muted-foreground space-y-1">
                {requirements.map((r, i) => (<li key={i}>{r}</li>))}
              </ul>
            </div>
          )}
          {steps?.length > 0 && (
            <div>
              <p className="font-medium">How to participate</p>
              <ol className="list-decimal pl-5 text-muted-foreground space-y-1">
                {steps.map((s, i) => (<li key={i}>{s}</li>))}
              </ol>
            </div>
          )}
          {proof && (
            <div>
              <p className="font-medium">Proof & review</p>
              <p className="text-muted-foreground">{proof}</p>
            </div>
          )}
          {prizes?.length > 0 && (
            <div>
              <p className="font-medium">Prizes</p>
              <ul className="list-disc pl-5 text-muted-foreground space-y-1">
                {prizes.map((p, i) => (<li key={i}>{p}</li>))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const EventCard = ({ event, index }) => {
  const status = getStatus(event.start, event.end);
  const badge = statusBadge(status);
  const period = useMemo(() => formatRange(event.start, event.end), [event.start, event.end]);
  const endsIn = useMemo(() => (status === 'ongoing' ? countdown(event.end) : null), [status, event.end]);
  const [copied, setCopied] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
    >
      <div
        id={`event-${event.key}`}
        className="relative rounded-2xl p-[1px] bg-gradient-to-br from-primary/30 via-pink-500/20 to-transparent transition-transform hover:-translate-y-0.5"
      >
        <Card className="relative overflow-hidden h-full flex flex-col shadow-lg bg-card/80 backdrop-blur-xl border border-border/60 rounded-2xl hover:border-primary/40 transition-colors">
          <div className={`h-1.5 w-full bg-gradient-to-r ${event.gradient}`} />
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="w-full">
                <CardTitle className="text-xl flex items-center gap-2">
                  {typeof event.icon === 'string' ? <span className="text-2xl">{event.icon}</span> : event.icon}
                  {event.title}
                </CardTitle>
                <CardDescription className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                  <CalendarDays className="h-4 w-4" />
                  <span>{period}</span>
                  <Badge variant="secondary" className={cn('ml-1 border', badge.className)}>
                    {badge.label}
                  </Badge>
                  {status === 'ongoing' && (
                    <span className="ml-auto text-xs rounded-full border px-2 py-0.5 bg-green-500/10 border-green-500/20 text-green-600">
                      {endsIn}
                    </span>
                  )}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex-grow flex flex-col justify-between">
            <div>
              <div className="mb-4">
                <p className="font-semibold text-sm mb-1 text-muted-foreground">Task</p>
                <p>{event.task}</p>
              </div>
              <div className="mb-4">
                <p className="font-semibold text-sm mb-1 text-muted-foreground">Reward</p>
                <p>{event.reward}</p>
              </div>

              {/* More info expandable */}
              <MoreInfo
                overview={event.overview}
                requirements={event.requirements}
                steps={event.steps}
                proof={event.proof}
                prizes={event.prizes}
              />
            </div>

            <div className="mt-4 pt-4 border-t border-dashed flex items-center gap-2">
              {event.extra && (
                <Badge
                  variant="secondary"
                  className="mr-auto w-fit text-amber-600 bg-amber-500/10 border-amber-500/20"
                >
                  {event.extra}
                </Badge>
              )}

              {/* Only Copy Link remains */}
              <Button
                variant="outline"
                size="sm"
                className="rounded-full ml-auto"
                onClick={async () => {
                  await navigator.clipboard.writeText(`${SITE_URL}/events#event-${event.key}`);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1200);
                }}
                aria-label={`Copy link for ${event.title}`}
              >
                {copied ? <Check className="mr-2 h-4 w-4" /> : <Clipboard className="mr-2 h-4 w-4" />}
                {copied ? 'Copied' : 'Copy Link'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
};


const Events = () => {
  const [tab, setTab] = useState('all'); // 'all' | 'upcoming' | 'ongoing' | 'ended'

  const filtered = useMemo(() => {
    return eventsData.filter(e => {
      const s = getStatus(e.start, e.end);
      return tab === 'all' ? true : s === tab;
    });
  }, [tab]);

  // Smooth-scroll to an event if URL has a hash (e.g., /events#event-halloween-2025)
  useEffect(() => {
    const hash = window.location.hash ? window.location.hash.slice(1) : '';
    if (!hash) return;
    const el = document.getElementById(hash);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      el.classList.add('ring-2', 'ring-primary', 'ring-offset-2', 'rounded-2xl');
      setTimeout(() => el.classList.remove('ring-2', 'ring-primary', 'ring-offset-2', 'rounded-2xl'), 1600);
    }
  }, []);

  return (
    <>
      <Seo
        title="Events"
        description="Participate in special events on Herazur and earn exclusive rewards, badges, and coins."
      />

      <div className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-purple-500/10 to-transparent" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center">
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-3">
              <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent">Community Events</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Join our special events, complete challenges, and earn exclusive badges and rewards!
            </p>
          </motion.div>
        </div>
      </div>

      {/* Tabs */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pb-6">
        <div className="mx-auto w-full max-w-3xl flex items-center justify-center gap-2 rounded-full bg-muted p-1">
          {(['all', 'ongoing', 'upcoming', 'ended']).map(key => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-semibold transition-all',
                tab === key ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
              aria-pressed={tab === key}
            >
              {key === 'all' ? 'All' : key === 'ongoing' ? 'Ongoing' : key === 'upcoming' ? 'Upcoming' : 'Ended'}
            </button>
          ))}
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((event, index) => (
            <EventCard key={event.key} event={event} index={index} />
          ))}

          {filtered.length === 0 && (
            <div className="col-span-full text-center text-muted-foreground py-12">
              No events under this filter. New events will be added soon! ✨
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Events;
