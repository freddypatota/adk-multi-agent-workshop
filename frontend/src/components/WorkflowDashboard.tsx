import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertTriangle,
  FileText,
  Shield,
  Package,
  DollarSign,
  CheckCircle2,
  XCircle,
  Clock,
  FileIcon,
  Gavel,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/utils";

// Types matching backend Pydantic models
export interface InvoiceData {
  invoice_number?: string;
  vendor_name?: string;
  vendor_iban?: string;
  invoice_date?: string;
  currency?: string;
  total_amount_net?: number;
  total_amount_gross?: number;
  line_items?: Array<{
    description?: string;
    quantity?: number;
    unit_price?: number;
    total_amount?: number;
  }>;
  is_signed?: boolean;
  [key: string]: unknown;
}

export interface ComplianceCheckResult {
  check_name?: string;
  status?: string;  // "PASS" or "FAIL"
  flags?: string[];
  reason?: string;
  [key: string]: unknown;
}

export interface FinancialContext {
  client_id?: string;
  approved_limit?: number;
  current_exposure?: number;
  remaining_limit?: number;
  invoice_amount_converted?: number;
  conversion_rate?: number;
  is_within_limit?: boolean;
  currency?: string;
  [key: string]: unknown;
}

export interface CheckSummary {
  check_name?: string;
  status?: string;  // "PASS", "FAIL", or "FLAGGED"
  reason?: string;
}

// The decision agent's validation_report can be a structured object or a string
export type DecisionData = {
  decision?: string;     // "APPROVED", "REJECTED", or "TO BE REVIEWED"
  checks?: CheckSummary[];
  conclusion?: string;
  // Legacy fields
  approved?: boolean;
  reason?: string;
  reasoning_trace?: string;
  [key: string]: unknown;
} | string;

// Batch wrapper types matching backend schemas
export interface InvoiceBatch { invoices: InvoiceData[] }
export interface ComplianceBatchResult { results: ComplianceCheckResult[] }
export interface FinancialBatchContext { results: FinancialContext[] }
export interface BatchValidationReport { reports: DecisionData[] }

// WorkflowStageData stores batch wrapper objects from the backend
export interface WorkflowStageData {
  extraction?: InvoiceBatch | InvoiceData;
  sanctions?: ComplianceBatchResult | ComplianceCheckResult;
  prohibitedGoods?: ComplianceBatchResult | ComplianceCheckResult;
  creditCeiling?: FinancialBatchContext | FinancialContext;
  decision?: BatchValidationReport | DecisionData;
}

export interface UploadedFile {
  name: string;
  type?: string;
  previewUrl?: string;
}

interface WorkflowDashboardProps {
  workflowData: WorkflowStageData;
  uploadedFile: UploadedFile[];
}

// --- Helpers to normalize batch vs single results ---

function getInvoices(data?: WorkflowStageData["extraction"]): InvoiceData[] {
  if (!data) return [];
  if ("invoices" in data && Array.isArray(data.invoices)) return data.invoices;
  return [data as InvoiceData];
}

function getComplianceResults(data?: WorkflowStageData["sanctions"] | WorkflowStageData["prohibitedGoods"]): ComplianceCheckResult[] {
  if (!data) return [];
  if ("results" in data && Array.isArray(data.results)) return data.results;
  return [data as ComplianceCheckResult];
}

function getFinancialResults(data?: WorkflowStageData["creditCeiling"]): FinancialContext[] {
  if (!data) return [];
  if ("results" in data && Array.isArray(data.results)) return data.results;
  return [data as FinancialContext];
}

function getDecisionReports(data?: WorkflowStageData["decision"]): DecisionData[] {
  if (!data) return [];
  if (typeof data === "object" && "reports" in data && Array.isArray(data.reports)) return data.reports;
  return [data as DecisionData];
}

type StageStatus = "pass" | "fail" | "warning" | "pending";

