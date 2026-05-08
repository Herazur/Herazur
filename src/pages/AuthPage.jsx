import React, { useState, useEffect, useMemo, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Github, Loader2, Mail, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import Seo from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { supabase } from "@/lib/customSupabaseClient";

const GoogleIcon = (props) => (
  <svg viewBox="0 0 48 48" aria-hidden="true" {...props}>
    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C42.021,35.596,44,30.138,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
  </svg>
);

const ConfirmationScreen = ({ title, description, actionLabel, onAction, actionDisabled, onBack }) => (
  <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[calc(100vh-128px)]">
    <motion.div
      variants={{
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0, transition: { duration: 0.5 } },
      }}
      initial="initial"
      animate="animate"
      className="w-full max-w-md"
    >
      <Card className="bg-background/60 backdrop-blur-lg border-border/30">
        <CardHeader className="text-center">
          <Mail className="mx-auto h-12 w-12 text-primary" aria-hidden="true" />
          <CardTitle className="text-3xl font-bold mt-4">{title}</CardTitle>
          <CardDescription className="pt-2">{description}</CardDescription>
        </CardHeader>
        <CardFooter className="flex flex-col gap-2">
          {onAction && (
            <Button onClick={onAction} disabled={actionDisabled} className="w-full">
              {actionDisabled && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {actionLabel}
            </Button>
          )}
          <Button variant="link" onClick={onBack}>Back to Log In</Button>
        </CardFooter>
      </Card>
    </motion.div>
  </div>
);

function AuthPage() {
  const {
    user,
    profile,
    loading: authLoading,
    isRecoveryMode,
    signIn,
    signUp,
    signInWithProvider,
    sendPasswordResetEmail,
    setLoading,
  } = useAuth();

  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [authView, setAuthView] = useState(() => {
    const view = new URLSearchParams(location.search).get("view");
    return view === "forgot_password" ? "forgot_password" : "login";
  }); // 'login' | 'signup' | 'forgot_password'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmationMessage, setShowConfirmationMessage] = useState(false);
  const [showResetPasswordMessage, setShowResetPasswordMessage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const emailInputRef = useRef(null);

  const cardVariants = useMemo(
    () => ({
      initial: { opacity: 0, y: 20, scale: 0.98 },
      animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
      exit: { opacity: 0, y: -20, scale: 0.98, transition: { duration: 0.3, ease: [0.6, -0.05, 0.73, 0.99] } },
    }),
    []
  );

  const isEmailValid = (v) => /[^\s@]+@[^\s@]+\.[^\s@]+/.test(v);
  const isPasswordValid = (v) => v.length >= 8;

  // Check for recovery mode and redirect
  useEffect(() => {
    if (isRecoveryMode && window.location.pathname !== '/update-password') {
      navigate('/update-password', { replace: true });
    }
  }, [isRecoveryMode, navigate]);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const hashParams = new URLSearchParams(location.hash.replace(/^#/, ""));
    const view = searchParams.get("view");
    const errorCode = searchParams.get("error_code") || hashParams.get("error_code");

    if (view === "forgot_password" && authView !== "forgot_password") {
      setAuthView("forgot_password");
    }

    if (errorCode === "otp_expired") {
      setAuthView("forgot_password");
      toast({ title: "Link Expired", description: "Your reset link has expired or was already used. Please request a new reset link.", variant: "destructive", duration: 8000 });
      navigate("/auth?view=forgot_password", { replace: true });
    }
  }, [authView, location.hash, location.search, navigate, toast]);

  useEffect(() => {
    // Don't redirect if in recovery mode
    if (isRecoveryMode) return;

    if (!authLoading && user) {
      const returnTo = sessionStorage.getItem('returnTo');
      sessionStorage.removeItem('returnTo');
      if (profile) {
        navigate(returnTo || `/u/${profile.username}`, { replace: true });
      } else {
        navigate(returnTo || "/create", { replace: true });
      }
    }
  }, [authLoading, user, profile, isRecoveryMode, navigate]);

  useEffect(() => {
    emailInputRef.current?.focus();
  }, [authView]);

  const handleResendConfirmation = async () => {
    setSubmitting(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth` },
    });
    setSubmitting(false);
    if (error) {
      const isRateLimitError = error.status === 429 || String(error.message).toLowerCase().includes("rate limit");
      toast({
        title: "Resend Failed",
        description: isRateLimitError
          ? "You've tried resending too many times. Please wait a while."
          : error.message,
        variant: "destructive",
      });
    } else {
      setShowConfirmationMessage(true);
      toast({
        title: "Confirmation Email Sent",
        description: "Please check your inbox and spam folder.",
      });
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    if (!isEmailValid(email)) {
      return toast({ title: "Invalid email", description: "Please enter a valid email address.", variant: "destructive" });
    }
    setSubmitting(true);
    const success = await sendPasswordResetEmail(email);
    setSubmitting(false);
    if (success) setShowResetPasswordMessage(true);
  };

  const handleAuthAction = async (e) => {
    e.preventDefault();
    if (submitting) return;
    const emailOk = isEmailValid(email);
    const passOk = isPasswordValid(password);

    if (authView !== "forgot_password" && (!emailOk || (authView === "signup" && !passOk))) {
      return toast({
        title: "Validation Error",
        description: !emailOk ? "Please provide a valid email." : "Password must be at least 8 characters.",
        variant: "destructive",
      });
    }

    try {
      setSubmitting(true);
      if (authView === "signup") {
        const { success, isUnconfirmedUser, error } = await signUp(email, password);
        if (success) {
          setShowConfirmationMessage(true);
        } else if (isUnconfirmedUser) {
          toast({
            title: "Account Exists",
            description: "This email is already registered but not confirmed. Would you like to resend the confirmation email?",
            action: <ToastAction onClick={handleResendConfirmation}>Resend</ToastAction>,
            duration: 10000,
          });
        } else if (error) {
          toast({ title: "Sign Up Failed", description: String(error.message || error), variant: "destructive" });
        }
      } else {
        const { success, isEmailNotConfirmed, error } = await signIn(email, password);
        if (!success) {
          if (isEmailNotConfirmed) {
            toast({
              title: "Email Not Confirmed",
              description: "Please check your inbox for the confirmation link. Need a new one?",
              action: <ToastAction onClick={handleResendConfirmation}>Resend</ToastAction>,
              duration: 10000,
            });
          } else {
            toast({ title: "Login Failed", description: String(error?.message || error || "Unknown error"), variant: "destructive" });
          }
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  const headTitle = useMemo(() => (authView === "signup" ? "Sign Up" : authView === "login" ? "Log In" : "Reset Password"), [authView]);

  const seoNode = (
    <Seo
      title={headTitle}
      description="Log in or create an account to access Herazur."
      noindex
    />
  );

  if ((authLoading || (user && !profile && authLoading)) && !showConfirmationMessage && !showResetPasswordMessage) {
    return (
      <>
        {seoNode}
        <div className="flex justify-center items-center min-h-[calc(100vh-128px)]" role="status" aria-live="polite">
          <Loader2 className="h-10 w-10 animate-spin" />
          <span className="sr-only">Loading…</span>
        </div>
      </>
    );
  }

  // Don't render auth page if in recovery mode
  if (isRecoveryMode) return null;

  if (!authLoading && user) return null;

  if (showConfirmationMessage) {
    return (
      <>
        {seoNode}
        <ConfirmationScreen
          title="Check Your Email"
          description={<><strong>{email}</strong> adresine onay linki gönderdik. Hesabını aktifleştirmek için linke tıkla. Gelen kutusunda yoksa spam klasörünü kontrol et veya tekrar gönder.</>}
          actionLabel="Resend Confirmation Email"
          onAction={handleResendConfirmation}
          actionDisabled={submitting}
          onBack={() => { setShowConfirmationMessage(false); setAuthView("login"); }}
        />
      </>
    );
  }
  if (showResetPasswordMessage) {
    return (
      <>
        {seoNode}
        <ConfirmationScreen
          title="Password Reset Email Sent"
          description={<> {"If an account exists for "}<strong>{email}</strong>{", you will receive a password reset link. Please check your inbox."} </>}
          onBack={() => { setShowResetPasswordMessage(false); setAuthView("login"); }}
        />
      </>
    );
  }

  const AuthContent = () => {
    if (authView === "forgot_password") {
      return (
        <>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold">Reset Password</CardTitle>
            <CardDescription className="pt-2">Enter your email to receive a password reset link.</CardDescription>
          </CardHeader>
          <form onSubmit={handlePasswordReset} noValidate>
            <CardContent className="flex flex-col gap-4">
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  ref={emailInputRef}
                  type="email"
                  id="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <Button type="submit" className="w-full btn-glow" size="lg" disabled={submitting}>
                {submitting ? <Loader2 className="h-6 w-6 animate-spin" /> : "Send Reset Link"}
              </Button>
            </CardContent>
          </form>
          <CardFooter className="flex justify-center">
            <Button variant="link" onClick={() => setAuthView("login")}>Back to Log In</Button>
          </CardFooter>
        </>
      );
    }

    const title = authView === "signup" ? "Create an Account" : "Welcome Back";
    const subtitle = authView === "signup" ? "Join to get discovered!" : "Log in to continue your journey.";

    return (
      <>
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">{title}</CardTitle>
          <CardDescription className="pt-2">{subtitle}</CardDescription>
        </CardHeader>
        <form onSubmit={handleAuthAction} noValidate>
          <CardContent className="flex flex-col gap-4">
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                ref={emailInputRef}
                type="email"
                id="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete={authView === "signup" ? "new-password" : "current-password"}
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 px-3 grid place-items-center opacity-70 hover:opacity-100"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            {authView === "login" && (
              <div className="flex justify-end -mt-2">
                <Button variant="link" size="sm" className="h-auto p-0" type="button" onClick={() => setAuthView("forgot_password")}>
                  Forgot Password?
                </Button>
              </div>
            )}
            <Button type="submit" className="w-full btn-glow" size="lg" disabled={submitting}>
              {submitting ? <Loader2 className="h-6 w-6 animate-spin" /> : (authView === "signup" ? "Sign Up" : "Log In")}
            </Button>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 opacity-80">Or continue with</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Button type="button" onClick={() => signInWithProvider("google")} variant="outline" className="w-full transition-transform hover:scale-105" size="lg" aria-label="Log in with Google" disabled={submitting}>
                <GoogleIcon className="h-6 w-6 mr-3" /> Google
              </Button>
              <Button type="button" onClick={() => signInWithProvider("github")} variant="outline" className="w-full transition-transform hover:scale-105" size="lg" aria-label="Log in with GitHub" disabled={submitting}>
                <Github className="h-6 w-6 mr-3" /> GitHub
              </Button>
            </div>
          </CardContent>
        </form>
        <CardFooter className="flex justify-center">
          <p className="text-sm opacity-80">
            {authView === "signup" ? "Already have an account?" : "Don't have an account?"}
            <Button variant="link" onClick={() => setAuthView(authView === "signup" ? "login" : "signup")} className="font-bold" type="button">
              {authView === "signup" ? "Log In" : "Sign Up"}
            </Button>
          </p>
        </CardFooter>
      </>
    );
  };

  return (
    <>
      {seoNode}
      <div className="relative container mx-auto px-4 py-8 flex justify-center items-center min-h-[calc(100vh-128px)] overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full filter blur-3xl opacity-50 auth-bg-shape"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full filter blur-3xl opacity-50 auth-bg-shape-2"></div>
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={authView} variants={cardVariants} initial="initial" animate="animate" exit="exit" className="w-full max-w-md">
          <Card className="bg-card/80 backdrop-blur-lg border-border/30 shadow-2xl shadow-primary/10">{AuthContent()}</Card>
        </motion.div>
      </AnimatePresence>
      </div>
    </>
  );
}

export default AuthPage;
