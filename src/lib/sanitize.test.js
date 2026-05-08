import { describe, expect, it } from 'vitest';
import {
  findInvalidSocialLink,
  normalizeExternalUrl,
  normalizeMarkdownUrl,
  sanitizeSearchQuery,
  sanitizeSocialLinks,
} from './sanitize';

describe('sanitize helpers', () => {
  it('allows safe external links and adds https to bare domains', () => {
    expect(normalizeExternalUrl('example.com/profile')).toBe('https://example.com/profile');
    expect(normalizeExternalUrl('https://example.com/a?b=1')).toBe('https://example.com/a?b=1');
    expect(normalizeExternalUrl('mailto:test@example.com')).toBe('mailto:test@example.com');
  });

  it('blocks executable and malformed links', () => {
    expect(normalizeExternalUrl('javascript:alert(1)')).toBe('');
    expect(normalizeExternalUrl('data:text/html,<script>alert(1)</script>')).toBe('');
    expect(normalizeExternalUrl('mailto:not-an-email')).toBe('');
  });

  it('sanitizes profile social links', () => {
    const result = sanitizeSocialLinks([
      { platform: 'GitHub', url: 'github.com/user' },
      { platform: 'website', url: 'javascript:alert(1)' },
      { platform: '', url: 'https://example.com' },
    ]);

    expect(result).toEqual([{ platform: 'github', url: 'https://github.com/user' }]);
    expect(findInvalidSocialLink([{ platform: 'website', url: 'javascript:alert(1)' }])).toBeTruthy();
  });

  it('allows markdown relative links but blocks unsafe protocols', () => {
    expect(normalizeMarkdownUrl('/blog/post/test')).toBe('/blog/post/test');
    expect(normalizeMarkdownUrl('#section')).toBe('#section');
    expect(normalizeMarkdownUrl('javascript:alert(1)')).toBe('');
  });

  it('removes PostgREST grammar characters from search terms', () => {
    expect(sanitizeSearchQuery('alice,bob%(admin)')).toBe('alice bob admin');
    expect(sanitizeSearchQuery('a'.repeat(100))).toHaveLength(80);
  });
});
