import type { SwitchHistory, TripEvaluation } from "@/lib/algorithm/types";
import { getCurrentPosition } from "@/lib/location/geolocation";
import { searchPlace } from "@/lib/routes/client";
import type { Coordinate } from "@/lib/routes/types";
import { formatClock } from "@/lib/time";
import {
  createInitialMockTrip,
  createTrafficChangedMockTrip,
  MOCK_CURRENT_LOCATION,
} from "@/data/mock-trip";
import type {
  CurrentLocation,
  RouteOption,
  StartTripRequest,
  TrafficAlert,
  TripSnapshot,
  UserPreferences,
} from "@/types/trip";

export interface LocationProvider {
  getCurrentLocation(): Promise<CurrentLocation>;
}

export interface RouteProvider {
  searchRoutes(request: StartTripRequest): Promise<TripSnapshot["routes"]>;
}

export interface TripService {
  getCurrentLocation(): Promise<CurrentLocation>;
  startTrip(request: StartTripRequest): Promise<TripSnapshot>;
  getTripSnapshot(tripId: string): Promise<TripSnapshot>;
  savePreferences(
    tripId: string,
    preferences: UserPreferences,
  ): Promise<void>;
  simulateTrafficEvent(tripId: string): Promise<TripSnapshot>;
}

const wait = (milliseconds: number) =>
  new Promise((resolve) => window.setTimeout(resolve, milliseconds));

class MockTripService implements TripService {
  private trips = new Map<string, TripSnapshot>();

  async getCurrentLocation() {
    await wait(450);
    return MOCK_CURRENT_LOCATION;
  }

  async startTrip(request: StartTripRequest) {
    await wait(700);
    const trip = createInitialMockTrip(request);
    this.trips.set(trip.tripId, trip);
    return trip;
  }

  async getTripSnapshot(tripId: string) {
    await wait(250);
    const trip = this.trips.get(tripId);
    if (!trip) throw new Error("이동 정보를 찾을 수 없습니다.");
    return trip;
  }

  async savePreferences(tripId: string, _preferences: UserPreferences) {
    await wait(350);
    if (!this.trips.has(tripId)) {
      throw new Error("이동 정보를 찾을 수 없습니다.");
    }
  }

  async simulateTrafficEvent(tripId: string) {
    await wait(900);
    const current = this.trips.get(tripId);
    if (!current) throw new Error("이동 정보를 찾을 수 없습니다.");

    const changed = createTrafficChangedMockTrip(current);
    this.trips.set(tripId, changed);
    return changed;
  }
}

type EvaluateApiResponse = {
  evaluation: TripEvaluation;
  routeSource: "live" | "mock";
  warnings?: string[];
  demo?: { message: string };
};

type TripSession = {
  origin: Coordinate;
  destinationCoordinate: Coordinate;
  destinationLabel: string;
  originLabel: string;
  deadline: number;
  preferences: UserPreferences;
  history: SwitchHistory;
  demoElapsedSeconds: number;
};

/**
 * DARTS 알고리즘(/api/evaluate)과 실제 위치 API를 사용하는 구현체.
 * API 키가 없으면 route-data 레이어가 자동으로 Mock 데이터로 전환되므로
 * 키 없이도 동일한 평가 로직으로 동작한다 (문서 §9 DEMO 모드, §13-7 원칙).
 */
class ApiTripService implements TripService {
  private sessions = new Map<string, TripSession>();

  async getCurrentLocation(): Promise<CurrentLocation> {
    const position = await getCurrentPosition();
    return {
      latitude: position.lat,
      longitude: position.lng,
      label: `현재 위치 (${position.lat.toFixed(3)}, ${position.lng.toFixed(3)})`,
    };
  }

  async startTrip(request: StartTripRequest): Promise<TripSnapshot> {
    const originPosition = await getCurrentPosition().catch(() => {
      throw new Error("현재 위치를 확인하지 못했습니다. 위치 권한을 허용해 주세요.");
    });

    const places = await searchPlace(request.destination, {
      origin: originPosition,
    });
    const destinationPlace = places[0];
    if (!destinationPlace) {
      throw new Error(
        `"${request.destination}" 목적지를 찾을 수 없습니다. 데모 모드에서는 서울역, 고려대학교, 강남역, 서울시청만 검색됩니다.`,
      );
    }

    const tripId = `trip-${Date.now()}`;
    const deadline = new Date(request.deadline).getTime();
    const session: TripSession = {
      origin: originPosition,
      destinationCoordinate: { lat: destinationPlace.lat, lng: destinationPlace.lng },
      destinationLabel: destinationPlace.name,
      originLabel: "현재 위치",
      deadline,
      preferences: request.preferences,
      history: { candidateStreak: 0 },
      demoElapsedSeconds: 0,
    };
    this.sessions.set(tripId, session);

    const { evaluation, demo } = await this.requestEvaluation(session);
    session.history = {
      currentPolicyId: evaluation.recommendedPolicyId,
      candidateStreak: 0,
    };

    return this.toSnapshot(tripId, session, evaluation, demo?.message ?? null);
  }

