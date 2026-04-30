import { getCurrentUser } from "@/lib/auth";
import { forkSharedProject } from "@/lib/stratmap/workspace";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ shareId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return Response.json({ error: "Authentication is required." }, { status: 401 });

    const { shareId } = await params;
    const project = await forkSharedProject(shareId, user.id);
    return Response.json({ project });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fork notebook.";
    return Response.json({ error: message }, { status: 500 });
  }
}
