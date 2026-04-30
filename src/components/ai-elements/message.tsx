"use client";

import { Button } from "@/components/ui/button";
import {
  ButtonGroup,
  ButtonGroupText,
} from "@/components/ui/button-group";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { cjk } from "@streamdown/cjk";
import { code } from "@streamdown/code";
import { math } from "@streamdown/math";
import { mermaid } from "@streamdown/mermaid";
import type { UIMessage } from "ai";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckIcon,
  ClipboardIcon,
  DownloadIcon,
  Maximize2Icon,
  XIcon,
} from "lucide-react";
import type { ComponentProps, HTMLAttributes, ReactElement, ReactNode } from "react";
import {
  createContext,
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Streamdown } from "streamdown";

export type MessageProps = HTMLAttributes<HTMLDivElement> & {
  from: UIMessage["role"];
};

export const Message = ({ className, from, ...props }: MessageProps) => (
  <div
    className={cn(
      "group flex w-full max-w-[95%] flex-col gap-2",
      from === "user" ? "is-user ml-auto justify-end" : "is-assistant",
      className
    )}
    {...props}
  />
);

export type MessageContentProps = HTMLAttributes<HTMLDivElement>;

export const MessageContent = ({
  children,
  className,
  ...props
}: MessageContentProps) => (
  <div
    className={cn(
      "is-user:dark flex w-fit min-w-0 max-w-full flex-col gap-2 overflow-hidden text-sm",
      "group-[.is-user]:ml-auto group-[.is-user]:rounded-lg group-[.is-user]:bg-secondary group-[.is-user]:px-4 group-[.is-user]:py-3 group-[.is-user]:text-foreground",
      "group-[.is-assistant]:text-foreground",
      className
    )}
    {...props}
  >
    {children}
  </div>
);

export type MessageActionsProps = ComponentProps<"div">;

export const MessageActions = ({
  className,
  children,
  ...props
}: MessageActionsProps) => (
  <div className={cn("flex items-center gap-1", className)} {...props}>
    {children}
  </div>
);

export type MessageActionProps = ComponentProps<typeof Button> & {
  tooltip?: string;
  label?: string;
};

export const MessageAction = ({
  tooltip,
  children,
  label,
  variant = "ghost",
  size = "icon-sm",
  ...props
}: MessageActionProps) => {
  const button = (
    <Button size={size} type="button" variant={variant} {...props}>
      {children}
      <span className="sr-only">{label || tooltip}</span>
    </Button>
  );

  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>{button}</TooltipTrigger>
          <TooltipContent>
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return button;
};

interface MessageBranchContextType {
  currentBranch: number;
  totalBranches: number;
  goToPrevious: () => void;
  goToNext: () => void;
  branches: ReactElement[];
  setBranches: (branches: ReactElement[]) => void;
}

const MessageBranchContext = createContext<MessageBranchContextType | null>(
  null
);

const useMessageBranch = () => {
  const context = useContext(MessageBranchContext);

  if (!context) {
    throw new Error(
      "MessageBranch components must be used within MessageBranch"
    );
  }

  return context;
};

export type MessageBranchProps = HTMLAttributes<HTMLDivElement> & {
  defaultBranch?: number;
  onBranchChange?: (branchIndex: number) => void;
};

export const MessageBranch = ({
  defaultBranch = 0,
  onBranchChange,
  className,
  ...props
}: MessageBranchProps) => {
  const [currentBranch, setCurrentBranch] = useState(defaultBranch);
  const [branches, setBranches] = useState<ReactElement[]>([]);

  const handleBranchChange = useCallback(
    (newBranch: number) => {
      setCurrentBranch(newBranch);
      onBranchChange?.(newBranch);
    },
    [onBranchChange]
  );

  const goToPrevious = useCallback(() => {
    const newBranch =
      currentBranch > 0 ? currentBranch - 1 : branches.length - 1;
    handleBranchChange(newBranch);
  }, [currentBranch, branches.length, handleBranchChange]);

  const goToNext = useCallback(() => {
    const newBranch =
      currentBranch < branches.length - 1 ? currentBranch + 1 : 0;
    handleBranchChange(newBranch);
  }, [currentBranch, branches.length, handleBranchChange]);

  const contextValue = useMemo<MessageBranchContextType>(
    () => ({
      branches,
      currentBranch,
      goToNext,
      goToPrevious,
      setBranches,
      totalBranches: branches.length,
    }),
    [branches, currentBranch, goToNext, goToPrevious]
  );

  return (
    <MessageBranchContext.Provider value={contextValue}>
      <div
        className={cn("grid w-full gap-2 [&>div]:pb-0", className)}
        {...props}
      />
    </MessageBranchContext.Provider>
  );
};

export type MessageBranchContentProps = HTMLAttributes<HTMLDivElement>;

