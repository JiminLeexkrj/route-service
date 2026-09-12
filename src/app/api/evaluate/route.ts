import { NextRequest, NextResponse } from "next/server";

import { evaluateTrip } from "@/lib/algorithm/evaluateTrip";
import type { SwitchHistory } from "@/lib/algorithm/types";
import { getRouteCandidates } from "@/lib/routes/service";
import type { Coordinate, RouteDataMode } from "@/lib/routes/types";
import type { UserPreferences } from "@/types/trip";

export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
};

type EvaluateRequestBody = {
  origin: Coordinate;
  destination: Coordinate;
  deadline: number;
  preferences: UserPreferences;
  mode?: RouteDataMode;
  demoElapsedSeconds?: number;
  history?: SwitchHistory;
};

function isCoordinate(value: unknown): value is Coordinate {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as Coordinate).lat === "number" &&
    typeof (value as Coordinate).lng === "number"
  );
}

function validateBody(body: unknown): EvaluateRequestBody {
  const input = body as Partial<EvaluateRequestBody> | null;
  if (
    !input ||
    !isCoordinate(input.origin) ||
    !isCoordinate(input.destination) ||
    typeof input.deadline !== "number" ||
    !input.preferences
  ) {
    throw new Error("origin, destination, deadline, preferences가 필요합니다.");
  }

  return {
    origin: input.origin,
    destination: input.destination,
    deadline: input.deadline,
    preferences: input.preferences,
    mode: input.mode,
    demoElapsedSeconds: input.demoElapsedSeconds,
    history: input.history,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = validateBody(await request.json());
    const now = Date.now();

    const routesResponse = await getRouteCandidates({
      origin: body.origin,
      destination: body.destination,
      mode: body.mode,
      demoElapsedSeconds: body.demoElapsedSeconds,
    });

    const evaluation = evaluateTrip({
      now,
      deadline: body.deadline,
      rawRoutes: routesResponse.routes,
      preferences: body.preferences,
      dataMode: routesResponse.source === "mock" ? "DEMO" : "LIVE",
      history: body.history ?? { candidateStreak: 0 },
    });

    return NextResponse.json(
      {
        evaluation,
        routeSource: routesResponse.source,
        warnings: routesResponse.warnings,
        demo: routesResponse.demo,
      },
      { headers: NO_STORE_HEADERS },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          code: "EVALUATE_FAILED",
          message:
            error instanceof Error ? error.message : "평가에 실패했습니다.",
        },
      },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }
}
