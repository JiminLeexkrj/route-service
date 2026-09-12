"use client";

import {
  BellRing,
  BusFront,
  Check,
  ChevronRight,
  CircleDollarSign,
  Route,
  ShieldCheck,
} from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { DestinationForm } from "@/components/destination-form";
import type { CurrentLocation, StartTripRequest } from "@/types/trip";

type LandingPageProps = {
  isLoading: boolean;
  error: string | null;
  onStart: (request: StartTripRequest) => Promise<void>;
  onResolveLocation: () => Promise<CurrentLocation>;
};

const FEATURES = [
  {
    icon: BellRing,
    title: "위험을 먼저 감지",
    description: "교통 변화와 지각 가능성을 실시간으로 알려줘요.",
  },
  {
    icon: Route,
    title: "대안 경로 즉시 비교",
    description: "버스·지하철·택시 중 지금 가장 나은 선택을 보여줘요.",
  },
  {
    icon: CircleDollarSign,
    title: "내 조건까지 반영",
    description: "추가비용, 걷기 거리, 택시 허용 여부를 맞춰요.",
  },
];

export function LandingPage({
  isLoading,
  error,
  onStart,
  onResolveLocation,
}: LandingPageProps) {
  return (
    <div className="hero-mesh min-h-screen">
      <AppHeader />
      <main>
        <section className="mx-auto grid max-w-7xl items-center gap-12 px-5 pb-14 pt-12 sm:px-8 sm:pb-20 sm:pt-16 lg:grid-cols-[1.02fr_0.98fr] lg:gap-16 lg:px-10 lg:pb-24 lg:pt-20">
          <div className="max-w-2xl animate-fade-up">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-3 py-1.5 text-xs font-extrabold text-emerald-700 shadow-sm backdrop-blur">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              지각 방지 실시간 내비게이션
            </div>
            <h1 className="text-[2.55rem] font-black leading-[1.1] tracking-[-0.055em] text-slate-950 sm:text-6xl lg:text-[4.15rem]">
              늦을 것 같다면,
              <br />
              <span className="text-emerald-600">지금 경로를 바꾸세요.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base font-medium leading-7 text-slate-600 sm:text-lg sm:leading-8">
              목적지와 도착시간만 알려주세요. 현재 교통상황을 계속 확인해
              <strong className="font-extrabold text-slate-900">
                {" "}정시에 도착할 가능성이 가장 높은 방법
              </strong>
              을 바로 안내합니다.
            </p>

            <div className="mt-8 hidden flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-slate-600 lg:flex">
              {["실시간 위험 알림", "도착 확률 비교", "맞춤 이동 조건"].map(
                (item) => (
                  <span key={item} className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                      <Check className="h-3 w-3" strokeWidth={3} aria-hidden="true" />
                    </span>
                    {item}
                  </span>
                ),
              )}
            </div>
          </div>

          <div className="relative animate-fade-up lg:pl-5" style={{ animationDelay: "90ms" }}>
            <div className="absolute -inset-5 -z-10 rounded-[42px] bg-gradient-to-br from-emerald-200/35 via-white/0 to-blue-200/30 blur-2xl" />
            <DestinationForm
              isLoading={isLoading}
              apiError={error}
              onSubmit={onStart}
              onResolveLocation={onResolveLocation}
            />
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 pb-16 sm:px-8 lg:px-10 lg:pb-24">
          <div className="overflow-hidden rounded-[30px] border border-slate-200/80 bg-white/75 shadow-soft backdrop-blur">
            <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
              <div className="relative min-h-[280px] overflow-hidden bg-slate-950 p-6 text-white sm:p-9">
                <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_75%_20%,#10b981_0,transparent_28%),radial-gradient(circle_at_18%_85%,#2563eb_0,transparent_30%)]" />
                <div className="relative z-10">
                  <div className="mb-8 flex items-center justify-between">
                    <span className="flex items-center gap-2 text-xs font-bold text-slate-300">
                      <span className="h-2 w-2 animate-soft-pulse rounded-full bg-emerald-400" />
                      이동 중 · 교통정보 갱신됨
                    </span>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/80">
                      09:24
                    </span>
                  </div>

                  <div className="grid grid-cols-[48px_1fr] gap-x-3">
                    <div className="flex flex-col items-center">
                      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-400 text-slate-950">
                        <BusFront className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <span className="route-dots my-2 h-14 w-2" />
                      <span className="h-3.5 w-3.5 rounded-full border-4 border-white bg-slate-950" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-emerald-300">지금 해야 할 일</p>
                      <p className="mt-1 text-xl font-black tracking-tight sm:text-2xl">
                        현재 버스를 계속 이용하세요.
                      </p>
                      <p className="mt-10 text-xs text-slate-400">목적지 · 서울역</p>
                      <p className="mt-1 text-sm font-bold text-white">8정거장 남음</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col justify-between p-6 sm:p-9">
                <div>
                  <p className="text-sm font-extrabold text-slate-500">정시 도착 가능성</p>
                  <div className="mt-3 flex items-end gap-3">
                    <span className="text-6xl font-black tracking-[-0.06em] text-slate-950">
                      87<span className="text-3xl">%</span>
                    </span>
                    <span className="mb-2 rounded-full bg-emerald-100 px-3 py-1 text-sm font-extrabold text-emerald-700">
                      ● 안전
                    </span>
                  </div>
                  <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full w-[87%] rounded-full bg-emerald-500" />
                  </div>
                </div>

                <div className="mt-8 flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                  <div>
                    <p className="text-xs font-semibold text-slate-500">예상 도착</p>
                    <p className="mt-0.5 text-lg font-black text-slate-900">09:53</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-400" aria-hidden="true" />
                  <div className="text-right">
                    <p className="text-xs font-semibold text-slate-500">도착 마감</p>
                    <p className="mt-0.5 text-lg font-black text-slate-900">10:00</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-slate-200/70 bg-white/70">
          <div className="mx-auto grid max-w-7xl gap-4 px-5 py-12 sm:px-8 md:grid-cols-3 lg:px-10 lg:py-16">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <article
                key={title}
                className="rounded-3xl border border-slate-200/80 bg-white p-5 transition hover:-translate-y-1 hover:shadow-soft"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h2 className="mt-4 text-base font-extrabold text-slate-900">{title}</h2>
                <p className="mt-1.5 text-sm leading-6 text-slate-500">{description}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
