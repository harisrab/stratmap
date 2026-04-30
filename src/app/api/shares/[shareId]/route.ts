import { getSharedProject } from "@/lib/stratmap/workspace";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ shareId: string }> }
) {
  try {
    const { shareId } = await params;
    const { project } = await getSharedProject(shareId);

    return Response.json({
      project: {
        description: project.description,
        id: project.id,
        name: project.name,
        sharing: project.sharing,
      },
      shareId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load shared notebook.";
    return Response.json({ error: message }, { status: 404 });
  }
}
