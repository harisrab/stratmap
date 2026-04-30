import { getAnthropicModel, hasAnthropicKey } from "@/lib/env";
import { getCurrentUser } from "@/lib/auth";
import {
  ChatUsageLimitError,
  createProjectChatThread,
  getChatUsage,
  getProject,
  getWorkspaceIndex,
  listProjectChatThreads,
  readWorkspaceFile,
  readProjectChatMessages,
  recordChatMessageUse,
  searchWorkspaceFiles,
  writeProjectChatMessages,
  writeWorkspaceFile,
} from "@/lib/stratmap/workspace";
import { anthropic } from "@ai-sdk/anthropic";
import {
  convertToModelMessages,
  createIdGenerator,
  stepCountIs,
  streamText,
  tool,
  type UIMessage,
} from "ai";
import { z } from "zod";

export const maxDuration = 30;

const chatBodySchema = z.object({
  messages: z.array(z.custom<UIMessage>()),
  projectId: z.string().min(1),
  selectedPath: z.string().optional(),
  threadId: z.string().min(1).optional(),
});

const chatQuerySchema = z.object({
  projectId: z.string().min(1),
  threadId: z.string().min(1).optional(),
});

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "Authentication is required." }, { status: 401 });
  }

  const url = new URL(request.url);
  const query = chatQuerySchema.parse({
    projectId: url.searchParams.get("projectId") ?? "",
    threadId: url.searchParams.get("threadId") ?? undefined,
  });

  try {
    await getProject(user.id, query.projectId);
  } catch {
    return Response.json({ error: "Project not found or access denied." }, { status: 403 });
  }

  let threads = await listProjectChatThreads(user.id, query.projectId);
  if (threads.length === 0) {
    threads = [await createProjectChatThread({ ownerId: user.id, projectId: query.projectId })];
  }
  const activeThreadId =
    query.threadId && threads.some((thread) => thread.id === query.threadId)
      ? query.threadId
      : threads[0].id;

  const [messages, usage] = await Promise.all([
    readProjectChatMessages(user.id, query.projectId, activeThreadId),
    getChatUsage(user.id),
  ]);

  return Response.json({ activeThreadId, messages, threads, usage });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "Authentication is required." }, { status: 401 });
  }

  if (!hasAnthropicKey()) {
    return Response.json(
      { error: "Missing ANTHROPIC_API_KEY. Add it to .env.local to enable chat." },
      { status: 500 }
    );
  }

  const body = chatBodySchema.parse(await request.json());
  const { projectId } = body;
  const threadId = body.threadId ?? "default";
  try {
    await getProject(user.id, projectId);
  } catch {
    return Response.json({ error: "Project not found or access denied." }, { status: 403 });
  }

  try {
    await recordChatMessageUse(user.id, projectId);
  } catch (error) {
    if (error instanceof ChatUsageLimitError) {
      return Response.json({ error: error.message, usage: error.usage }, { status: 429 });
    }
    throw error;
  }

  const result = streamText({
    model: anthropic(getAnthropicModel()),
    system: [
      "You are the Strategist, the on-call analyst for a Stratbook — a map-first strategic notebook.",
      "Do not use emojis or decorative emoji-style symbols.",
      "Prefer inspecting the stratbook with tools before answering questions about its contents.",
      "You can read, search, and overwrite notes, scenarios, and data inside the stratbook.",
      "Keep responses readable in a narrow chat panel. When using tables, use short column names and compact cells.",
      "When you save a file, explain what changed and include the exact stratbook path.",
      body.selectedPath
        ? `The user is currently focused on ${body.selectedPath}.`
        : "The user does not currently have a file selected.",
    ].join("\n"),
    messages: await convertToModelMessages(body.messages),
    stopWhen: stepCountIs(5),
    tools: {
      list_workspace_files: tool({
        description: "List the workspace files and map-linked notes that are currently available.",
        inputSchema: z.object({
          kind: z.enum(["note", "scenario", "data"]).optional(),
        }),
        execute: async ({ kind }) => {
          const index = await getWorkspaceIndex(user.id, projectId);
          const files = kind
            ? index.files.filter((file) => file.kind === kind)
            : index.files;
          return {
            files: files.slice(0, 200).map((file) => ({
              hasLocation: Boolean(file.location),
              kind: file.kind,
              path: file.path,
              title: file.title,
            })),
            source: index.sourceLabel,
          };
        },
      }),
      search_workspace_files: tool({
        description: "Search notes and file names in the current workspace by keyword.",
        inputSchema: z.object({ query: z.string().min(2) }),
        execute: async ({ query }) => ({
          hits: await searchWorkspaceFiles(user.id, projectId, query),
        }),
      }),
      read_workspace_file: tool({
        description: "Read a file from the workspace by path.",
        inputSchema: z.object({ path: z.string().min(1) }),
        execute: async ({ path }) => {
          const file = await readWorkspaceFile(user.id, projectId, path);
          return {
            content: file.content,
            kind: file.kind,
            path: file.path,
            title: file.title,
          };
        },
      }),
      save_workspace_file: tool({
        description:
          "Overwrite or create a workspace file. Use this only when the user explicitly wants a file updated.",
        inputSchema: z.object({
          content: z.string().min(1),
          path: z.string().min(1),
        }),
        execute: async ({ content, path }) => {
          const file = await writeWorkspaceFile({ content, ownerId: user.id, path, projectId });
          return {
            path: file.path,
            preview: file.content.slice(0, 500),
            title: file.title,
          };
        },
      }),
    },
  });

  result.consumeStream();

  return result.toUIMessageStreamResponse({
    generateMessageId: createIdGenerator({
      prefix: "msg",
      size: 16,
    }),
    originalMessages: body.messages,
    onFinish: async ({ isAborted, messages }) => {
      if (isAborted) return;
      await writeProjectChatMessages(user.id, projectId, threadId, messages);
    },
  });
}
