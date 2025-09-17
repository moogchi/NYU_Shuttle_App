import React from "react";
import { Card, CardContent } from "./ui/card";
import { Bus, MapPin, Clock } from "lucide-react";
import type { Route } from "../types";

// --- TYPE DEFINITIONS ---
interface NearbyStopsScreenProps {
  routes: Route[];
  onStopSelect: (stopName: string, routes: Route[]) => void;
  onRouteSelect: (route: Route) => void;
  userLocation: { lat: number; lng: number } | null;
}

export interface StopWithRoutes {
  id: string;
  name: string;
  routes: Route[];
  nextArrival: string;
  location: { lat: number; lng: number };
  distance: number | null;
  isFavorite?: boolean;
}

// --- HOOKS & HELPERS (defined outside the component) ---

/**
 * Custom hook to load stop locations from a JSON file.
 */
const useStopLocations = () => {
  const [locations, setLocations] = React.useState<
    Record<string, { lat: number; lng: number }>
  >({});

  React.useEffect(() => {
    fetch("/location.json")
      .then((res) => res.json())
      .then((data) => setLocations(data.stops || {}))
      .catch((err) => {
        console.error("Failed to load stop locations:", err);
        setLocations({});
      });
  }, []);

  return locations;
};

/**
 * Converts a time string (e.g., '5:30 PM' or '17:30') to minutes since midnight.
 */
const timeToMinutes = (time?: string): number | null => {
  if (!time) return null;
  const t = time.trim().toUpperCase();

  const match12hr = t.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/);
  if (match12hr) {
    let [_, hours, minutes, ampm] = match12hr;
    let h = parseInt(hours, 10);
    if (h === 12) h = 0; // Convert 12 AM/PM to 0 for easier calculation
    if (ampm === "PM") h += 12;
    return h * 60 + parseInt(minutes, 10);
  }

  const match24hr = t.match(/(\d{1,2}):(\d{2})/);
  if (match24hr) {
    const [_, hours, minutes] = match24hr;
    return parseInt(hours, 10) * 60 + parseInt(minutes, 10);
  }

  return null;
};

/**
 * Gets the correct schedule array for a given route based on the current day.
 */
const getTodaysSchedule = (route: Route, date: Date) => {
  const day = date.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  if (day >= 1 && day <= 4) return route.schedules["Mon-Thu"] || [];
  if (day === 5) return route.schedules["Fri"] || [];
  return route.schedules["Weekend"] || [];
};

/**
 * Calculates the next arrival time in minutes from now for a specific stop.
 */
const getNextArrivalMinutes = (stopName: string, routes: Route[]): number | null => {
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  let nextMinutes: number | null = null;

  for (const route of routes) {
    const stopSchedules = getTodaysSchedule(route, now);
    const stopSchedule = stopSchedules.find(
      (s) => s.stop?.trim().toLowerCase() === stopName.trim().toLowerCase()
    );

    if (stopSchedule?.times) {
      for (const timeStr of stopSchedule.times) {
        const arrivalMins = timeToMinutes(timeStr);
        if (
          arrivalMins !== null &&
          arrivalMins >= nowMinutes &&
          (nextMinutes === null || arrivalMins < nextMinutes)
        ) {
          nextMinutes = arrivalMins;
        }
      }
    }
  }

  return nextMinutes !== null ? nextMinutes - nowMinutes : null;
};

/**
 * Calculates the distance between two GPS coordinates using the Haversine formula.
 */
function getDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 6371000; // Earth's radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}


// --- COMPONENT ---

export function NearbyStopsScreen({
  routes,
  onStopSelect,
  onRouteSelect,
  userLocation,
}: NearbyStopsScreenProps) {
  const STOP_LOCATIONS = useStopLocations();

  const stopsWithRoutes = React.useMemo(() => {
    // 1. Group all routes by their stop names.
    const stopToRoutes = routes.reduce((acc, route) => {
      route.stops.forEach((stopName) => {
        if (!stopName) return;
        if (!acc[stopName]) acc[stopName] = [];
        acc[stopName].push(route);
      });
      return acc;
    }, {} as Record<string, Route[]>);

    // 2. Map the grouped stops into a structured array with calculated data.
    let stopsArr: StopWithRoutes[] = Object.entries(stopToRoutes).map(
      ([stopName, routeList]) => {
        const nextMins = getNextArrivalMinutes(stopName, routeList);
        const location = STOP_LOCATIONS[stopName] || { lat: 0, lng: 0 };
        const distance = userLocation
          ? getDistance(userLocation.lat, userLocation.lng, location.lat, location.lng)
          : null;

        return {
          id: stopName,
          name: stopName,
          routes: routeList,
          nextArrival: nextMins !== null ? `${nextMins} min` : "No more buses",
          location,
          distance,
          isFavorite: false,
        };
      }
    );

    // 3. Sort the array with multiple priority levels.
    stopsArr.sort((a, b) => {
      // Priority 1: Stops with upcoming buses come first.
      const aHasBuses = a.nextArrival !== "No more buses";
      const bHasBuses = b.nextArrival !== "No more buses";
      if (aHasBuses && !bHasBuses) return -1;
      if (!aHasBuses && bHasBuses) return 1;

      // Priority 2: Sort by distance if available.
      if (a.distance !== null && b.distance !== null) {
        return a.distance - b.distance;
      }

      // Priority 3: Fallback to alphabetical sorting by name.
      return a.name.localeCompare(b.name);
    });

    return stopsArr;
  }, [routes, userLocation, STOP_LOCATIONS]);

  return (
    <div className="p-4 pb-safe">
      <div className="space-y-3 overflow-y-auto" style={{ maxHeight: "70vh" }}>
        {stopsWithRoutes.map((stopInfo) => (
          <Card
            key={stopInfo.id}
            className="cursor-pointer transition-all duration-200 hover:shadow-md active:scale-[0.98] border-gray-200 bg-white"
            onClick={() => onStopSelect(stopInfo.name, stopInfo.routes)}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-purple-600" />
                <div className="min-w-0 flex-1">
                  <h3 className="mb-1 flex items-center gap-2 font-medium text-gray-900">
                    <MapPin className="h-4 w-4 text-purple-600" /> {stopInfo.name}
                  </h3>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                      {stopInfo.routes.length} route{stopInfo.routes.length !== 1 ? "s" : ""}
                    </p>
                    <div className="flex items-center gap-1 text-sm font-bold text-purple-600">
                      <Clock className="h-4 w-4" /> {stopInfo.nextArrival}
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {stopInfo.routes.map((route) => (
                      <button
                        key={route.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onStopSelect(stopInfo.name, stopInfo.routes);
                          onRouteSelect(route);
                        }}
                        className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-1 text-xs text-purple-800 transition-colors hover:bg-purple-200"
                      >
                        <Bus className="h-3 w-3" /> {route.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}