import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send, Paperclip, X, FileText } from "lucide-react";
import { useTranslation } from "react-i18next";

export interface AttachedFile {
  file: File;
  previewUrl?: string;
}

interface InputFormProps {
  onSubmit: (query: string, files?: AttachedFile[]) => void;
  isLoading: boolean;
  context?: 'homepage' | 'chat';
}

function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

export function InputForm({ onSubmit, isLoading, context = 'homepage' }: InputFormProps) {
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      for (const f of attachedFiles) {
        if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
      }
    };
  }, [attachedFiles]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const hasText = inputValue.trim().length > 0;
    const hasFiles = attachedFiles.length > 0;
    if ((hasText || hasFiles) && !isLoading) {
      onSubmit(inputValue.trim(), hasFiles ? attachedFiles : undefined);
      setInputValue("");
      setAttachedFiles([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles: AttachedFile[] = Array.from(files).map(file => ({
      file,
      previewUrl: isImageFile(file) ? URL.createObjectURL(file) : undefined,
    }));

    setAttachedFiles(prev => [...prev, ...newFiles]);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => {
      const removed = prev[index];
      if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  const placeholderText =
    context === 'chat'
      ? t('chat.placeholderChat')
      : t('chat.placeholderHomepage');

  const canSubmit = (inputValue.trim().length > 0 || attachedFiles.length > 0) && !isLoading;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      {/* Attached files preview */}
      {attachedFiles.length > 0 && (
        <div className="px-1 flex flex-wrap gap-1.5">
          {attachedFiles.map((attached, index) => (
            <div key={`${attached.file.name}-${index}`} className="relative flex items-center gap-2 bg-muted rounded-lg px-2.5 py-1.5 text-sm group border border-border w-fit">
              {attached.previewUrl ? (
                <img
                  src={attached.previewUrl}
                  alt={attached.file.name}
                  className="h-10 w-10 rounded object-cover flex-shrink-0"
                />
              ) : (
                <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
              )}
              <div className="flex flex-col min-w-0">
                <span className="truncate max-w-[140px] text-xs font-medium">{attached.file.name}</span>
                <span className="text-[10px] text-muted-foreground">
                  {(attached.file.size / 1024).toFixed(0)} KB
                </span>
              </div>
              <button
                type="button"
                onClick={() => removeFile(index)}
                aria-label={`Remove ${attached.file.name}`}
                className="absolute -top-1.5 -right-1.5 p-0.5 bg-background border border-border rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end space-x-2">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.tiff,.webp,.gif,.bmp"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          title="Attach files"
          className="flex-shrink-0 text-muted-foreground hover:text-foreground"
        >
          <Paperclip className="h-4 w-4" />
        </Button>

        <Textarea
          ref={textareaRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholderText}
          rows={1}
          className="flex-1 resize-none pr-10 min-h-[40px] bg-background text-foreground border-border"
        />
        <Button type="submit" size="icon" disabled={!canSubmit} className="bg-primary text-primary-foreground hover:bg-primary/90">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </form>
  );
}
