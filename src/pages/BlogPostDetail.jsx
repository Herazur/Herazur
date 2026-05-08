import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Seo from '@/components/Seo';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { supabase } from '@/lib/customSupabaseClient';
import { DEFAULT_OG_IMAGE, SITE_URL, toAbsoluteUrl } from '@/lib/seo';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User, Calendar } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { buildSupabaseSrcSet, optimizeSupabaseImageUrl } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import { normalizeExternalUrl, normalizeMarkdownUrl } from '@/lib/sanitize';

const Markdown = ({ content }) => {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeSanitize]}
      components={{
        a: ({ href, children, ...props }) => {
          const safeHref = normalizeMarkdownUrl(href);
          if (!safeHref) return <span>{children}</span>;
          const isExternal = /^https?:\/\//i.test(safeHref) || /^mailto:/i.test(safeHref);
          return (
            <a
              {...props}
              href={safeHref}
              target={isExternal ? '_blank' : undefined}
              rel={isExternal ? 'noopener noreferrer' : undefined}
              className="text-primary hover:underline"
            >
              {children}
            </a>
          );
        },
        img: ({ src, alt, ...props }) => {
          const safeSrc = normalizeExternalUrl(src);
          if (!safeSrc) return null;
          return (
            <img
              {...props}
              src={safeSrc}
              alt={alt || ''}
              loading="lazy"
              decoding="async"
              className="rounded-lg"
            />
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
};

const AuthorCard = ({ author }) => {
  if (!author) return null;
  return (
    <Card className="mt-12">
      <CardContent className="p-6 flex items-center gap-4">
        <Link to={`/u/${author.username}`}>
          <Avatar className="h-16 w-16">
            <AvatarImage src={author.avatar_url} alt={author.name} />
            <AvatarFallback>{author.name?.charAt(0)}</AvatarFallback>
          </Avatar>
        </Link>
        <div>
          <p className="text-sm text-muted-foreground">Written by</p>
          <Link to={`/u/${author.username}`} className="text-lg font-bold hover:text-primary">{author.name}</Link>
          <p className="text-sm text-muted-foreground">@{author.username}</p>
        </div>
      </CardContent>
    </Card>
  );
};

const BlogPostDetail = () => {
  const { slug } = useParams();
  const { toast } = useToast();
  const [post, setPost] = useState(null);
  const [author, setAuthor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      setLoading(true);
      const { data: postData, error: postError } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .single();

      if (postError || !postData) {
        toast({ title: 'Error', description: 'Blog post not found.', variant: 'destructive' });
        setLoading(false);
        return;
      }
      setPost(postData);

      if (postData.author_id) {
        const { data: authorData, error: authorError } = await supabase
          .from('profiles')
          .select('name, username, avatar_url')
          .eq('user_id', postData.author_id)
          .single();
        
        if (!authorError) {
          setAuthor(authorData);
        }
      }
      
      setLoading(false);
    };

    fetchPost();
  }, [slug, toast]);

  const getMetaDescription = () => {
    if (!post?.content) return 'Read this article on Herazur.';
    return post.content.substring(0, 155).replace(/#+\s/g, '').trim() + '...';
  };

  if (loading) {
    return (
      <div className="container mx-auto max-w-3xl py-12 px-4">
        <Skeleton className="h-10 w-1/4 mb-8" />
        <Skeleton className="h-12 w-full mb-4" />
        <Skeleton className="h-8 w-3/4 mb-8" />
        <Skeleton className="aspect-video w-full mb-8" />
        <Skeleton className="h-6 w-full mb-4" />
        <Skeleton className="h-6 w-full mb-4" />
        <Skeleton className="h-6 w-5/6 mb-4" />
      </div>
    );
  }

  if (!post) {
    return (
      <>
        <Seo title="Post Not Found" noindex />
        <div className="container mx-auto text-center py-20">
          <h1 className="text-3xl font-bold">Post Not Found</h1>
          <p className="text-muted-foreground mt-2">The blog post you're looking for doesn't exist.</p>
          <Button asChild className="mt-6">
            <Link to="/blog">Back to Blog</Link>
          </Button>
        </div>
      </>
    );
  }

  const postUrl = `${SITE_URL}/blog/post/${post.slug}`;
  const publishedTime = new Date(post.created_at).toISOString();
  const modifiedTime = new Date(post.updated_at || post.created_at).toISOString();
  const authorName = author?.name || 'Herazur Team';
  const authorUrl = author?.username ? `${SITE_URL}/u/${author.username}` : null;
  const postImage = post.image_url || DEFAULT_OG_IMAGE;
  const absolutePostImage = toAbsoluteUrl(postImage, SITE_URL);
  const heroImage = optimizeSupabaseImageUrl(post.image_url, { width: 1200, quality: 80 }) || post.image_url;
  const heroSrcSet = post.image_url
    ? buildSupabaseSrcSet(post.image_url, [640, 960, 1200], { quality: 80 })
    : '';
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    image: [absolutePostImage],
    author: {
      '@type': 'Person',
      name: authorName,
      ...(authorUrl ? { url: authorUrl } : {}),
    },
    publisher: {
      '@type': 'Organization',
      name: 'Herazur',
      logo: {
        '@type': 'ImageObject',
        url: toAbsoluteUrl(DEFAULT_OG_IMAGE, SITE_URL),
      },
    },
    datePublished: publishedTime,
    dateModified: modifiedTime,
    description: getMetaDescription(),
    url: postUrl,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': postUrl,
    },
  };
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog` },
      { '@type': 'ListItem', position: 3, name: post.title, item: postUrl },
    ],
  };
  const combinedSchema = [structuredData, breadcrumbSchema].filter(Boolean);

  return (
    <>
      <Seo
        title={`${post.title} - Blog`}
        description={getMetaDescription()}
        image={postImage}
        imageAlt={post.title}
        url={postUrl}
        canonical={postUrl}
        type="article"
        publishedTime={publishedTime}
        modifiedTime={modifiedTime}
        author={authorName}
        section="Blog"
        schema={combinedSchema}
      />
      <motion.article
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="container mx-auto max-w-3xl py-12 px-4"
      >
        <Button variant="ghost" asChild className="mb-8">
          <Link to="/blog">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Blog
          </Link>
        </Button>

        <header>
          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-4 gradient-text">
            {post.title}
          </h1>
          <div className="flex items-center gap-6 text-muted-foreground mb-8 text-sm">
            {author ? (
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={author.avatar_url} alt={author.name} />
                  <AvatarFallback>{author.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <Link to={`/u/${author.username}`} className="hover:text-primary">{author.name}</Link>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>Herazur Team</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <time dateTime={new Date(post.created_at).toISOString()}>
                {format(new Date(post.created_at), 'MMMM d, yyyy')}
              </time>
            </div>
          </div>
        </header>

        {post.image_url && (
          <div className="aspect-video rounded-lg overflow-hidden mb-8 shadow-lg">
            <img
              className="w-full h-full object-cover"
              src={heroImage || post.image_url}
              srcSet={heroSrcSet || undefined}
              sizes="(max-width: 1024px) 100vw, 768px"
              alt={post.title}
              loading="eager"
              decoding="async"
              fetchPriority="high"
              onError={(e) => {
                const target = e.currentTarget;
                target.onerror = null;
                if (post.image_url && target.src !== post.image_url) {
                  target.src = post.image_url;
                }
              }}
            />
          </div>
        )}

        <div className="prose prose-lg dark:prose-invert max-w-none">
          <Markdown content={post.content || ''} />
        </div>

        <AuthorCard author={author} />
      </motion.article>
    </>
  );
};

export default BlogPostDetail;