export const MessageBranchContent = ({
  children,
  ...props
}: MessageBranchContentProps) => {
  const { currentBranch, setBranches, branches } = useMessageBranch();
  const childrenArray = useMemo(
    () => (Array.isArray(children) ? children : [children]),
    [children]
  );

  // Use useEffect to update branches when they change
  useEffect(() => {
    if (branches.length !== childrenArray.length) {
      setBranches(childrenArray);
    }
  }, [childrenArray, branches, setBranches]);

  return childrenArray.map((branch, index) => (
    <div
      className={cn(
        "grid gap-2 overflow-hidden [&>div]:pb-0",
        index === currentBranch ? "block" : "hidden"
      )}
      key={branch.key}
      {...props}
    >
      {branch}
    </div>
  ));
};

export type MessageBranchSelectorProps = ComponentProps<typeof ButtonGroup>;

export const MessageBranchSelector = ({
  className,
  ...props
}: MessageBranchSelectorProps) => {
  const { totalBranches } = useMessageBranch();

  // Don't render if there's only one branch
  if (totalBranches <= 1) {
    return null;
  }

  return (
    <ButtonGroup
      className={cn(
        "[&>*:not(:first-child)]:rounded-l-md [&>*:not(:last-child)]:rounded-r-md",
        className
      )}
      orientation="horizontal"
      {...props}
    />
  );
};

export type MessageBranchPreviousProps = ComponentProps<typeof Button>;

export const MessageBranchPrevious = ({
  children,
  ...props
}: MessageBranchPreviousProps) => {
  const { goToPrevious, totalBranches } = useMessageBranch();

  return (
    <Button
      aria-label="Previous branch"
      disabled={totalBranches <= 1}
      onClick={goToPrevious}
      size="icon-sm"
      type="button"
      variant="ghost"
      {...props}
    >
      {children ?? <ChevronLeftIcon size={14} />}
    </Button>
  );
};

export type MessageBranchNextProps = ComponentProps<typeof Button>;

export const MessageBranchNext = ({
  children,
  ...props
}: MessageBranchNextProps) => {
  const { goToNext, totalBranches } = useMessageBranch();

  return (
    <Button
      aria-label="Next branch"
      disabled={totalBranches <= 1}
      onClick={goToNext}
      size="icon-sm"
      type="button"
      variant="ghost"
      {...props}
    >
      {children ?? <ChevronRightIcon size={14} />}
    </Button>
  );
};

export type MessageBranchPageProps = HTMLAttributes<HTMLSpanElement>;

export const MessageBranchPage = ({
  className,
  ...props
}: MessageBranchPageProps) => {
  const { currentBranch, totalBranches } = useMessageBranch();

  return (
    <ButtonGroupText
      className={cn(
        "border-none bg-transparent text-muted-foreground shadow-none",
        className
      )}
      {...props}
    >
      {currentBranch + 1} of {totalBranches}
    </ButtonGroupText>
  );
};

export type MessageResponseProps = ComponentProps<typeof Streamdown>;

const streamdownPlugins = { cjk, code, math, mermaid };

function tableToCsv(table: HTMLTableElement | null) {
  if (!table) return "";
  return Array.from(table.querySelectorAll("tr"))
    .map((row) =>
      Array.from(row.querySelectorAll("th,td"))
        .map((cell) => {
          const text = (cell.textContent ?? "").replace(/\s+/g, " ").trim();
          return `"${text.replace(/"/g, '""')}"`;
        })
        .join(",")
    )
    .join("\n");
}

function TableControlButton({
  children,
  label,
  onClick,
  variant = "default",
}: {
  children: ReactElement;
  label: string;
  onClick: () => void;
  variant?: "default" | "success";
}) {
  return (
    <button
      aria-label={label}
      className={cn(
        "flex size-6 items-center justify-center rounded-md transition",
        variant === "success"
          ? "bg-teal-300/14 text-teal-200"
          : "text-white/38 hover:bg-white/[0.07] hover:text-white/78"
      )}
      onClick={onClick}
      title={label}
      type="button"
    >
      {children}
    </button>
  );
}

type ChatTableProps = Record<string, unknown> & {
  children?: ReactNode;
};

