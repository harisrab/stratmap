import { getCurrentUser } from "@/lib/auth";
import { getWorkspaceIndex } from "@/lib/stratmap/workspace";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("project");

  if (!projectId) {
    return Response.json({ error: "Missing project parameter." }, { status: 400 });
  }

  try {
    const user = await getCurrentUser();
    if (!user) return Response.json({ error: "Authentication is required." }, { status: 401 });

    const workspace = await getWorkspaceIndex(user.id, projectId);
    return Response.json(workspace);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load workspace index.";
    return Response.json({ error: message }, { status: 500 });
  }
}
