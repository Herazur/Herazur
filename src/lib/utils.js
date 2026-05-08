import { clsx } from 'clsx';
    import { twMerge } from 'tailwind-merge';

    export function cn(...inputs) {
      return twMerge(clsx(inputs));
    }

    export function formatViews(num) {
      if (num === null || num === undefined) {
        return '0';
      }
      if (num >= 1000000) {
        return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
      }
      if (num >= 1000) {
        return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
      }
      return num.toString();
    }

    export function optimizeSupabaseImageUrl(url, options = {}) {
      if (!url) return url;
      if (!/^https?:\/\//i.test(url)) return url;
      const lower = String(url).toLowerCase();
      if (lower.endsWith('.gif') || lower.includes('.gif?')) return url;

      const {
        width,
        height,
        quality = 80,
        resize,
      } = options;

      try {
        const u = new URL(url);
        const objectPath = '/storage/v1/object/public/';
        const renderPath = '/storage/v1/render/image/public/';

        if (u.pathname.includes(objectPath)) {
          u.pathname = u.pathname.replace(objectPath, renderPath);
        } else if (!u.pathname.includes(renderPath)) {
          return url;
        }

        if (width) u.searchParams.set('width', String(Math.round(width)));
        if (height) u.searchParams.set('height', String(Math.round(height)));
        if (quality) u.searchParams.set('quality', String(Math.round(quality)));
        if (resize) u.searchParams.set('resize', resize);

        return u.toString();
      } catch {
        return url;
      }
    }

    export function buildSupabaseSrcSet(url, widths = [], options = {}) {
      if (!url || !Array.isArray(widths)) return '';
      const normalized = widths
        .map((w) => Number(w))
        .filter((w) => Number.isFinite(w) && w > 0);
      if (normalized.length === 0) return '';

      const entries = [];
      const seen = new Set();

      normalized.forEach((w) => {
        const src = optimizeSupabaseImageUrl(url, { ...options, width: w });
        if (!src || seen.has(src)) return;
        seen.add(src);
        entries.push(`${src} ${Math.round(w)}w`);
      });

      return entries.length > 1 ? entries.join(', ') : '';
    }
