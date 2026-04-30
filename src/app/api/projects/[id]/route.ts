import { getCurrentUser } from "@/lib/auth";
import { updateProject } from "@/lib/stratmap/workspace";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return Response.json({ error: "Authentication is required." }, { status: 401 });

    const { id } = await params;
    const body = (await request.json()) as Partial<{
      onboardingComplete: boolean;
      name: string;
      description: string;
    }>;
    const project = await updateProject(user.id, id, body);
    return Response.json({ project });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update project.";
    return Response.json({ error: message }, { status: 500 });
  }
}
