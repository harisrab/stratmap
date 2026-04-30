"use client";

import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning";
import { Shimmer } from "@/components/ai-elements/shimmer";
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from "@/components/ai-elements/sources";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { WorkspaceAccessMode } from "@/lib/stratmap/types";
import { DefaultChatTransport } from "ai";
import { useChat } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import {
  AlertCircleIcon,
  ChevronDownIcon,
  CompassIcon,
  FileEditIcon,
  FileSearchIcon,
  Loader2Icon,
  PlusIcon,
  WrenchIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

type ChatPanelProps = {
  accessMode?: WorkspaceAccessMode;
  onBlockedChat?: () => void;
  onSelectFile?: (path: string) => void;
  onWorkspaceRefresh: () => Promise<void>;
  projectId: string;
  selectedPath: string;
};

type ChatUsageSnapshot = {
  count: number;
  limit: number;
  month: string;
  remaining: number;
};

type ChatThreadSummary = {
  createdAt: string;
  id: string;
  messageCount: number;
  title: string;
  updatedAt: string;
};

function ThinkingIndicator() {
  return (
    <Message from="assistant">
      <Shimmer className="text-xs text-white/40" duration={1.5}>
        Thinking...
      </Shimmer>
    </Message>
  );
}

type ToolMeta = {
  icon: typeof WrenchIcon;
  verb: string;
  summarize: (input: unknown, output: unknown) => ReactNode;
};

function basename(path: string) {
  return path.split("/").pop() ?? path;
}

function countLines(text: string) {
  if (!text) return 0;
  return text.split(/\r?\n/).length;
}

const TOOL_META: Record<string, ToolMeta> = {
  list_workspace_files: {
    icon: FileSearchIcon,
    verb: "Scanned",
    summarize: (_input, output) => {
      const files = (output as { files?: unknown[] } | undefined)?.files;
      return (
        <span>
          {Array.isArray(files) ? `${files.length} workspace files` : "workspace files"}
        </span>
      );
    },
  },
  search_workspace_files: {
    icon: FileSearchIcon,
    verb: "Searched",
    summarize: (input, output) => {
      const query = (input as { query?: string } | undefined)?.query;
      const hits = (output as { hits?: unknown[] } | undefined)?.hits;
      return (
        <span className="min-w-0 truncate">
          {query ? <span className="font-mono">&quot;{query}&quot;</span> : "notes"}
          {Array.isArray(hits) ? (
            <span className="text-white/32"> · {hits.length} hits</span>
          ) : null}
        </span>
      );
    },
  },
  read_workspace_file: {
    icon: FileSearchIcon,
    verb: "Read",
    summarize: (input) => {
      const path = (input as { path?: string } | undefined)?.path;
      return path ? <span className="font-mono">{basename(path)}</span> : null;
    },
  },
  save_workspace_file: {
    icon: FileEditIcon,
    verb: "Edited",
    summarize: (input) => {
      const i = input as { path?: string; content?: string } | undefined;
      const path = i?.path;
      const lines = countLines(i?.content ?? "");
      return (
        <span className="flex items-center gap-1.5">
          {path ? <span className="font-mono">{basename(path)}</span> : null}
          {lines > 0 ? (
            <span className="text-[10px] text-emerald-300/80">+{lines} lines</span>
          ) : null}
        </span>
      );
    },
  },
};

function ToolResultCard({
  onSelectFile,
  part,
}: {
  onSelectFile?: (path: string) => void;
  part: UIMessage["parts"][number];
}) {
  if (part.type !== "dynamic-tool" && !part.type.startsWith("tool-")) {
    return null;
  }

  const toolName =
    part.type === "dynamic-tool" ? part.toolName : part.type.replace(/^tool-/, "");
  const input = "input" in part ? part.input : undefined;
  const output = "output" in part ? part.output : undefined;
  const state = "state" in part ? part.state : "input-available";
  const isRunning = state === "input-available";
  const isDone = state === "output-available";
  const isError = state === "output-error";

  const meta = TOOL_META[toolName] ?? {
    icon: WrenchIcon,
    verb: toolName.replace(/_/g, " "),
    summarize: () => null,
  };
  const Icon = meta.icon;
  const summary = meta.summarize(input, output);
  const path =
    toolName === "read_workspace_file"
      ? (input as { path?: string } | undefined)?.path ??
        (output as { path?: string } | undefined)?.path
      : undefined;
  const canOpen = Boolean(path && onSelectFile && isDone);
  const content = (
    <>
      <Icon
        className={cn(
          "size-3.5 shrink-0",
          isError ? "text-rose-300/80" : isDone ? "text-teal-300/78" : "text-white/38"
        )}
      />
      <span className="shrink-0 text-white/38">{meta.verb}</span>
      <span className="min-w-0 flex-1 truncate text-white/68">{summary}</span>
      {isRunning ? (
        <Loader2Icon className="size-3 shrink-0 animate-spin text-white/35" />
      ) : isError ? (
        <span className="shrink-0 text-[9px] uppercase tracking-[0.14em] text-rose-300/75">
          Failed
        </span>
      ) : null}
    </>
  );

  if (canOpen && path) {
    return (
      <button
        className="group flex w-full items-center gap-2 rounded-md px-1 py-1.5 text-left text-xs transition hover:bg-white/[0.035]"
        onClick={() => onSelectFile?.(path)}
        title={`Open ${path}`}
        type="button"
      >
        {content}
      </button>
    );
  }

  return (
    <div className="flex w-full items-center gap-2 rounded-md px-1 py-1.5 text-xs">
      {content}
    </div>
  );
}

function renderToolResult(
  part: UIMessage["parts"][number],
  key: string,
  onSelectFile?: (path: string) => void
) {
  if (part.type !== "dynamic-tool" && !part.type.startsWith("tool-")) {
    return null;
  }
  return <ToolResultCard key={key} onSelectFile={onSelectFile} part={part} />;
}

function ChatMessage({
  message,
  onSelectFile,
}: {
  message: UIMessage;
  onSelectFile?: (path: string) => void;
}) {
  const text = message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("");
  const reasoning = message.parts
    .filter((part) => part.type === "reasoning")
    .map((part) => part.text)
    .join("\n\n");
  const isReasoningStreaming = message.parts.some(
    (part) => part.type === "reasoning" && part.state === "streaming"
  );
  const sources = message.parts.filter(
    (part): part is Extract<UIMessage["parts"][number], { type: "source-url" }> =>
      part.type === "source-url"
  );
  const toolParts = message.parts
    .map((part, idx) => renderToolResult(part, `${message.id}-tool-${idx}`, onSelectFile))
    .filter(Boolean);

  return (
    <Message from={message.role}>
      {sources.length > 0 ? (
        <Sources>
          <SourcesTrigger count={sources.length} />
          <SourcesContent>
            {sources.map((source) => (
              <Source
                href={source.url}
                key={`${source.sourceId}-${source.url}`}
                title={source.title || source.url}
              />
            ))}
          </SourcesContent>
        </Sources>
      ) : null}

      {reasoning ? (
        <Reasoning defaultOpen={false} isStreaming={isReasoningStreaming}>
          <ReasoningTrigger />
          <ReasoningContent>{reasoning}</ReasoningContent>
        </Reasoning>
      ) : null}

      {toolParts.length > 0 ? <div className="flex flex-col gap-0.5">{toolParts}</div> : null}

      {text ? (
        <MessageContent
          className={cn(
            message.role === "user" ? "text-sm" : "chat-prose text-sm"
          )}
        >
          <MessageResponse>{text}</MessageResponse>
        </MessageContent>
      ) : null}
    </Message>
  );
}

type ChatRuntimeProps = ChatPanelProps & {
  activeThreadId: string | null;
  onActiveThreadChange: (threadId: string | null) => void;
};

function ChatRuntime({
  accessMode = "owner",
  activeThreadId,
  onActiveThreadChange,
  onBlockedChat,
  onSelectFile,
  onWorkspaceRefresh,
  projectId,
  selectedPath,
}: ChatRuntimeProps) {
  const [input, setInput] = useState("");
  const [chatKey, setChatKey] = useState(0);
  const [isLoadingHistory, setIsLoadingHistory] = useState(accessMode === "owner");
  const [isCreatingThread, setIsCreatingThread] = useState(false);
  const [isThreadMenuOpen, setIsThreadMenuOpen] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [threads, setThreads] = useState<ChatThreadSummary[]>([]);
  const [usage, setUsage] = useState<ChatUsageSnapshot | null>(null);
  const { error, messages, sendMessage, setMessages, status, stop } = useChat({
    onFinish: () => {
      void onWorkspaceRefresh();
    },
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
  });

  useEffect(() => {
    if (accessMode !== "owner") {
      queueMicrotask(() => {
        setIsLoadingHistory(false);
        setUsage(null);
      });
      return;
    }

    let cancelled = false;

    async function loadChatHistory(threadId?: string) {
      setIsLoadingHistory(true);
      setLocalError(null);
      const params = new URLSearchParams({ projectId });
      if (threadId) params.set("threadId", threadId);
      const response = await fetch(`/api/chat?${params.toString()}`);
      const payload = (await response.json()) as {
        activeThreadId?: string;
        error?: string;
        messages?: UIMessage[];
        threads?: ChatThreadSummary[];
        usage?: ChatUsageSnapshot;
      };
      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to load Strategist history.");
      }
      if (cancelled) return;
      onActiveThreadChange(payload.activeThreadId ?? null);
      setMessages(payload.messages ?? []);
      setChatKey((key) => key + 1);
      setThreads(payload.threads ?? []);
      setUsage(payload.usage ?? null);
    }

    void loadChatHistory()
      .catch((historyError) => {
        if (cancelled) return;
        setLocalError(
          historyError instanceof Error
            ? historyError.message
            : "Unable to load Strategist history."
        );
      })
      .finally(() => {
        if (!cancelled) setIsLoadingHistory(false);
      });

    return () => {
      cancelled = true;
    };
  }, [accessMode, onActiveThreadChange, projectId, setMessages]);

  async function loadThread(threadId: string) {
    if (accessMode !== "owner") return;
    if (threadId === activeThreadId && !isLoadingHistory) {
      setIsThreadMenuOpen(false);
      return;
    }
    setIsLoadingHistory(true);
    setLocalError(null);
    setIsThreadMenuOpen(false);
    try {
      const params = new URLSearchParams({ projectId, threadId });
      const response = await fetch(`/api/chat?${params.toString()}`);
      const payload = (await response.json()) as {
        activeThreadId?: string;
        error?: string;
        messages?: UIMessage[];
        threads?: ChatThreadSummary[];
        usage?: ChatUsageSnapshot;
      };
      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to load Strategist thread.");
      }
      onActiveThreadChange(payload.activeThreadId ?? threadId);
      setMessages(payload.messages ?? []);
      setChatKey((key) => key + 1);
      setThreads(payload.threads ?? []);
      setUsage(payload.usage ?? null);
    } catch (threadError) {
      setLocalError(
        threadError instanceof Error ? threadError.message : "Unable to load Strategist thread."
      );
    } finally {
      setIsLoadingHistory(false);
    }
  }

  async function createThread() {
    if (accessMode !== "owner" || isCreatingThread) return;
    setIsCreatingThread(true);
    setLocalError(null);
    try {
      const response = await fetch("/api/chat/threads", {
        body: JSON.stringify({ projectId }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const payload = (await response.json()) as {
        error?: string;
        thread?: ChatThreadSummary;
      };
      if (!response.ok || !payload.thread) {
        throw new Error(payload.error ?? "Unable to create a new Strategist thread.");
      }
      setThreads((current) => [payload.thread!, ...current]);
      onActiveThreadChange(payload.thread.id);
      setMessages([]);
      setChatKey((key) => key + 1);
      setIsThreadMenuOpen(false);
    } catch (threadError) {
      setLocalError(
        threadError instanceof Error
          ? threadError.message
          : "Unable to create a new Strategist thread."
      );
    } finally {
      setIsCreatingThread(false);
    }
  }

  // Close the thread menu on outside click or Escape — without these, the
  // dropdown feels stuck open until the user clicks the trigger again.
  const threadMenuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!isThreadMenuOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (threadMenuRef.current && !threadMenuRef.current.contains(event.target as Node)) {
        setIsThreadMenuOpen(false);
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setIsThreadMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isThreadMenuOpen]);

  // Live refresh: as soon as a `save_workspace_file` tool transitions to
  // `output-available`, refresh the workspace so the file tree + currently
  // selected note pick up the change without waiting for the assistant to
  // finish streaming. We track which tool-call IDs we've already handled to
  // avoid refreshing on every render.
  const seenSavesRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    const writeTools = new Set(["save_workspace_file"]);
    let triggered = false;
    for (const message of messages) {
      for (const part of message.parts) {
        const isTool =
          part.type === "dynamic-tool" || part.type.startsWith("tool-");
        if (!isTool) continue;
        const name =
          part.type === "dynamic-tool"
            ? part.toolName
            : part.type.replace(/^tool-/, "");
        if (!writeTools.has(name)) continue;
        const id = "toolCallId" in part ? part.toolCallId : `${message.id}-${name}`;
        const state = "state" in part ? part.state : undefined;
        if (state === "output-available" && !seenSavesRef.current.has(id)) {
          seenSavesRef.current.add(id);
          triggered = true;
        }
      }
    }
    if (triggered) void onWorkspaceRefresh();
  }, [messages, onWorkspaceRefresh]);

  async function handleSubmit(message: PromptInputMessage) {
    const trimmed = message.text.trim();
    if (!trimmed) return;
    if (accessMode !== "owner") {
      onBlockedChat?.();
      return;
    }
    if (usage && usage.remaining <= 0) {
      setLocalError(`You have used all ${usage.limit} Strategist messages for ${usage.month}.`);
      return;
    }

    setLocalError(null);
    const previousUsage = usage;
    if (previousUsage) {
      setUsage({
        ...previousUsage,
        count: previousUsage.count + 1,
        remaining: Math.max(0, previousUsage.remaining - 1),
      });
    }

    try {
      const threadId = activeThreadId ?? "default";
      setThreads((current) =>
        current.map((thread) =>
          thread.id === threadId && thread.messageCount === 0
            ? { ...thread, messageCount: 1, title: trimmed.slice(0, 48) }
            : thread
        )
      );
      await sendMessage({ text: trimmed }, { body: { projectId, selectedPath, threadId } });
    } catch (sendError) {
      if (previousUsage) {
        setUsage(previousUsage);
      }
      setLocalError(
        sendError instanceof Error ? sendError.message : "The Strategist could not respond."
      );
    }

    setInput("");
  }

  const suggestions = [
    "Brief the selected note in five bullets.",
    "Find the most important places in this stratbook.",
    "Draft an analyst summary I can save.",
  ];

  const isWorking = status === "submitted" || status === "streaming";
  const publicPlaceholder =
    accessMode === "public-anonymous"
      ? "Sign up to ask questions about this public map..."
      : "Fork this map to ask questions or make edits...";
  const activeThread = threads.find((thread) => thread.id === activeThreadId);

  return (
    <section className="panel-surface flex h-full w-full min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border border-white/10 bg-[rgba(5,10,16,0.92)]">
      <header className="relative shrink-0 border-b border-white/8 px-2.5 py-2">
        {accessMode === "owner" ? (
          <div className="flex items-center gap-1" ref={threadMenuRef}>
            <button
              aria-expanded={isThreadMenuOpen}
              aria-haspopup="listbox"
              className="group flex min-w-0 flex-1 items-center gap-1.5 rounded-md px-1.5 py-1.5 text-left transition hover:bg-white/[0.04] disabled:opacity-50"
              disabled={isLoadingHistory}
              onClick={() => setIsThreadMenuOpen((open) => !open)}
              type="button"
            >
              <span className="shrink-0 font-mono text-[9px] uppercase tracking-[0.18em] text-teal-300/55">
                Strategist
              </span>
              <span className="shrink-0 text-[10px] text-white/15">·</span>
              <span className="min-w-0 flex-1 truncate text-[12px] font-medium text-white/85">
                {activeThread?.title ?? "New conversation"}
              </span>
              <ChevronDownIcon
                className={cn(
                  "size-3 shrink-0 text-white/30 transition-transform group-hover:text-white/55",
                  isThreadMenuOpen && "rotate-180"
                )}
              />
            </button>

            <button
              aria-label="New thread"
              className="flex size-7 shrink-0 items-center justify-center rounded-md text-white/40 transition hover:bg-white/[0.06] hover:text-white/85 disabled:opacity-50"
              disabled={isCreatingThread}
              onClick={() => void createThread()}
              title="Start a new thread"
              type="button"
            >
              {isCreatingThread ? (
                <Loader2Icon className="size-3.5 animate-spin" />
              ) : (
                <PlusIcon className="size-3.5" />
              )}
            </button>

            {isThreadMenuOpen ? (
              <div
                className="absolute inset-x-2.5 top-[calc(100%+1px)] z-50 overflow-hidden rounded-md border border-white/10 bg-[rgba(5,10,16,0.98)] shadow-[0_18px_48px_-12px_rgba(0,0,0,0.7)] backdrop-blur-xl"
                role="listbox"
              >
                <div className="flex items-center justify-between px-3 py-2 font-mono text-[9px] uppercase tracking-[0.2em] text-white/30">
                  <span>Threads</span>
                  {usage ? (
                    <span className="tabular-nums tracking-normal text-white/30">
                      {usage.remaining}/{usage.limit}
                    </span>
                  ) : null}
                </div>
                <div className="stratmap-scroll max-h-72 overflow-y-auto border-t border-white/[0.06]">
                  {threads.map((thread) => {
                    const isActive = thread.id === activeThreadId;
                    return (
                      <button
                        aria-selected={isActive}
                        className={cn(
                          "flex w-full items-center gap-2.5 px-3 py-2 text-left transition",
                          isActive
                            ? "bg-teal-300/[0.06] text-white"
                            : "text-white/65 hover:bg-white/[0.04] hover:text-white/90"
                        )}
                        key={thread.id}
                        onClick={() => void loadThread(thread.id)}
                        role="option"
                        type="button"
                      >
                        <span
                          aria-hidden
                          className={cn(
                            "size-1.5 shrink-0 rounded-full transition-colors",
                            isActive ? "bg-teal-300" : "bg-white/15"
                          )}
                        />
                        <span className="min-w-0 flex-1 truncate text-[12px]">
                          {thread.title}
                        </span>
                        <span className="shrink-0 font-mono text-[9.5px] tabular-nums text-white/25">
                          {thread.messageCount}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <button
                  className="flex w-full items-center gap-2 border-t border-white/[0.06] px-3 py-2 text-left text-teal-100/85 transition hover:bg-teal-300/[0.06] hover:text-teal-50"
                  onClick={() => void createThread()}
                  type="button"
                >
                  {isCreatingThread ? (
                    <Loader2Icon className="size-3 shrink-0 animate-spin" />
                  ) : (
                    <PlusIcon className="size-3 shrink-0" />
                  )}
                  <span className="text-[11.5px] font-medium">New thread</span>
                </button>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="flex min-w-0 items-center gap-1.5 px-1.5 py-1.5">
            <CompassIcon className="size-3.5 shrink-0 text-teal-300/80" />
            <span className="shrink-0 font-mono text-[9px] uppercase tracking-[0.18em] text-teal-300/55">
              Strategist
            </span>
            <span className="shrink-0 text-[10px] text-white/15">·</span>
            <p className="truncate text-[11px] text-white/40">Ask, brief, edit notes</p>
          </div>
        )}
      </header>

      <Conversation className="min-h-0 flex-1">
        <ConversationContent
          className="gap-5 px-4 py-4"
          key={`${activeThreadId ?? "initial"}-${chatKey}`}
          scrollClassName="stratmap-scroll overflow-y-auto"
        >
          {isLoadingHistory ? (
            <ConversationEmptyState>
              <Loader2Icon className="size-5 animate-spin text-teal-300/80" />
              <p className="mt-3 text-xs text-white/38">Loading Strategist history...</p>
            </ConversationEmptyState>
          ) : messages.length === 0 && !isWorking ? (
            <ConversationEmptyState>
              {/* Centered graphic — a stylized globe with latitude rings and
                  a single pin. SVG so it scales crisply and inherits brand
                  teal via currentColor on the accent layer. */}
              <div className="relative flex size-28 items-center justify-center">
                {/* outer halo */}
                <div className="absolute inset-0 rounded-full bg-teal-400/8 blur-2xl" />
                <svg
                  aria-hidden
                  className="relative text-teal-300/85"
                  fill="none"
                  height="112"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeWidth="1.1"
                  viewBox="0 0 112 112"
                  width="112"
                >
                  {/* globe sphere */}
                  <circle cx="56" cy="56" r="34" stroke="rgba(255,255,255,0.18)" />
                  {/* latitude lines */}
                  <ellipse cx="56" cy="56" rx="34" ry="11" stroke="rgba(255,255,255,0.12)" />
                  <ellipse cx="56" cy="56" rx="34" ry="22" stroke="rgba(255,255,255,0.1)" />
                  {/* meridian */}
                  <ellipse cx="56" cy="56" rx="11" ry="34" stroke="rgba(255,255,255,0.12)" />
                  {/* outer orbital ring (teal accent) */}
                  <ellipse
                    cx="56"
                    cy="56"
                    rx="50"
                    ry="18"
                    transform="rotate(-22 56 56)"
                    stroke="currentColor"
                    strokeOpacity="0.55"
                  />
                  {/* pin: drop + dot */}
                  <path
                    d="M76 30c0 6-8 14-8 14s-8-8-8-14a8 8 0 1 1 16 0z"
                    fill="currentColor"
                    fillOpacity="0.18"
                    stroke="currentColor"
                    strokeOpacity="0.95"
                  />
                  <circle cx="68" cy="30" r="2.4" fill="currentColor" />
                </svg>
              </div>

              <div className="mt-1 space-y-1.5">
                <h3 className="text-[14px] font-medium text-white/88">
                  Start with the map in view
                </h3>
                <p className="max-w-[18rem] text-[11.5px] leading-relaxed text-white/40">
                  Ask for a brief, find every note tied to a place, or have the Strategist
                  tighten the selected file.
                </p>
              </div>

              <div className="mt-6 flex w-full flex-col items-center gap-2">
                {suggestions.map((suggestion) => (
                  <Button
                    className="h-auto w-full max-w-[18rem] justify-center rounded-md px-2 py-1.5 text-center text-xs text-white/48 hover:bg-transparent hover:text-teal-100/82"
                    key={suggestion}
                    onClick={() => {
                      void handleSubmit({ files: [], text: suggestion });
                    }}
                    type="button"
                    variant="ghost"
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </ConversationEmptyState>
          ) : (
            <>
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  onSelectFile={onSelectFile}
                />
              ))}
              {status === "submitted" ? <ThinkingIndicator /> : null}
            </>
          )}
        </ConversationContent>
        <ConversationScrollButton className="border-white/10 bg-black/50 text-white hover:bg-black/70" />
      </Conversation>

      <div className="shrink-0 border-t border-white/8 px-4 py-3">
        {localError || error ? (
          <div className="mb-2.5 flex items-start gap-2 rounded-lg border border-rose-400/18 bg-rose-500/8 px-3 py-2 text-xs text-rose-200/80">
            <AlertCircleIcon className="mt-0.5 size-3.5 shrink-0" />
            <p>{localError ?? error?.message}</p>
          </div>
        ) : null}

        <PromptInput
          className="rounded-xl border border-white/10 bg-white/4 p-2.5"
          onSubmit={(message, event) => {
            event.preventDefault();
            void handleSubmit(message);
          }}
        >
          <PromptInputBody>
            <PromptInputTextarea
              className="min-h-14 border-none bg-transparent px-2 text-sm text-white placeholder:text-white/28 focus-visible:ring-0"
              onChange={(event) => setInput(event.currentTarget.value)}
              placeholder={
                accessMode !== "owner"
                  ? publicPlaceholder
                  : selectedPath
                  ? `Ask about ${basename(selectedPath)} or request an edit...`
                  : "Ask about the map, notes, or next move..."
              }
              value={input}
            />
          </PromptInputBody>
          <PromptInputFooter className="mt-2 items-center justify-end gap-2">
            <PromptInputSubmit
              className="rounded-full border border-white/10 bg-white text-slate-950 hover:bg-white/90"
              disabled={
                (!input.trim() && status === "ready") ||
                isLoadingHistory ||
                (usage?.remaining ?? 1) <= 0
              }
              onStop={() => {
                void stop();
              }}
              status={status}
            />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </section>
  );
}

export function ChatPanel(props: ChatPanelProps) {
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);

  return (
    <ChatRuntime
      {...props}
      activeThreadId={activeThreadId}
      onActiveThreadChange={setActiveThreadId}
    />
  );
}
