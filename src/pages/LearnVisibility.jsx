import React from 'react';
import Seo from '@/components/Seo';
import { motion, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Star, Rocket, Gift, Zap, Tag, Users, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const visibilityTips = [
  {
    icon: Star,
    title: 'Polish Your Profile',
    description: 'A complete profile is your foundation. Add a high-quality avatar (or GIF!), a compelling bio, an eye-catching banner, and link your social accounts. First impressions matter!',
    color: 'text-yellow-400',
  },
  {
    icon: Rocket,
    title: 'Use Boosts Strategically',
    description: 'Need a quick push? Use a "Quick Boost". For sustained visibility, activate a "Spotlight" to appear in the exclusive Spotlight Members section and climb the leaderboards.',
    color: 'text-blue-400',
  },
  {
    icon: Gift,
    title: 'Send Gifts to Connect',
    description: 'Sending gifts is a powerful way to get noticed. It triggers a notification to the receiver, increases your "Closeness Score", and places you on the "Most Generous" list.',
    color: 'text-pink-400',
  },
  {
    icon: Zap,
    title: 'Stay Active Daily',
    description: 'Activity is key to a high "Trending Score". Log in daily, claim your rewards, and interact with others by sending messages. The more active you are, the more visible you become.',
    color: 'text-green-400',
  },
  {
    icon: Tag,
    title: 'Tag Your Interests',
    description: 'Use relevant and popular tags to help like-minded people find you. A well-tagged profile appears in more searches and on the homepage under "Popular Interests".',
    color: 'text-purple-400',
  },
  {
    icon: Users,
    title: 'Grow Your Network',
    description: 'Follow other profiles and gain followers. A strong follower count acts as social proof and boosts your credibility and ranking on the platform.',
    color: 'text-red-400',
  },
];

const LearnVisibility = () => {
  const shouldReduceMotion = useReducedMotion();
  const fadeUp = (delay = 0) =>
    shouldReduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 20 },
          whileInView: { opacity: 1, y: 0 },
          transition: { duration: 0.5, delay },
          viewport: { once: true },
        };

  return (
    <>
      <Seo
        title="How to Stand Out"
        description="Learn the best strategies to boost your profile visibility on Herazur. Get noticed and connect with more people."
      />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div {...fadeUp()} className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            How to <span className="gradient-text">Stand Out</span> & Get Noticed
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Follow these expert tips to boost your profile's visibility, climb the leaderboards, and connect with a wider audience on Herazur.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibilityTips.map((tip, index) => (
            <motion.div {...fadeUp(0.1 + index * 0.1)} key={tip.title}>
              <Card className="h-full flex flex-col bg-card/80 backdrop-blur-sm border-border/50 hover:border-primary/50 transition-all duration-300 shadow-lg hover:shadow-primary/20">
                <CardHeader className="flex-row items-center gap-4">
                  <div className={`w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center ${tip.color}`}>
                    <tip.icon className="h-6 w-6" />
                  </div>
                  <CardTitle>{tip.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-muted-foreground">{tip.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div {...fadeUp(0.8)} className="text-center mt-16">
          <Card className="max-w-2xl mx-auto bg-gradient-to-r from-primary/10 to-purple-500/10 p-8 rounded-2xl">
            <h2 className="text-2xl font-bold mb-4">Ready to Boost Your Profile?</h2>
            <p className="text-muted-foreground mb-6">
              Put these tips into action! Head over to the promotion page to get boosts, or start by polishing your profile.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg">
                <Link to="/promote">
                  Promote Now <Rocket className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/edit-profile">
                  Edit Your Profile <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    </>
  );
};

export default LearnVisibility;
