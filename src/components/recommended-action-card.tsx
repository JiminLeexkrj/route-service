import {
  ArrowRight,
  BusFront,
  ClockArrowDown,
  Footprints,
  Siren,
  TrainFront,
} from "lucide-react";
import type { TrafficAlert, TripStatus } from "@/types/trip";

type RecommendedActionCardProps = {
  status: TripStatus;
  alert: TrafficAlert | null;
};

export function RecommendedActionCard({
  status,
  alert,
}: RecommendedActionCardProps) {
  const changed = Boolean(alert);

  return (
    <section
      className={`relative overflow-hidden rounded-[30px] p-6 text-white shadow-card sm:p-8 ${
        changed
          ? "bg-gradient-to-br from-slate-950 via-slate-900 to-orange-950"
          : "bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950"
      }`}
    >
      <div
        className={`absolute -right-16 -top-24 h-64 w-64 rounded-full blur-3xl ${
          changed ? "bg-orange-500/20" : "bg-emerald-400/20"
        }`}
      />
      <div className="relative">
        <div className="flex items-center justify-between gap-3">
          <span
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-black ${
              changed
                ? "bg-orange-400/15 text-orange-300"
                : "bg-emerald-400/15 text-emerald-300"
            }`}
          >
            {changed ? (
              <Siren className="h-4 w-4" aria-hidden="true" />
            ) : (
              <ClockArrowDown className="h-4 w-4" aria-hidden="true" />
            )}
            지금 해야 할 일
          </span>
          <span className="text-[11px] font-semibold text-slate-400">실시간 추천</span>
        </div>

        <div className="mt-7 flex items-start gap-4 sm:gap-5">
          <span
            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl sm:h-16 sm:w-16 ${
              changed
                ? "bg-orange-500 text-white shadow-lg shadow-orange-500/25"
                : "bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-400/20"
            }`}
          >
            {changed ? (
              <Footprints className="h-7 w-7 sm:h-8 sm:w-8" aria-hidden="true" />
            ) : (
              <BusFront className="h-7 w-7 sm:h-8 sm:w-8" aria-hidden="true" />
            )}
          </span>
          <div className="min-w-0">
            <h2 className="text-2xl font-black leading-tight tracking-[-0.04em] sm:text-4xl">
              {changed && <span className="mr-1">🚨</span>}
              {status.recommendedAction}
            </h2>
            {alert ? (
              <div className="mt-4 flex flex-wrap items-center gap-2 text-sm font-bold text-slate-300 sm:text-base">
                <span className="flex items-center gap-1.5">
                  <TrainFront className="h-4 w-4 text-orange-300" aria-hidden="true" />
                  지하철로 환승하면
                </span>
                <span className="text-slate-400 line-through">{alert.previousArrival}</span>
                <ArrowRight className="h-4 w-4 text-slate-500" aria-hidden="true" />
                <span className="rounded-lg bg-emerald-400/15 px-2 py-1 text-emerald-300">
                  {alert.newArrival} 도착
                </span>
              </div>
            ) : (
              <p className="mt-3 text-sm font-semibold leading-6 text-slate-300 sm:text-base">
                현재 경로가 가장 안정적입니다. 변화가 생기면 바로 다음 행동을
                알려드릴게요.
              </p>
            )}
          </div>
        </div>

        <div className="mt-7 flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3.5 backdrop-blur sm:px-5">
          <div className="flex items-center gap-3">
            <span className="h-2.5 w-2.5 animate-soft-pulse rounded-full bg-emerald-400" />
            <p className="text-xs font-bold text-slate-300 sm:text-sm">
              {changed ? "다음 정류장까지 약 2분" : "다음 안내까지 약 4분"}
            </p>
          </div>
          <p className="text-xs font-semibold text-slate-500">경로 이탈 자동 감지</p>
        </div>
      </div>
    </section>
  );
}