function StatusBadge({ status }: { status: StageStatus }) {
  const { t } = useTranslation();
  if (status === "pass") {
    return (
      <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800">
        <CheckCircle2 className="h-3 w-3 mr-1" />
        {t("workflow.pass")}
      </Badge>
    );
  }
  if (status === "fail") {
    return (
      <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800">
        <XCircle className="h-3 w-3 mr-1" />
        {t("workflow.fail")}
      </Badge>
    );
  }
  if (status === "warning") {
    return (
      <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800">
        <AlertTriangle className="h-3 w-3 mr-1" />
        {t("workflow.flagged")}
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-muted-foreground">
      <Clock className="h-3 w-3 mr-1" />
      {t("workflow.pending")}
    </Badge>
  );
}

function StageCard({
  title,
  icon,
  status,
  children,
  defaultExpanded = false,
}: {
  title: string;
  icon: React.ReactNode;
  status: StageStatus;
  children?: React.ReactNode;
  defaultExpanded?: boolean;
}) {
  const isPending = status === "pending";
  const hasContent = children != null;
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <Card className={cn("transition-all", isPending && "opacity-50")}>
      <CardHeader
        className={cn("pb-2 cursor-pointer select-none", !isExpanded && hasContent && "pb-2")}
        onClick={() => hasContent && setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            {hasContent && !isPending ? (
              isExpanded
                ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <span className="w-3.5" />
            )}
            {icon}
            {title}
          </CardTitle>
          <StatusBadge status={status} />
        </div>
      </CardHeader>
      {isExpanded && hasContent && (
        <CardContent className="pt-0">
          <div className="text-sm text-muted-foreground space-y-1">
            {children}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

function formatCurrency(amount: number | undefined, currency?: string): string {
  if (amount === undefined || amount === null) return "N/A";
  const cur = currency || "RON";
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: cur }).format(amount);
  } catch {
    return `${cur} ${amount.toLocaleString()}`;
  }
}

function resolveComplianceStatus(result: ComplianceCheckResult): StageStatus {
  if (result.status === "FAIL") return "fail";
  if (result.status === "FLAGGED") return "warning";
  return "pass";
}

function resolveDecision(
  decision: DecisionData,
  t: (key: string) => string,
): { status: StageStatus; label: string } {
  if (typeof decision !== "string" && decision.decision) {
    const upper = decision.decision.toUpperCase();
    if (upper === "APPROVED") return { status: "pass", label: t("workflow.approved") };
    if (upper === "REJECTED") return { status: "fail", label: t("workflow.rejected") };
    if (upper === "TO BE REVIEWED") return { status: "warning", label: t("workflow.toBeReviewed") };
    return { status: "fail", label: t("workflow.rejected") };
  }
  if (typeof decision !== "string" && decision.approved !== undefined) {
    return {
      status: decision.approved ? "pass" : "fail",
      label: decision.approved ? t("workflow.approved") : t("workflow.rejected"),
    };
  }
  if (typeof decision === "string") {
    const upper = decision.toUpperCase();
    if (upper.includes("REJECT")) return { status: "fail", label: t("workflow.rejected") };
    if (upper.includes("APPROVE")) return { status: "pass", label: t("workflow.approved") };
    if (upper.includes("REVIEW")) return { status: "warning", label: t("workflow.toBeReviewed") };
    return { status: "fail", label: decision };
  }
  return { status: "fail", label: t("workflow.rejected") };
}

function getDecisionChecks(decision: DecisionData): CheckSummary[] | undefined {
  if (typeof decision === "string") return undefined;
  return decision.checks;
}

function getDecisionConclusion(decision: DecisionData): string | undefined {
  if (typeof decision === "string") return undefined;
  return decision.conclusion || decision.reasoning_trace || decision.reason;
}

function UploadedFileCard({ file }: { file: UploadedFile }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isImage = file.type?.startsWith('image/');
  const isPdf = file.type === 'application/pdf';
  const hasPreview = file.previewUrl && (isImage || isPdf);

  return (
    <div className="space-y-2">
      <div
        className="flex items-center gap-2 text-sm cursor-pointer select-none"
        onClick={() => hasPreview && setIsExpanded(!isExpanded)}
      >
        {hasPreview ? (
          isExpanded
            ? <ChevronDown className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            : <ChevronRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
        ) : (
          <span className="w-3 flex-shrink-0" />
        )}
        <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <span className="truncate">{file.name}</span>
        {file.type && (
          <Badge variant="outline" className="text-xs flex-shrink-0">{file.type}</Badge>
        )}
      </div>
      {isExpanded && file.previewUrl && (
        <div className="ml-5 rounded-md overflow-hidden border border-border">
          {isImage && (
            <img src={file.previewUrl} alt={file.name} className="w-full object-contain bg-muted/30" />
          )}
          {isPdf && (
            <object data={file.previewUrl} type="application/pdf" className="w-full aspect-[1/1.414] bg-muted/30">
              <p className="p-3 text-xs text-muted-foreground">PDF preview not available in this browser.</p>
            </object>
          )}
        </div>
      )}
    </div>
  );
}

// --- Per-invoice result card ---

function InvoiceResultCard({
  index,
  invoice,
  sanctions,
  prohibitedGoods,
  creditCeiling,
  decision,
}: {
  index: number;
  invoice?: InvoiceData;
  sanctions?: ComplianceCheckResult;
  prohibitedGoods?: ComplianceCheckResult;
  creditCeiling?: FinancialContext;
  decision?: DecisionData;
}) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(true);

  const sanctionsStatus = sanctions ? resolveComplianceStatus(sanctions) : "pending";
  const prohibitedGoodsStatus = prohibitedGoods ? resolveComplianceStatus(prohibitedGoods) : "pending";
  const creditCeilingStatus = creditCeiling
    ? (creditCeiling.is_within_limit === false ? "fail" : "pass")
    : "pending";
  const resolved = decision ? resolveDecision(decision, t) : null;
  const decisionStatus = resolved ? resolved.status : "pending";

  const invoiceLabel = invoice?.invoice_number
    ? `Invoice #${invoice.invoice_number}`
    : invoice?.vendor_name
      ? `Invoice from ${invoice.vendor_name}`
      : `Invoice ${index + 1}`;

  return (
    <Card>
      <CardHeader
        className="pb-2 cursor-pointer select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            {isExpanded
              ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
            <FileText className="h-4 w-4" />
            {invoiceLabel}
          </CardTitle>
          {resolved && <StatusBadge status={decisionStatus} />}
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="pt-0 space-y-2">
          {/* Extraction */}
          <StageCard
            title={t("workflow.extraction")}
            icon={<FileText className="h-4 w-4" />}
            status={invoice ? "pass" : "pending"}
          >
            {invoice && (
              <>
                {invoice.invoice_number && (
                  <div className="flex justify-between">
                    <span className="font-medium">Invoice #:</span>
                    <span>{invoice.invoice_number}</span>
                  </div>
                )}
                {invoice.vendor_name && (
                  <div className="flex justify-between">
                    <span className="font-medium">{t("workflow.vendor")}:</span>
                    <span>{invoice.vendor_name}</span>
                  </div>
                )}
                {invoice.total_amount_gross !== undefined && (
                  <div className="flex justify-between">
                    <span className="font-medium">{t("workflow.amount")} (gross):</span>
                    <span>{formatCurrency(invoice.total_amount_gross, invoice.currency)}</span>
                  </div>
                )}
                {invoice.total_amount_net !== undefined && (
                  <div className="flex justify-between">
                    <span className="font-medium">{t("workflow.amount")} (net):</span>
                    <span>{formatCurrency(invoice.total_amount_net, invoice.currency)}</span>
                  </div>
                )}
                {invoice.invoice_date && (
                  <div className="flex justify-between">
                    <span className="font-medium">{t("workflow.date")}:</span>
                    <span>{invoice.invoice_date}</span>
                  </div>
                )}
                {invoice.line_items && invoice.line_items.length > 0 && (
                  <div>
                    <span className="font-medium">{t("workflow.lineItems")} ({invoice.line_items.length}):</span>
                    <ul className="list-disc pl-4 mt-1">
                      {invoice.line_items.map((item, i) => (
                        <li key={i}>
                          {item.description || "Item"}
                          {item.quantity != null && ` x${item.quantity}`}
                          {item.total_amount !== undefined && ` — ${formatCurrency(item.total_amount, invoice.currency)}`}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </StageCard>

          {/* Sanctions */}
          <StageCard title={t("workflow.sanctions")} icon={<Shield className="h-4 w-4" />} status={sanctionsStatus}>
            {sanctions && (
              <>
                {sanctions.reason && <p>{sanctions.reason}</p>}
                {sanctions.flags && sanctions.flags.length > 0 && (
                  <div>
                    <span className="font-medium">{t("workflow.flags")}:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {sanctions.flags.map((flag, i) => (
                        <Badge key={i} variant="outline" className="text-xs">{flag}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </StageCard>

          {/* Prohibited Goods */}
          <StageCard title={t("workflow.prohibitedGoods")} icon={<Package className="h-4 w-4" />} status={prohibitedGoodsStatus}>
            {prohibitedGoods && (
              <>
                {prohibitedGoods.reason && <p>{prohibitedGoods.reason}</p>}
                {prohibitedGoods.flags && prohibitedGoods.flags.length > 0 && (
                  <div>
                    <span className="font-medium">{t("workflow.flags")}:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {prohibitedGoods.flags.map((flag, i) => (
                        <Badge key={i} variant="outline" className="text-xs">{flag}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </StageCard>

          {/* Credit Ceiling */}
          <StageCard title={t("workflow.creditCeiling")} icon={<DollarSign className="h-4 w-4" />} status={creditCeilingStatus}>
            {creditCeiling && (
              <>
                {creditCeiling.approved_limit !== undefined && (
                  <div className="flex justify-between">
                    <span className="font-medium">{t("workflow.approvedLimit")}:</span>
                    <span>{formatCurrency(creditCeiling.approved_limit, creditCeiling.currency)}</span>
                  </div>
                )}
                {creditCeiling.remaining_limit !== undefined && (
                  <div className="flex justify-between">
                    <span className="font-medium">{t("workflow.remainingCapacity")}:</span>
                    <span>{formatCurrency(creditCeiling.remaining_limit, creditCeiling.currency)}</span>
                  </div>
                )}
                {creditCeiling.invoice_amount_converted !== undefined && (
                  <div className="flex justify-between">
                    <span className="font-medium">Invoice (converted):</span>
                    <span>{formatCurrency(creditCeiling.invoice_amount_converted, creditCeiling.currency)}</span>
                  </div>
                )}
                {creditCeiling.is_within_limit !== undefined && (
                  <div className="flex justify-between">
                    <span className="font-medium">{t("workflow.withinLimit")}:</span>
                    <span>{creditCeiling.is_within_limit ? t("workflow.pass") : t("workflow.fail")}</span>
                  </div>
                )}
              </>
            )}
          </StageCard>

          {/* Decision */}
          <StageCard title={t("workflow.decision")} icon={<Gavel className="h-4 w-4" />} status={decisionStatus} defaultExpanded={true}>
            {decision && resolved && (() => {
              const checks = getDecisionChecks(decision);
              const conclusion = getDecisionConclusion(decision);
              return (
                <>
                  <div className="font-medium">{resolved.label}</div>
                  {checks && checks.length > 0 && (
                    <div className="space-y-1 mt-2">
                      {checks.map((check, i) => (
                        <div key={i} className="flex items-start gap-2">
                          {check.status === "PASS" ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                          ) : check.status === "FLAGGED" ? (
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5 text-red-500 mt-0.5 flex-shrink-0" />
                          )}
                          <div>
                            <span className="font-medium text-xs">{check.check_name}</span>
                            {check.reason && (
                              <span className="text-xs text-muted-foreground"> — {check.reason}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {conclusion && (
                    <p className="text-xs mt-2 pt-1 border-t border-border">{conclusion}</p>
                  )}
                </>
              );
            })()}
          </StageCard>
        </CardContent>
      )}
    </Card>
  );
}

export function WorkflowDashboard({ workflowData, uploadedFile }: WorkflowDashboardProps) {
  const { t } = useTranslation();

  const invoices = getInvoices(workflowData.extraction);
  const sanctionsResults = getComplianceResults(workflowData.sanctions);
  const prohibitedGoodsResults = getComplianceResults(workflowData.prohibitedGoods);
  const financialResults = getFinancialResults(workflowData.creditCeiling);
  const decisionReports = getDecisionReports(workflowData.decision);

  const invoiceCount = Math.max(invoices.length, sanctionsResults.length, decisionReports.length, 1);
  const hasResults = invoices.length > 0 || decisionReports.length > 0;

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-3">
        <h2 className="text-lg font-semibold">{t("workflow.title")}</h2>

        {/* Uploaded Files */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileIcon className="h-4 w-4" />
              {t("workflow.uploadedFile")}
              {uploadedFile.length > 1 && (
                <Badge variant="outline" className="text-xs">{uploadedFile.length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {uploadedFile.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("workflow.noFiles")}</p>
            ) : (
              <div className="space-y-1">
                {uploadedFile.map((file, i) => (
                  <UploadedFileCard key={`${file.name}-${i}`} file={file} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Per-invoice results */}
        {hasResults ? (
          Array.from({ length: invoiceCount }).map((_, i) => (
            <InvoiceResultCard
              key={i}
              index={i}
              invoice={invoices[i]}
              sanctions={sanctionsResults[i]}
              prohibitedGoods={prohibitedGoodsResults[i]}
              creditCeiling={financialResults[i]}
              decision={decisionReports[i]}
            />
          ))
        ) : (
          // Show pending placeholders when no results yet
          <div className="space-y-3 opacity-50">
            <StageCard title={t("workflow.extraction")} icon={<FileText className="h-4 w-4" />} status="pending" />
            <StageCard title={t("workflow.sanctions")} icon={<Shield className="h-4 w-4" />} status="pending" />
            <StageCard title={t("workflow.prohibitedGoods")} icon={<Package className="h-4 w-4" />} status="pending" />
            <StageCard title={t("workflow.creditCeiling")} icon={<DollarSign className="h-4 w-4" />} status="pending" />
            <StageCard title={t("workflow.decision")} icon={<Gavel className="h-4 w-4" />} status="pending" />
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