  async getTripSnapshot(tripId: string): Promise<TripSnapshot> {
    const session = this.requireSession(tripId);
    const { evaluation, demo } = await this.requestEvaluation(session);
    this.applyHistory(session, evaluation);
    return this.toSnapshot(tripId, session, evaluation, demo?.message ?? null);
  }

  async savePreferences(
    tripId: string,
    preferences: UserPreferences,
  ): Promise<void> {
    const session = this.requireSession(tripId);
    session.preferences = preferences;
  }

  async simulateTrafficEvent(tripId: string): Promise<TripSnapshot> {
    const session = this.requireSession(tripId);
    // 데모 시나리오의 "교통체증 발생" 지점을 강제로 지나가게 해서
    // 같은 평가 코드가 실제로 확률을 재계산하게 한다 (문서 §9).
    session.demoElapsedSeconds = 999;
    const { evaluation, demo } = await this.requestEvaluation(session);
    this.applyHistory(session, evaluation);
    return this.toSnapshot(tripId, session, evaluation, demo?.message ?? null);
  }

  private requireSession(tripId: string): TripSession {
    const session = this.sessions.get(tripId);
    if (!session) throw new Error("이동 정보를 찾을 수 없습니다.");
    return session;
  }

  private applyHistory(session: TripSession, evaluation: TripEvaluation) {
    session.history = {
      currentPolicyId: evaluation.recommendedPolicyId,
      candidatePolicyId: undefined,
      candidateStreak: 0,
      lastSwitchAt: evaluation.shouldSwitch ? evaluation.evaluatedAt : session.history.lastSwitchAt,
    };
  }

  private async requestEvaluation(
    session: TripSession,
  ): Promise<EvaluateApiResponse> {
    const response = await fetch("/api/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({
        origin: session.origin,
        destination: session.destinationCoordinate,
        deadline: session.deadline,
        preferences: session.preferences,
        demoElapsedSeconds: session.demoElapsedSeconds,
        history: session.history,
      }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.error?.message ?? "경로 평가에 실패했습니다.");
    }

    return response.json();
  }

  private toSnapshot(
    tripId: string,
    session: TripSession,
    evaluation: TripEvaluation,
    demoMessage: string | null,
  ): TripSnapshot {
    const now = evaluation.evaluatedAt;
    const target = evaluation.policies.find(
      (p) => p.policy.id === evaluation.recommendedPolicyId,
    )!;
    const current = evaluation.currentPolicyId
      ? evaluation.policies.find((p) => p.policy.id === evaluation.currentPolicyId)
      : undefined;

    const routes: RouteOption[] = evaluation.policies.map(({ policy, forecast }) => ({
      id: policy.id,
      title: policy.label,
      description: `환승 ${policy.transferCount}회 · 도보 ${Math.round(policy.walkingMinutes)}분${
        policy.extraCost > 0 ? ` · 추가비용 ${policy.extraCost.toLocaleString()}원` : ""
      }`,
      arrivalTime: formatClock(new Date(forecast.arrivalP50)),
      durationMinutes: Math.max(0, Math.round((forecast.arrivalP50 - now) / 60_000)),
      onTimeProbability: Math.round(forecast.onTimeProbability * 100),
      extraCost: policy.extraCost,
      recommended: policy.id === evaluation.recommendedPolicyId,
      mode: policy.mode,
      polyline: policy.polyline,
    }));

    let alert: TrafficAlert | null = null;
    if (evaluation.shouldSwitch && current) {
      alert = {
        id: `alert-${now}`,
        title: demoMessage ? "교통 상황 변화 감지" : "정시 도착 확률 변화 감지",
        detail: evaluation.switchReason ?? evaluation.recommendation.reason,
        suggestion: evaluation.recommendation.action.description,
        previousArrival: formatClock(new Date(current.forecast.arrivalP50)),
        newArrival: formatClock(new Date(target.forecast.arrivalP50)),
        occurredAt: formatClock(new Date(now)),
        severity:
          target.riskLevel === "DANGER" || target.riskLevel === "LATE"
            ? "CRITICAL"
            : "WARNING",
      };
    }

    return {
      tripId,
      originLabel: session.originLabel,
      destination: session.destinationLabel,
      status: {
        currentTime: formatClock(new Date(now)),
        deadline: formatClock(new Date(session.deadline)),
        expectedArrival: formatClock(new Date(target.forecast.arrivalP50)),
        onTimeProbability: Math.round(target.forecast.onTimeProbability * 100),
        riskLevel: target.riskLevel,
        recommendedAction: evaluation.recommendation.action.description,
      },
      routes,
      alert,
      updatedAt: new Date(now).toISOString(),
      origin: session.origin,
      destinationCoordinate: session.destinationCoordinate,
    };
  }
}

// 실제 API 연결 시 이 한 줄의 구현체만 교체해도 UI는 그대로 유지됩니다.
// API 키가 없으면 route-data 레이어가 자동으로 Mock/Demo로 전환되므로
// ApiTripService는 키 유무와 상관없이 항상 동작합니다.
export const tripService: TripService = new ApiTripService();

export { MockTripService, ApiTripService };
