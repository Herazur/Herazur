import React, { useEffect } from 'react';
import Seo from '@/components/Seo';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useData } from '@/contexts/DataContext';

const PromoteSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { refreshProfile } = useAuth();
  const { fetchProfiles } = useData();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const sessionId = searchParams.get('session_id');

    if (sessionId) {
      toast({
        title: 'Payment Successful!',
        description: 'Your profile boost is now active. Enjoy increased visibility!',
        duration: 5000,
      });

      // Refresh user's profile and all profiles to show the new boost status
      refreshProfile();
      fetchProfiles();

      // Clean up URL params
      navigate(location.pathname, { replace: true });
    }
  }, [toast, navigate, location, refreshProfile, fetchProfiles]);

  return (
    <>
      <Seo
        title="Payment Successful"
        description="Your profile promotion payment was successfully completed."
        noindex
      />
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, type: 'spring' }}
        >
          <Card className="w-full max-w-md text-center shadow-2xl">
            <CardHeader>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, duration: 0.5, type: 'spring', stiffness: 150 }}
                className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30"
              >
                <CheckCircle className="h-12 w-12 text-green-500" />
              </motion.div>
              <CardTitle className="text-3xl font-bold mt-6">Payment Successful!</CardTitle>
              <CardDescription className="text-lg text-muted-foreground mt-2">
                Your profile boost has been successfully activated. Your visibility has already started to increase!
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <p>
                Your profile will now reach more people. You can check your statistics page to track your interactions.
              </p>
              <Button asChild size="lg" className="w-full">
                <Link to="/discover">
                  Back to Discover <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </>
  );
};

export default PromoteSuccess;
