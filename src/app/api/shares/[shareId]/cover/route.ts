import { readSharedProjectCoverImage } from "@/lib/stratmap/workspace";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ shareId: string }> }
) {
  try {
    const { shareId } = await params;
    const image = await readSharedProjectCoverImage(shareId);
    return new Response(image, {
      headers: {
        "Cache-Control": "public, max-age=300, stale-while-revalidate=86400",
        "Content-Type": "image/png",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load shared cover image.";
    return Response.json({ error: message }, { status: 404 });
  }
}
