import { StratMapShell } from "@/components/stratmap/app-shell";
import { getCurrentUser } from "@/lib/auth";
import {
  SupabaseNotConfiguredError,
  getProject,
  getWorkspaceIndex,
  readWorkspaceFile,
} from "@/lib/stratmap/workspace";
import { redirect } from "next/navigation";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  let project;
  let index;
  let initialFile;

  if (!user) {
    redirect("/auth");
  }

  try {
    [project, index] = await Promise.all([getProject(user.id, id), getWorkspaceIndex(user.id, id)]);

    if (!index.defaultPath) {
      redirect("/app");
    }

    initialFile = await readWorkspaceFile(user.id, id, index.defaultPath);
  } catch (error) {
    if (error instanceof SupabaseNotConfiguredError) {
      redirect("/app");
    }
    redirect("/app");
  }

  return (
    <StratMapShell
      accessMode="owner"
      initialFile={initialFile}
      initialIndex={index}
      project={project}
      projectId={id}
    />
  );
}
