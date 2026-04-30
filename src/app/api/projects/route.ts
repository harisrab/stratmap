import { getCurrentUser } from "@/lib/auth";
import { createProject, listProjects } from "@/lib/stratmap/workspace";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return Response.json({ error: "Authentication is required." }, { status: 401 });

    const projects = await listProjects(user.id);
    return Response.json({ projects });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list projects.";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return Response.json({ error: "Authentication is required." }, { status: 401 });

    const body = (await request.json()) as { name?: string; description?: string };

    if (!body.name?.trim()) {
      return Response.json({ error: "Project name is required." }, { status: 400 });
    }

    const project = await createProject({
      ownerId: user.id,
      name: body.name,
      description: body.description,
    });

    return Response.json({ project }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create project.";
    return Response.json({ error: message }, { status: 500 });
  }
}
