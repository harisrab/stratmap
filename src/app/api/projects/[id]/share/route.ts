import { getCurrentUser } from "@/lib/auth";
import { createProjectShare, disableProjectShare } from "@/lib/stratmap/workspace";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return Response.json({ error: "Authentication is required." }, { status: 401 });

    const { id } = await params;
    const { manifest, project } = await createProjectShare(user.id, id);
    const origin = new URL(request.url).origin;

    return Response.json({
      project,
      shareId: manifest.shareId,
      shareUrl: `${origin}/s/${manifest.shareId}`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create share link.";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return Response.json({ error: "Authentication is required." }, { status: 401 });

    const { id } = await params;
    const project = await disableProjectShare(user.id, id);
    return Response.json({ project });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to disable share link.";
    return Response.json({ error: message }, { status: 500 });
  }
}
