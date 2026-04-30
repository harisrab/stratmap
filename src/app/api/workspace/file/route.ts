import { getCurrentUser } from "@/lib/auth";
import {
  deleteWorkspaceFile,
  moveWorkspaceFile,
  readWorkspaceFile,
  writeWorkspaceFile,
} from "@/lib/stratmap/workspace";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("project");
  const filePath = searchParams.get("path");

  if (!projectId || !filePath) {
    return Response.json({ error: "Missing project or path parameter." }, { status: 400 });
  }

  try {
    const user = await getCurrentUser();
    if (!user) return Response.json({ error: "Authentication is required." }, { status: 401 });

    const file = await readWorkspaceFile(user.id, projectId, filePath);
    return Response.json(file);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to read workspace file.";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return Response.json({ error: "Authentication is required." }, { status: 401 });

    const body = (await request.json()) as {
      projectId?: string;
      path?: string;
      content?: string;
    };

    if (!body.projectId || !body.path || typeof body.content !== "string") {
      return Response.json(
        { error: "Expected projectId, path, and string content." },
        { status: 400 }
      );
    }

    const file = await writeWorkspaceFile({
      content: body.content,
      ownerId: user.id,
      path: body.path,
      projectId: body.projectId,
    });

    return Response.json(file);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save workspace file.";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("project");
  const filePath = searchParams.get("path");

  if (!projectId || !filePath) {
    return Response.json({ error: "Missing project or path parameter." }, { status: 400 });
  }

  try {
    const user = await getCurrentUser();
    if (!user) return Response.json({ error: "Authentication is required." }, { status: 401 });

    await deleteWorkspaceFile(user.id, projectId, filePath);
    return Response.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete workspace file.";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return Response.json({ error: "Authentication is required." }, { status: 401 });

    const body = (await request.json()) as {
      projectId?: string;
      fromPath?: string;
      toPath?: string;
    };

    if (!body.projectId || !body.fromPath || !body.toPath) {
      return Response.json(
        { error: "Expected projectId, fromPath, and toPath." },
        { status: 400 }
      );
    }

    const file = await moveWorkspaceFile({
      fromPath: body.fromPath,
      ownerId: user.id,
      projectId: body.projectId,
      toPath: body.toPath,
    });

    return Response.json(file);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to move workspace file.";
    return Response.json({ error: message }, { status: 500 });
  }
}
