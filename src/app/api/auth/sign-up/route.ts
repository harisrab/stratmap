import { signUpWithPassword } from "@/lib/auth";
import { ensureExampleStratbooks, ensurePublicExampleStratbooks } from "@/lib/stratmap/workspace";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      displayName?: string;
      email?: string;
      password?: string;
    };

    if (!body.email?.trim() || !body.password) {
      return Response.json({ error: "Email and password are required." }, { status: 400 });
    }

    if (body.password.length < 8) {
      return Response.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    const result = await signUpWithPassword({
      displayName: body.displayName,
      email: body.email.trim(),
      password: body.password,
    });

    if (result.user) {
      await Promise.all([
        ensureExampleStratbooks(result.user.id),
        ensurePublicExampleStratbooks(),
      ]);
    }

    return Response.json({
      needsConfirmation: result.needsConfirmation,
      user: result.user
        ? {
            email: result.user.email,
            id: result.user.id,
            name: result.user.user_metadata?.display_name ?? null,
          }
        : null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create account.";
    return Response.json({ error: message }, { status: 400 });
  }
}
