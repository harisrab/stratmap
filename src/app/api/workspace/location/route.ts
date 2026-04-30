import { getCurrentUser } from "@/lib/auth";
import type { GeoLocation } from "@/lib/stratmap/types";
import { saveFileLocation } from "@/lib/stratmap/workspace";

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return Response.json({ error: "Authentication is required." }, { status: 401 });

    const body = (await request.json()) as {
      projectId?: string;
      path?: string;
      location?: GeoLocation | null;
    };

    if (!body.projectId || !body.path) {
      return Response.json({ error: "Expected projectId and path." }, { status: 400 });
    }

    const file = await saveFileLocation({
      location: body.location ?? null,
      ownerId: user.id,
      path: body.path,
      projectId: body.projectId,
    });

    return Response.json(file);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save location.";
    return Response.json({ error: message }, { status: 500 });
  }
}
