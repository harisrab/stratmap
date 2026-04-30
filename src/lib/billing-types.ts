export type BillingStatus =
  | "free"
  | "incomplete"
  | "incomplete_expired"
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "unpaid"
  | "paused";

export type BillingProfile = {
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
  isPro: boolean;
  priceId: string | null;
  status: BillingStatus;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
};
