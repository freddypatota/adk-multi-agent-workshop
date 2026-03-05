import { useState, useRef, useCallback, useEffect } from "react";
import { MainLayout } from "@/components/MainLayout";
import { ChatMessagesView } from "@/components/ChatMessagesView";
import { ThemeProvider, useTheme } from "@/components/ThemeProvider";
import { useTranslation } from 'react-i18next';
import { WorkflowDashboard, WorkflowStageData, UploadedFile } from "@/components/WorkflowDashboard";
import { AttachedFile } from "@/components/InputForm";

import { useAuth } from "@/hooks/useAuth";
import { AuthProvider } from "@/contexts/AuthProvider";

interface MessageWithAgent {
  type: "human" | "ai";
  content: string;
  id: string;
  agent?: string;
}

interface ProcessedEvent {
  title: string;
  data: unknown;
}

const displayFunctionCalls = true;
const displayFunctionResponses = false;
const useStreaming = true;

interface SSEContentPart {
  text?: string;
  functionCall?: { name: string; args: Record<string, unknown> };
  functionResponse?: { name: string; response: Record<string, unknown> };
}

interface SSEParsedEvent {
  content?: { parts?: SSEContentPart[] };
  author?: string;
  actions?: { stateDelta?: Record<string, unknown> };
  partial?: boolean;
}

// Map tool names to workflow stages (for functionResponse events).
// Note: prohibited_goods_rag is excluded — it returns keywords, not a ComplianceCheckResult.
const TOOL_STAGE_MAP: Record<string, keyof WorkflowStageData> = {
  check_sanctions: "sanctions",
  get_financial_context: "creditCeiling",
};

// Map state keys to workflow stages (for stateDelta events from output_key agents)
const STATE_KEY_STAGE_MAP: Record<string, keyof WorkflowStageData> = {
  extracted_invoice: "extraction",
  sanctions_result: "sanctions",
  prohibited_goods_result: "prohibitedGoods",
  financial_context: "creditCeiling",
  validation_report: "decision",
};

// Human-readable labels for agent transitions
const AGENT_LABELS: Record<string, string> = {
  extraction_agent: "Extracting invoice data",
  sanctions_agent: "Running sanctions check",
  prohibited_goods_agent: "Checking prohibited goods",
  credit_ceiling_agent: "Checking credit ceiling",
  decision_agent: "Making final decision",
};

// Human-readable labels for stage completions
const STAGE_COMPLETE_LABELS: Record<string, string> = {
  extracted_invoice: "Invoice extraction complete",
  sanctions_result: "Sanctions check complete",
  prohibited_goods_result: "Prohibited goods check complete",
  financial_context: "Credit ceiling check complete",
  validation_report: "Decision complete",
};

function BackendLoadingScreen() {
  const { t } = useTranslation();
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 overflow-hidden relative h-screen w-screen bg-background">
      <div className="w-full max-w-2xl z-10
                      bg-card text-card-foreground
                      p-8 rounded-2xl border
                      shadow-2xl shadow-black/60">

        <div className="text-center space-y-6">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-muted border-t-primary rounded-full animate-spin"></div>
              <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-secondary rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
            </div>

            <div className="space-y-2">
              <p className="text-xl text-muted-foreground">
                {t('backend.waiting')}
              </p>
              <p className="text-sm text-muted-foreground/80">
                {t('backend.startupNote')}
              </p>
            </div>

            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-primary/80 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BackendUnavailableScreen() {
  const { t } = useTranslation();
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 h-screen w-screen bg-background">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold text-destructive">{t('backend.unavailable')}</h2>
        <p className="text-muted-foreground">
          {t('backend.connectionError')}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors"
        >
          {t('backend.retry')}
        </button>
      </div>
    </div>
  );
}

