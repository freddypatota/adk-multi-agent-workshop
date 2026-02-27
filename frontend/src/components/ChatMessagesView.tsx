import type React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Copy, CopyCheck } from "lucide-react";
import { InputForm, AttachedFile } from "@/components/InputForm";
import { useState, ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from 'remark-gfm';
import { cn } from "@/utils";
import { Badge } from "@/components/ui/badge";
import { ActivityTimeline } from "@/components/ActivityTimeline";
import { useTranslation } from "react-i18next";

type MdComponentProps = {
  className?: string;
  children?: ReactNode;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

interface ProcessedEvent {
  title: string;
  data: unknown;
}

const mdComponents = {
  h1: ({ className, children, ...props }: MdComponentProps) => (
    <h1 className={cn("text-2xl font-bold mt-4 mb-2", className)} {...props}>
      {children}
    </h1>
  ),
  h2: ({ className, children, ...props }: MdComponentProps) => (
    <h2 className={cn("text-xl font-bold mt-3 mb-2", className)} {...props}>
      {children}
    </h2>
  ),
  h3: ({ className, children, ...props }: MdComponentProps) => (
    <h3 className={cn("text-lg font-bold mt-3 mb-1", className)} {...props}>
      {children}
    </h3>
  ),
  p: ({ className, children, ...props }: MdComponentProps) => (
    <p className={cn("mb-3 leading-7", className)} {...props}>
      {children}
    </p>
  ),
  a: ({ className, children, href, ...props }: MdComponentProps) => (
    <Badge className="text-xs mx-0.5">
      <a
        className={cn("text-primary-foreground hover:text-chart-1 text-xs", className)}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        {...props}
      >
        {children}
      </a>
    </Badge>
  ),
  ul: ({ className, children, ...props }: MdComponentProps) => (
    <ul className={cn("list-disc pl-6 mb-3", className)} {...props}>
      {children}
    </ul>
  ),
  ol: ({ className, children, ...props }: MdComponentProps) => (
    <ol className={cn("list-decimal pl-6 mb-3", className)} {...props}>
      {children}
    </ol>
  ),
  li: ({ className, children, ...props }: MdComponentProps) => (
    <li className={cn("mb-1", className)} {...props}>
      {children}
    </li>
  ),
  blockquote: ({ className, children, ...props }: MdComponentProps) => (
    <blockquote
      className={cn(
        "border-l-4 border-muted-foreground/50 pl-4 italic my-3 text-sm",
        className
      )}
      {...props}
    >
      {children}
    </blockquote>
  ),
  code: ({ className, children, ...props }: MdComponentProps) => (
    <code
      className={cn(
        "bg-muted rounded px-1 py-0.5 font-mono text-xs",
        className
      )}
      {...props}
    >
      {children}
    </code>
  ),
  pre: ({ className, children, ...props }: MdComponentProps) => (
    <pre
      className={cn(
        "bg-muted p-3 rounded-lg overflow-x-auto font-mono text-xs my-3",
        className
      )}
      {...props}
    >
      {children}
    </pre>
  ),
  hr: ({ className, ...props }: MdComponentProps) => (
    <hr className={cn("border-border my-4", className)} {...props} />
  ),
  table: ({ className, children, ...props }: MdComponentProps) => (
    <div className="my-3 overflow-x-auto">
      <table className={cn("border-collapse w-full", className)} {...props}>
        {children}
      </table>
    </div>
  ),
  th: ({ className, children, ...props }: MdComponentProps) => (
    <th
      className={cn(
        "border border-border px-3 py-2 text-left font-bold",
        className
      )}
      {...props}
    >
      {children}
    </th>
  ),
  td: ({ className, children, ...props }: MdComponentProps) => (
    <td
      className={cn("border border-border px-3 py-2", className)}
      {...props}
    >
      {children}
    </td>
  ),
};

interface HumanMessageBubbleProps {
  message: { content: string; id: string };
  mdComponents: typeof mdComponents;
}

const HumanMessageBubble: React.FC<HumanMessageBubbleProps> = ({
  message,
  mdComponents,
}) => {
  return (
    <div className="text-primary-foreground rounded-3xl break-words min-h-7 bg-primary max-w-[90%] px-4 pt-3 rounded-br-lg">
      <ReactMarkdown components={mdComponents} remarkPlugins={[remarkGfm]}>
        {message.content}
      </ReactMarkdown>
    </div>
  );
};

interface AiMessageBubbleProps {
  message: { content: string; id: string };
  mdComponents: typeof mdComponents;
  handleCopy: (text: string, messageId: string) => void;
  copiedMessageId: string | null;
  agent?: string;
  processedEvents: ProcessedEvent[];
  isLoading: boolean;
  showTimeline: boolean;
}

const AiMessageBubble: React.FC<AiMessageBubbleProps> = ({
  message,
  mdComponents,
  handleCopy,
  copiedMessageId,
  agent,
  processedEvents,
  isLoading,
  showTimeline,
}) => {
  const shouldShowTimeline = showTimeline && processedEvents.length > 0;
  const shouldDisplayDirectly = agent === "loan_drawdown_agent";

  const renderContent = () => (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex items-start gap-3">
        <div id={`message-content-${message.id}`} className={cn("flex-1", isLoading && "typing-cursor")}>
          <ReactMarkdown components={mdComponents} remarkPlugins={[remarkGfm]}>
            {message.content}
          </ReactMarkdown>
        </div>
        <button
          onClick={() => handleCopy(message.content, message.id)}
          className="p-1 hover:bg-muted rounded flex-shrink-0"
        >
          {copiedMessageId === message.id ? (
            <CopyCheck className="h-4 w-4 text-chart-2" />
          ) : (
            <Copy className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
      </div>
    </div>
  );

  if (shouldDisplayDirectly) {
    return (
      <div className="relative break-words flex flex-col w-full">
        {shouldShowTimeline && (
          <div className="w-full mb-2">
            <ActivityTimeline
              processedEvents={processedEvents}
              isLoading={isLoading}
            />
          </div>
        )}
        {renderContent()}
      </div>
    );
  } else if (shouldShowTimeline) {
    return (
      <div className="relative break-words flex flex-col w-full">
        <div className="w-full">
          <ActivityTimeline
            processedEvents={processedEvents}
            isLoading={isLoading}
          />
        </div>
        {message.content && message.content.trim() && (
          <div className="mt-2">
            {renderContent()}
          </div>
        )}
      </div>
    );
  } else {
    return (
      <div className="relative break-words flex flex-col w-full">
        {renderContent()}
      </div>
    );
  }
};

interface ChatMessagesViewProps {
  messages: { type: "human" | "ai"; content: string; id: string; agent?: string }[];
  isLoading: boolean;
  scrollAreaRef: React.RefObject<HTMLDivElement | null>;
  onSubmit: (query: string, files?: AttachedFile[]) => void;
  messageEvents: Map<string, ProcessedEvent[]>;
  showTimeline: boolean;
}

export function ChatMessagesView({
  messages,
  isLoading,
  scrollAreaRef,
  onSubmit,
  messageEvents,
  showTimeline,
}: ChatMessagesViewProps) {
  const { t } = useTranslation();
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  const handleCopy = async (text: string, messageId: string) => {
    try {
      const contentElement = document.getElementById(`message-content-${messageId}`);
      if (contentElement) {
        const html = contentElement.innerHTML;
        await navigator.clipboard.write([
          new ClipboardItem({
            "text/html": new Blob([html], { type: "text/html" }),
            "text/plain": new Blob([text], { type: "text/plain" }),
          }),
        ]);
      } else {
        await navigator.clipboard.writeText(text);
      }
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      console.error("Failed to copy rich text:", err);
      try {
        await navigator.clipboard.writeText(text);
        setCopiedMessageId(messageId);
        setTimeout(() => setCopiedMessageId(null), 2000);
      } catch (copyErr) {
        console.error("Failed to copy plain text as fallback:", copyErr);
      }
    }
  };

  const lastAiMessage = messages.slice().reverse().find(m => m.type === "ai");
  const lastAiMessageId = lastAiMessage?.id;

  return (
    <div className="flex flex-col h-full w-full bg-background text-foreground">
      <div className="flex-1 w-full overflow-y-auto">
        <ScrollArea ref={scrollAreaRef} className="h-full">
          <div className="p-4 space-y-2 w-full">
            {messages.map((message) => {
              const eventsForMessage = message.type === "ai" ? (messageEvents.get(message.id) || []) : [];
              const isCurrentMessageTheLastAiMessage = message.type === "ai" && message.id === lastAiMessageId;

              return (
                <div
                  key={message.id}
                  className={`flex ${message.type === "human" ? "justify-end" : "justify-start"}`}
                >
                  {message.type === "human" ? (
                    <HumanMessageBubble
                      message={message}
                      mdComponents={mdComponents}
                    />
                  ) : (
                    <AiMessageBubble
                      message={message}
                      mdComponents={mdComponents}
                      handleCopy={handleCopy}
                      copiedMessageId={copiedMessageId}
                      agent={message.agent}
                      processedEvents={eventsForMessage}
                      isLoading={isCurrentMessageTheLastAiMessage && isLoading}
                      showTimeline={showTimeline}
                    />
                  )}
                </div>
              );
            })}
            {isLoading && !lastAiMessage && messages.some(m => m.type === 'human') && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{t('chat.thinking')}</span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
      <div className="border-t p-4 w-full bg-background flex-shrink-0">
        <div className="w-full">
          <InputForm onSubmit={(query, files) => onSubmit(query, files)} isLoading={isLoading} context="chat" />
        </div>
      </div>
    </div>
  );
}
