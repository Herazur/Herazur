import Stripe from 'https://esm.sh/stripe@18.5.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.105.3';
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';

type CheckoutBody = {
  planId?: string;
  profileId?: string;
  purchaseType?: 'boost' | 'coin_pack';
};

const coinPacks: Record<string, { priceEnv: string; coins: number }> = {
  starter_pack: { priceEnv: 'STRIPE_PRICE_STARTER_PACK', coins: 100 },
  adventurer_pack: { priceEnv: 'STRIPE_PRICE_ADVENTURER_PACK', coins: 450 },
  legendary_pack: { priceEnv: 'STRIPE_PRICE_LEGENDARY_PACK', coins: 1800 },
};

const isSubscriptionPlan = (planId: string) => {
  const id = planId.toLowerCase();
  return id.includes('spotlight') || id.includes('presence');
};

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
      return jsonResponse({ error: 'Server is not configured for checkout.' }, 500);
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

    const body = await req.json() as CheckoutBody;
    const planId = String(body.planId ?? '').trim();
    const profileId = String(body.profileId ?? '').trim();
    const purchaseType = body.purchaseType;

    if (!planId || !profileId || !['boost', 'coin_pack'].includes(String(purchaseType))) {
      return jsonResponse({ error: 'Invalid checkout request.' }, 400);
    }

    const { data: profile, error: profileError } = await serviceClient
      .from('profiles')
      .select('id, user_id')
      .eq('id', profileId)
      .single();

    if (profileError || !profile || profile.user_id !== userData.user.id) {
      return jsonResponse({ error: 'Profile ownership could not be verified.' }, 403);
    }

    let priceId = '';
    let mode: Stripe.Checkout.SessionCreateParams.Mode = 'payment';
    const metadata: Record<string, string> = {
      user_id: userData.user.id,
      profile_id: profile.id,
      plan_id: planId,
      purchase_type: purchaseType,
    };

    if (purchaseType === 'coin_pack') {
      const pack = coinPacks[planId];
      if (!pack) return jsonResponse({ error: 'Unknown coin pack.' }, 400);

      priceId = Deno.env.get(pack.priceEnv) ?? '';
      metadata.coin_amount = String(pack.coins);
    } else {
      const { data: boost, error: boostError } = await serviceClient
        .from('boost_types')
        .select('id, stripe_price_id')
        .eq('id', planId)
        .single();

      if (boostError || !boost?.stripe_price_id) {
        return jsonResponse({ error: 'Unknown boost plan.' }, 400);
      }

      priceId = boost.stripe_price_id;
      mode = isSubscriptionPlan(planId) ? 'subscription' : 'payment';
    }

    if (!priceId) {
      return jsonResponse({ error: 'Plan is not configured with a Stripe price.' }, 500);
    }

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${siteUrl}/promote/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/promote/cancel`,
      client_reference_id: profile.id,
      customer_email: userData.user.email ?? undefined,
      metadata,
    };

    if (mode === 'subscription') {
      sessionParams.subscription_data = { metadata };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);
    return jsonResponse({ checkoutUrl: session.url });
  } catch (error) {
    console.error('create-checkout-session failed:', error);
    return jsonResponse({ error: 'Failed to create checkout session.' }, 500);
  }
});
