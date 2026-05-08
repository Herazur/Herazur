export const SITE_NAME = 'Herazur';
export const SITE_URL = import.meta.env.VITE_SITE_URL || 'https://herazur.com';
export const DEFAULT_DESCRIPTION =
  'Discover people, showcase your profile, and connect with a vibrant community on Herazur.';
export const DEFAULT_OG_IMAGE =
  'https://horizons-cdn.hostinger.com/5282b176-8f74-4659-a4e9-aade9fc3d869/6e97d26a2fd63a1eaf7468127f18b1bf.png';
export const DEFAULT_TWITTER_CARD = 'summary_large_image';
export const DEFAULT_LOCALE = 'en_US';

export const toAbsoluteUrl = (url, baseUrl = SITE_URL) => {
  if (!url) return baseUrl;
  if (/^https?:\/\//i.test(url)) return url;
  const base = String(baseUrl || '').replace(/\/$/, '');
  const path = String(url).startsWith('/') ? url : `/${url}`;
  return `${base}${path}`;
};
