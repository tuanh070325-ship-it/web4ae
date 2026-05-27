import type { ReactNode } from 'react';
import { CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

export const adminInputClass =
  'h-10 min-w-0 rounded border border-[#343d43] bg-[#101417] px-3 text-sm font-medium text-white outline-none transition-colors placeholder:text-zinc-500 focus:border-red-500/70 disabled:text-zinc-500';

export const adminTextareaClass =
  'min-h-20 min-w-0 rounded border border-[#343d43] bg-[#101417] px-3 py-2 text-sm font-medium text-white outline-none transition-colors placeholder:text-zinc-500 focus:border-red-500/70';

export const adminLabelClass =
  'mb-1.5 block text-xs font-black uppercase tracking-wide text-zinc-500';

export const adminInlineLabelClass =
  'text-xs font-black uppercase tracking-wide text-zinc-500';

export const adminHelperTextClass =
  'text-xs font-semibold leading-5 text-zinc-500';

export const adminReadOnlyFieldClass =
  'flex h-10 min-w-0 items-center rounded border border-[#343d43] bg-[#101417] px-3 text-sm font-medium text-zinc-300';

export const adminPrimaryButtonClass =
  'inline-flex h-10 items-center justify-center rounded bg-[#e63946] px-4 text-sm font-bold text-white transition-colors hover:bg-red-500 disabled:bg-zinc-700 disabled:text-zinc-500';

export const adminSecondaryButtonClass =
  'inline-flex h-10 items-center justify-center gap-2 rounded border border-[#343d43] bg-[#171d21] px-4 text-sm font-bold text-zinc-300 transition-colors hover:border-red-500/70 hover:text-white';

export const adminIconButtonClass =
  'inline-flex h-9 w-9 items-center justify-center rounded border border-[#343d43] text-zinc-400 transition-colors hover:border-red-500/70 hover:text-white';

export const adminPanelClass =
  'overflow-hidden rounded bg-[#171d21] shadow-[0_14px_34px_rgba(0,0,0,0.22)]';

export const adminFormClass = 'mb-8 grid grid-cols-1 gap-3 rounded bg-[#171d21] p-5 shadow-[0_14px_34px_rgba(0,0,0,0.22)]';
export const adminTableClass = 'w-full min-w-[760px] text-left text-sm';
export const adminThClass = 'px-4 py-3 text-sm font-bold text-zinc-300';
export const adminTdClass = 'px-4 py-3 text-sm text-zinc-200';

export function AdminPage({
  title,
  description,
  message,
  children,
}: {
  title: string;
  description?: string;
  message?: string | null;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-[1440px]">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black leading-tight text-white">{title}</h1>
          {description && <p className="mt-1 text-sm text-zinc-500">{description}</p>}
        </div>
        {message && (
          <span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-emerald-300">
            {message}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

export function AdminPanel({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn(adminPanelClass, className)}>{children}</section>;
}

export function AdminTable({ children }: { children: ReactNode }) {
  return (
    <AdminPanel>
      <div className="overflow-x-auto">{children}</div>
    </AdminPanel>
  );
}

export interface AdminToastState {
  type: 'success' | 'error' | 'info';
  title: string;
  description?: string;
}

export function AdminToast({ toast, onClose }: { toast: AdminToastState | null; onClose: () => void }) {
  if (!toast) {return null;}

  const Icon = toast.type === 'success' ? CheckCircle2 : toast.type === 'error' ? XCircle : Info;
  const tone = toast.type === 'success'
    ? 'border-emerald-400/35 bg-emerald-500/12 text-emerald-200'
    : toast.type === 'error'
      ? 'border-red-400/35 bg-red-500/12 text-red-200'
      : 'border-sky-400/35 bg-sky-500/12 text-sky-200';

  return (
    <div className="pointer-events-none fixed right-4 top-[118px] z-[70] w-[calc(100vw-32px)] max-w-sm sm:right-6">
      <div className={`pointer-events-auto flex gap-3 rounded border p-4 shadow-[0_22px_60px_rgba(0,0,0,0.38)] backdrop-blur-xl ${tone}`}>
        <Icon className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={2.2} />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-black text-white">{toast.title}</div>
          {toast.description && <div className="mt-1 text-sm leading-5 text-zinc-300">{toast.description}</div>}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="-mr-1 -mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="Close notification"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
