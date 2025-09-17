import React from "react";
import { X, Star, Clock, MapPin } from "lucide-react";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "./ui/card";
import type { Stop, Route } from "../App";

interface StopDetailScreenProps {
  stop: Stop & { routes?: Route[] };
  onBack: () => void;
  onToggleFavorite: (stopId: string) => void;
}

// Convert 12-hour format to minutes since midnight
const timeToMinutes = (time: string) => {
  if (!time) return null;
  const [rawTime, ampm] = time.split(" ");
  if (!rawTime || !ampm) return null;
  const [hours, minutes] = rawTime.split(":").map(Number);
  if (hours === undefined || minutes === undefined) return null;
  let hrs = hours % 12;
  if (ampm.toUpperCase() === "PM") hrs += 12;
  return hrs * 60 + minutes;
};

export function StopDetailScreen({
  stop,
  onBack,
  onToggleFavorite,
}: StopDetailScreenProps) {
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  // Compute ETAs from all routes for this stop
  let etas: number[] = [];
  if (stop.routes && stop.routes.length > 0) {
    stop.routes.forEach((route) => {
      const day = now.getDay();
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
        (s: any) => s.stop?.trim() === stop.name?.trim(),
      );
      if (stopSchedule && Array.isArray(stopSchedule.times)) {
        stopSchedule.times.forEach((time: string) => {
          const mins = timeToMinutes(time);
          if (mins !== null && mins >= nowMinutes)
            etas.push(mins - nowMinutes);
        });
      }
    });
  }

  etas = etas.sort((a, b) => a - b);
  const nextArrival =
    etas.length > 0 ? `${etas[0]} min` : "No more buses";
  const upcomingArrivals = etas
    .slice(1, 4)
    .map((mins) => `${mins} min`);

  return (
    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-end z-50 pt-10">
      <Card className="w-full mx-4 mb-4 mb-safe bg-white rounded-t-2xl animate-in slide-in-from-bottom-full duration-300">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-purple-600" />
              {stop.name}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggleFavorite(stop.id)}
                className="p-2"
              >
                <Star
                  className={`w-5 h-5 ${
                    stop.isFavorite
                      ? "text-yellow-500 fill-yellow-500"
                      : "text-gray-400"
                  }`}
                />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="p-2"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Next arrival info */}
          <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
            <div className="bg-purple-600 rounded-full p-2">
              <Clock className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="font-semibold text-gray-900">
                Next bus arrives in
              </div>
              <div className="text-lg font-bold text-purple-600">
                {nextArrival}
              </div>
            </div>
          </div>

          {/* Additional arrival times */}
          <div>
            <h4 className="font-medium text-gray-900 mb-2">
              Upcoming arrivals
            </h4>
            <div className="space-y-2">
              {upcomingArrivals.length > 0 ? (
                upcomingArrivals.map((time, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center p-2 bg-gray-50 rounded"
                  >
                    <span className="text-gray-600">
                      Bus #{index + 2}
                    </span>
                    <span className="font-medium">{time}</span>
                  </div>
                ))
              ) : (
                <div className="text-gray-400">
                  No more buses
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button variant="outline" className="w-full">
              Set Alert
            </Button>
            <Button
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              onClick={onBack}
            >
              View Map
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}