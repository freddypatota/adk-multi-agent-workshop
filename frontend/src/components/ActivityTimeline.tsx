import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Loader,
  Activity,
  Info,
  Search,
  Brain,
  Shield,
  FileText,
  DollarSign,
  Package,
  ChevronDown,
  ChevronUp,
  Link,
  CheckCircle2,
} from "lucide-react";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { useTranslation } from "react-i18next";

export interface ProcessedEvent {
  title: string;
  data: unknown;
}

interface ActivityTimelineProps {
  processedEvents: ProcessedEvent[];
  isLoading: boolean;
}

export function ActivityTimeline({
  processedEvents,
  isLoading,
}: ActivityTimelineProps) {
  const [isTimelineCollapsed, setIsTimelineCollapsed] =
    useState<boolean>(false);
  const { t } = useTranslation();

  /** Convert a JSON value into a readable markdown key-value list. */
  const jsonToMarkdown = (value: unknown, depth: number = 0): string => {
    if (value === null || value === undefined) return '_none_';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'number' || typeof value === 'bigint') return String(value);
    if (typeof value === 'string') {
      // Try parsing stringified JSON for nested objects
      if (depth === 0) {
        try {
          const parsed = JSON.parse(value);
          if (typeof parsed === 'object' && parsed !== null) {
            return jsonToMarkdown(parsed, depth);
          }
        } catch { /* not JSON, use as-is */ }
      }
      return value;
    }
    if (Array.isArray(value)) {
      if (value.length === 0) return '_empty list_';
      // Simple scalar arrays render inline
      if (value.every(v => typeof v !== 'object' || v === null)) {
        return value.map(v => `\`${String(v)}\``).join(', ');
      }
      return value.map(v => `- ${jsonToMarkdown(v, depth + 1)}`).join('\n');
    }
    if (typeof value === 'object') {
      const entries = Object.entries(value as Record<string, unknown>);
      if (entries.length === 0) return '_empty_';
      return entries
        .map(([k, v]) => {
          const formatted = jsonToMarkdown(v, depth + 1);
          // If the value is multiline, put it on the next line
          if (formatted.includes('\n')) {
            return `**${k}**:\n${formatted}`;
          }
          return `**${k}**: ${formatted}`;
        })
        .join('\n');
    }
    return String(value);
  };

  const formatEventData = (data: unknown): string => {
    if (typeof data === "object" && data !== null && 'type' in data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const structuredData = data as any;
      switch (structuredData.type) {
        case 'call':
        case 'functionCall':
          return jsonToMarkdown(structuredData.args, 0);
        case 'result':
        case 'functionResponse':
          return jsonToMarkdown(structuredData.result ?? structuredData.response, 0);
        case 'text':
          return structuredData.content;
        case 'agent_start':
        case 'stage_complete':
          return '';
        case 'sources': {
          const sources = structuredData.content as Record<string, { title: string; url: string }>;
          if (Object.keys(sources).length === 0) {
            return t('timeline.noSources');
          }
          return Object.values(sources)
            .map(source => `[${source.title || t('timeline.untitledSource')}](${source.url})`).join(', ');
        }
        default:
          return jsonToMarkdown(data, 0);
      }
    }

    if (typeof data === "string") {
      try {
        const parsed = JSON.parse(data);
        return jsonToMarkdown(parsed, 0);
      } catch {
        return data;
      }
    } else if (Array.isArray(data)) {
      return jsonToMarkdown(data, 0);
    } else if (typeof data === "object" && data !== null) {
      return jsonToMarkdown(data, 0);
    }
    return String(data);
  };

  const getEventIcon = (title: string, index: number, data?: unknown) => {
    if (index === 0 && isLoading && processedEvents.length === 0) {
      return <Loader className="h-4 w-4 text-primary-foreground animate-spin" />;
    }

    // Handle structured event types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eventData = data as any;
    if (eventData && typeof eventData === 'object' && 'type' in eventData) {
      if (eventData.type === 'stage_complete') {
        return <CheckCircle2 className="h-4 w-4 text-green-300" />;
      }
      if (eventData.type === 'agent_start') {
        const agentName = eventData.name as string;
        if (agentName === 'sanctions_agent') return <Shield className="h-4 w-4 text-primary-foreground" />;
        if (agentName === 'prohibited_goods_agent') return <Package className="h-4 w-4 text-primary-foreground" />;
        if (agentName === 'credit_ceiling_agent') return <DollarSign className="h-4 w-4 text-primary-foreground" />;
        if (agentName === 'extraction_agent') return <FileText className="h-4 w-4 text-primary-foreground" />;
        if (agentName === 'decision_agent') return <Brain className="h-4 w-4 text-primary-foreground" />;
        return <Activity className="h-4 w-4 text-primary-foreground" />;
      }
    }

    const lower = title.toLowerCase();
    if (lower.includes("sanction") || lower.includes("check_sanctions")) {
      return <Shield className="h-4 w-4 text-primary-foreground" />;
    } else if (lower.includes("prohibited") || lower.includes("prohibited_goods")) {
      return <Package className="h-4 w-4 text-primary-foreground" />;
    } else if (lower.includes("financial") || lower.includes("credit") || lower.includes("get_financial_context")) {
      return <DollarSign className="h-4 w-4 text-primary-foreground" />;
    } else if (lower.includes("extract") || lower.includes("invoice")) {
      return <FileText className="h-4 w-4 text-primary-foreground" />;
    } else if (lower.includes("function call") || lower.includes("function response")) {
      return <Activity className="h-4 w-4 text-primary-foreground" />;
    } else if (lower.includes("thinking")) {
      return <Loader className="h-4 w-4 text-primary-foreground animate-spin" />;
    } else if (lower.includes("evaluating") || lower.includes("decision")) {
      return <Brain className="h-4 w-4 text-primary-foreground" />;
    } else if (lower.includes("search")) {
      return <Search className="h-4 w-4 text-primary-foreground" />;
    } else if (lower.includes("retrieved sources")) {
      return <Link className="h-4 w-4 text-primary-foreground" />;
    }
    return <Activity className="h-4 w-4 text-primary-foreground" />;
  };

  useEffect(() => {
    if (!isLoading && processedEvents.length !== 0) {
      setIsTimelineCollapsed(true);
    }
  }, [isLoading, processedEvents]);

  return (
    <Card className={`border rounded-lg bg-card ${isTimelineCollapsed ? "h-10 py-2" : "max-h-96 py-2"}`}>
      <CardHeader className="py-0">
        <CardDescription className="flex items-center justify-between">
          <div
            className="flex items-center justify-start text-sm w-full cursor-pointer gap-2 text-card-foreground"
            onClick={() => setIsTimelineCollapsed(!isTimelineCollapsed)}
          >
            <span>{t('timeline.research')}</span>
            {isTimelineCollapsed ? (
              <ChevronDown className="h-4 w-4 mr-2" />
            ) : (
              <ChevronUp className="h-4 w-4 mr-2" />
            )}
          </div>
        </CardDescription>
      </CardHeader>
      {!isTimelineCollapsed && (
        <ScrollArea className="max-h-80 overflow-y-auto">
          <CardContent>
            {isLoading && processedEvents.length === 0 && (
              <div className="relative pl-8 pb-4">
                <div className="absolute left-3 top-3.5 h-full w-0.5 bg-border" />
                <div className="absolute left-0.5 top-2 h-6 w-6 rounded-full bg-primary flex items-center justify-center ring-4 ring-card">
                  <Loader className="h-3 w-3 text-primary-foreground animate-spin" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">
                    {t('timeline.thinking')}
                  </p>
                </div>
              </div>
            )}
            {processedEvents.length > 0 ? (
              <div className="space-y-0">
                {processedEvents.map((eventItem, index) => (
                  <div key={index} className="relative pl-8 pb-4">
                    {index < processedEvents.length - 1 ||
                    (isLoading && index === processedEvents.length - 1) ? (
                      <div className="absolute left-3 top-3.5 h-full w-0.5 bg-border" />
                    ) : null}
                    <div className="absolute left-0.5 top-2 h-6 w-6 rounded-full bg-primary flex items-center justify-center ring-4 ring-card">
                      {getEventIcon(eventItem.title, index, eventItem.data)}
                    </div>
                    <div>
                      <p className="text-sm text-foreground font-medium mb-0.5">
                        {eventItem.title}
                      </p>
                      <div className="text-xs text-muted-foreground leading-relaxed">
                        <ReactMarkdown
                          components={{
                            p: ({ children }) => <span>{children}</span>,
                            a: ({ href, children }) => (
                              <a
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:text-primary underline"
                              >
                                {children}
                              </a>
                            ),
                            code: ({ children }) => (
                              <code className="bg-background/50 px-1 py-0.5 rounded text-xs">
                                {children}
                              </code>
                            ),
                          }}
                        >
                          {formatEventData(eventItem.data)}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && processedEvents.length > 0 && (
                  <div className="relative pl-8 pb-4">
                    <div className="absolute left-0.5 top-2 h-6 w-6 rounded-full bg-primary flex items-center justify-center ring-4 ring-card">
                      <Loader className="h-3 w-3 text-primary-foreground animate-spin" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground font-medium">
                        {t('timeline.thinking')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : !isLoading ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground pt-10">
                <Info className="h-6 w-6 mb-3" />
                  <p className="text-sm">{t('timeline.noActivity')}</p>
                <p className="text-xs text-muted-foreground/80 mt-1">
                    {t('timeline.timelineUpdate')}
                </p>
              </div>
            ) : null}
          </CardContent>
        </ScrollArea>
      )}
    </Card>
  );
}
