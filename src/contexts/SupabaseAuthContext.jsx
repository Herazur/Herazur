import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const { toast } = useToast();
  const navigate = useNavigate();

  const mountedRef = useRef(true);
  const recoveryRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    recoveryRef.current = isRecoveryMode;
  }, [isRecoveryMode]);

  const fetchUserProfile = useCallback(async (userId) => {
    if (!userId) {
      setProfile(null);
      return null;
    }
    try {
      const { data, error } = await supabase
        .from('profiles_ranked_v3_enhanced')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        setProfile(null);
        return null;
      }
      setProfile(data);
      return data;
    } catch (err) {
      console.error('Error fetching profile (exception):', err);
      setProfile(null);
      return null;
    }
  }, []);

  const fetchAdminStatus = useCallback(async (currentUser) => {
    if (!currentUser) {
      setIsAdmin(false);
      return false;
    }

    try {
      const { data, error } = await supabase.rpc('is_admin');
      if (error) {
        console.warn('Error checking admin status:', error);
        setIsAdmin(false);
        return false;
      }

      const nextIsAdmin = Boolean(data);
      setIsAdmin(nextIsAdmin);
      return nextIsAdmin;
    } catch (err) {
      console.warn('Admin status check failed:', err);
      setIsAdmin(false);
      return false;
    }
  }, []);

  const applySession = useCallback(
    async (sess) => {
      if (!mountedRef.current) return;

      setSession(sess || null);
      const currentUser = sess?.user ?? null;
      setUser(currentUser);

      if (currentUser && !recoveryRef.current) {
        await Promise.all([
          fetchUserProfile(currentUser.id),
          fetchAdminStatus(currentUser),
        ]);
      } else {
        setProfile(null);
        setIsAdmin(false);
      }
      if (mountedRef.current) setLoading(false);
    },
    [fetchAdminStatus, fetchUserProfile]
  );

  const clearHash = () => {
    try {
      const url = window.location.pathname + window.location.search;
      window.history.replaceState({}, document.title, url);
    } catch {
      /* no-op */
    }
  };

  useEffect(() => {
    let unsub;

    const init = async () => {
      setLoading(true);

      try {
        const { data: sessData, error: sessError } = await supabase.auth.getSession();
        if (sessError) {
          console.error("Error getting session:", sessError);
          throw sessError;
        }
        const currentSession = sessData?.session ?? null;

        if (currentSession && !currentSession.user) {
          try {
            await supabase.auth.signOut({ scope: 'local' });
          } catch {
            // Ignore local cleanup failures during invalid session recovery.
          }
          await applySession(null);
        }

        const hashParams = new URLSearchParams((window.location.hash || '').slice(1));
        const recoveryType = hashParams.get('type');

        // Check for password recovery - handle both recovery and magiclink types
        const isRecoveryHash = recoveryType === 'recovery' || recoveryType === 'magiclink';

        if (isRecoveryHash && currentSession?.access_token) {
          // Valid recovery session detected
          setIsRecoveryMode(true);
          await applySession(currentSession);

          if (mountedRef.current) {
            navigate('/update-password', { replace: true });
            clearHash();
          }
        } else if (isRecoveryHash) {
          // Recovery hash but no valid session - wait for auth state change
          setIsRecoveryMode(true);
          await applySession(null);
        } else {
          await applySession(currentSession);
        }
      } catch (error) {
        console.warn("Initial session check failed, signing out locally.", error);
        try {
          await supabase.auth.signOut({ scope: 'local' });
        } catch {
          // Ignore local cleanup failures while falling back to a signed-out state.
        }
        await applySession(null);
      }

      const { data: sub } = supabase.auth.onAuthStateChange(
        async (event, newSession) => {
          if (!mountedRef.current) return;

          if (event === 'PASSWORD_RECOVERY') {
            setIsRecoveryMode(true);
            await applySession(newSession);
            if (window.location.pathname !== '/update-password') {
              navigate('/update-password', { replace: true });
            }
            clearHash();
            return;
          }

          if (event === 'USER_UPDATED' && recoveryRef.current) {
            setIsRecoveryMode(false);
          }

          if (event === 'SIGNED_OUT') {
            setIsRecoveryMode(false);
            await applySession(null);
            return;
          }

          if (event === 'TOKEN_REFRESHED' && !newSession) {
            console.warn("Token refresh failed, signing out.");
            await signOut();
            return;
          }

          // Don't apply session changes if we're in recovery mode and on update-password page
          if (recoveryRef.current && window.location.pathname === '/update-password') {
            return;
          }

          await applySession(newSession);
        }
      );

      unsub = sub?.subscription;
    };

    init();
    return () => { unsub?.unsubscribe?.(); };
  }, [applySession, navigate]);


  const signIn = async (email, password) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      const isEmailNotConfirmed = error.message?.toLowerCase().includes('email not confirmed');
      return { success: false, isEmailNotConfirmed, error };
    }
    return { success: true };
  };

  const signUp = async (email, password) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth` },
    });
    setLoading(false);

    if (error) {
      const isUnconfirmedUser =
        error.message?.includes('already registered') && error.message?.includes('unconfirmed');
      const isRateLimitError =
        error.status === 429 || error.message?.toLowerCase().includes('rate limit');

      if (isRateLimitError) {
        toast({
          title: 'Too Many Requests',
          description:
            "You've tried to sign up too many times. Please wait a while before trying again.",
          variant: 'destructive',
        });
      } else if (!isUnconfirmedUser) {
        toast({ title: 'Sign Up Failed', description: error.message, variant: 'destructive' });
      }
      return { success: false, isUnconfirmedUser };
    }

    if (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      return { success: false, isUnconfirmedUser: true };
    }

    return { success: true, isUnconfirmedUser: false };
  };

  const signInWithProvider = async (provider) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth`,
        queryParams: {
          prompt: 'select_account',
        },
      },
    });
    if (error) {
      toast({ title: 'Login Failed', description: error.message, variant: 'destructive' });
    }
    setLoading(false);
  };

  const signOut = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.auth.getSession();
      const hasToken = !!data?.session?.access_token;

      if (hasToken) {
        const { error } = await supabase.auth.signOut({ scope: 'global' });
        if (error) {
          const msg = String(error?.message || '');
          const code = error?.code;
          const isUserNotFound = code === 403 || /user.*not.*found/i.test(msg);
          if (!isUserNotFound) {
            throw error;
          }
        }
      }
    } catch (e) {
      toast({
        title: 'Could not log out globally',
        description: String(e?.message || e),
        variant: 'destructive',
      });
    } finally {
      try {
        await supabase.auth.signOut({ scope: 'local' });
      } catch (localError) {
        console.warn("Local sign out failed, proceeding.", localError);
      }

      if (mountedRef.current) {
        setUser(null);
        setProfile(null);
        setSession(null);
        setIsAdmin(false);
        setIsRecoveryMode(false);
        setLoading(false);
        navigate('/', { replace: true });
        toast({ title: 'Logged out', description: 'See you next time!' });
      }
    }
  };

  const sendPasswordResetEmail = async (email) => {
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });
    setLoading(false);
    if (error) {
      const message = String(error.message || '').toLowerCase();
      const isUserNotFound = message.includes('user not found');
      if (!isUserNotFound) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
        return false;
      }
      return true;
    }
    return true;
  };

  const updatePassword = async (password) => {
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast({ title: 'Update Failed', description: error.message, variant: 'destructive' });
      return false;
    }

    toast({ title: 'Success!', description: 'Your password has been updated.' });

    if (isRecoveryMode) {
      setIsRecoveryMode(false);
      // Sign out after password update to force fresh login
      try {
        await supabase.auth.signOut({ scope: 'local' });
      } catch (e) {
        console.warn('Sign out after password update failed:', e);
      }

      if (mountedRef.current) {
        setUser(null);
        setProfile(null);
        setSession(null);
        setIsAdmin(false);
        navigate('/auth', { replace: true });
      }
    }

    return true;
  };

  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      await fetchUserProfile(user.id);
    }
  }, [user?.id, fetchUserProfile]);

  const value = useMemo(
    () => ({
      session,
      user,
      profile,
      loading,
      setLoading,
      signIn,
      signUp,
      signInWithProvider,
      signOut,
      sendPasswordResetEmail,
      updatePassword,
      refreshProfile,
      isRecoveryMode,
      isAdmin,
    }),
    [
      session,
      user,
      profile,
      loading,
      isRecoveryMode,
      isAdmin,
      refreshProfile,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
