import type { Coordinate, TravelMode } from "@/lib/routes/types";

export type RiskLevel = "SAFE" | "CAUTION" | "DANGER" | "LATE";

export type RouteOption = {
  id: string;
  title: string;
  description: string;
  arrivalTime: string;
  durationMinutes: number;
  onTimeProbability: number;
  extraCost: number;
  recommended: boolean;
  mode?: TravelMode;
  polyline?: Coordinate[];
};

export type TripStatus = {
  currentTime: string;
  deadline: string;
  expectedArrival: string;
  onTimeProbability: number;
  riskLevel: RiskLevel;
  recommendedAction: string;
};

export type UserPreferences = {
  maxExtraCost: number;
  walkingDistanceMeters: number;
  canRun: boolean;
  allowTaxi: boolean;
};

export type CurrentLocation = {
  latitude: number;
  longitude: number;
  label: string;
};

export type StartTripRequest = {
  destination: string;
  deadline: string;
  useCurrentLocation: boolean;
  preferences: UserPreferences;
};

export type TrafficAlert = {
  id: string;
  title: string;
  detail: string;
  suggestion: string;
  previousArrival: string;
  newArrival: string;
  occurredAt: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
};

export type TripSnapshot = {
  tripId: string;
  originLabel: string;
  destination: string;
  status: TripStatus;
  routes: RouteOption[];
  alert: TrafficAlert | null;
  updatedAt: string;
  origin?: Coordinate;
  destinationCoordinate?: Coordinate;
};

export const DEFAULT_PREFERENCES: UserPreferences = {
  maxExtraCost: 10000,
  walkingDistanceMeters: 800,
  canRun: false,
  allowTaxi: true,
};

