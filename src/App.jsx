import React, { useEffect, Suspense, lazy } from 'react';
    import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
    import Layout from '@/components/Layout';
    import { useAuth } from '@/contexts/SupabaseAuthContext';
    import { Skeleton } from '@/components/ui/skeleton';
    import { useToast } from '@/components/ui/use-toast';

    const Home = lazy(() => import('@/pages/Home.jsx'));
    const Discover = lazy(() => import('@/pages/Discover.jsx'));
    const Profile = lazy(() => import('@/pages/Profile.jsx'));
    const CreateProfile = lazy(() => import('@/pages/CreateProfile.jsx'));
    const EditProfile = lazy(() => import('@/pages/EditProfile.jsx'));
    const Promote = lazy(() => import('@/pages/Promote.jsx'));
    const PromoteSuccess = lazy(() => import('@/pages/PromoteSuccess.jsx'));
    const PromoteCancel = lazy(() => import('@/pages/PromoteCancel.jsx'));
    const Privacy = lazy(() => import('@/pages/Privacy.jsx'));
    const Terms = lazy(() => import('@/pages/Terms.jsx'));
    const AuthPage = lazy(() => import('@/pages/AuthPage.jsx'));
    const UpdatePasswordPage = lazy(() => import('@/pages/UpdatePasswordPage.jsx'));
    const ActivityPage = lazy(() => import('@/pages/ActivityPage.jsx'));
    const Stats = lazy(() => import('@/pages/Stats.jsx'));
    const LeaderboardPage = lazy(() => import('@/pages/LeaderboardPage.jsx'));
    const Events = lazy(() => import('@/pages/Events.jsx'));
    const Contact = lazy(() => import('@/pages/Contact.jsx'));
    const LearnVisibility = lazy(() => import('@/pages/LearnVisibility.jsx'));
    const Blog = lazy(() => import('@/pages/Blog.jsx'));
    const ManageBlogPost = lazy(() => import('@/pages/ManageBlogPost.jsx'));
    const BlogPostDetail = lazy(() => import('@/pages/BlogPostDetail.jsx'));
    const VibeHistory = lazy(() => import('@/pages/VibeHistory.jsx'));
    const About = lazy(() => import('@/pages/About.jsx'));
    const NotFound = lazy(() => import('@/pages/NotFound.jsx'));

    const PageLoader = () => (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <Skeleton className="h-32 w-full" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-20 w-full" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-64 w-full" />)}
        </div>
      </div>
    );

    function App() {
      const location = useLocation();
      const navigate = useNavigate();
      const { user, profile, loading, isRecoveryMode } = useAuth();
      const { toast } = useToast();

      useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const hashParams = new URLSearchParams(location.hash.replace(/^#/, ''));
        const errorCode = searchParams.get('error_code') || hashParams.get('error_code');

        if (!errorCode) return;

        const isExpiredOtp = errorCode === 'otp_expired';
        toast({
          title: isExpiredOtp ? 'Reset Link Expired' : 'Authentication Error',
          description: isExpiredOtp
            ? 'This password reset link has expired or was already used. Please request a new reset link.'
            : searchParams.get('error_description') || hashParams.get('error_description') || 'Please try again.',
          variant: 'destructive',
          duration: 8000,
        });

        navigate(isExpiredOtp ? '/auth?view=forgot_password' : '/auth', { replace: true });
      }, [location.search, location.hash, navigate, toast]);

      useEffect(() => {
        if (loading) return;

        if (isRecoveryMode && location.pathname !== '/update-password') {
          navigate('/update-password', { replace: true });
          return;
        }

        const authRoutes = ['/auth', '/login', '/update-password'];
        const publicRoutes = ['/', '/discover', '/leaderboard', '/privacy', '/terms', '/events', '/contact', '/learn/visibility', '/blog', '/about'];
        
        const isPublic = publicRoutes.includes(location.pathname) || location.pathname.startsWith('/u/') || location.pathname.startsWith('/blog/');
        const isAuth = authRoutes.includes(location.pathname);
        
        if (user) {
          if (isAuth && location.pathname !== '/update-password') {
            const returnTo = sessionStorage.getItem('returnTo');
            sessionStorage.removeItem('returnTo');
            navigate(returnTo || '/');
            return;
          }
          
          if (!profile && !['/create', '/blog', '/blog/manage', '/vibe-history'].some(p => location.pathname.startsWith(p))) {
            navigate('/create', { replace: true });
            return;
          }
          
          if (profile && location.pathname === '/create') {
            navigate(`/u/${profile.username}`, { replace: true });
            return;
          }
        } else {
          if (!isPublic && !isAuth && !isRecoveryMode) {
            sessionStorage.setItem('returnTo', location.pathname + location.search);
            navigate('/auth');
          }
        }
      }, [loading, user, profile, navigate, location.pathname, location.search, isRecoveryMode]);


      return (
        <Layout>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/discover" element={<Discover />} />
              <Route path="/leaderboard" element={<LeaderboardPage />} />
              <Route path="/u/:username" element={<Profile />} />
              <Route path="/create" element={<CreateProfile />} />
              <Route path="/edit-profile" element={<EditProfile />} />
              <Route path="/promote" element={<Promote />} />
              <Route path="/promote/success" element={<PromoteSuccess />} />
              <Route path="/promote/cancel" element={<PromoteCancel />} />
              <Route path="/activity" element={<ActivityPage />} />
              <Route path="/stats" element={<Stats />} />
              <Route path="/events" element={<Events />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/learn/visibility" element={<LearnVisibility />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/login" element={<AuthPage />} />
              <Route path="/update-password" element={<UpdatePasswordPage />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/post/:slug" element={<BlogPostDetail />} />
              <Route path="/blog/manage" element={<ManageBlogPost />} />
              <Route path="/blog/manage/:postId" element={<ManageBlogPost />} />
              <Route path="/vibe-history" element={<VibeHistory />} />
              <Route path="/about" element={<About />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </Layout>
      );
    }

    export default App;
