import { StratMapShell } from "@/components/stratmap/app-shell";
import { getCurrentUser } from "@/lib/auth";
import {
  SupabaseNotConfiguredError,
  getSharedProject,
  getSharedWorkspaceIndex,
  readSharedWorkspaceFile,
} from "@/lib/stratmap/workspace";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ shareId: string }>;
}): Promise<Metadata> {
  const { shareId } = await params;
  try {
    const [{ project }, headersList] = await Promise.all([
      getSharedProject(shareId),
      headers(),
    ]);
    const proto = headersList.get("x-forwarded-proto") ?? "http";
    const host = headersList.get("x-forwarded-host") ?? headersList.get("host") ?? "localhost:3000";
    const origin = `${proto}://${host}`;
    const imageUrl = `${origin}/api/shares/${encodeURIComponent(shareId)}/cover`;
    const title = `${project.name} | Stratbook`;
    const description = project.description || "A public map-first stratbook.";

    return {
      description,
      openGraph: {
        description,
        images: [{ height: 630, url: imageUrl, width: 1200 }],
        title,
        type: "article",
      },
      title,
      twitter: {
        card: "summary_large_image",
        description,
        images: [imageUrl],
        title,
      },
    };
  } catch {
    return {
      title: "Shared Stratbook",
    };
  }
}

export default async function SharedProjectPage({
  params,
}: {
  params: Promise<{ shareId: string }>;
}) {
  const { shareId } = await params;
  const user = await getCurrentUser();
  let project;
  let index;
  let initialFile;

  try {
    [{ project }, index] = await Promise.all([
      getSharedProject(shareId),
      getSharedWorkspaceIndex(shareId),
    ]);

    if (!index.defaultPath) {
      notFound();
    }

    initialFile = await readSharedWorkspaceFile(shareId, index.defaultPath);
  } catch (error) {
    if (error instanceof SupabaseNotConfiguredError) {
      redirect("/");
    }
    notFound();
  }

  return (
    <StratMapShell
      accessMode={user ? "public-authenticated" : "public-anonymous"}
      initialFile={initialFile}
      initialIndex={index}
      project={project}
      projectId={project.id}
      shareId={shareId}
    />
  );
}
