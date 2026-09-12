"use client";

import {
  ArrowDown,
  BellRing,
  LoaderCircle,
  Radio,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import type { TrafficAlert } from "@/types/trip";

type AlertBannerProps = {
  alert: TrafficAlert | null;
  isSimulating: boolean;
  onSimulate: () => Promise<void>;
};

export function AlertBanner({
  alert,
  isSimulating,
  onSimulate,
}: AlertBannerProps) {
  const scrollToRoutes = () => {
    document.getElementById("routes")?.scrollIntoView({ behavior: "smooth" });
  };

  if (!alert) {
    return (
      <section className="flex flex-col justify-between gap-4 rounded-3xl border border-blue-100 bg-blue-50/70 px-5 py-4 sm:flex-row sm:items-center sm:px-6">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
            <Radio className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-extrabold text-slate-900">
              이동 중 교통상황을 계속 확인하고 있어요
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              더 빠른 경로가 생기거나 지각 위험이 높아지면 즉시 알려드릴게요.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onSimulate}
          disabled={isSimulating}
          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-4 text-xs font-extrabold text-blue-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 disabled:cursor-wait disabled:opacity-60"
        >
          {isSimulating ? (
            <>
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
              교통 변화 수신 중
            </>
          ) : (
            <>
              <BellRing className="h-4 w-4" aria-hidden="true" />
              교통 변화 시연
            </>
          )}
        </button>
      </section>
    );
  }

  return (
    <section
      aria-live="assertive"
      className="animate-fade-up overflow-hidden rounded-3xl border border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 shadow-soft"
    >
      <div className="flex items-center justify-between border-b border-orange-200/70 px-5 py-3 sm:px-6">
        <div className="flex items-center gap-2 text-xs font-black text-orange-700">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-500 opacity-70" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-orange-600" />
          </span>
          실시간 경로 변경 알림
        </div>
        <span className="text-xs font-bold tabular-nums text-orange-600">
          {alert.occurredAt}
        </span>
      </div>

      <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex min-w-0 items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-lg shadow-orange-500/20">
            <TriangleAlert className="h-6 w-6" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-lg font-black tracking-tight text-slate-950">
              {alert.title}
            </h2>
            <p className="mt-1 text-sm font-bold text-orange-700">{alert.detail}</p>
            <p className="mt-1.5 flex items-center gap-1.5 text-sm font-semibold text-slate-600">
              <Sparkles className="h-4 w-4 text-emerald-600" aria-hidden="true" />
              {alert.suggestion}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={scrollToRoutes}
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 text-sm font-extrabold text-white shadow-lg shadow-orange-600/20 transition hover:bg-orange-700"
        >
          새 경로 보기
          <ArrowDown className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}

