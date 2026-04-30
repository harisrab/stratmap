import { getCurrentUser } from "@/lib/auth";
import { createProjectChatThread, getProject } from "@/lib/stratmap/workspace";
import { z } from "zod";

const createThreadSchema = z.object({
  projectId: z.string().min(1),
  title: z.string().trim().min(1).optional(),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "Authentication is required." }, { status: 401 });
  }

  const body = createThreadSchema.parse(await request.json());

  try {
    await getProject(user.id, body.projectId);
  } catch {
    return Response.json({ error: "Project not found or access denied." }, { status: 403 });
  }

  const thread = await createProjectChatThread({
    ownerId: user.id,
    projectId: body.projectId,
    title: body.title,
  });

  return Response.json({ thread }, { status: 201 });
}
