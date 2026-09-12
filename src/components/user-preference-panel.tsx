"use client";

import { useEffect, useState } from "react";
import {
  Banknote,
  CarTaxiFront,
  Check,
  ChevronDown,
  Footprints,
  LoaderCircle,
  PersonStanding,
  Save,
  Settings2,
} from "lucide-react";
import type { UserPreferences } from "@/types/trip";

type UserPreferencePanelProps = {
  preferences: UserPreferences;
  forceOpenSignal: number;
  onApply: (preferences: UserPreferences) => Promise<void>;
};

type ToggleRowProps = {
  icon: typeof CarTaxiFront;
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

function ToggleRow({
  icon: Icon,
  label,
  description,
  checked,
  onChange,
}: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <div>
          <p className="text-sm font-extrabold text-slate-900">{label}</p>
          <p className="mt-0.5 text-xs text-slate-500">{description}</p>
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full p-1 transition ${
          checked ? "bg-emerald-600" : "bg-slate-300"
        }`}
      >
        <span
          className={`block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

export function UserPreferencePanel({
  preferences,
  forceOpenSignal,
  onApply,
}: UserPreferencePanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState(preferences);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (forceOpenSignal > 0) {
      setIsOpen(true);
      window.setTimeout(() => {
        document.getElementById("preferences")?.scrollIntoView({ behavior: "smooth" });
      }, 50);
    }
  }, [forceOpenSignal]);

  const applyPreferences = async () => {
    setIsSaving(true);
    setSaved(false);
    try {
      await onApply(draft);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2200);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section
      id="preferences"
      className="scroll-mt-24 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-soft"
    >
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-4 p-5 text-left sm:p-6"
      >
        <span className="flex items-center gap-3.5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white">
            <Settings2 className="h-5 w-5" aria-hidden="true" />
          </span>
          <span>
            <span className="block text-base font-black text-slate-950">내 이동 조건</span>
            <span className="mt-0.5 block text-xs font-medium text-slate-500">
              비용과 이동 가능 범위를 경로 추천에 반영해요.
            </span>
          </span>
        </span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-slate-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div className="animate-fade-up border-t border-slate-100 px-5 pb-5 sm:px-6 sm:pb-6">
          <div className="py-5">
            <div className="flex items-center justify-between gap-4">
              <label
                htmlFor="max-cost"
                className="flex items-center gap-2 text-sm font-extrabold text-slate-900"
              >
                <Banknote className="h-4 w-4 text-emerald-700" aria-hidden="true" />
                최대 추가비용
              </label>
              <output className="rounded-lg bg-emerald-50 px-2.5 py-1 text-sm font-black text-emerald-700">
                {draft.maxExtraCost.toLocaleString("ko-KR")}원
              </output>
            </div>
            <input
              id="max-cost"
              type="range"
              min={0}
              max={30000}
              step={1000}
              value={draft.maxExtraCost}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  maxExtraCost: Number(event.target.value),
                }))
              }
              className="range-control mt-4 h-2 w-full cursor-pointer"
            />
            <div className="mt-1 flex justify-between text-[10px] font-bold text-slate-400">
              <span>0원</span>
              <span>30,000원</span>
            </div>
          </div>

          <div className="border-t border-slate-100 py-5">
            <div className="flex items-center justify-between gap-4">
              <label
                htmlFor="walking-distance"
                className="flex items-center gap-2 text-sm font-extrabold text-slate-900"
              >
                <Footprints className="h-4 w-4 text-emerald-700" aria-hidden="true" />
                걷기 가능 거리
              </label>
              <output className="rounded-lg bg-emerald-50 px-2.5 py-1 text-sm font-black text-emerald-700">
                {draft.walkingDistanceMeters >= 1000
                  ? `${(draft.walkingDistanceMeters / 1000).toFixed(1)}km`
                  : `${draft.walkingDistanceMeters}m`}
              </output>
            </div>
            <input
              id="walking-distance"
              type="range"
              min={100}
              max={2000}
              step={100}
              value={draft.walkingDistanceMeters}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  walkingDistanceMeters: Number(event.target.value),
                }))
              }
              className="range-control mt-4 h-2 w-full cursor-pointer"
            />
            <div className="mt-1 flex justify-between text-[10px] font-bold text-slate-400">
              <span>100m</span>
              <span>2km</span>
            </div>
          </div>

          <div className="divide-y divide-slate-100 border-y border-slate-100">
            <ToggleRow
              icon={PersonStanding}
              label="뛰기 가능"
              description="급할 때 달리는 경로도 추천"
              checked={draft.canRun}
              onChange={(checked) =>
                setDraft((current) => ({ ...current, canRun: checked }))
              }
            />
            <ToggleRow
              icon={CarTaxiFront}
              label="택시 허용"
              description="비용 한도 내 택시 경로 포함"
              checked={draft.allowTaxi}
              onChange={(checked) =>
                setDraft((current) => ({ ...current, allowTaxi: checked }))
              }
            />
          </div>

          <button
            type="button"
            onClick={applyPreferences}
            disabled={isSaving}
            className={`mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-extrabold transition ${
              saved
                ? "bg-emerald-100 text-emerald-700"
                : "bg-slate-950 text-white hover:bg-slate-800"
            }`}
          >
            {isSaving ? (
              <>
                <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                조건 반영 중
              </>
            ) : saved ? (
              <>
                <Check className="h-4 w-4" strokeWidth={3} aria-hidden="true" />
                적용 완료
              </>
            ) : (
              <>
                <Save className="h-4 w-4" aria-hidden="true" />
                이 조건으로 경로 다시 보기
              </>
            )}
          </button>
        </div>
      )}
    </section>
  );
}
