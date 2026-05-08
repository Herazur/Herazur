import React from 'react';
import { ExternalLink } from 'lucide-react';
import {
  SiGithub,
  SiLinkedin,
  SiX,
  SiInstagram,
  SiYoutube,
  SiFacebook,
  SiSpotify,
  SiTiktok,
  SiPinterest,
  SiReddit,
  SiMedium,
  SiBehance,
  SiTwitch
} from 'react-icons/si';
import { cn } from '@/lib/utils';

const SocialIcon = ({ platform, className }) => {
  const baseClass = cn("h-5 w-5", className);

  const icons = {
    github: <SiGithub className={baseClass} />,
    linkedin: <SiLinkedin className={baseClass} />,
    twitter: <SiX className={baseClass} />,
    instagram: <SiInstagram className={baseClass} />,
    youtube: <SiYoutube className={baseClass} />,
    facebook: <SiFacebook className={baseClass} />,
    spotify: <SiSpotify className={baseClass} />,
    tiktok: <SiTiktok className={baseClass} />,
    pinterest: <SiPinterest className={baseClass} />,
    reddit: <SiReddit className={baseClass} />,
    medium: <SiMedium className={baseClass} />,
    behance: <SiBehance className={baseClass} />,
    twitch: <SiTwitch className={baseClass} />,
    website: <ExternalLink className={baseClass} />,
  };

  return icons[platform] || <ExternalLink className={baseClass} />;
};

export default SocialIcon;