import { signInWithPassword } from "@/lib/auth";
import { ensureExampleStratbooks, ensurePublicExampleStratbooks } from "@/lib/stratmap/workspace";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; password?: string };

    if (!body.email?.trim() || !body.password) {
      return Response.json({ error: "Email and password are required." }, { status: 400 });
    }

    const user = await signInWithPassword({
      email: body.email.trim(),
      password: body.password,
    });

    await Promise.all([
      ensureExampleStratbooks(user.id),
      ensurePublicExampleStratbooks(),
    ]);

    return Response.json({
      user: {
        email: user.email,
        id: user.id,
        name: user.user_metadata?.display_name ?? null,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to sign in.";
    return Response.json({ error: message }, { status: 401 });
  }
}
