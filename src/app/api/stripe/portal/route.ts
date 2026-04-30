import { getCurrentUser } from "@/lib/auth";
import { getBillingProfile } from "@/lib/billing";
import { getAppUrl } from "@/lib/env";
import { getStripe } from "@/lib/stripe";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "Authentication is required." }, { status: 401 });
  }

  const billing = await getBillingProfile(user.id);
  if (!billing.stripeCustomerId) {
    return Response.json({ error: "No Stripe customer exists for this user." }, { status: 404 });
  }

  const session = await getStripe().billingPortal.sessions.create({
    customer: billing.stripeCustomerId,
    return_url: `${getAppUrl()}/app`,
  });

  return Response.json({ url: session.url });
}
