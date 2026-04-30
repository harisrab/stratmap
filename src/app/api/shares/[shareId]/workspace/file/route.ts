import { readSharedWorkspaceFile } from "@/lib/stratmap/workspace";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ shareId: string }> }
) {
  const { searchParams } = new URL(request.url);
  const filePath = searchParams.get("path");

  if (!filePath) {
    return Response.json({ error: "Missing path parameter." }, { status: 400 });
  }

  try {
    const { shareId } = await params;
    const file = await readSharedWorkspaceFile(shareId, filePath);
    return Response.json(file);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to read shared file.";
    return Response.json({ error: message }, { status: 404 });
  }
}
