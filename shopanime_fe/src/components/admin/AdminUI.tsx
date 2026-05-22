import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

export const adminInputClass =
  'h-10 min-w-0 rounded border border-[#343d43] bg-[#101417] px-3 text-sm text-white outline-none transition-colors placeholder:text-zinc-500 focus:border-red-500/70 disabled:text-zinc-500';

export const adminTextareaClass =
  'min-h-20 min-w-0 rounded border border-[#343d43] bg-[#101417] px-3 py-2 text-sm text-white outline-none transition-colors placeholder:text-zinc-500 focus:border-red-500/70';

export const adminPrimaryButtonClass =
  'inline-flex h-10 items-center justify-center rounded bg-[#e63946] px-4 text-sm font-bold text-white transition-colors hover:bg-red-500 disabled:bg-zinc-700 disabled:text-zinc-500';

export const adminSecondaryButtonClass =
  'inline-flex h-10 items-center justify-center gap-2 rounded border border-[#343d43] bg-[#171d21] px-4 text-sm font-bold text-zinc-300 transition-colors hover:border-red-500/70 hover:text-white';

export const adminIconButtonClass =
  'inline-flex h-9 w-9 items-center justify-center rounded border border-[#343d43] text-zinc-400 transition-colors hover:border-red-500/70 hover:text-white';

export const adminPanelClass =
  'overflow-hidden rounded border border-[#343d43] bg-[#171d21] shadow-[0_14px_34px_rgba(0,0,0,0.22)]';

export const adminFormClass = 'mb-8 grid grid-cols-1 gap-3 rounded border border-[#343d43] bg-[#171d21] p-5';
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
    <div className="mx-auto w-full max-w-[1180px]">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">{title}</h1>
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
