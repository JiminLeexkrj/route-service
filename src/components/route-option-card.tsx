"use client";

import {
  ArrowRight,
  BusFront,
  CarTaxiFront,
  Check,
  Clock3,
  Coins,
  Footprints,
  Route as RouteIcon,
  Sparkles,
  TrainFront,
} from "lucide-react";
import type { RouteOption } from "@/types/trip";

type RouteOptionCardProps = {
  option: RouteOption;
  label: string;
  selected: boolean;
  onSelect: (option: RouteOption) => void;
};

function RouteModeIcon({ title }: { title: string }) {
  if (title.includes("택시")) {
    return <CarTaxiFront className="h-5 w-5" aria-hidden="true" />;
  }
  if (title.includes("지하철")) {
    return <TrainFront className="h-5 w-5" aria-hidden="true" />;
  }
  return <BusFront className="h-5 w-5" aria-hidden="true" />;
}

export function RouteOptionCard({
  option,
  label,
  selected,
  onSelect,
}: RouteOptionCardProps) {
  const probabilityColor =
    option.onTimeProbability >= 80
      ? "text-emerald-700"
      : option.onTimeProbability >= 50
        ? "text-orange-600"
        : "text-red-600";
  const probabilityBar =
    option.onTimeProbability >= 80
      ? "bg-emerald-500"
      : option.onTimeProbability >= 50
        ? "bg-orange-500"
        : "bg-red-500";

  return (
    <article
      className={`relative flex h-full flex-col overflow-hidden rounded-3xl border bg-white p-5 transition duration-200 sm:p-6 ${
        option.recommended
          ? "border-emerald-400 shadow-[0_12px_35px_rgba(16,185,129,0.13)]"
          : selected
            ? "border-slate-400 shadow-soft"
            : "border-slate-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-soft"
      }`}
    >
      {option.recommended && (
        <div className="absolute right-0 top-0 flex items-center gap-1.5 rounded-bl-2xl bg-emerald-600 px-3 py-2 text-[11px] font-black text-white">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> 추천
        </div>
      )}

      <div className="flex items-center gap-3 pr-16">
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
            option.recommended
              ? "bg-emerald-100 text-emerald-700"
              : "bg-slate-100 text-slate-600"
          }`}
        >
          <RouteModeIcon title={option.title} />
        </span>
        <div>
          <p className="text-[11px] font-black tracking-[0.12em] text-slate-400">
            경로 {label}
          </p>
          <h3 className="mt-0.5 text-base font-black leading-tight tracking-tight text-slate-950">
            {option.title}
          </h3>
        </div>
      </div>

      <div className="mt-5 rounded-2xl bg-slate-50 px-4 py-3.5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold text-slate-500">예상 도착</p>
            <p className="mt-0.5 text-3xl font-black tracking-[-0.05em] tabular-nums text-slate-950">
              {option.arrivalTime}
            </p>
          </div>
          <div className="pb-1 text-right">
            <p className="flex items-center justify-end gap-1 text-[11px] font-bold text-slate-500">
              <Clock3 className="h-3 w-3" aria-hidden="true" /> 총 소요
            </p>
            <p className="mt-0.5 text-sm font-extrabold text-slate-800">
              {option.durationMinutes}분
            </p>
          </div>
        </div>
      </div>

      <p className="mt-4 min-h-10 text-xs font-semibold leading-5 text-slate-500">
        {option.description}
      </p>

      <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
        <div>
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 font-bold text-slate-500">
              <RouteIcon className="h-3.5 w-3.5" aria-hidden="true" /> 정시 도착 확률
            </span>
            <span className={`text-sm font-black ${probabilityColor}`}>
              {option.onTimeProbability}%
            </span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full transition-all duration-700 ${probabilityBar}`}
              style={{ width: `${option.onTimeProbability}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 font-bold text-slate-500">
            <Coins className="h-3.5 w-3.5" aria-hidden="true" /> 추가비용
          </span>
          <span className="font-extrabold text-slate-800">
            {option.extraCost === 0 ? "0원" : `${option.extraCost.toLocaleString("ko-KR")}원`}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 font-bold text-slate-500">
            <Footprints className="h-3.5 w-3.5" aria-hidden="true" /> 이동 강도
          </span>
          <span className="font-extrabold text-slate-800">
            {option.title.includes("택시") ? "낮음" : option.title.includes("지하철") ? "보통" : "낮음"}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onSelect(option)}
        aria-pressed={selected}
        className={`mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-extrabold transition ${
          selected
            ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/15"
            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
        }`}
      >
        {selected ? (
          <>
            <Check className="h-4 w-4" strokeWidth={3} aria-hidden="true" /> 선택한 경로
          </>
        ) : (
          <>
            이 경로 선택
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </>
        )}
      </button>
    </article>
  );
}
