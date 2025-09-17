import { ArrowLeft, Clock, Bus, Star } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import type { Route } from "../App";

interface StopETAScreenProps {
  stopName: string;
  routes: Route[];
  onBack: () => void;
  onRouteSelect: (route: Route) => void;
  debugTime?: string; // Optional debug time, e.g. '14:30' or '8:00 AM'
}

// Convert time string to minutes since midnight (supports 'h:mm AM/PM' and 'HH:mm')
const timeToMinutes = (time: string) => {
  if (!time) return null;
  // Try 12-hour format
  const parts = time.trim().split(" ");
  if (parts.length === 2) {
    const [rawTime, ampm] = parts;
    const [hours, minutes] = rawTime.split(":").map(Number);
    if (hours === undefined || minutes === undefined)
      return null;
    let hrs = hours % 12;
    if (ampm.toUpperCase() === "PM") hrs += 12;
    return hrs * 60 + minutes;
  }
  // Try 24-hour format
  if (parts.length === 1 && time.includes(":")) {
    const [hours, minutes] = time.split(":").map(Number);
    if (hours === undefined || minutes === undefined)
      return null;
    return hours * 60 + minutes;
  }
  return null;
};

// Generate ETA for a route at a stop using real schedule data
const generateETAForRoute = (
  route: Route,
  stopName: string,
  nowMinutes: number,
): string[] => {
  // Choose schedule based on the day
  // Use the same day as the debug time if set, else today
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 1=Mon...
  let scheduleObjs: any[] = [];
  if (day >= 1 && day <= 4)
    scheduleObjs = route.schedules["Mon-Thu"] || [];
  else if (day === 5)
    scheduleObjs = route.schedules["Fri"] || [];
  else scheduleObjs = route.schedules["Weekend"] || [];

  // Flatten if scheduleObjs is [{ stops: [...] }]
  if (
    scheduleObjs.length === 1 &&
    typeof scheduleObjs[0] === "object" &&
    Array.isArray((scheduleObjs[0] as any).stops)
  ) {
    scheduleObjs = (scheduleObjs[0] as any).stops;
  }

  // Find the schedule for this stop
  const stopSchedule = scheduleObjs.find(
    (s: any) => s.stop?.trim() === stopName?.trim(),
  );
  let times: string[] = [];
  if (stopSchedule && Array.isArray(stopSchedule.times)) {
    times = stopSchedule.times;
  }

  // Convert schedule to minutes since midnight and filter future buses
  const upcoming = times
    .map(timeToMinutes)
    .filter(
      (minutes): minutes is number =>
        minutes !== null && minutes >= nowMinutes,
    )
    .map((minutes) => `${minutes - nowMinutes} min`);

  return upcoming.length > 0 ? upcoming : ["No more buses"];
};

export function StopETAScreen({
  stopName,
  routes,
  onBack,
  onRouteSelect,
  debugTime,
}: StopETAScreenProps) {
  // Compute nowMinutes from debugTime if provided, else use current time
  let nowMinutes: number;
  let displayTime: string;
  if (debugTime) {
    const mins = timeToMinutes(debugTime);
    nowMinutes =
      typeof mins === "number"
        ? mins
        : new Date().getHours() * 60 + new Date().getMinutes();
    displayTime = debugTime;
  } else {
    const now = new Date();
    nowMinutes = now.getHours() * 60 + now.getMinutes();
    displayTime = now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  // eslint-disable-next-line no-console
  console.log(
    "[StopETAScreen] Using time for ETA:",
    displayTime,
    "(",
    nowMinutes,
    "minutes since midnight )",
  );
  return (
    <div className="flex flex-col h-screen bg-gray-50 pt-10">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 pt-safe">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="p-2 hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-gray-900 truncate">
              {stopName}
            </h1>
            <p className="text-sm text-gray-600">
              Real-time arrivals
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="p-2 hover:bg-gray-100"
          >
            <Star className="w-5 h-5 text-gray-400" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">
          <div className="mb-2 text-xs text-gray-400">
            Current time for ETA: {displayTime} ({nowMinutes}{" "}
            min since midnight)
          </div>

          {routes.map((route) => {
            const etas = generateETAForRoute(
              route,
              stopName,
              nowMinutes,
            );
            const nextETA = etas[0];
            return (
              <Card
                key={route.id}
                className="cursor-pointer transition-all duration-200 hover:shadow-md active:scale-[0.98] border-gray-200 bg-white"
                onClick={() => onRouteSelect(route)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                        <Bus className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {route.name}
                        </h3>
                        <div className="flex flex-wrap gap-1">
                          {route.availableDays.map(
                            (day, index) => (
                              <span
                                key={index}
                                className="inline-block px-1.5 py-0.5 bg-gray-100 text-gray-700 text-xs rounded"
                              >
                                {day}
                              </span>
                            ),
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-purple-600">
                        {nextETA}
                      </div>
                      <div className="text-xs text-gray-500">
                        Next bus
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>
                      Upcoming:{" "}
                      {etas.length > 1
                        ? etas.slice(1).join(", ")
                        : "No more buses"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {routes.length === 0 && (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-gray-500">
                  No routes currently serving this stop
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}