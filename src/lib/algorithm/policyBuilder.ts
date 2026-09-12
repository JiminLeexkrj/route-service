import type { RawRoute, RouteSegment } from "@/lib/routes/types";
import {
  buildTimeDistribution,
  computeEffectiveConfidence,
} from "./distribution";
import type { AlgoSegmentMode, RealtimeRouteSegment, RoutePolicy } from "./types";

const BOARD_PROBABILITY: Record<AlgoSegmentMode, number> = {
  WALK: 1,
  RUN: 1,
  BUS: 0.93,
  SUBWAY: 0.97,
  CAR: 1,
  TAXI: 1,
};

function resolveSegmentMode(segment: RouteSegment): AlgoSegmentMode {
  if (segment.mode === "CAR" && segment.routeName?.includes("택시")) {
    return "TAXI";
  }
  return segment.mode;
}

function buildSegment(
  segment: RouteSegment,
  index: number,
  route: RawRoute,
  now: number,
): RealtimeRouteSegment {
  const mode = resolveSegmentMode(segment);
  const ageSeconds = route.fetchedAt
    ? Math.max(0, (now - new Date(route.fetchedAt).getTime()) / 1000)
    : 0;
  const effectiveConfidence = computeEffectiveConfidence(
    mode,
    Boolean(route.isRealtime),
    ageSeconds,
  );

  return {
    id: `${route.id}-seg-${index}`,
    mode,
    from: segment.from,
    to: segment.to,
    routeName: segment.routeName,
    travelTime: buildTimeDistribution(
      segment.durationMinutes,
      mode,
      effectiveConfidence,
    ),
    distanceMeters: segment.distanceMeters,
    boardProbability: BOARD_PROBABILITY[mode],
    transferSuccessProbability: mode === "WALK" || mode === "RUN" ? 1 : 0.95,
    realtimeConfidence: effectiveConfidence,
    isRoadDependent: mode === "BUS" || mode === "CAR" || mode === "TAXI",
  };
}

function routeSignature(route: RawRoute): string {
  return route.segments
    .filter((segment) => segment.mode !== "WALK")
    .map((segment) => `${segment.mode}:${segment.routeName ?? ""}`)
    .join("|");
}

function policyLabel(route: RawRoute): string {
  const nonWalk = route.segments.filter((segment) => segment.mode !== "WALK");
  if (nonWalk.length === 0) return "도보 이동";
  return nonWalk
    .map((segment) => segment.routeName ?? segment.mode)
    .join(" → ");
}

/**
 * RawRoute 후보들을 RoutePolicy로 변환한다 (문서 §5-C).
 * 같은 노선 조합(routeSignature)에 의존하는 중복 후보는 더 빠른 쪽만 남긴다.
 */
export function buildPolicies(
  routes: RawRoute[],
  now: number,
  allowTaxi: boolean,
): RoutePolicy[] {
  const bestBySignature = new Map<string, RawRoute>();

  for (const route of routes) {
    const signature = routeSignature(route);
    const existing = bestBySignature.get(signature);
    if (!existing || route.durationMinutes < existing.durationMinutes) {
      bestBySignature.set(signature, route);
    }
  }

  const policies = Array.from(bestBySignature.values()).map((route) => {
    const segments = route.segments.map((segment, index) =>
      buildSegment(segment, index, route, now),
    );
    const usesTaxi = segments.some((segment) => segment.mode === "TAXI");
    const walkingSegments = segments.filter(
      (segment) => segment.mode === "WALK" || segment.mode === "RUN",
    );
    const walkingMinutes = walkingSegments.reduce(
      (sum, segment) => sum + segment.travelTime.mean,
      0,
    );
    const walkingMeters = walkingSegments.reduce(
      (sum, segment) => sum + (segment.distanceMeters ?? 0),
      0,
    );
    const transferCount = Math.max(
      0,
      segments.filter((segment) => segment.mode !== "WALK" && segment.mode !== "RUN")
        .length - 1,
    );

    return {
      id: route.id,
      label: policyLabel(route),
      sourceRouteId: route.id,
      mode: route.mode,
      polyline: route.polyline,
      segments,
      extraCost: route.fare ?? 0,
      walkingMinutes,
      walkingMeters,
      transferCount,
      usesTaxi,
    } satisfies RoutePolicy;
  });

  const feasible = policies.filter((policy) => allowTaxi || !policy.usesTaxi);
  const usable = feasible.length > 0 ? feasible : policies;

  // 정책이 실패했을 때 통째로 갈아탈 대안을 지정한다 (문서 §4의 FallbackBranch를
  // 정책 단위로 단순화한 MVP 표현: 우리는 같은 이동편의 대체 승차가 아니라
  // 정책 후보 자체를 fallback으로 사용한다).
  const sorted = [...usable].sort(
    (a, b) => totalMinutes(a) - totalMinutes(b),
  );
  return usable.map((policy) => ({
    ...policy,
    fallbackPolicyId: sorted.find((candidate) => candidate.id !== policy.id)?.id,
  }));
}

function totalMinutes(policy: RoutePolicy): number {
  return policy.segments.reduce((sum, segment) => sum + segment.travelTime.mean, 0);
}
