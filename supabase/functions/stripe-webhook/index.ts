import Stripe from 'https://esm.sh/stripe@18.5.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.105.3';
import { jsonResponse } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY') ?? '';
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '';

  if (!supabaseUrl || !serviceRoleKey || !stripeSecretKey || !webhookSecret) {
    return jsonResponse({ error: 'Webhook is not configured.' }, 500);
  }

  const stripe = new Stripe(stripeSecretKey);
  const signature = req.headers.get('stripe-signature') ?? '';
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (error) {
    console.error('Invalid Stripe webhook signature:', error);
    return jsonResponse({ error: 'Invalid signature.' }, 400);
  }

  const serviceClient = createClient(supabaseUrl, serviceRoleKey);

  const { error: eventInsertError } = await serviceClient
    .from('stripe_events')
    .insert({ id: event.id, type: event.type });

  if (eventInsertError) {
    if (String(eventInsertError.code) === '23505') {
      return jsonResponse({ received: true, duplicate: true });
    }
    console.error('Could not record Stripe event:', eventInsertError);
    return jsonResponse({ error: 'Could not record event.' }, 500);
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const metadata = session.metadata ?? {};
      const profileId = metadata.profile_id;
      const planId = metadata.plan_id;
      const purchaseType = metadata.purchase_type;

      if (!profileId || !planId || !purchaseType) {
        throw new Error('Missing checkout metadata.');
      }

      if (purchaseType === 'coin_pack') {
        const coinAmount = Number(metadata.coin_amount ?? 0);
        const { error } = await serviceClient.rpc('grant_coin_purchase', {
          p_profile_id: profileId,
          p_amount: coinAmount,
          p_stripe_event_id: event.id,
        });
        if (error) throw error;
      }

      if (purchaseType === 'boost') {
        const { error } = await serviceClient.rpc('activate_boost_purchase', {
          p_profile_id: profileId,
          p_plan_id: planId,
          p_stripe_session_id: session.id,
          p_stripe_customer_id: String(session.customer ?? ''),
          p_stripe_subscription_id: session.subscription ? String(session.subscription) : null,
        });
        if (error) throw error;
      }
    }

    return jsonResponse({ received: true });
  } catch (error) {
    console.error('Stripe webhook processing failed:', error);
    return jsonResponse({ error: 'Webhook processing failed.' }, 500);
  }
});
