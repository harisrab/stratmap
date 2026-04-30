import { getCurrentUser } from "@/lib/auth";
import { createWorkspaceFolder } from "@/lib/stratmap/workspace";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return Response.json({ error: "Authentication is required." }, { status: 401 });

    const body = (await request.json()) as { projectId?: string; folderPath?: string };

    if (!body.projectId || !body.folderPath) {
      return Response.json(
        { error: "Expected projectId and folderPath." },
        { status: 400 }
      );
    }

    await createWorkspaceFolder(user.id, body.projectId, body.folderPath);
    return Response.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create folder.";
    return Response.json({ error: message }, { status: 500 });
  }
}
