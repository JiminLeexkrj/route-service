"use client";

import { useCallback, useState } from "react";
import { tripService } from "@/services/trip-service";
import type {
  CurrentLocation,
  StartTripRequest,
  TripSnapshot,
  UserPreferences,
} from "@/types/trip";

export function useTripDemo() {
  const [trip, setTrip] = useState<TripSnapshot | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resolveCurrentLocation = useCallback(async (): Promise<CurrentLocation> => {
    setError(null);
    try {
      return await tripService.getCurrentLocation();
    } catch {
      const message = "현재 위치를 확인하지 못했습니다.";
      setError(message);
      throw new Error(message);
    }
  }, []);

  const startTrip = useCallback(async (request: StartTripRequest) => {
    setIsStarting(true);
    setError(null);
    try {
      const snapshot = await tripService.startTrip(request);
      setTrip(snapshot);
    } catch {
      setError("길찾기를 시작하지 못했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setIsStarting(false);
    }
  }, []);

  const simulateTrafficEvent = useCallback(async () => {
    if (!trip) return;
    setIsSimulating(true);
    setError(null);
    try {
      const snapshot = await tripService.simulateTrafficEvent(trip.tripId);
      setTrip(snapshot);
    } catch {
      setError("교통정보를 업데이트하지 못했습니다.");
    } finally {
      setIsSimulating(false);
    }
  }, [trip]);

  const savePreferences = useCallback(
    async (preferences: UserPreferences) => {
      if (!trip) return;
      await tripService.savePreferences(trip.tripId, preferences);
    },
    [trip],
  );

  const resetTrip = useCallback(() => {
    setTrip(null);
    setError(null);
  }, []);

  return {
    trip,
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
