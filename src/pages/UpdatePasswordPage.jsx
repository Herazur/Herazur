import React, { useState, useEffect } from 'react';
import Seo from '@/components/Seo';
import { motion } from 'framer-motion';
import { Loader2, KeyRound } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';

function UpdatePasswordPage() {
  const { updatePassword, loading: authLoading, isRecoveryMode, session } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Wait for auth to finish loading before checking access
    if (authLoading) return;

    // Allow access if in recovery mode OR if user has a valid session
    if (!isRecoveryMode && !session) {
      navigate('/auth', { replace: true });
      toast({
        title: 'Access Denied',
        description: 'Please use the password reset link sent to your email.',
        variant: 'destructive',
      });
    }
  }, [isRecoveryMode, session, authLoading, navigate, toast]);

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    
    if (password.length < 8) {
      return toast({ 
        title: "Password Too Short", 
        description: "Please use a password with at least 8 characters.", 
        variant: "destructive" 
      });
    }
    
    if (password !== confirmPassword) {
      return toast({ 
        title: "Passwords Don't Match", 
        description: "Please ensure both passwords are the same.", 
        variant: "destructive" 
      });
    }
    
    // Check if we have a valid session for password update
    if (!session?.access_token) {
      return toast({ 
        title: "Session Expired", 
        description: "Your password reset link has expired. Please request a new one.", 
        variant: "destructive" 
      });
    }

    setSubmitting(true);
    const success = await updatePassword(password);
    setSubmitting(false);
    
    if (success) {
      // Password update successful, context will handle navigation
      toast({
        title: "Password Updated",
        description: "Please log in with your new password.",
      });
    }
  };

  const cardVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  // Show loading spinner while auth initializes
  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-128px)]">
        <Loader2 className="h-10 w-10 animate-spin" />
      </div>
    );
  }

  // Don't render if conditions aren't met (after auth loading completes)
  if (!isRecoveryMode && !session) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[calc(100vh-128px)]">
      <Seo
        title="Update Password"
        description="Update your password on Herazur."
        noindex
      />
      <motion.div
        variants={cardVariants}
        initial="initial"
        animate="animate"
        className="w-full max-w-md"
      >
        <Card className="shadow-2xl shadow-primary/10">
          <CardHeader className="text-center p-6">
            <KeyRound className="mx-auto h-12 w-12 text-primary" />
            <CardTitle className="text-3xl font-bold gradient-text mt-4">
              Set New Password
            </CardTitle>
            <CardDescription className="pt-2">
              Create a new, strong password for your account.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleUpdatePassword}>
            <CardContent className="p-6 flex flex-col gap-4">
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="password">New Password</Label>
                <Input 
                  type="password" 
                  id="password" 
                  placeholder="••••••••" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                  minLength={8}
                  autoComplete="new-password"
                />
              </div>
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input 
                  type="password" 
                  id="confirm-password" 
                  placeholder="••••••••" 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  required 
                  minLength={8}
                  autoComplete="new-password"
                />
              </div>
              <Button type="submit" className="w-full h-12 text-base" disabled={submitting || authLoading}>
                {(submitting || authLoading) ? <Loader2 className="h-6 w-6 animate-spin" /> : 'Update Password'}
              </Button>
            </CardContent>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}

export default UpdatePasswordPage;
