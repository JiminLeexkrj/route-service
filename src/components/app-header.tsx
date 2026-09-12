"use client";

import { Clock3, Settings2 } from "lucide-react";

type AppHeaderProps = {
  compact?: boolean;
  onOpenPreferences?: () => void;
};

export function AppHeader({ compact = false, onOpenPreferences }: AppHeaderProps) {
  return (
    <header
      className={`z-40 w-full border-b border-slate-200/80 bg-white/85 backdrop-blur-xl ${
        compact ? "sticky top-0" : "relative"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:h-[72px] sm:px-8 lg:px-10">
        <div className="flex items-center gap-3" aria-label="제시간 홈">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-sm">
            <Clock3 aria-hidden="true" className="h-5 w-5" strokeWidth={2.4} />
            <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-400" />
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-black tracking-[-0.04em] text-slate-950">
                제시간
              </span>
              <span className="hidden text-[10px] font-bold tracking-[0.18em] text-emerald-600 sm:inline">
                ON-TIME NAVIGATION
              </span>
            </div>
            {!compact && (
              <p className="text-[11px] font-medium text-slate-500">
                늦지 않도록, 끝까지 안내합니다
              </p>
            )}
          </div>
        </div>

        {compact ? (
          <button
            type="button"
            onClick={onOpenPreferences}
            className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            <Settings2 className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">이동 설정</span>
          </button>
        ) : (
          <div className="flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
            <span className="h-2 w-2 animate-soft-pulse rounded-full bg-emerald-500" />
            실시간 교통 반영
          </div>
        )}
      </div>
    </header>
  );
}

