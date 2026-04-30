import { getCurrentUser } from "@/lib/auth";
import { generateProjectCoverImage, readProjectCoverImage } from "@/lib/stratmap/workspace";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return Response.json({ error: "Authentication is required." }, { status: 401 });

    const { id } = await params;
    const image = await readProjectCoverImage(user.id, id);
    return new Response(image, {
      headers: {
        "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
        "Content-Type": "image/png",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load cover image.";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return Response.json({ error: "Authentication is required." }, { status: 401 });

    const { id } = await params;
    const project = await generateProjectCoverImage(user.id, id);
    return Response.json({ project });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate cover image.";
    return Response.json({ error: message }, { status: 500 });
  }
}
