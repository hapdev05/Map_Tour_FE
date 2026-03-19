import { NextRequest } from "next/server";

const GOOGLE_MAPS_KEY = process.env.GOOGLE_MAPS_KEY;

interface RoutesResponse {
  routes?: {
    distanceMeters: number;
    duration: string;
    polyline: { encodedPolyline: string };
    legs: {
      distanceMeters: number;
      duration: string;
      localizedValues?: {
        distance: { text: string };
        duration: { text: string };
      };
    }[];
  }[];
  error?: { message: string };
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const origin = searchParams.get("origin");
  const destination = searchParams.get("destination");

  if (!origin || !destination) {
    return Response.json(
      { error: "Thiếu tham số origin hoặc destination" },
      { status: 400 }
    );
  }

  if (!GOOGLE_MAPS_KEY) {
    return Response.json(
      { error: "Chưa cấu hình GOOGLE_MAPS_KEY" },
      { status: 500 }
    );
  }

  const [originLat, originLng] = origin.split(",").map(Number);
  const [destLat, destLng] = destination.split(",").map(Number);

  const body = {
    origin: {
      location: {
        latLng: { latitude: originLat, longitude: originLng },
      },
    },
    destination: {
      location: {
        latLng: { latitude: destLat, longitude: destLng },
      },
    },
    travelMode: "DRIVE",
    routingPreference: "TRAFFIC_AWARE",
    languageCode: "vi",
    units: "METRIC",
  };

  const res = await fetch(
    "https://routes.googleapis.com/directions/v2:computeRoutes",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_MAPS_KEY,
        "X-Goog-FieldMask":
          "routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.legs.localizedValues",
      },
      body: JSON.stringify(body),
    }
  );

  const data: RoutesResponse = await res.json();

  if (!data.routes?.length) {
    return Response.json(
      { error: data.error?.message || "Không tìm thấy tuyến đường" },
      { status: 404 }
    );
  }

  const route = data.routes[0];
  const leg = route.legs?.[0];

  return Response.json({
    polyline: route.polyline.encodedPolyline,
    distance: leg?.localizedValues?.distance?.text ?? `${(route.distanceMeters / 1000).toFixed(1)} km`,
    duration: leg?.localizedValues?.duration?.text ?? formatDuration(route.duration),
  });
}

function formatDuration(dur: string): string {
  const seconds = parseInt(dur.replace("s", ""), 10);
  const mins = Math.round(seconds / 60);
  if (mins >= 60) {
    return `${Math.floor(mins / 60)} giờ ${mins % 60} phút`;
  }
  return `${mins} phút`;
}