function ChatTable({ children, ...props }: ChatTableProps) {
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const tableRef = useRef<HTMLTableElement>(null);
  const tableProps = { ...props };
  delete tableProps.node;
  const safeTableProps = tableProps as ComponentProps<"table">;

  async function copyTable() {
    const csv = tableToCsv(tableRef.current);
    if (!csv) return;
    try {
      await navigator.clipboard?.writeText(csv);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  }

  function downloadTable() {
    const csv = tableToCsv(tableRef.current);
    if (!csv) return;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "stratbook-table.csv";
    anchor.click();
    URL.revokeObjectURL(url);
    setDownloaded(true);
    window.setTimeout(() => setDownloaded(false), 1400);
  }

  const tableClassName =
    "w-full min-w-[34rem] border-collapse text-[11px] leading-snug";

  return (
    <>
      <div className="group/table relative my-4 overflow-hidden rounded-lg border border-white/[0.08] bg-[#031016]/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]">
        <div className="absolute right-2 top-2 z-20 flex items-center gap-1 rounded-md border border-white/[0.06] bg-[#061018]/88 p-0.5 opacity-80 shadow-lg backdrop-blur transition group-hover/table:opacity-100">
          <TableControlButton
            label={copied ? "Copied" : "Copy table"}
            onClick={() => void copyTable()}
            variant={copied ? "success" : "default"}
          >
            {copied ? <CheckIcon className="size-3.5" /> : <ClipboardIcon className="size-3.5" />}
          </TableControlButton>
          <TableControlButton
            label={downloaded ? "Downloaded" : "Download CSV"}
            onClick={downloadTable}
            variant={downloaded ? "success" : "default"}
          >
            {downloaded ? <CheckIcon className="size-3.5" /> : <DownloadIcon className="size-3.5" />}
          </TableControlButton>
          <TableControlButton label="Expand table" onClick={() => setIsExpanded(true)}>
            <Maximize2Icon className="size-3.5" />
          </TableControlButton>
        </div>
        <div className="stratmap-scroll max-h-72 overflow-auto">
          <table className={tableClassName} ref={tableRef} {...safeTableProps}>
            {children}
          </table>
        </div>
      </div>

      {isExpanded ? (
        <div className="fixed inset-0 z-[100] flex flex-col bg-[#03070c]/96 backdrop-blur-xl">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(45,212,191,0.10),transparent_34%),radial-gradient(circle_at_90%_20%,rgba(255,255,255,0.05),transparent_28%)]" />
          <div className="relative flex h-12 shrink-0 items-center justify-end border-b border-white/[0.08] px-4">
            <div className="flex items-center gap-1 rounded-lg border border-white/[0.08] bg-white/[0.035] p-1 shadow-[0_16px_48px_rgba(0,0,0,0.35)] backdrop-blur-xl">
              <TableControlButton
                label={copied ? "Copied" : "Copy table"}
                onClick={() => void copyTable()}
                variant={copied ? "success" : "default"}
              >
                {copied ? <CheckIcon className="size-3.5" /> : <ClipboardIcon className="size-3.5" />}
              </TableControlButton>
              <TableControlButton
                label={downloaded ? "Downloaded" : "Download CSV"}
                onClick={downloadTable}
                variant={downloaded ? "success" : "default"}
              >
                {downloaded ? <CheckIcon className="size-3.5" /> : <DownloadIcon className="size-3.5" />}
              </TableControlButton>
              <TableControlButton label="Close table" onClick={() => setIsExpanded(false)}>
                <XIcon className="size-3.5" />
              </TableControlButton>
            </div>
          </div>
          <div className="stratmap-scroll relative min-h-0 flex-1 overflow-auto p-5">
            <table
              className="w-full min-w-[52rem] border-collapse text-[12px] leading-snug"
              {...safeTableProps}
            >
              {children}
            </table>
          </div>
        </div>
      ) : null}
    </>
  );
}

export const MessageResponse = memo(
  ({ className, components, ...props }: MessageResponseProps) => (
    <Streamdown
      className={cn(
        "size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
        className
      )}
      components={{
        p: ({ children, ...paragraphProps }) => (
          <div className="my-3 first:mt-0 last:mb-0" {...paragraphProps}>
            {children}
          </div>
        ),
        hr: ({ ...hrProps }) => (
          <hr className="my-7 border-white/10" {...hrProps} />
        ),
        table: ChatTable as NonNullable<MessageResponseProps["components"]>["table"],
        thead: ({ children, ...theadProps }) => (
          <thead className="sticky top-0 z-10 bg-[#061018]" {...theadProps}>
            {children}
          </thead>
        ),
        th: ({ children, ...thProps }) => (
          <th
            className="border-b border-white/[0.08] px-2.5 py-2 text-left align-bottom text-[10px] font-semibold uppercase tracking-[0.08em] text-white/62"
            {...thProps}
          >
            {children}
          </th>
        ),
        td: ({ children, ...tdProps }) => (
          <td
            className="border-b border-white/[0.045] px-2.5 py-2 align-top text-[11.5px] leading-snug text-white/72"
            {...tdProps}
          >
            {children}
          </td>
        ),
        ...components,
      }}
      plugins={streamdownPlugins}
      {...props}
    />
  ),
  (prevProps, nextProps) =>
    prevProps.children === nextProps.children &&
    nextProps.isAnimating === prevProps.isAnimating
);

MessageResponse.displayName = "MessageResponse";

export type MessageToolbarProps = ComponentProps<"div">;

export const MessageToolbar = ({
  className,
  children,
  ...props
}: MessageToolbarProps) => (
  <div
    className={cn(
      "mt-4 flex w-full items-center justify-between gap-4",
      className
    )}
    {...props}
  >
    {children}
  </div>
);
