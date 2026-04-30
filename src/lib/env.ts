const fallbackBucket = "stratmap-workspace";

export function getSupabaseConfig() {
  return {
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    bucket: process.env.SUPABASE_STORAGE_BUCKET ?? fallbackBucket,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  };
}

export function hasSupabaseStorageConfig() {
  const config = getSupabaseConfig();
  return Boolean(config.url && config.anonKey && config.serviceRoleKey);
}

export function hasSupabaseAuthConfig() {
  const config = getSupabaseConfig();
  return Boolean(config.url && config.anonKey);
}

export function getAnthropicModel() {
  return process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";
}

export function hasAnthropicKey() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export function getMapboxToken() {
  return process.env.MAPBOX_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";
}

export function hasMapboxToken() {
  return Boolean(getMapboxToken());
}

export function getAppUrl() {
  const explicitUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
  if (explicitUrl) return explicitUrl.replace(/\/$/, "");

  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export function getStripeProPriceId() {
  return process.env.STRIPE_PRO_PRICE_ID || "";
}
