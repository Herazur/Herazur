import React from 'react';
import Seo from '@/components/Seo';
import { motion } from 'framer-motion';

const About = () => {
  return (
    <>
      <Seo
        title="About Us"
        description="Learn more about Herazur, our mission, and what we stand for."
      />
      <div className="container mx-auto max-w-4xl py-12 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-card p-8 rounded-lg shadow-lg"
        >
          <h1 className="text-4xl font-bold gradient-text mb-6 text-center">About Herazur</h1>
          <p className="text-lg text-muted-foreground mb-8 text-center">
            Empowering creators to shine and connect.
          </p>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
            <p className="text-md text-foreground leading-relaxed">
              At Herazur, our mission is to build a vibrant and supportive community where creators can discover, share, and grow. We believe in the power of connection and the importance of providing tools that help individuals amplify their unique voices and talents. We're dedicated to fostering an environment that encourages creativity, collaboration, and meaningful interactions.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">What We Offer</h2>
            <ul className="list-disc list-inside text-md text-foreground leading-relaxed space-y-2">
              <li><strong>Discover:</strong> Explore a diverse range of talented creators and their work.</li>
              <li><strong>Connect:</strong> Engage with like-minded individuals through profiles, comments, and direct messages.</li>
              <li><strong>Grow:</strong> Utilize our tools to promote your profile, track your performance, and gain visibility.</li>
              <li><strong>Community:</strong> Participate in events, climb leaderboards, and celebrate achievements together.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Our Vision</h2>
            <p className="text-md text-foreground leading-relaxed">
              We envision a world where every creator has the opportunity to find their audience and thrive. Herazur is more than just a platform; it's a movement towards a more connected and appreciative creative ecosystem. We are constantly evolving, driven by feedback from our community, to provide the best possible experience for everyone.
            </p>
          </section>
        </motion.div>
      </div>
    </>
  );
};

export default About;
