import "server-only";

import { getSupabaseConfig, hasSupabaseStorageConfig } from "@/lib/env";
import { getStripe } from "@/lib/stripe";
import { createClient, type User } from "@supabase/supabase-js";
import type Stripe from "stripe";
import type { BillingProfile, BillingStatus } from "./billing-types";

export type { BillingProfile, BillingStatus };

type BillingRow = {
  cancel_at_period_end: boolean | null;
  current_period_end: string | null;
  price_id: string | null;
  status: BillingStatus | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
};

const proStatuses = new Set<BillingStatus>(["active", "trialing"]);

function getSupabaseClient() {
  const config = getSupabaseConfig();
  return createClient(config.url, config.serviceRoleKey, {
    auth: { persistSession: false },
  });
}

function emptyBillingProfile(): BillingProfile {
  return {
    cancelAtPeriodEnd: false,
    currentPeriodEnd: null,
    isPro: false,
    priceId: null,
    status: "free",
    stripeCustomerId: null,
    stripeSubscriptionId: null,
  };
}

function toBillingProfile(row?: BillingRow | null): BillingProfile {
  const status = row?.status ?? "free";
  return {
    cancelAtPeriodEnd: Boolean(row?.cancel_at_period_end),
    currentPeriodEnd: row?.current_period_end ?? null,
    isPro: proStatuses.has(status),
    priceId: row?.price_id ?? null,
    status,
    stripeCustomerId: row?.stripe_customer_id ?? null,
    stripeSubscriptionId: row?.stripe_subscription_id ?? null,
  };
}

function getSubscriptionPeriodEnd(subscription: Stripe.Subscription) {
  const periodEnd = subscription.items.data[0]?.current_period_end;
  return periodEnd ? new Date(periodEnd * 1000).toISOString() : null;
}

function getSubscriptionPriceId(subscription: Stripe.Subscription) {
  return subscription.items.data[0]?.price.id ?? null;
}

export async function getBillingProfile(ownerId: string): Promise<BillingProfile> {
  if (!hasSupabaseStorageConfig()) return emptyBillingProfile();

  const { data, error } = await getSupabaseClient()
    .from("stratbook_billing_customers")
    .select(
      "cancel_at_period_end,current_period_end,price_id,status,stripe_customer_id,stripe_subscription_id"
    )
    .eq("owner_id", ownerId)
    .maybeSingle();

  if (error) throw error;
  return toBillingProfile(data);
}

export async function requireProSubscription(ownerId: string): Promise<BillingProfile> {
  const profile = await getBillingProfile(ownerId);
  if (!profile.isPro) {
    throw new Error("A Pro subscription is required to use the Strategist.");
  }
  return profile;
}

export async function getOrCreateStripeCustomer(user: User) {
  const current = await getBillingProfile(user.id);
  if (current.stripeCustomerId) return current.stripeCustomerId;

  const stripe = getStripe();
  const customer = await stripe.customers.create({
    email: user.email ?? undefined,
    metadata: {
      supabase_user_id: user.id,
    },
    name:
      typeof user.user_metadata?.display_name === "string"
        ? user.user_metadata.display_name
        : undefined,
  });

  const { error } = await getSupabaseClient().from("stratbook_billing_customers").upsert(
    {
      owner_id: user.id,
      status: "free",
      stripe_customer_id: customer.id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "owner_id" }
  );
  if (error) throw error;

  return customer.id;
}

export async function updateSubscriptionFromStripe(subscription: Stripe.Subscription) {
  const customerId =
    typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
  const ownerId = subscription.metadata.supabase_user_id || (await findOwnerIdByCustomer(customerId));
  if (!ownerId) throw new Error(`No Stratbook user found for Stripe customer ${customerId}.`);

  const { error } = await getSupabaseClient().from("stratbook_billing_customers").upsert(
    {
      cancel_at_period_end: subscription.cancel_at_period_end,
      current_period_end: getSubscriptionPeriodEnd(subscription),
      owner_id: ownerId,
      price_id: getSubscriptionPriceId(subscription),
      status: subscription.status,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "owner_id" }
  );
  if (error) throw error;
}

async function findOwnerIdByCustomer(stripeCustomerId: string) {
  const { data, error } = await getSupabaseClient()
    .from("stratbook_billing_customers")
    .select("owner_id")
    .eq("stripe_customer_id", stripeCustomerId)
    .maybeSingle();

  if (error) throw error;
  return typeof data?.owner_id === "string" ? data.owner_id : null;
}
