import Stripe from 'https://esm.sh/stripe@18.5.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.105.3';
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY') ?? '';
    const siteUrl = (Deno.env.get('SITE_URL') ?? 'https://herazur.com').replace(/\/$/, '');

    if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey || !stripeSecretKey) {
      return jsonResponse({ error: 'Server is not configured for billing portal.' }, 500);
    }

    const authHeader = req.headers.get('Authorization') ?? '';
    if (!authHeader) {
      return jsonResponse({ error: 'Authentication required.' }, 401);
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const serviceClient = createClient(supabaseUrl, serviceRoleKey);
    const stripe = new Stripe(stripeSecretKey);

    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user) {
      return jsonResponse({ error: 'Invalid session.' }, 401);
    }

    const { data: profiles, error: profilesError } = await serviceClient
      .from('profiles')
      .select('id')
      .eq('user_id', userData.user.id);

    if (profilesError || !profiles?.length) {
      return jsonResponse({ error: 'Profile not found.' }, 404);
    }

    const profileIds = profiles.map((profile) => profile.id);
    const { data: subscription, error: subscriptionError } = await serviceClient
      .from('subscriptions')
      .select('stripe_customer_id')
      .in('profile_id', profileIds)
      .not('stripe_customer_id', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (subscriptionError || !subscription?.stripe_customer_id) {
      return jsonResponse({ error: 'No billing customer found.' }, 404);
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${siteUrl}/promote`,
    });

    return jsonResponse({ url: portalSession.url });
  } catch (error) {
    console.error('create-portal-session failed:', error);
    return jsonResponse({ error: 'Failed to create billing portal session.' }, 500);
  }
});
