import { X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useToastStore, type Toast as ToastType } from '../../stores/toastStore';

const toastStyles: Record<ToastType['type'], string> = {
  success: 'border-l-4 border-l-[var(--success)] bg-[var(--success-bg)]',
  error: 'border-l-4 border-l-[var(--danger)] bg-[var(--danger-bg)]',
  warning: 'border-l-4 border-l-[var(--warning)] bg-[var(--warning-bg)]',
  info: 'border-l-4 border-l-[var(--info)] bg-[var(--info-bg)]',
  nut: 'border-l-4 border-l-[var(--nut-gold)] bg-[var(--nut-gold)]/10',
};

function ToastItem({ toast }: { toast: ToastType }) {
  const removeToast = useToastStore((s) => s.removeToast);

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-lg px-4 py-3 shadow-lg backdrop-blur-sm',
        'animate-slide-in-right',
        'border border-[var(--border-subtle)]',
        toastStyles[toast.type]
      )}
      role="alert"
    >
      {toast.icon && (
        <span className="mt-0.5 flex-shrink-0 text-base">{toast.icon}</span>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{toast.title}</p>
        {toast.message && (
          <p className="mt-0.5 text-xs text-muted-foreground">{toast.message}</p>
        )}
      </div>
      <button
        className="flex-shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-[var(--bg-tertiary)] hover:text-foreground"
        onClick={() => removeToast(toast.id)}
        aria-label="Dismiss notification"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-toast flex w-80 flex-col gap-2"
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
