import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Seo from '@/components/Seo';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { buildSupabaseSrcSet, optimizeSupabaseImageUrl } from '@/lib/utils';
import { DEFAULT_OG_IMAGE, SITE_URL, toAbsoluteUrl } from '@/lib/seo';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/components/ui/use-toast';

const getPostImage = (url) =>
  optimizeSupabaseImageUrl(url, { width: 960, quality: 80 }) || url;

const getPostSrcSet = (url) =>
  buildSupabaseSrcSet(url, [480, 720, 960], { quality: 80 });

const BlogPostCard = ({ post, isAdmin, onDelete }) => {
  const imageSrc = post.image_url ? getPostImage(post.image_url) : '';
  const imageSrcSet = post.image_url ? getPostSrcSet(post.image_url) : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="h-full flex flex-col overflow-hidden hover:shadow-lg transition-shadow duration-300">
        {post.image_url && (
          <Link to={`/blog/post/${post.slug}`} className="aspect-video overflow-hidden block">
            <img
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
              alt={post.title}
              src={imageSrc}
              srcSet={imageSrcSet || undefined}
              sizes="(max-width: 1024px) 100vw, 420px"
              loading="lazy"
              decoding="async"
              onError={(e) => {
                const target = e.currentTarget;
                target.onerror = null;
                if (post.image_url && target.src !== post.image_url) {
                  target.src = post.image_url;
                }
              }}
            />
          </Link>
        )}
        <CardHeader>
          <CardTitle className="text-xl leading-tight">
            <Link to={`/blog/post/${post.slug}`} className="hover:text-primary transition-colors">{post.title}</Link>
          </CardTitle>
          <CardDescription>
            {format(new Date(post.created_at), 'MMMM d, yyyy')}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow">
          <p className="text-muted-foreground line-clamp-3">
            {post.content?.substring(0, 150).replace(/#+\s/g, '') || 'No content preview available.'}...
          </p>
        </CardContent>
        <CardFooter className="flex justify-between items-center">
          <Button asChild variant="link" className="p-0">
            <Link to={`/blog/post/${post.slug}`}>Read More</Link>
          </Button>
          {isAdmin && (
            <div className="flex items-center gap-2">
              <Button asChild variant="ghost" size="icon">
                <Link to={`/blog/manage/${post.id}`}>
                  <Edit className="h-4 w-4" />
                </Link>
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the blog post titled "{post.title}".
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onDelete(post.id)} className="bg-destructive hover:bg-destructive/90">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  );
};

const Blog = () => {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const blogSchema = useMemo(() => {
    if (!posts || posts.length === 0) return null;

    return {
      '@context': 'https://schema.org',
      '@type': 'Blog',
      name: 'Herazur Blog',
      url: `${SITE_URL}/blog`,
      description:
        'Read the latest articles and updates from the Herazur team on creativity, community, and platform features.',
      blogPost: posts.slice(0, 12).map((post) => ({
        '@type': 'BlogPosting',
        headline: post.title,
        url: `${SITE_URL}/blog/post/${post.slug}`,
        datePublished: new Date(post.created_at).toISOString(),
        dateModified: new Date(post.updated_at || post.created_at).toISOString(),
        image: toAbsoluteUrl(post.image_url || DEFAULT_OG_IMAGE, SITE_URL),
      })),
    };
  }, [posts]);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Hata',
        description: 'Blog yazıları yüklenemedi.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (postId) => {
    if (!isAdmin) return;

    try {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;

      setPosts(posts.filter(p => p.id !== postId));
      toast({
        title: 'Başarılı',
        description: 'Blog yazısı silindi.',
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Hata',
        description: 'Silme işlemi başarısız.',
        variant: 'destructive',
      });
    }
  };
  
  return (
    <>
      <Seo
        title="Blog"
        description="Read the latest articles and updates from the Herazur team on creativity, community, and platform features."
        schema={blogSchema}
      />
      <div className="container mx-auto max-w-6xl py-12 px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold gradient-text">Herazur Blog</h1>
            <p className="text-muted-foreground mt-2">Latest articles, news, and updates.</p>
          </div>
          {isAdmin && (
            <Button asChild>
              <Link to="/blog/manage">
                <PlusCircle className="mr-2 h-4 w-4" />
                New Post
              </Link>
            </Button>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <Skeleton className="aspect-video w-full" />
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map(post => (
              <BlogPostCard key={post.id} post={post} isAdmin={isAdmin} onDelete={handleDelete} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 border-2 border-dashed rounded-lg">
            <h2 className="text-2xl font-semibold">No Posts Yet</h2>
            <p className="text-muted-foreground mt-2">
              {isAdmin ? "Click 'New Post' to get started!" : "Check back soon for new articles."}
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default Blog;
