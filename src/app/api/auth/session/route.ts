import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();

  return Response.json({
    user: user
      ? {
          email: user.email,
          id: user.id,
          name: user.user_metadata?.display_name ?? null,
        }
      : null,
  });
}
