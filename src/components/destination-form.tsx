"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  LoaderCircle,
  LocateFixed,
  MapPin,
  Navigation,
} from "lucide-react";
import { getDefaultDeadline, toDateTimeLocalValue } from "@/lib/time";
import {
  DEFAULT_PREFERENCES,
  type CurrentLocation,
  type StartTripRequest,
} from "@/types/trip";

type DestinationFormProps = {
  isLoading: boolean;
  apiError: string | null;
  onSubmit: (request: StartTripRequest) => Promise<void>;
  onResolveLocation: () => Promise<CurrentLocation>;
};

export function DestinationForm({
  isLoading,
  apiError,
  onSubmit,
  onResolveLocation,
}: DestinationFormProps) {
  const [destination, setDestination] = useState("서울역");
  const [deadline, setDeadline] = useState("");
  const [minimumDeadline, setMinimumDeadline] = useState("");
  const [location, setLocation] = useState<CurrentLocation | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 1, 0, 0);
    setMinimumDeadline(toDateTimeLocalValue(now));
    setDeadline(getDefaultDeadline());
  }, []);

  const handleLocation = async () => {
    setIsLocating(true);
    setFormError(null);
    try {
      const current = await onResolveLocation();
      setLocation(current);
    } catch {
      setFormError("현재 위치를 확인하지 못했어요. 다시 시도해 주세요.");
    } finally {
      setIsLocating(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    if (!destination.trim()) {
      setFormError("목적지를 입력해 주세요.");
      return;
    }
    if (!deadline) {
      setFormError("도착해야 하는 시간을 선택해 주세요.");
      return;
    }
    if (new Date(deadline).getTime() <= Date.now()) {
      setFormError("현재 시각보다 늦은 도착시간을 선택해 주세요.");
      return;
    }

    await onSubmit({
      destination: destination.trim(),
      deadline,
      useCurrentLocation: Boolean(location),
      preferences: DEFAULT_PREFERENCES,
    });
  };

  const visibleError = formError ?? apiError;

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[28px] border border-white/90 bg-white p-5 shadow-card sm:p-7"
    >
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-extrabold text-slate-900">어디에, 몇 시까지?</p>
          <p className="mt-1 text-xs text-slate-500">
            입력하면 정시 도착 경로를 바로 비교해 드려요.
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-500">
          약 10초
        </span>
      </div>

      <div className="space-y-4">
        <label className="block">
          <span className="mb-2 block text-xs font-bold text-slate-600">목적지</span>
          <span className="relative block">
            <MapPin
              className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-emerald-600"
              aria-hidden="true"
            />
            <input
              type="text"
              value={destination}
              onChange={(event) => setDestination(event.target.value)}
              placeholder="회사, 학교 또는 장소를 입력하세요"
              autoComplete="off"
              className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50/80 pl-12 pr-4 text-base font-semibold text-slate-950 placeholder:font-normal placeholder:text-slate-400 transition focus:border-emerald-400 focus:bg-white focus:outline-none"
            />
          </span>
        </label>

        <label className="block">
          <span className="mb-2 block text-xs font-bold text-slate-600">
            도착 마감시간
          </span>
          <span className="relative block">
            <CalendarClock
              className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-emerald-600"
              aria-hidden="true"
            />
            <input
              type="datetime-local"
              value={deadline}
              min={minimumDeadline}
              onChange={(event) => setDeadline(event.target.value)}
              className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50/80 pl-12 pr-3 text-sm font-semibold text-slate-950 transition focus:border-emerald-400 focus:bg-white focus:outline-none sm:text-base"
            />
          </span>
        </label>

        <button
          type="button"
          onClick={handleLocation}
          disabled={isLocating}
          className={`flex min-h-12 w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
            location
              ? "border-emerald-200 bg-emerald-50"
              : "border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/50"
          }`}
        >
          <span className="flex min-w-0 items-center gap-3">
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                location ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"
              }`}
            >
              {isLocating ? (
                <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : location ? (
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              ) : (
                <LocateFixed className="h-4 w-4" aria-hidden="true" />
              )}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-bold text-slate-800">
                {location ? "현재 위치 확인 완료" : "현재 위치 사용"}
              </span>
              <span className="block truncate text-xs text-slate-500">
                {location?.label ?? "출발지를 자동으로 불러옵니다"}
              </span>
            </span>
          </span>
          {!location && !isLocating && (
            <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
          )}
        </button>
      </div>

      {visibleError && (
        <p role="alert" className="mt-4 text-sm font-semibold text-red-600">
          {visibleError}
        </p>
      )}

      <button
        type="submit"
        disabled={isLoading || !deadline}
        className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-base font-extrabold text-white shadow-lg shadow-slate-950/15 transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0"
      >
        {isLoading ? (
          <>
            <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />
            가장 안전한 경로 계산 중
          </>
        ) : (
          <>
            <Navigation className="h-5 w-5 fill-current" aria-hidden="true" />
            길찾기 시작
          </>
        )}
      </button>
    </form>
  );
}

