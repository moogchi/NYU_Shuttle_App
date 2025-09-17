import React, { useState } from 'react';
import { ArrowLeft, Clock, MapPin } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import type { Route } from '../App';

interface RouteDetailScreenProps {
  route: Route;
  onBack: () => void;
}

function formatToAmPm(time: string): string {
  const [hourStr, minute] = time.split(":");
  let hour = parseInt(hourStr, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  hour = hour % 12;
  if (hour === 0) hour = 12; // midnight/noon handling
  return `${hour}:${minute} ${ampm}`;
}

export function RouteDetailScreen({ route, onBack }: RouteDetailScreenProps) {
  const [selectedStop, setSelectedStop] = useState(route.stops[0]);

  // Map JS getDay() numbers to day strings
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayKeyMap: Record<string, keyof Route['schedules']> = {
    Mon: 'Mon-Thu',
    Tue: 'Mon-Thu',
    Wed: 'Mon-Thu',
    Thu: 'Mon-Thu',
    Fri: 'Fri',
    Sat: 'Weekend',
    Sun: 'Weekend',
  };
  //Testing
  const debugDay: string | null = null; // e.g. "Mon", "Tue", "Fri", "Sun"


  const todayKey = dayKeyMap[debugDay ?? dayNames[new Date().getDay()]];

  // ✅ Correctly find the schedule for the selected stop
  const scheduleForStop =
    route.schedules[todayKey]?.find((s) => s.stop === selectedStop)?.times || [];

  return (
    <div className="flex flex-col h-screen bg-gray-50 pt-10">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 pt-safe flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="p-2 hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="font-semibold text-gray-900">{route.name}</h1>
          <div className="flex flex-wrap gap-1 mt-1">
            {route.availableDays.map((day) => (
              <span
                key={day}
                className="inline-block px-2 py-0.5 bg-purple-100 text-purple-800 text-xs rounded"
              >
                {day}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Stop Selector */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-5 h-5 text-purple-600" />
              <h2 className="font-semibold text-gray-900">Select Stop</h2>
            </div>
            <Select value={selectedStop} onValueChange={setSelectedStop}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a stop" />
              </SelectTrigger>
              <SelectContent>
                {route.stops.map((stop) => (
                  <SelectItem key={stop} value={stop}>
                    {stop}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Schedule */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-purple-600" />
              <h2 className="font-semibold text-gray-900">Schedule for {selectedStop}</h2>
            </div>

            {scheduleForStop.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {scheduleForStop.map((time) => (
                  <div
                    key={time}
                    className="p-3 bg-gray-100 rounded text-center text-sm font-medium"
                  >
                    {formatToAmPm(time)}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">
                No scheduled stops at this location today
              </p>
            )}
          </CardContent>
        </Card>

        {/* Route Overview */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-gray-900 mb-3">All Stops on {route.name}</h3>
            <div className="space-y-2">
              {route.stops.map((stop) => (
                <div
                  key={stop}
                  className={`flex items-center gap-3 p-2 rounded transition-colors ${
                    stop === selectedStop
                      ? 'bg-purple-100 border border-purple-200'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedStop(stop)}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${
                      stop === selectedStop ? 'bg-purple-600' : 'bg-gray-400'
                    }`}
                  />
                  <span
                    className={`text-sm ${
                      stop === selectedStop ? 'font-medium text-purple-900' : 'text-gray-700'
                    }`}
                  >
                    {stop}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
