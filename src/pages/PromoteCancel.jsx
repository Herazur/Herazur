import React, { useEffect } from 'react';
import Seo from '@/components/Seo';
import { motion } from 'framer-motion';
import { XCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';

const PromoteCancel = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    toast({
      title: 'Payment Canceled',
      description: 'Your payment process was canceled. You can try again anytime.',
      variant: 'destructive',
      duration: 5000,
    });
    
    // Clean up URL
    navigate(location.pathname, { replace: true });
  }, [toast, navigate, location.pathname]);

  return (
    <>
      <Seo
        title="Payment Canceled"
        description="Your profile promotion payment was canceled."
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
                className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30"
              >
                <XCircle className="h-12 w-12 text-red-500" />
              </motion.div>
              <CardTitle className="text-3xl font-bold mt-6">Transaction Canceled</CardTitle>
              <CardDescription className="text-lg text-muted-foreground mt-2">
                You did not complete the payment process. Don't worry about your profile, everything is as before.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <p>
                If you change your mind, you can always review our promotion plans again.
              </p>
              <Button asChild size="lg" className="w-full">
                <Link to="/promote">
                  Review Plans Again <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </>
  );
};

export default PromoteCancel;
