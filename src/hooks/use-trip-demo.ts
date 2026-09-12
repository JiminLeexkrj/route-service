"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { watchCurrentPosition } from "@/lib/location/geolocation";
import { haversineDistanceMeters } from "@/lib/routes/geometry";
import type { Coordinate } from "@/lib/routes/types";
import { tripService } from "@/services/trip-service";
import type {
  CurrentLocation,
  StartTripRequest,
  TripSnapshot,
  UserPreferences,
} from "@/types/trip";

// Tmap 대중교통 API가 유료/일일 호출 제한이라, GPS가 자주 바뀌어도
// 이 조건을 모두 만족할 때만 서버에 재평가(/api/evaluate)를 요청한다.
const MIN_REFETCH_INTERVAL_MS = 3 * 60 * 1000; // 최소 3분 간격
const MIN_MOVEMENT_METERS = 150; // 최소 150m 이동

export function useTripDemo() {
  const [trip, setTrip] = useState<TripSnapshot | null>(null);
  const [livePosition, setLivePosition] = useState<Coordinate | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tripIdRef = useRef<string | null>(null);
  const lastEvaluatedPositionRef = useRef<Coordinate | null>(null);
  const lastEvaluatedAtRef = useRef(0);
  const isRefreshingRef = useRef(false);

  const resolveCurrentLocation = useCallback(async (): Promise<CurrentLocation> => {
    setError(null);
    try {
      return await tripService.getCurrentLocation();
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : "현재 위치를 확인하지 못했습니다.";
      setError(message);
      throw new Error(message);
    }
  }, []);

  const startTrip = useCallback(async (request: StartTripRequest) => {
    setIsStarting(true);
    setError(null);
    try {
      const snapshot = await tripService.startTrip(request);
      tripIdRef.current = snapshot.tripId;
      lastEvaluatedPositionRef.current = snapshot.origin ?? null;
      lastEvaluatedAtRef.current = Date.now();
      setLivePosition(snapshot.origin ?? null);
      setTrip(snapshot);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "길찾기를 시작하지 못했습니다. 잠시 후 다시 시도해 주세요.",
      );
    } finally {
      setIsStarting(false);
    }
  }, []);

  // 위치가 MIN_MOVEMENT_METERS 이상 바뀌고 MIN_REFETCH_INTERVAL_MS가 지났을 때만
  // 실제 서버 재평가(Tmap/Kakao 호출 포함)를 수행한다.
  const maybeRefreshFromPosition = useCallback(async (position: Coordinate) => {
    const tripId = tripIdRef.current;
    if (!tripId || isRefreshingRef.current) return;

    const lastPosition = lastEvaluatedPositionRef.current;
    const movedEnough =
      !lastPosition ||
      haversineDistanceMeters(lastPosition, position) >= MIN_MOVEMENT_METERS;
    const enoughTimePassed =
      Date.now() - lastEvaluatedAtRef.current >= MIN_REFETCH_INTERVAL_MS;

    if (!movedEnough || !enoughTimePassed) return;

    isRefreshingRef.current = true;
    try {
      const snapshot = await tripService.getTripSnapshot(tripId, position);
      lastEvaluatedPositionRef.current = snapshot.origin ?? position;
      lastEvaluatedAtRef.current = Date.now();
      setTrip(snapshot);
    } catch {
      // 실시간 갱신 실패는 조용히 무시한다 — 다음 위치 변화 때 재시도된다.
    } finally {
      isRefreshingRef.current = false;
    }
  }, []);

  // 길찾기가 시작되면 GPS를 계속 관찰한다. 지도의 "현재 위치" 마커는
  // 이 좌표로 매번 즉시 움직이고, 서버 재평가는 위 스로틀 조건을 통과할 때만 나간다.
  useEffect(() => {
    if (!trip) return;

    const stopWatching = watchCurrentPosition(
      (position) => {
        setLivePosition(position);
        void maybeRefreshFromPosition(position);
      },
      () => {
        // 위치 추적 실패는 무시한다 — 마지막으로 알려진 위치를 계속 사용한다.
      },
    );

    return stopWatching;
  }, [trip?.tripId, maybeRefreshFromPosition]);

  const simulateTrafficEvent = useCallback(async () => {
    if (!trip) return;
    setIsSimulating(true);
    setError(null);
    try {
      const snapshot = await tripService.simulateTrafficEvent(trip.tripId);
      // 수동 시연 직후에는 자동 재평가가 곧바로 다시 나가지 않도록 기준을 갱신한다.
      lastEvaluatedPositionRef.current = snapshot.origin ?? lastEvaluatedPositionRef.current;
      lastEvaluatedAtRef.current = Date.now();
      setTrip(snapshot);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "교통정보를 업데이트하지 못했습니다.",
      );
    } finally {
      setIsSimulating(false);
    }
  }, [trip]);

  const savePreferences = useCallback(
    async (preferences: UserPreferences) => {
      if (!trip) return;
      try {
        const snapshot = await tripService.savePreferences(trip.tripId, preferences);
        setTrip(snapshot);
      } catch (cause) {
        setError(
          cause instanceof Error ? cause.message : "이동 조건을 반영하지 못했습니다.",
        );
      }
    },
    [trip],
  );

  const resetTrip = useCallback(() => {
    tripIdRef.current = null;
    lastEvaluatedPositionRef.current = null;
    lastEvaluatedAtRef.current = 0;
    setLivePosition(null);
    setTrip(null);
    setError(null);
  }, []);

  return {
    trip,
    livePosition,
    error,
    isStarting,
    isSimulating,
    resolveCurrentLocation,
    startTrip,
    simulateTrafficEvent,
    savePreferences,
    resetTrip,
  };
}
