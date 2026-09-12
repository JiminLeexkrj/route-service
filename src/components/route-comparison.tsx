"use client";

import { GitCompareArrows } from "lucide-react";
import { RouteOptionCard } from "@/components/route-option-card";
import type { RouteOption } from "@/types/trip";

type RouteComparisonProps = {
  routes: RouteOption[];
  selectedRouteId: string;
  onSelect: (option: RouteOption) => void;
};

export function RouteComparison({
  routes,
  selectedRouteId,
  onSelect,
}: RouteComparisonProps) {
  return (
    <section id="routes" className="scroll-mt-24">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-extrabold text-emerald-700">
            <GitCompareArrows className="h-4 w-4" aria-hidden="true" />
            실시간 비교
          </div>
          <h2 className="mt-1.5 text-2xl font-black tracking-[-0.035em] text-slate-950">
            어떤 경로로 갈까요?
          </h2>
          <p className="mt-1 text-sm font-medium text-slate-500">
            도착 가능성, 시간, 추가비용을 한눈에 비교하세요.
          </p>
        </div>
        <span className="hidden rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-500 sm:inline">
          방금 업데이트됨
        </span>
      </div>

      {routes.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-3">
          {routes.map((route, index) => (
            <RouteOptionCard
              key={route.id}
              option={route}
              label={String.fromCharCode(65 + index)}
              selected={selectedRouteId === route.id}
              onSelect={onSelect}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <p className="text-sm font-bold text-slate-600">
            현재 설정에 맞는 대체 경로가 없습니다.
          </p>
        </div>
      )}
    </section>
  );
}

