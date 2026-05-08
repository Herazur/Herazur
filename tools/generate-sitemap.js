#!/usr/bin/env node

import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const loadEnvFile = (fileName) => {
  const filePath = path.join(process.cwd(), fileName);
  if (!fsSync.existsSync(filePath)) return;

  const lines = fsSync.readFileSync(filePath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;

    const [, key, rawValue] = match;
    if (process.env[key]) continue;

    process.env[key] = rawValue
      .trim()
      .replace(/^['"]|['"]$/g, '');
  }
};

loadEnvFile('.env.local');
loadEnvFile('.env');

const SITE_URL = process.env.VITE_SITE_URL || 'https://herazur.com';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const OUTPUT_PATH = path.join(process.cwd(), 'public', 'sitemap.xml');
const PAGE_SIZE = 1000;

const STATIC_ROUTES = [
  { loc: '/', changefreq: 'daily', priority: 1.0 },
  { loc: '/discover', changefreq: 'daily', priority: 0.9 },
  { loc: '/leaderboard', changefreq: 'daily', priority: 0.8 },
  { loc: '/events', changefreq: 'weekly', priority: 0.7 },
  { loc: '/blog', changefreq: 'daily', priority: 0.7 },
  { loc: '/learn/visibility', changefreq: 'monthly', priority: 0.6 },
  { loc: '/about', changefreq: 'monthly', priority: 0.5 },
  { loc: '/contact', changefreq: 'monthly', priority: 0.5 },
  { loc: '/privacy', changefreq: 'yearly', priority: 0.3 },
  { loc: '/terms', changefreq: 'yearly', priority: 0.3 },
];

const toAbsoluteUrl = (loc) => {
  const base = SITE_URL.replace(/\/$/, '');
  const pathPart = loc.startsWith('/') ? loc : `/${loc}`;
  return `${base}${pathPart}`;
};

const escapeXml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const buildUrlEntry = ({ loc, lastmod, changefreq, priority }) => {
  const tags = [
    `<loc>${escapeXml(loc)}</loc>`,
    lastmod ? `<lastmod>${escapeXml(lastmod)}</lastmod>` : null,
    changefreq ? `<changefreq>${escapeXml(changefreq)}</changefreq>` : null,
    typeof priority === 'number' ? `<priority>${priority.toFixed(1)}</priority>` : null,
  ].filter(Boolean);

  return `<url>${tags.join('')}</url>`;
};

const fetchAllRows = async (table, selectFields) => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return [];
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const rows = [];

  for (let from = 0; ; from += PAGE_SIZE) {
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await supabase
      .from(table)
      .select(selectFields)
      .range(from, to);

    if (error) throw error;
    if (!data || data.length === 0) break;

    rows.push(...data);
    if (data.length < PAGE_SIZE) break;
  }

  return rows;
};

const toIsoDate = (value) => {
  if (!value) return null;
  try {
    return new Date(value).toISOString();
  } catch {
    return null;
  }
};

async function main() {
  if ((!SUPABASE_URL || !SUPABASE_ANON_KEY)) {
    try {
      await fs.access(OUTPUT_PATH);
      console.warn('WARN: Supabase env is missing; keeping existing sitemap.xml.');
      return;
    } catch {
      console.warn('WARN: Supabase env is missing; writing static sitemap only.');
    }
  }

  const entries = STATIC_ROUTES.map((route) => ({
    ...route,
    loc: toAbsoluteUrl(route.loc),
  }));

  try {
    const profiles = await fetchAllRows('profiles_ranked_v3_enhanced', 'username, updated_at');
    profiles
      .filter((profile) => profile?.username)
      .forEach((profile) => {
        entries.push({
          loc: toAbsoluteUrl(`/u/${encodeURIComponent(profile.username)}`),
          lastmod: toIsoDate(profile.updated_at),
          changefreq: 'weekly',
          priority: 0.6,
        });
      });
  } catch (error) {
    console.error('ERROR: Unable to fetch profiles for sitemap.', error.message || error);
  }

  try {
    const posts = await fetchAllRows('blog_posts', 'slug, updated_at, created_at');
    posts
      .filter((post) => post?.slug)
      .forEach((post) => {
        entries.push({
          loc: toAbsoluteUrl(`/blog/post/${encodeURIComponent(post.slug)}`),
          lastmod: toIsoDate(post.updated_at || post.created_at),
          changefreq: 'monthly',
          priority: 0.7,
        });
      });
  } catch (error) {
    console.error('ERROR: Unable to fetch blog posts for sitemap.', error.message || error);
  }

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries.map(buildUrlEntry),
    '</urlset>',
  ].join('\n');

  await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await fs.writeFile(OUTPUT_PATH, xml, 'utf8');
  console.log(`Sitemap written to ${OUTPUT_PATH}`);
}

const isMainModule = import.meta.url === `file://${process.argv[1]}`;

if (isMainModule) {
  main().catch((error) => {
    console.error('ERROR: Failed to generate sitemap.', error.message || error);
    process.exit(0);
  });
}
