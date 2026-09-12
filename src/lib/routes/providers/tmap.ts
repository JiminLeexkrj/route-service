import { downsampleCoordinates } from "@/lib/routes/geometry";
import { addMinutesToArrivalTime } from "@/lib/routes/time";
import type {
  Coordinate,
  RawRoute,
  RouteSegment,
  SegmentMode,
  TravelMode,
} from "@/lib/routes/types";

type TmapStation = {
  name?: string;
  lon?: number | string;
  lat?: number | string;
};

type TmapStep = {
  linestring?: string;
  distance?: number;
};

type TmapLeg = {
  mode?: string;
  sectionTime?: number;
  distance?: number;
  route?: string;
  start?: TmapStation;
  end?: TmapStation;
  passShape?: { linestring?: string };
  steps?: TmapStep[];
};

type TmapItinerary = {
  totalTime?: number;
  totalDistance?: number;
  fare?: { regular?: { totalFare?: number } };
  legs?: TmapLeg[];
};

type TmapError = {
  id?: string;
  category?: string;
  code?: string;
  message?: string;
};

type TmapResponse = {
  metaData?: { plan?: { itineraries?: TmapItinerary[] } };
  error?: TmapError;
};

// Tmap 응답의 mode는 WALK/BUS/SUBWAY 외에 TRAIN/EXPRESSBUS/AIRPLANE/FERRY도 포함한다.
// 우리 팀 공용 SegmentMode(WALK|BUS|SUBWAY|CAR)에는 없는 값이라 가장 가까운 범주로 합친다.
function toSegmentMode(mode?: string): SegmentMode {
  if (mode === "SUBWAY" || mode === "TRAIN") return "SUBWAY";
  if (mode === "WALK") return "WALK";
  return "BUS";
}

function overallMode(legs: TmapLeg[]): TravelMode {
  const nonWalkModes = new Set(
    legs
      .map((leg) => toSegmentMode(leg.mode))
      .filter((mode): mode is SegmentMode => mode !== "WALK"),
  );

  if (nonWalkModes.size === 0) return "WALK";
  if (nonWalkModes.size === 1) return [...nonWalkModes][0];
  return "MIXED";
}

function asCoordinate(lonValue: unknown, latValue: unknown): Coordinate | null {
  const lng = Number(lonValue);
  const lat = Number(latValue);
  return Number.isFinite(lng) && Number.isFinite(lat) ? { lat, lng } : null;
}

// Tmap linestring은 "경도,위도 경도,위도 ..." 형식의 공백 구분 문자열이다.
function parseLinestring(linestring?: string): Coordinate[] {
  if (!linestring) return [];
  return linestring
    .trim()
    .split(/\s+/)
    .map((pair) => {
      const [lon, lat] = pair.split(",");
      return asCoordinate(lon, lat);
    })
    .filter((point): point is Coordinate => point !== null);
}

function legPoints(leg: TmapLeg): Coordinate[] {
  const fromShape = parseLinestring(leg.passShape?.linestring);
  if (fromShape.length > 1) return fromShape;

  const fromSteps = (leg.steps ?? []).flatMap((step) =>
    parseLinestring(step.linestring),
  );
  if (fromSteps.length > 1) return fromSteps;

  const start = asCoordinate(leg.start?.lon, leg.start?.lat);
  const end = asCoordinate(leg.end?.lon, leg.end?.lat);
  return [start, end].filter((point): point is Coordinate => point !== null);
}

function buildPolyline(itinerary: TmapItinerary): Coordinate[] {
  const points = (itinerary.legs ?? []).flatMap((leg) => legPoints(leg));
  return downsampleCoordinates(points);
}

function buildSegments(legs: TmapLeg[]): RouteSegment[] {
  return legs.map((leg, index) => {
    const mode = toSegmentMode(leg.mode);
    const previous = legs[index - 1];
    const next = legs[index + 1];
    const from =
      leg.start?.name ||
      previous?.end?.name ||
      (index === 0 ? "현재 위치" : "이전 구간");
    const to =
      leg.end?.name ||
      next?.start?.name ||
      (index === legs.length - 1 ? "목적지" : "다음 구간");

    return {
      mode,
      from,
      to,
      durationMinutes: Math.max(0, Math.round((leg.sectionTime ?? 0) / 60)),
      ...(Number.isFinite(leg.distance)
        ? { distanceMeters: Math.round(leg.distance ?? 0) }
        : {}),
      ...(mode !== "WALK" && leg.route ? { routeName: leg.route } : {}),
    };
  });
}

export async function getTmapTransitRoutes(
  origin: Coordinate,
  destination: Coordinate,
): Promise<RawRoute[]> {
  const apiKey = process.env.TMAP_API_KEY;
  if (!apiKey) {
    throw new Error("TMAP_API_KEY가 설정되지 않았습니다.");
  }

  const response = await fetch("https://apis.openapi.sk.com/transit/routes", {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      appKey: apiKey,
    },
    body: JSON.stringify({
      startX: String(origin.lng),
      startY: String(origin.lat),
      endX: String(destination.lng),
      endY: String(destination.lat),
      count: 4,
      lang: 0,
      format: "json",
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(8_000),
  });

  const data = (await response.json().catch(() => null)) as TmapResponse | null;

  if (!response.ok || data?.error) {
    const error = data?.error;
    throw new Error(
      `Tmap API 오류 (${error?.code ?? response.status}): ${error?.message ?? "응답 오류"}`,
    );
  }

  const fetchedAt = new Date().toISOString();
  return (data?.metaData?.plan?.itineraries ?? [])
    .filter(
      (itinerary) =>
        Number.isFinite(itinerary.totalTime) &&
        Number.isFinite(itinerary.totalDistance),
    )
    .slice(0, 4)
    .map((itinerary, index): RawRoute => {
      const legs = itinerary.legs ?? [];
      const durationMinutes = Math.max(
        1,
        Math.round((itinerary.totalTime ?? 0) / 60),
      );
      const distanceMeters = Math.max(0, Math.round(itinerary.totalDistance ?? 0));
      const fare = itinerary.fare?.regular?.totalFare;
      const polyline = buildPolyline(itinerary);

      return {
        id: `tmap-transit-${index + 1}`,
        mode: overallMode(legs),
        durationMinutes,
        distanceMeters,
        estimatedArrivalTime: addMinutesToArrivalTime(durationMinutes),
        ...(Number.isFinite(fare) ? { fare } : {}),
        segments: buildSegments(legs),
        ...(polyline.length > 1 ? { polyline } : {}),
        provider: "TMAP",
        isRealtime: false,
        fetchedAt,
      };
    });
}
