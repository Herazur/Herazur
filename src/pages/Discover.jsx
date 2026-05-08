import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Seo from '@/components/Seo';
import { motion } from 'framer-motion';
import {
  Search,
  Filter,
  X,
  SlidersHorizontal,
  Zap,
  TrendingUp,
  Clock,
  Users,
  Eye,
  Gift,
  Activity
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import ProfileCard, { ProfileCardSkeleton } from '@/components/ProfileCard';
import { useData } from '@/contexts/DataContext';
import { countries } from '@/lib/countries';
import { SITE_URL } from '@/lib/seo';

const Discover = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { getTopTags, searchProfiles: dataSearchProfiles } = useData();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'trending');
  const [gender, setGender] = useState(searchParams.get('gender') || 'all');
  const [country, setCountry] = useState(searchParams.get('country') || 'all');
  const [showBoostedOnly, setShowBoostedOnly] = useState(searchParams.get('boosted') === 'true');
  const [showFilters, setShowFilters] = useState(false);
  const [results, setResults] = useState([]);
  const [topTags, setTopTags] = useState([]);
  const [loading, setLoading] = useState(true);

  // Gelişmiş filtreler
  const [minGifts, setMinGifts] = useState(Number(searchParams.get('gifts_min') || 0));
  const [minFollowers, setMinFollowers] = useState(Number(searchParams.get('followers_min') || 0));
  const [activeWithin, setActiveWithin] = useState(searchParams.get('active_within') || 'any');

  const selectedTags = useMemo(() => {
    const tags = searchParams.get('tags');
    return tags ? tags.split(',') : [];
  }, [searchParams]);

  const fetchAndSetTopTags = useCallback(async () => {
    const fetchedTags = await getTopTags(20);
    setTopTags(fetchedTags);
  }, [getTopTags]);

  const searchProfiles = useCallback(async (filters) => {
    setLoading(true);
    const searchResults = await dataSearchProfiles(filters);

    // İstemci tarafı “Most Generous” fallback’i kalsın
    let finalResults = Array.isArray(searchResults) ? [...searchResults] : [];

    if (filters?.sort === 'most_generous') {
      finalResults.sort((a, b) => (b?.gifts_sent_count ?? 0) - (a?.gifts_sent_count ?? 0));
    }

    // Güvenli son
    setResults(finalResults);
    setLoading(false);
  }, [dataSearchProfiles]);

  useEffect(() => {
    fetchAndSetTopTags();
    const currentFilters = {
      query: searchParams.get('q') || '',
      tags: searchParams.get('tags')?.split(',') || [],
      sort: searchParams.get('sort') || 'trending',
      gender: searchParams.get('gender') || 'all',
      country: searchParams.get('country') || 'all',
      boostedOnly: searchParams.get('boosted') === 'true',
      giftsMin: Number(searchParams.get('gifts_min') || 0),
      followersMin: Number(searchParams.get('followers_min') || 0),
      activeWithin: searchParams.get('active_within') || 'any',
    };

    setSearchQuery(currentFilters.query);
    setSortBy(currentFilters.sort);
    setGender(currentFilters.gender);
    setCountry(currentFilters.country);
    setShowBoostedOnly(currentFilters.boostedOnly);
    setMinGifts(currentFilters.giftsMin);
    setMinFollowers(currentFilters.followersMin);
    setActiveWithin(currentFilters.activeWithin);

    searchProfiles(currentFilters);

  }, [searchParams, searchProfiles, fetchAndSetTopTags]);

  const updateSearchParam = (key, value, defaultValue) => {
    const params = new URLSearchParams(searchParams);
    if (value && value !== defaultValue) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    setSearchParams(params, { replace: true });
  };

  const handleSearchInputChange = (e) => {
    const newQuery = e.target.value;
    setSearchQuery(newQuery);
    updateSearchParam('q', newQuery, '');
  };

  const handleSortChange = (newSort) => {
    setSortBy(newSort);
    updateSearchParam('sort', newSort, 'trending');
  };

  const handleGenderChange = (newGender) => {
    setGender(newGender);
    updateSearchParam('gender', newGender, 'all');
  };

  const handleCountryChange = (newCountry) => {
    setCountry(newCountry);
    updateSearchParam('country', newCountry, 'all');
  };

  const handleTagToggle = (tagName) => {
    const newTags = selectedTags.includes(tagName)
      ? selectedTags.filter(t => t !== tagName)
      : [...selectedTags, tagName].slice(0, 5);
    updateSearchParam('tags', newTags.join(','), '');
  };

  const handleBoostedToggle = (isToggled) => {
    setShowBoostedOnly(isToggled);
    updateSearchParam('boosted', isToggled ? 'true' : '', '');
  };

  // Numeric/time filtre handler'ları
  const handleGiftsSlider = (vals) => {
    const v = Math.max(0, Math.round(vals[0] ?? 0));
    setMinGifts(v);
    updateSearchParam('gifts_min', v ? String(v) : '', '');
  };
  const handleGiftsInput = (e) => {
    const v = Math.max(0, Math.round(Number(e.target.value || 0)));
    setMinGifts(v);
    updateSearchParam('gifts_min', v ? String(v) : '', '');
  };

  const handleFollowersSlider = (vals) => {
    const v = Math.max(0, Math.round(vals[0] ?? 0));
    setMinFollowers(v);
    updateSearchParam('followers_min', v ? String(v) : '', '');
  };
  const handleFollowersInput = (e) => {
    const v = Math.max(0, Math.round(Number(e.target.value || 0)));
    setMinFollowers(v);
    updateSearchParam('followers_min', v ? String(v) : '', '');
  };

  const handleActiveWithinChange = (val) => {
    setActiveWithin(val);
    updateSearchParam('active_within', val === 'any' ? '' : val, '');
  };

  const clearFilters = () => {
    setSearchParams({}, { replace: true });
  };

  const handleCardClick = (profile) => {
    navigate(`/u/${profile.username}`);
  };

  const activeFilterCount = [
    searchQuery,
    sortBy !== 'trending',
    gender !== 'all',
    country !== 'all',
    showBoostedOnly,
    minGifts > 0,
    minFollowers > 0,
    activeWithin !== 'any',
    ...selectedTags
  ].filter(Boolean).length;

  return (
    <>
      <Seo
        title="Discover People"
        description="Discover talented people, filter by interests, and connect with like-minded individuals in our community."
        schema={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'Discover People',
          description: 'Browse and filter profiles to find people on Herazur.',
          url: `${SITE_URL}/discover`,
        }}
      />

      <div className="min-h-screen py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl font-bold mb-4 gradient-text">Discover People</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Find interesting people, filter by interests, and connect with those who share your passions.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-8"
          >
            <Card>
              <CardContent className="p-4 sm:px-6 sm:py-6">
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-label="Search" />
                  <Input
                    type="text"
                    placeholder="Search by name, username, or interests..."
                    value={searchQuery}
                    onChange={handleSearchInputChange}
                    className="pl-10 pr-4"
                  />
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2 w-full sm:w-auto"
                  >
                    <SlidersHorizontal className="h-4 w-4" aria-label="Filters" />
                    Advanced Filters
                    {activeFilterCount > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {activeFilterCount}
                      </Badge>
                    )}
                  </Button>

                  {activeFilterCount > 0 && (
                    <Button variant="ghost" onClick={clearFilters} className="text-sm w-full sm:w-auto">
                      <X className="h-4 w-4 mr-1" aria-label="Clear" />
                      Clear All
                    </Button>
                  )}
                </div>

                {showFilters && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-5 pt-4 border-t"
                  >
                    {/* Satır 1: Sort / Gender / Country */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Sort By</label>
                        <Select onValueChange={handleSortChange} value={sortBy}>
                          <SelectTrigger><SelectValue placeholder="Sort by..." /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="trending"><div className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-purple-500" /> Trending</div></SelectItem>
                            <SelectItem value="popular"><div className="flex items-center gap-2"><Users className="h-4 w-4 text-green-500" /> Most Popular</div></SelectItem>
                            <SelectItem value="most_viewed"><div className="flex items-center gap-2"><Eye className="h-4 w-4 text-teal-500" /> Most Viewed (7d)</div></SelectItem>
                            <SelectItem value="newest"><div className="flex items-center gap-2"><Clock className="h-4 w-4 text-blue-500" /> Newest</div></SelectItem>
                            <SelectItem value="oldest"><div className="flex items-center gap-2"><Clock className="h-4 w-4 text-blue-500" /> Oldest</div></SelectItem>
                            <SelectItem value="most_generous"><div className="flex items-center gap-2"><Gift className="h-4 w-4 text-rose-500" /> Most Generous</div></SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Gender</label>
                        <Select onValueChange={handleGenderChange} value={gender}>
                          <SelectTrigger><SelectValue placeholder="Any Gender" /></SelectTrigger>
                          <SelectContent className="max-h-72 overflow-y-auto">
                            <SelectItem value="all">All Genders</SelectItem>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Country</label>
                        <Select onValueChange={handleCountryChange} value={country}>
                          <SelectTrigger><SelectValue placeholder="Any Country" /></SelectTrigger>
                          <SelectContent className="max-h-72 overflow-y-auto">
                            <SelectItem value="all">All Countries</SelectItem>
                            {countries.map(c => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Satır 2: Boosted / Generosity / Followers */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      <div className="flex items-center justify-between rounded-lg border p-3">
                        <label htmlFor="boosted-only" className="text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <Zap className="h-4 w-4 text-yellow-500" />
                            Boosted Profiles Only
                          </div>
                        </label>
                        <Switch id="boosted-only" checked={showBoostedOnly} onCheckedChange={handleBoostedToggle} />
                      </div>

                      <div className="rounded-lg border p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Gift className="h-4 w-4 text-rose-500" />
                            <span className="text-sm font-medium">Gifts Sent ≥</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min={0}
                              value={minGifts}
                              onChange={handleGiftsInput}
                              className="h-8 w-24"
                            />
                          </div>
                        </div>
                        <Slider value={[minGifts]} onValueChange={handleGiftsSlider} min={0} max={100} step={1} />
                      </div>

                      <div className="rounded-lg border p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium">Followers ≥</span>
                          </div>
                          <Input
                            type="number"
                            min={0}
                            value={minFollowers}
                            onChange={handleFollowersInput}
                            className="h-8 w-24"
                          />
                        </div>
                        <Slider value={[minFollowers]} onValueChange={handleFollowersSlider} min={0} max={5000} step={10} />
                      </div>
                    </div>

                    {/* Satır 3: Last Active */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      <div className="rounded-lg border p-3">
                        <label className="text-sm font-medium mb-2 block">
                          <div className="flex items-center gap-2">
                            <Activity className="h-4 w-4 text-blue-600" />
                            Last Active
                          </div>
                        </label>
                        <Select value={activeWithin} onValueChange={handleActiveWithinChange}>
                          <SelectTrigger><SelectValue placeholder="Any time" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="any">Any time</SelectItem>
                            <SelectItem value="7">Last 7 days</SelectItem>
                            <SelectItem value="30">Last 30 days</SelectItem>
                            <SelectItem value="90">Last 90 days</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="lg:col-span-2">
                        <h3 className="text-sm font-medium mb-2 block">
                          Popular Interests ({selectedTags.length}/5)
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {topTags.map((tag) => (
                            <Badge
                              key={tag.name}
                              variant={selectedTags.includes(tag.name) ? "default" : "outline"}
                              className="cursor-pointer tag-chip"
                              onClick={() => handleTagToggle(tag.name)}
                            >
                              {tag.name} ({tag.usage_count})
                              {selectedTags.includes(tag.name) && (
                                <X className="h-3 w-3 ml-1" aria-label="Remove" />
                              )}
                            </Badge>
                          ))}
                        </div>
                        {selectedTags.length >= 5 && (
                          <p className="text-sm text-muted-foreground mt-2">
                            A maximum of 5 tags can be selected
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-muted-foreground">
                {!loading && `${results.length} ${results.length === 1 ? 'profile' : 'profiles'} found`}
              </p>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => <ProfileCardSkeleton key={i} />)}
              </div>
            ) : results.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {results.map((profile, index) => (
                  <motion.div
                    key={profile.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                    className="cursor-pointer"
                  >
                    <ProfileCard
                      profile={profile}
                      onCardClick={handleCardClick}
                      giftsSentCount={profile.gifts_sent_count}
                    />
                  </motion.div>
                ))}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-center py-12"
              >
                <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-4" aria-label="No results" />
                <h3 className="text-lg font-semibold mb-2">No Profiles Found</h3>
                <p className="text-muted-foreground mb-4">
                  Try changing your search criteria or clearing some filters.
                </p>
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default Discover;
