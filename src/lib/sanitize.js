const SAFE_EXTERNAL_PROTOCOLS = new Set(['http:', 'https:', 'mailto:']);
const MAX_SEARCH_LENGTH = 80;

const hasProtocol = (value) => /^[a-z][a-z\d+\-.]*:/i.test(value);
const stripControlCharacters = (value) =>
  String(value || '')
    .split('')
    .filter((char) => {
      const code = char.charCodeAt(0);
      return code >= 32 && code !== 127;
    })
    .join('');

export const normalizeExternalUrl = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return '';

  const candidate = hasProtocol(raw) ? raw : `https://${raw}`;

  try {
    const url = new URL(candidate);
    const protocol = url.protocol.toLowerCase();

    if (!SAFE_EXTERNAL_PROTOCOLS.has(protocol)) return '';

    if (protocol === 'mailto:') {
      const address = decodeURIComponent(url.pathname || '').trim();
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address) ? `mailto:${address}` : '';
    }

    if (!url.hostname || /[\s<>]/.test(url.hostname)) return '';
    return url.toString();
  } catch {
    return '';
  }
};

export const isSafeExternalUrl = (value) => Boolean(normalizeExternalUrl(value));

export const normalizeMarkdownUrl = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return '';

  if (raw.startsWith('/') || raw.startsWith('#')) {
    return stripControlCharacters(raw);
  }

  return normalizeExternalUrl(raw);
};

export const sanitizeSocialLinks = (links = []) => {
  if (!Array.isArray(links)) return [];

  return links
    .map((link) => {
      const platform = String(link?.platform || '').trim().toLowerCase();
      const url = normalizeExternalUrl(link?.url);
      return platform && url ? { platform, url } : null;
    })
    .filter(Boolean)
    .slice(0, 5);
};

export const findInvalidSocialLink = (links = []) => {
  if (!Array.isArray(links)) return null;

  return links.find((link) => {
    const platform = String(link?.platform || '').trim();
    const url = String(link?.url || '').trim();
    if (!platform && !url) return false;
    return !platform || !url || !normalizeExternalUrl(url);
  }) || null;
};

export const sanitizeSearchQuery = (value) => {
  return String(value || '')
    .normalize('NFKC')
    .split('')
    .map((char) => {
      const code = char.charCodeAt(0);
      return code < 32 || code === 127 ? ' ' : char;
    })
    .join('')
    .replace(/[,%()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_SEARCH_LENGTH);
};
