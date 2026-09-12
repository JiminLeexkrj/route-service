"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  LocateFixed,
  MapPin,
  Navigation2,
  X,
} from "lucide-react";
import { AlertBanner } from "@/components/alert-banner";
import { AppHeader } from "@/components/app-header";
import { RouteMap } from "@/components/map/RouteMap";
import { RecommendedActionCard } from "@/components/recommended-action-card";
import { RouteComparison } from "@/components/route-comparison";
import { TripStatusCard } from "@/components/trip-status-card";
import { UserPreferencePanel } from "@/components/user-preference-panel";
import {
  DEFAULT_PREFERENCES,
  type RouteOption,
  type TripSnapshot,
  type UserPreferences,
} from "@/types/trip";

type TripDashboardProps = {
  trip: TripSnapshot;
  error: string | null;
  isSimulating: boolean;
  onSimulateTraffic: () => Promise<void>;
  onSavePreferences: (preferences: UserPreferences) => Promise<void>;
  onBack: () => void;
};

export function TripDashboard({
  trip,
  error,
  isSimulating,
  onSimulateTraffic,
  onSavePreferences,
  onBack,
}: TripDashboardProps) {
  const recommendedRoute = trip.routes.find((route) => route.recommended);
  const [selectedRouteId, setSelectedRouteId] = useState(
    recommendedRoute?.id ?? trip.routes[0]?.id ?? "",
  );
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [preferenceOpenSignal, setPreferenceOpenSignal] = useState(0);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const nextRecommended = trip.routes.find((route) => route.recommended);
    if (nextRecommended) setSelectedRouteId(nextRecommended.id);
  }, [trip.routes]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const visibleRoutes = useMemo(
    () =>
      trip.routes.filter(
        (route) => preferences.allowTaxi || !route.title.includes("택시"),
      ),
    [preferences.allowTaxi, trip.routes],
  );

  const handleSelectRoute = (option: RouteOption) => {
    setSelectedRouteId(option.id);
    setToast(`${option.title} 경로를 선택했습니다.`);
  };

  const handleApplyPreferences = async (next: UserPreferences) => {
    await onSavePreferences(next);
    setPreferences(next);
    setToast("이동 조건을 경로 목록에 반영했습니다.");
  };

  return (
    <div className="min-h-screen bg-[#f5f7fb]">
      <AppHeader
        compact
        onOpenPreferences={() => setPreferenceOpenSignal((value) => value + 1)}
      />

      <main className="mx-auto max-w-7xl px-4 pb-24 pt-5 sm:px-8 sm:pt-7 lg:px-10">
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              aria-label="목적지 입력 화면으로 돌아가기"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
            >
              <ArrowLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-2 text-xs font-semibold text-slate-500">
                <span className="flex min-w-0 items-center gap-1.5 truncate">
                  <LocateFixed className="h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden="true" />
                  <span className="truncate">{trip.originLabel}</span>
                </span>
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-300" aria-hidden="true" />
                <span className="flex min-w-0 items-center gap-1.5 truncate font-extrabold text-slate-800">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-red-500" aria-hidden="true" />
                  <span className="truncate">{trip.destination}</span>
                </span>
              </div>
              <p className="mt-1 text-[11px] font-medium text-slate-400">
                목적지에 도착할 때까지 경로를 계속 확인합니다.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-[11px] font-extrabold text-emerald-700 sm:self-auto">
            <Navigation2 className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
            안내 진행 중
          </div>
        </div>

        {error && (
          <div role="alert" className="mb-5 flex items-center justify-between rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            <span>{error}</span>
            <X className="h-4 w-4" aria-hidden="true" />
          </div>
        )}

        <div className="space-y-5 sm:space-y-6">
          <TripStatusCard status={trip.status} />

          <AlertBanner
            alert={trip.alert}
            isSimulating={isSimulating}
            onSimulate={onSimulateTraffic}
          />

          <RecommendedActionCard status={trip.status} alert={trip.alert} />

          {trip.origin && trip.destinationCoordinate && (
            <RouteMap
              origin={trip.origin}
              destination={trip.destinationCoordinate}
              route={trip.routes.find((route) => route.id === selectedRouteId)}
              className="h-72 sm:h-80"
            />
          )}

          <div className="pt-3 sm:pt-5">
            <RouteComparison
              routes={visibleRoutes}
              selectedRouteId={selectedRouteId}
              onSelect={handleSelectRoute}
            />
          </div>

          <UserPreferencePanel
            preferences={preferences}
            forceOpenSignal={preferenceOpenSignal}
            onApply={handleApplyPreferences}
          />

          <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 px-1 pt-5 text-center text-[11px] font-medium text-slate-400 sm:flex-row sm:text-left">
            <span>실제 서비스에서는 교통 API 데이터가 자동 반영됩니다.</span>
            <button
              type="button"
              onClick={onBack}
              className="font-bold text-slate-500 underline decoration-slate-300 underline-offset-4 transition hover:text-slate-800"
            >
              새로운 목적지 검색
            </button>
          </div>
        </div>
      </main>

      {toast && (
        <div
          role="status"
          className="fixed bottom-5 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 animate-fade-up items-center gap-3 rounded-2xl bg-slate-950 px-4 py-3.5 text-sm font-bold text-white shadow-2xl sm:bottom-8"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-400 text-slate-950">
            <CheckCircle2 className="h-4 w-4" strokeWidth={3} aria-hidden="true" />
          </span>
          {toast}
        </div>
      )}
    </div>
  );
}

