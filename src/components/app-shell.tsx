"use client";

import { LandingPage } from "@/components/landing-page";
import { TripDashboard } from "@/components/trip-dashboard";
import { useTripDemo } from "@/hooks/use-trip-demo";

export function AppShell() {
  const {
    trip,
    error,
    isStarting,
    isSimulating,
    resolveCurrentLocation,
    startTrip,
    simulateTrafficEvent,
    savePreferences,
    resetTrip,
  } = useTripDemo();

  if (!trip) {
    return (
      <LandingPage
        isLoading={isStarting}
        error={error}
        onStart={startTrip}
        onResolveLocation={resolveCurrentLocation}
      />
    );
  }

  return (
    <TripDashboard
      trip={trip}
      error={error}
      isSimulating={isSimulating}
      onSimulateTraffic={simulateTrafficEvent}
      onSavePreferences={savePreferences}
      onBack={resetTrip}
    />
  );
}
