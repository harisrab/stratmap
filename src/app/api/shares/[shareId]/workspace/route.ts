import { getSharedWorkspaceIndex } from "@/lib/stratmap/workspace";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ shareId: string }> }
) {
  try {
    const { shareId } = await params;
    const workspace = await getSharedWorkspaceIndex(shareId);
    return Response.json(workspace);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load shared workspace.";
    return Response.json({ error: message }, { status: 404 });
  }
}
