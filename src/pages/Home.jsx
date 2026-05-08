import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Seo from '@/components/Seo';
import { motion, useReducedMotion } from 'framer-motion';
import { Search, ArrowRight, Users, Star, Zap, Crown, ChevronLeft, ChevronRight, Gift, Rocket, Award } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, A11y, Keyboard } from 'swiper/modules';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ProfileCard, { ProfileCardSkeleton } from '@/components/ProfileCard';
import { useData } from '@/contexts/DataContext';
import { supabase } from '@/lib/customSupabaseClient';
import { DEFAULT_OG_IMAGE, SITE_NAME, SITE_URL } from '@/lib/seo';
import VibeWeather from '@/components/VibeWeather';
import 'swiper/css';
import 'swiper/css/navigation';

const Home = () => {
  const { tags = [], loading: dataContextLoading } = useData();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [premiumProfiles, setPremiumProfiles] = useState([]);
  const [recentProfiles, setRecentProfiles] = useState([]);
  const [topGifters, setTopGifters] = useState([]);
  const [weeklyTopEarners, setWeeklyTopEarners] = useState([]);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    let alive = true;
    const fetchHomeData = async () => {
      setLoading(true);
      try {
        const [
          { data: spotlight, error: e1 },
          { data: newest, error: e2 },
          { data: gifters, error: e3 },
          { data: topEarners, error: e4 },
        ] = await Promise.all([
          supabase.rpc('get_spotlight_profiles', { p_limit: 10 }),
          supabase.rpc('get_new_members', { p_limit: 12 }),
          supabase.rpc('get_top_gifters', { p_limit: 10 }),
          supabase.rpc('get_weekly_top_earners', { p_limit: 10 }),
        ]);
        if (!alive) return;
        if (e1) console.error('get_spotlight_profiles error:', e1);
        if (e2) console.error('get_new_members error:', e2);
        if (e3) console.error('get_top_gifters error:', e3);
        if (e4) console.error('get_weekly_top_earners error:', e4);
        setPremiumProfiles(Array.isArray(spotlight) ? spotlight : []);
        setRecentProfiles(Array.isArray(newest) ? newest : []);
        setTopGifters(Array.isArray(gifters) ? gifters : []);
        setWeeklyTopEarners(Array.isArray(topEarners) ? topEarners : []);
      } finally {
        if (alive) setLoading(false);
      }
    };

    if (!dataContextLoading) fetchHomeData();
    return () => {
      alive = false;
    };
  }, [dataContextLoading]);

  const handleSearch = (e) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) navigate(`/discover?q=${encodeURIComponent(q)}`);
  };

  const handleTagClick = (tagName) => {
    if (!tagName) return;
    navigate(`/discover?tags=${encodeURIComponent(tagName)}`);
  };

  const handleCardClick = (profile) => {
    navigate(`/u/${profile.username}`);
  };

  // Normalize tag labels (e.g., stray leading backslashes)
  const cleanTag = (name) => (name ?? '').toString().replace(/^[\\/]+/, '').trim();

  const isPageLoading = loading || dataContextLoading;

  const fadeUp = (delay = 0.2) =>
    shouldReduceMotion
      ? {}
      : {
        initial: { opacity: 0, y: 16 },
        whileInView: { opacity: 1, y: 0 },
        transition: { duration: 0.5, delay },
        viewport: { once: true },
      };

  const showPremiumNav = premiumProfiles.length > 4;
  const showGiftersNav = topGifters.length > 4;
  const showTopEarnersNav = weeklyTopEarners.length > 4;
  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
      logo: DEFAULT_OG_IMAGE,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SITE_NAME,
      url: SITE_URL,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${SITE_URL}/discover?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
  ];

  const spotlightSlides = useMemo(
    () =>
      isPageLoading
        ? Array.from({ length: 4 }).map((_, i) => (
          <SwiperSlide key={`skeleton-${i}`} className="h-full">
            <ProfileCardSkeleton />
          </SwiperSlide>
        ))
        : premiumProfiles.map((profile) => (
          <SwiperSlide key={profile.id} className="h-full">
            <motion.div
              initial={shouldReduceMotion ? {} : { opacity: 0, y: 16 }}
              whileInView={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              viewport={{ once: true }}
              className="cursor-pointer h-full"
            >
              <ProfileCard profile={profile} onCardClick={handleCardClick} />
            </motion.div>
          </SwiperSlide>
        )),
    [isPageLoading, premiumProfiles, shouldReduceMotion, handleCardClick]
  );

  const gifterSlides = useMemo(
    () =>
      isPageLoading
        ? Array.from({ length: 4 }).map((_, i) => (
          <SwiperSlide key={`skeleton-g-${i}`} className="h-full">
            <ProfileCardSkeleton />
          </SwiperSlide>
        ))
        : topGifters.map((profile) => (
          <SwiperSlide key={profile.id} className="h-full">
            <motion.div
              initial={shouldReduceMotion ? {} : { opacity: 0, y: 16 }}
              whileInView={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              viewport={{ once: true }}
              className="cursor-pointer h-full"
            >
              <ProfileCard
                profile={profile}
                onCardClick={handleCardClick}
                giftsSentCount={profile.gifts_sent_count}
              />
            </motion.div>
          </SwiperSlide>
        )),
    [isPageLoading, topGifters, shouldReduceMotion, handleCardClick]
  );

  const topEarnerSlides = useMemo(
    () =>
      isPageLoading
        ? Array.from({ length: 4 }).map((_, i) => (
          <SwiperSlide key={`skeleton-te-${i}`} className="h-full">
            <ProfileCardSkeleton />
          </SwiperSlide>
        ))
        : weeklyTopEarners.map((profile) => (
          <SwiperSlide key={profile.id} className="h-full">
            <motion.div
              initial={shouldReduceMotion ? {} : { opacity: 0, y: 16 }}
              whileInView={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              viewport={{ once: true }}
              className="cursor-pointer h-full"
            >
              <ProfileCard profile={profile} onCardClick={handleCardClick} />
            </motion.div>
          </SwiperSlide>
        )),
    [isPageLoading, weeklyTopEarners, shouldReduceMotion, handleCardClick]
  );

  return (
    <>
      <Seo
        title="Connect, Discover, Showcase Your Identity"
        description="Join Herazur to create your profile, discover people with similar interests, and showcase your passions to the world."
        schema={structuredData}
      />

      <div className="min-h-screen">
        {/* HERO */}
        <section className="relative py-14 sm:py-20 lg:py-32 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-purple-500/5 to-transparent" />
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
            <motion.div
              initial={shouldReduceMotion ? {} : { opacity: 0, y: 16 }}
              animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center max-w-4xl mx-auto"
            >
              <h1 className="text-[clamp(1.75rem,6vw,3.75rem)] font-bold mb-4 sm:mb-6 leading-tight">
                <span className="gradient-text">Connect</span> with people who
                <span className="gradient-text"> get you</span>
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-6 sm:mb-8 max-w-2xl mx-auto">
                Discover individuals with similar interests, showcase your passions, and build meaningful connections in our vibrant community.
              </p>

              <motion.form
                initial={shouldReduceMotion ? {} : { opacity: 0, y: 16 }}
                animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                onSubmit={handleSearch}
                className="max-w-2xl mx-auto mb-6 sm:mb-8"
                role="search"
                aria-label="Search profiles"
              >
                <div className="relative flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-grow">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" aria-hidden />
                    <Input
                      type="search"
                      inputMode="search"
                      placeholder="Search by name, username, or interests..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-12 pr-4 h-12 sm:h-14 text-base sm:text-lg rounded-full border-2 focus:border-primary w-full"
                      aria-label="Search by name, username, or interests"
                    />
                  </div>
                  <Button type="submit" size="lg" className="w-full sm:w-auto rounded-full sm:px-6">
                    Search
                    <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
                  </Button>
                </div>
              </motion.form>

              <motion.div
                initial={shouldReduceMotion ? {} : { opacity: 0, y: 16 }}
                animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center"
              >
                <Button asChild size="lg" className="w-full sm:w-auto">
                  <Link to="/create">
                    Create Your Profile
                    <Star className="ml-2 h-4 w-4" aria-hidden />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
                  <Link to="/discover">
                    Explore Profiles
                    <Users className="ml-2 h-4 w-4" aria-hidden />
                  </Link>
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* POPULAR TAGS */}
        <section className="py-10 sm:py-12 bg-muted/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div {...fadeUp(0)} className="text-center mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-4">Popular Interests</h2>
              <p className="text-muted-foreground text-sm sm:text-base">Discover profiles by trending interests and hobbies</p>
            </motion.div>

            <motion.div
              {...fadeUp(0.1)}
              className="max-w-4xl mx-auto px-4 sm:px-0 overflow-x-auto no-scrollbar scroll-smooth"
              role="region"
              aria-label="Popular interest tags"
            >
              <div className="flex gap-2 whitespace-nowrap">
                {tags.length === 0 ? (
                  <div className="text-muted-foreground text-sm">No tags to show yet.</div>
                ) : (
                  tags.map((tag, index) => {
                    const label = cleanTag(tag?.name);
                    return (
                      <motion.div
                        key={`${label || 'tag'}-${index}`}
                        initial={shouldReduceMotion ? {} : { opacity: 0, scale: 0.96 }}
                        whileInView={shouldReduceMotion ? {} : { opacity: 1, scale: 1 }}
                        transition={{ duration: 0.25, delay: index * 0.03 }}
                        viewport={{ once: true }}
                      >
                        <Badge
                          variant="secondary"
                          className="cursor-pointer tag-chip text-sm py-2 px-4 rounded-full"
                          onClick={() => handleTagClick(label)}
                          aria-label={`Filter by ${label}`}
                        >
                          {label}
                          {typeof tag?.usage_count === 'number' && tag.usage_count > 0 ? ` (${tag.usage_count})` : ''}
                        </Badge>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </div>
        </section>

        {/* SPOTLIGHT */}
        {premiumProfiles.length > 0 && (
          <section className="py-12 sm:py-16">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <motion.div {...fadeUp(0)} className="text-center mb-8 sm:mb-12">
                <h2 className="text-2xl sm:text-3xl font-bold mb-2 flex items-center justify-center gap-2">
                  <Crown className="inline h-7 w-7 sm:h-8 sm:w-8 text-yellow-400" aria-hidden />
                  <span className="premium-text">Spotlight Members</span>
                </h2>
                <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base">
                  Discover exceptional people and community leaders who are making an impact.
                </p>
              </motion.div>

              <div className="relative">
                <Swiper
                  modules={[Navigation, A11y, Keyboard]}
                  a11y={{ enabled: true }}
                  keyboard={{ enabled: true }}
                  spaceBetween={12}
                  slidesPerView={1.05}
                  centeredSlides
                  loop={premiumProfiles.length > 2}
                  breakpoints={{
                    390: { slidesPerView: 1.1, spaceBetween: 14, centeredSlides: true },
                    480: { slidesPerView: 1.25, spaceBetween: 16, centeredSlides: true },
                    640: { slidesPerView: 2, centeredSlides: false, spaceBetween: 20 },
                    1024: { slidesPerView: 3, centeredSlides: false, spaceBetween: 24 },
                    1280: { slidesPerView: 4, centeredSlides: false, spaceBetween: 24 },
                  }}
                  navigation={{ nextEl: '.swiper-button-next-premium', prevEl: '.swiper-button-prev-premium' }}
                  className="!pb-4"
                >
                  {spotlightSlides}
                </Swiper>

                {showPremiumNav && (
                  <>
                    <Button
                      variant="outline"
                      size="icon"
                      className="swiper-button-prev-premium absolute top-1/2 -translate-y-1/2 left-0 z-10 hidden md:flex rounded-full"
                      aria-label="Previous spotlight"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="swiper-button-next-premium absolute top-1/2 -translate-y-1/2 right-0 z-10 hidden md:flex rounded-full"
                      aria-label="Next spotlight"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </section>
        )}

        {/* MOST GENEROUS */}
        {topGifters.length > 0 && (
          <section className="py-12 sm:py-16 bg-muted/30">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <motion.div {...fadeUp(0)} className="text-center mb-8 sm:mb-12">
                <h2 className="text-2xl sm:text-3xl font-bold mb-2">
                  <Gift className="inline h-7 w-7 sm:h-8 sm:w-8 mr-2 text-pink-500" aria-hidden />
                  Most Generous of the Week
                </h2>
                <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base">
                  Celebrating the top gifters in our community. Thank you for your generosity!
                </p>
              </motion.div>

              <div className="relative">
                <Swiper
                  modules={[Navigation, A11y, Keyboard]}
                  a11y={{ enabled: true }}
                  keyboard={{ enabled: true }}
                  spaceBetween={12}
                  slidesPerView={1.05}
                  centeredSlides
                  loop={topGifters.length > 2}
                  breakpoints={{
                    390: { slidesPerView: 1.1, spaceBetween: 14, centeredSlides: true },
                    480: { slidesPerView: 1.25, spaceBetween: 16, centeredSlides: true },
                    640: { slidesPerView: 2, centeredSlides: false, spaceBetween: 20 },
                    1024: { slidesPerView: 3, centeredSlides: false, spaceBetween: 24 },
                    1280: { slidesPerView: 4, centeredSlides: false, spaceBetween: 24 },
                  }}
                  navigation={{ nextEl: '.swiper-button-next-gifters', prevEl: '.swiper-button-prev-gifters' }}
                  className="!pb-4"
                >
                  {gifterSlides}
                </Swiper>

                {showGiftersNav && (
                  <>
                    <Button
                      variant="outline"
                      size="icon"
                      className="swiper-button-prev-gifters absolute top-1/2 -translate-y-1/2 left-0 z-10 hidden md:flex rounded-full"
                      aria-label="Previous gifter"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="swiper-button-next-gifters absolute top-1/2 -translate-y-1/2 right-0 z-10 hidden md:flex rounded-full"
                      aria-label="Next gifter"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </section>
        )}

        {/* WEEKLY TOP EARNERS */}
        {weeklyTopEarners.length > 0 && (
          <section className="py-12 sm:py-16">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <motion.div {...fadeUp(0)} className="text-center mb-8 sm:mb-12">
                <h2 className="text-2xl sm:text-3xl font-bold mb-2">
                  <Award className="inline h-7 w-7 sm:h-8 sm:w-8 mr-2 text-blue-500" aria-hidden />
                  Stars of the Week
                </h2>
                <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base">
                  Recognizing the most active and highest-scoring members of the past week.
                </p>
              </motion.div>

              <div className="relative">
                <Swiper
                  modules={[Navigation, A11y, Keyboard]}
                  a11y={{ enabled: true }}
                  keyboard={{ enabled: true }}
                  spaceBetween={12}
                  slidesPerView={1.05}
                  centeredSlides
                  loop={weeklyTopEarners.length > 2}
                  breakpoints={{
                    390: { slidesPerView: 1.1, spaceBetween: 14, centeredSlides: true },
                    480: { slidesPerView: 1.25, spaceBetween: 16, centeredSlides: true },
                    640: { slidesPerView: 2, centeredSlides: false, spaceBetween: 20 },
                    1024: { slidesPerView: 3, centeredSlides: false, spaceBetween: 24 },
                    1280: { slidesPerView: 4, centeredSlides: false, spaceBetween: 24 },
                  }}
                  navigation={{ nextEl: '.swiper-button-next-top-earners', prevEl: '.swiper-button-prev-top-earners' }}
                  className="!pb-4"
                >
                  {topEarnerSlides}
                </Swiper>

                {showTopEarnersNav && (
                  <>
                    <Button
                      variant="outline"
                      size="icon"
                      className="swiper-button-prev-top-earners absolute top-1/2 -translate-y-1/2 left-0 z-10 hidden md:flex rounded-full"
                      aria-label="Previous top earner"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="swiper-button-next-top-earners absolute top-1/2 -translate-y-1/2 right-0 z-10 hidden md:flex rounded-full"
                      aria-label="Next top earner"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </section>
        )}

        {/* NEW MEMBERS – max 4 columns */}
        <section className="py-12 sm:py-16 bg-muted/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div {...fadeUp(0)} className="text-center mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold mb-3">
                <Zap className="inline h-7 w-7 sm:h-8 sm:w-8 mr-2 text-primary" aria-hidden />
                New Members
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base">
                Welcome our newest community members and discover fresh faces
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {isPageLoading
                ? Array.from({ length: 8 }).map((_, i) => <ProfileCardSkeleton key={i} />)
                : recentProfiles.map((profile, index) => (
                  <motion.div
                    key={profile.id}
                    initial={shouldReduceMotion ? {} : { opacity: 0, y: 16 }}
                    whileInView={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: index * 0.06 }}
                    viewport={{ once: true }}
                    className="cursor-pointer"
                  >
                    <ProfileCard profile={profile} onCardClick={handleCardClick} />
                  </motion.div>
                ))}
            </div>

            {!isPageLoading && recentProfiles.length === 0 && (
              <div className="text-center text-muted-foreground mt-8">No new members yet.</div>
            )}
          </div>
        </section>

        {/* VIBE WEATHER */}
        <section className="py-10 sm:py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <VibeWeather />
          </div>
        </section>

        {/* COINS & BOOSTS */}
        <section className="py-12 sm:py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div {...fadeUp(0)} className="text-center mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold mb-3">
                Unlock Your <span className="gradient-text">Full Potential</span>
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base">
                Use Crystal Coins to boost your profile, send gifts, and connect like never before.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-5xl mx-auto mb-8 sm:mb-12">
              <motion.div {...fadeUp(0.15)} className="bg-card p-6 sm:p-8 rounded-xl shadow-lg">
                <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-red-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <Gift className="h-5 w-5 sm:h-6 sm:w-6 text-white" aria-hidden />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-semibold">Send Gifts & Build Bonds</h3>
                </div>
                <p className="text-muted-foreground text-sm sm:text-base">
                  Show your appreciation and strengthen connections by sending virtual gifts to other users. Each gift increases your Closeness Score, bringing you closer to your favorite people.
                </p>
              </motion.div>

              <motion.div {...fadeUp(0.25)} className="bg-card p-6 sm:p-8 rounded-xl shadow-lg">
                <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center">
                    <Rocket className="h-5 w-5 sm:h-6 sm:w-6 text-white" aria-hidden />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-semibold">Boost Your Visibility</h3>
                </div>
                <p className="text-muted-foreground text-sm sm:text-base">
                  Get noticed faster! Use boosts to climb the leaderboards, increase your visibility in search results, and make your profile more attractive with exclusive perks like animated banners.
                </p>
              </motion.div>
            </div>

            <motion.div {...fadeUp(0.35)} className="text-center">
              <Button asChild size="lg">
                <Link to="/promote">
                  Promote Now
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
                </Link>
              </Button>
            </motion.div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="py-12 sm:py-16 bg-muted/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div {...fadeUp(0)} className="text-center mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold mb-3">How It Works</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base">
                Get started in three simple steps and join our growing community
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-4xl mx-auto">
              {[
                { step: '1', title: 'Create Your Profile', description: 'Build a stunning profile with your photo, bio, and social links', icon: Users },
                { step: '2', title: 'Add 5 Interests', description: 'Tag yourself with 5 interests to help others discover you', icon: Star },
                { step: '3', title: 'Get Discovered', description: 'Connect with like-minded people and grow your network', icon: Zap },
              ].map((item, index) => (
                <motion.div key={item.step} {...fadeUp(0.1 + index * 0.1)} className="text-center">
                  <div className="relative mb-4 sm:mb-6">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto bg-gradient-to-br from-primary to-purple-600 rounded-lg flex items-center justify-center">
                      <item.icon className="h-7 w-7 sm:h-8 sm:w-8 text-white" aria-hidden />
                    </div>
                    <div className="absolute -top-2 -right-2 w-7 h-7 sm:w-8 sm:h-8 bg-background border-2 border-primary rounded-full flex items-center justify-center">
                      <span className="text-xs sm:text-sm font-bold text-primary">{item.step}</span>
                    </div>
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">{item.title}</h3>
                  <p className="text-muted-foreground text-sm sm:text-base">{item.description}</p>
                </motion.div>
              ))}
            </div>

            <motion.div {...fadeUp(0.4)} className="text-center mt-8 sm:mt-12">
              <Button asChild size="lg">
                <Link to="/create">
                  Get Started Now
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
                </Link>
              </Button>
            </motion.div>
          </div>
        </section>
      </div>
    </>
  );
};

export default Home;
