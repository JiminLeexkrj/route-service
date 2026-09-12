import { RISK_META } from "@/lib/risk";
import type { RiskLevel } from "@/types/trip";

type RiskGaugeProps = {
  probability: number;
  riskLevel: RiskLevel;
  size?: "compact" | "large";
};

export function RiskGauge({
  probability,
  riskLevel,
  size = "large",
}: RiskGaugeProps) {
  const meta = RISK_META[riskLevel];
  const radius = 68;
  const circumference = 2 * Math.PI * radius;
  const normalizedProbability = Math.min(100, Math.max(0, probability));
  const offset = circumference - (normalizedProbability / 100) * circumference;
  const dimension = size === "large" ? "h-48 w-48" : "h-36 w-36";

  return (
    <div
      className={`relative shrink-0 ${dimension}`}
      role="img"
      aria-label={`정시 도착 가능성 ${probability}퍼센트, ${meta.label}`}
    >
      <svg viewBox="0 0 160 160" className="h-full w-full -rotate-90">
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke="#e9eef5"
          strokeWidth="12"
        />
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke={meta.color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <p className="text-[11px] font-bold text-slate-500">정시 도착</p>
        <p className="mt-0.5 text-4xl font-black tracking-[-0.06em] text-slate-950">
          {probability}
          <span className="ml-0.5 text-xl">%</span>
        </p>
        <span
          className={`mt-1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-extrabold ${meta.bgClass} ${meta.textClass}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${meta.dotClass}`} />
          {meta.label}
        </span>
      </div>
    </div>
  );
}

