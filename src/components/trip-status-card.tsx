"use client";

import { useEffect, useMemo, useState } from "react";
import { AlarmClock, Clock3, Flag, TimerReset } from "lucide-react";
import { RiskGauge } from "@/components/risk-gauge";
import { RISK_META } from "@/lib/risk";
import {
  formatClock,
  formatRemaining,
  minutesBetweenClocks,
} from "@/lib/time";
import type { TripStatus } from "@/types/trip";

type TripStatusCardProps = {
  status: TripStatus;
  lastUpdatedAt?: string;
};

function formatUpdatedLabel(lastUpdatedAt: string | undefined, now: Date | null): string {
  if (!lastUpdatedAt || !now) return "실시간 위치 추적 중";
  const seconds = Math.max(0, Math.round((now.getTime() - new Date(lastUpdatedAt).getTime()) / 1000));
  if (seconds < 60) return "방금 경로 갱신됨";
  const minutes = Math.round(seconds / 60);
  return `${minutes}분 전 경로 갱신됨`;
}

export function TripStatusCard({ status, lastUpdatedAt }: TripStatusCardProps) {
  const [now, setNow] = useState<Date | null>(null);
  const riskMeta = RISK_META[status.riskLevel];

  useEffect(() => {
    setNow(new Date());
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const currentClock = now ? formatClock(now) : status.currentTime;
  const currentClockWithSeconds = now
    ? formatClock(now, true)
    : `${status.currentTime}:00`;
  const remaining = useMemo(
    () => minutesBetweenClocks(currentClock, status.deadline),
    [currentClock, status.deadline],
  );

  const metrics = [
    {
      label: "현재 시각",
      value: currentClockWithSeconds,
      icon: Clock3,
      valueClass: "tabular-nums",
    },
    {
      label: "목표 도착",
      value: status.deadline,
      icon: Flag,
      valueClass: "tabular-nums",
    },
    {
      label: "예상 도착",
      value: status.expectedArrival,
      icon: AlarmClock,
      valueClass:
        status.riskLevel === "LATE" ? "text-red-600 tabular-nums" : "tabular-nums",
    },
    {
      label: "남은 시간",
      value: formatRemaining(remaining),
      icon: TimerReset,
      valueClass: "text-emerald-700",
    },
  ];

  return (
    <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-soft">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-7">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </span>
          <h1 className="text-sm font-extrabold text-slate-900">실시간 이동 현황</h1>
        </div>
        <p className="text-[11px] font-semibold text-slate-400">
          {formatUpdatedLabel(lastUpdatedAt, now)}
        </p>
      </div>

      <div className="p-5 sm:p-7">
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
          {metrics.map(({ label, value, icon: Icon, valueClass }) => (
            <div key={label} className="rounded-2xl bg-slate-50 px-3.5 py-3.5 sm:px-4">
              <div className="flex items-center gap-1.5 text-slate-500">
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="text-[11px] font-bold">{label}</span>
              </div>
              <p
                className={`mt-2 whitespace-nowrap text-base font-black tracking-tight text-slate-950 sm:text-lg ${valueClass}`}
              >
                {value}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-7 flex flex-col items-center justify-between gap-4 sm:flex-row sm:px-4">
          <div className="order-2 text-center sm:order-1 sm:max-w-[320px] sm:text-left">
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-slate-400">
              On-time score
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-[-0.035em] text-slate-950 sm:text-3xl">
              정시 도착 가능성
            </h2>
            <p className={`mt-2 text-sm font-bold ${riskMeta.textClass}`}>
              {riskMeta.message}
            </p>
            <div className="mt-4 hidden items-center gap-4 text-xs font-bold text-slate-400 sm:flex">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> 안전
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-yellow-400" /> 주의
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-orange-500" /> 위험
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-red-500" /> 지각
              </span>
            </div>
          </div>
          <div className="order-1 sm:order-2">
            <RiskGauge
              probability={status.onTimeProbability}
              riskLevel={status.riskLevel}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

