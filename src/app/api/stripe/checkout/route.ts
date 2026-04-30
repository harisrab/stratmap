import { getCurrentUser } from "@/lib/auth";
import { getOrCreateStripeCustomer } from "@/lib/billing";
import { getAppUrl, getStripeProPriceId } from "@/lib/env";
import { getStripe } from "@/lib/stripe";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "Authentication is required." }, { status: 401 });
  }

  const priceId = getStripeProPriceId();
  if (!priceId) {
    return Response.json({ error: "Missing STRIPE_PRO_PRICE_ID." }, { status: 500 });
  }

  const stripe = getStripe();
  const customerId = await getOrCreateStripeCustomer(user);
  const appUrl = getAppUrl();
  const session = await stripe.checkout.sessions.create({
    allow_promotion_codes: true,
    cancel_url: `${appUrl}/app?checkout=canceled`,
    client_reference_id: user.id,
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: {
      supabase_user_id: user.id,
    },
    mode: "subscription",
    subscription_data: {
      metadata: {
        supabase_user_id: user.id,
      },
    },
    success_url: `${appUrl}/app?checkout=success`,
  });

  return Response.json({ url: session.url });
}
