import React from 'react';
import { Helmet } from 'react-helmet';
import { useLocation } from 'react-router-dom';
import {
  SITE_NAME,
  SITE_URL,
  DEFAULT_DESCRIPTION,
  DEFAULT_OG_IMAGE,
  DEFAULT_TWITTER_CARD,
  DEFAULT_LOCALE,
  toAbsoluteUrl,
} from '@/lib/seo';

const buildTitle = (title) => {
  if (!title) return SITE_NAME;
  if (String(title).includes(SITE_NAME)) return title;
  return `${title} | ${SITE_NAME}`;
};

export default function Seo({
  title,
  description,
  image,
  imageAlt,
  url,
  type = 'website',
  noindex = false,
  canonical,
  schema,
  locale = DEFAULT_LOCALE,
  publishedTime,
  modifiedTime,
  author,
  section,
  tags,
}) {
  const location = useLocation();
  const path = location?.pathname || '/';

  const fullTitle = buildTitle(title);
  const metaDescription = description || DEFAULT_DESCRIPTION;
  const canonicalUrl = toAbsoluteUrl(canonical || path, SITE_URL);
  const ogUrl = toAbsoluteUrl(url || canonical || path, SITE_URL);
  const metaImage = toAbsoluteUrl(image || DEFAULT_OG_IMAGE, SITE_URL);
  const metaImageAlt = imageAlt || title || SITE_NAME;
  const robots = noindex ? 'noindex, nofollow' : 'index, follow';

  const schemaList = Array.isArray(schema)
    ? schema
    : schema
      ? [schema]
      : [];
  const articleTags = Array.isArray(tags) ? tags.filter(Boolean) : [];
  const showArticleMeta =
    type === 'article' ||
    publishedTime ||
    modifiedTime ||
    author ||
    section ||
    articleTags.length > 0;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />
      <meta name="robots" content={robots} />
      <link rel="canonical" href={canonicalUrl} />

      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={ogUrl} />
      <meta property="og:image" content={metaImage} />
      <meta property="og:image:alt" content={metaImageAlt} />
      <meta property="og:locale" content={locale} />

      <meta name="twitter:card" content={DEFAULT_TWITTER_CARD} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={metaImage} />

      {showArticleMeta && publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {showArticleMeta && modifiedTime && (
        <meta property="article:modified_time" content={modifiedTime} />
      )}
      {showArticleMeta && author && <meta property="article:author" content={author} />}
      {showArticleMeta && section && <meta property="article:section" content={section} />}
      {showArticleMeta &&
        articleTags.map((tag, index) => (
          <meta key={`article-tag-${index}`} property="article:tag" content={tag} />
        ))}

      {schemaList.map((entry, index) => (
        <script key={`schema-${index}`} type="application/ld+json">
          {JSON.stringify(entry)}
        </script>
      ))}
    </Helmet>
  );
}