export function AppContent() {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();

  const [userId, setUserId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [appName, setAppName] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageWithAgent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [messageEvents, setMessageEvents] = useState<Map<string, ProcessedEvent[]>>(new Map());
  const [isBackendReady, setIsBackendReady] = useState(false);
  const [isCheckingBackend, setIsCheckingBackend] = useState(true);

  // Settings
  const [showTimeline, setShowTimeline] = useState(true);

  // Workflow state
  const [workflowData, setWorkflowData] = useState<WorkflowStageData>({});
  const [uploadedFile, setUploadedFile] = useState<UploadedFile[]>([]);

  const currentAgentRef = useRef('');
  const lastReportedAgentRef = useRef('');
  const accumulatedTextRef = useRef("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isCreatingSessionRef = useRef(false);
  const uploadedFileRef = useRef(uploadedFile);
  uploadedFileRef.current = uploadedFile;

  // Revoke Object URLs on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      for (const file of uploadedFileRef.current) {
        if (file.previewUrl) URL.revokeObjectURL(file.previewUrl);
      }
    };
  }, []);

  const toggleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  const retryWithBackoff = async <T,>(
    fn: () => Promise<T>,
    maxRetries: number = 10,
    maxDuration: number = 120000
  ): Promise<T> => {
    const startTime = Date.now();
    let lastError: Error;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      if (Date.now() - startTime > maxDuration) {
        throw new Error(`Retry timeout after ${maxDuration}ms`);
      }

      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
        console.log(`Attempt ${attempt + 1} failed, retrying in ${delay}ms...`, error);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  };

  const createSession = useCallback(async (agentName: string): Promise<{ userId: string, sessionId: string, appName: string }> => {
    const generatedSessionId = crypto.randomUUID();
    const currentUserId = user?.uid || 'anonymous';
    const response = await fetch(`/api/apps/${agentName}/users/${currentUserId}/sessions/${generatedSessionId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to create session: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return {
      userId: data.userId,
      sessionId: data.id,
      appName: data.appName
    };
  }, [user?.uid]);

  const checkBackendHealth = async (): Promise<boolean> => {
    try {
      const response = await fetch("/api/docs", {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        }
      });
      return response.ok;
    } catch (error) {
      console.log("Backend not ready yet:", error);
      return false;
    }
  };

  const extractDataFromSSE = (data: string) => {
    try {
      const parsed: SSEParsedEvent = JSON.parse(data);

      let textParts: string[] = [];
      let agent = '';
      let functionCall = null;
      let functionResponse = null;
      let stateDelta: Record<string, unknown> | null = null;
      let partial = false;

      if (parsed.content && parsed.content.parts) {
        textParts = parsed.content.parts
          .filter((part: SSEContentPart) => part.text)
          .map((part: SSEContentPart) => part.text || "");

        if ('partial' in parsed) {
          partial = !!parsed.partial;
        }

        const functionCallPart = parsed.content.parts.find((part: SSEContentPart) => part.functionCall);
        if (functionCallPart) {
          functionCall = functionCallPart.functionCall;
        }

        const functionResponsePart = parsed.content.parts.find((part: SSEContentPart) => part.functionResponse);
        if (functionResponsePart) {
          functionResponse = functionResponsePart.functionResponse;
        }
      }

      if (parsed.author) {
        agent = parsed.author;
      }

      if (parsed.actions && parsed.actions.stateDelta) {
        stateDelta = parsed.actions.stateDelta;
      }

      return { textParts, agent, functionCall, functionResponse, stateDelta, partial };
    } catch (e) {
      const truncatedData = data.length > 200 ? data.substring(0, 200) + "..." : data;
      console.error('Error parsing SSE data. Raw data (truncated): "', truncatedData, '". Error details:', e);
      return { textParts: [], agent: '', functionCall: null, functionResponse: null, stateDelta: null, partial: false };
    }
  };

  const processSseEventData = useCallback((data: string, aiMessageId: string) => {
    const { textParts, agent, functionCall, functionResponse, stateDelta, partial } = extractDataFromSSE(data);

    if (agent) {
      currentAgentRef.current = agent;

      // Track agent transitions as timeline events
      if (agent !== lastReportedAgentRef.current) {
        lastReportedAgentRef.current = agent;
        const label = AGENT_LABELS[agent];
        if (label) {
          setMessageEvents(prev => new Map(prev).set(aiMessageId, [...(prev.get(aiMessageId) || []), {
            title: label,
            data: { type: 'agent_start', name: agent }
          }]));
        }
      }
    }

    if (textParts.length > 0) {
      let shouldAppend = false;
      if (useStreaming) {
        if (partial) shouldAppend = true;
      } else {
        if (!partial) shouldAppend = true;
      }

      if (shouldAppend) {
        const newText = textParts.join("");
        accumulatedTextRef.current += newText;
        setMessages(prev => prev.map(msg =>
          msg.id === aiMessageId ? { ...msg, content: accumulatedTextRef.current, agent: currentAgentRef.current || msg.agent } : msg
        ));
      }
    }

    if (displayFunctionCalls && functionCall && !partial) {
      const functionName = functionCall.name;
      const functionArgs = JSON.stringify(functionCall.args, null, 2);
      setMessageEvents(prev => new Map(prev).set(aiMessageId, [...(prev.get(aiMessageId) || []), {
        title: t('timeline.callingTool', { name: functionName }),
        data: { type: 'call', name: functionName, args: functionArgs }
      }]));
    }

    if (displayFunctionResponses && functionResponse && !partial) {
      const functionName = functionResponse.name;
      const functionResult = JSON.stringify(functionResponse.response, null, 2);
      setMessageEvents(prev => new Map(prev).set(aiMessageId, [...(prev.get(aiMessageId) || []), {
        title: t('timeline.toolResponse', { name: functionName }),
        data: { type: 'result', name: functionName, result: functionResult }
      }]));
    }

    // Extract workflow data from function responses (tool calls).
    // Accumulate results into batch wrapper format for multi-invoice support.
    if (functionResponse) {
      const toolName = functionResponse.name;
      const stage = TOOL_STAGE_MAP[toolName];
      if (stage) {
        setWorkflowData(prev => {
          const existing = prev[stage];
          // Accumulate into a { results: [...] } wrapper
          if (existing && typeof existing === "object" && "results" in existing && Array.isArray(existing.results)) {
            return { ...prev, [stage]: { results: [...existing.results, functionResponse.response] } };
          }
          // First result — wrap in batch format
          return { ...prev, [stage]: { results: [functionResponse.response] } };
        });
      }
    }

    // Extract workflow data from stateDelta (agent output_key results)
    if (stateDelta) {
      for (const [key, value] of Object.entries(stateDelta)) {
        const stage = STATE_KEY_STAGE_MAP[key];
        if (stage && value != null) {
          setWorkflowData(prev => ({
            ...prev,
            [stage]: value,
          }));

          // Track stage completions as timeline events
          const stageLabel = STAGE_COMPLETE_LABELS[key];
          if (stageLabel) {
            setMessageEvents(prev => new Map(prev).set(aiMessageId, [...(prev.get(aiMessageId) || []), {
              title: stageLabel,
              data: { type: 'stage_complete', name: key }
            }]));
          }
        }
      }
    }
  }, [t, useStreaming]);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data:...;base64, prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = useCallback(async (query: string, files?: AttachedFile[]) => {
    const hasText = query.trim().length > 0;
    const hasFiles = files && files.length > 0;
    if (!hasText && !hasFiles) return;

    setIsLoading(true);
    try {
      let currentUserId = userId;
      let currentSessionId = sessionId;
      let currentAppName = appName;

      if (!currentSessionId || !currentUserId || !currentAppName) {
        if (isCreatingSessionRef.current) {
          setIsLoading(false);
          return;
        }
        isCreatingSessionRef.current = true;
        try {
          const agentName = "loan_drawdown_agent";
          const sessionData = await retryWithBackoff(() => createSession(agentName));
          currentUserId = sessionData.userId;
          currentSessionId = sessionData.sessionId;
          currentAppName = sessionData.appName;

          setUserId(currentUserId);
          setSessionId(currentSessionId);
          setAppName(currentAppName);
        } finally {
          isCreatingSessionRef.current = false;
        }
      }

      // Reset workflow data only when a new invoice is uploaded
      if (hasFiles) {
        setWorkflowData({});
      }

      // Build display message for the user
      const fileNames = hasFiles ? files.map(f => f.file.name) : [];
      const fileLabel = fileNames.map(n => `📎 ${n}`).join("\n");
      const displayContent = hasText
        ? (fileLabel ? `${query}\n\n${fileLabel}` : query)
        : fileLabel;

      const userMessageId = Date.now().toString();
      setMessages(prev => [...prev, { type: "human", content: displayContent, id: userMessageId }]);

      // Replace uploaded files in the workflow dashboard
      if (hasFiles) {
        // Revoke previous preview URLs
        for (const prev of uploadedFileRef.current) {
          if (prev.previewUrl) URL.revokeObjectURL(prev.previewUrl);
        }
        setUploadedFile(files.map(f => ({
          name: f.file.name,
          type: f.file.type || undefined,
          previewUrl: URL.createObjectURL(f.file),
        })));
      }

      // Build message parts: text + inline_data for each file
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const messageParts: any[] = [];
      if (hasText) {
        messageParts.push({ text: query });
      }

      if (hasFiles) {
        for (const attached of files) {
          const base64Data = await fileToBase64(attached.file);
          messageParts.push({
            inline_data: {
              mime_type: attached.file.type || 'application/octet-stream',
              data: base64Data,
              display_name: attached.file.name,
            }
          });
        }
        // If no text was provided, add a default prompt
        if (!hasText) {
          const prompt = files.length > 1
            ? `Please process these ${files.length} invoices.`
            : "Please process this invoice.";
          messageParts.unshift({ text: prompt });
        }
      }

      const aiMessageId = Date.now().toString() + "_ai";
      currentAgentRef.current = '';
      lastReportedAgentRef.current = '';
      accumulatedTextRef.current = '';

      setMessages(prev => [...prev, {
        type: "ai",
        content: "",
        id: aiMessageId,
        agent: '',
      }]);

      const controller = new AbortController();
      abortControllerRef.current = controller;

      const sendMessage = async () => {
        const response = await fetch("/api/run_sse", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          signal: controller.signal,
          body: JSON.stringify({
            appName: currentAppName,
            userId: currentUserId,
            sessionId: currentSessionId,
            newMessage: {
              parts: messageParts,
              role: "user"
            },
            streaming: useStreaming,
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to send message: ${response.status} ${response.statusText}`);
        }

        return response;
      };

      const response = await sendMessage();

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let lineBuffer = "";
      let eventDataBuffer = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();

          if (value) {
            lineBuffer += decoder.decode(value, { stream: true });
          }

          let eolIndex;
          while ((eolIndex = lineBuffer.indexOf('\n')) >= 0 || (done && lineBuffer.length > 0)) {
            let line: string;
            if (eolIndex >= 0) {
              line = lineBuffer.substring(0, eolIndex);
              lineBuffer = lineBuffer.substring(eolIndex + 1);
            } else {
              line = lineBuffer;
              lineBuffer = "";
            }

            if (line.trim() === "") {
              if (eventDataBuffer.length > 0) {
                const jsonDataToParse = eventDataBuffer.endsWith('\n') ? eventDataBuffer.slice(0, -1) : eventDataBuffer;
                processSseEventData(jsonDataToParse, aiMessageId);
                eventDataBuffer = "";
              }
            } else if (line.startsWith('data:')) {
              eventDataBuffer += line.substring(5).trimStart() + '\n';
            }
          }

          if (done) {
            if (eventDataBuffer.length > 0) {
              const jsonDataToParse = eventDataBuffer.endsWith('\n') ? eventDataBuffer.slice(0, -1) : eventDataBuffer;
              processSseEventData(jsonDataToParse, aiMessageId);
              eventDataBuffer = "";
            }
            break;
          }
        }
      }

      // Fetch the final session state to capture all output_key results.
      // Sub-agent stateDelta events may not surface via SSE inside AgentTool,
      // so this ensures we get extraction, compliance, financial, and decision data.
      try {
        const stateRes = await fetch(
          `/api/apps/${currentAppName}/users/${currentUserId}/sessions/${currentSessionId}`
        );
        if (stateRes.ok) {
          const session = await stateRes.json();
          const state = session.state ?? {};
          for (const [key, value] of Object.entries(state)) {
            const stage = STATE_KEY_STAGE_MAP[key];
            if (stage && value != null) {
              setWorkflowData(prev => ({ ...prev, [stage]: value }));
            }
          }
        }
      } catch {
        // Non-critical — workflow data from SSE events is still available
      }

      setIsLoading(false);
      abortControllerRef.current = null;

    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        setIsLoading(false);
        abortControllerRef.current = null;
        return;
      }
      console.error("Error:", error);
      const aiMessageId = Date.now().toString() + "_ai_error";
      setMessages(prev => [...prev, {
        type: "ai",
        content: t('error.processingRequest', { message: error instanceof Error ? error.message : 'Unknown error' }),
        id: aiMessageId
      }]);
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [processSseEventData, userId, sessionId, appName, t, createSession]);

  const handleNewSession = useCallback(() => {
    abortControllerRef.current?.abort();
    for (const file of uploadedFileRef.current) {
      if (file.previewUrl) URL.revokeObjectURL(file.previewUrl);
    }
    setMessages([]);
    setMessageEvents(new Map());
    setWorkflowData({});
    setUploadedFile([]);
    setSessionId(null);
    setUserId(null);
    setAppName(null);
    setIsLoading(false);
    currentAgentRef.current = '';
    lastReportedAgentRef.current = '';
    accumulatedTextRef.current = '';
  }, []);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages, messageEvents]);

  useEffect(() => {
    let cancelled = false;

    const checkBackend = async () => {
      setIsCheckingBackend(true);

      const maxAttempts = 60;
      let attempts = 0;

      while (attempts < maxAttempts && !cancelled) {
        const isReady = await checkBackendHealth();
        if (cancelled) return;
        if (isReady) {
          setIsBackendReady(true);
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
        attempts++;
      }

      if (!cancelled) setIsCheckingBackend(false);
    };

    checkBackend();
    return () => { cancelled = true; };
  }, []);

  if (isCheckingBackend) {
    return <BackendLoadingScreen />;
  }

  if (!isBackendReady) {
    return <BackendUnavailableScreen />;
  }

  return (
    <MainLayout
      theme={theme}
      onToggleTheme={toggleTheme}
      title={t('app.title')}
      showTimeline={showTimeline}
      onToggleTimeline={() => setShowTimeline(!showTimeline)}
      onNewSession={handleNewSession}
      sidebar={
        <div className="flex flex-col h-full overflow-hidden">
          <div className="flex-1 min-h-0">
            <ChatMessagesView
              messages={messages}
              isLoading={isLoading}
              scrollAreaRef={scrollAreaRef}
              onSubmit={(query, files) => handleSubmit(query, files)}
              messageEvents={messageEvents}
              showTimeline={showTimeline}
            />
          </div>
        </div>
      }
    >
      <WorkflowDashboard
        workflowData={workflowData}
        uploadedFile={uploadedFile}
      />
    </MainLayout>
  );
}

export default function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
