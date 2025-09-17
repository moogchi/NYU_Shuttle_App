import React, { useState, useEffect } from 'react';
import { Search, Clock, Bus, MapPin, PersonStanding, CheckCircle2, Train, Footprints } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Geolocation } from '@capacitor/geolocation';
import type { Route } from '../types';

// ## 1. Helper Functions
const normalize = (s: string) => s.trim().toLowerCase();

const useLocations = () => {
  const [data, setData] = useState<{ stops: Record<string, { lat: number; lng: number }>; buildings: Record<string, { lat: number; lng: number }> }>({ stops: {}, buildings: {} });

  useEffect(() => {
    fetch('/location.json')
      .then(res => res.json())
      .then(json => setData({ stops: json.stops || {}, buildings: json.buildings || {} }))
      .catch(() => setData({ stops: {}, buildings: {} }));
  }, []);

  return data;
};

const getDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 6371000; // Radius of Earth in meters
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const walkingTimeMeters = (meters: number) => Math.ceil(meters / 78); // Average walking speed 1.3 m/s -> 78 m/min

const getNextBusEta = (stop: string, route: Route): number | null => {
  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const day = now.getDay();

  let stopSchedules: { stop: string; times: string[] }[] = [];
  if (day >= 1 && day <= 4) stopSchedules = route.schedules['Mon-Thu'] || [];
  else if (day === 5) stopSchedules = route.schedules['Fri'] || [];
  else stopSchedules = route.schedules['Weekend'] || [];

  const sched = stopSchedules.find(s => normalize(s.stop) === normalize(stop));
  if (!sched) return null;

  for (const t of sched.times) {
    const [hour, min] = t.split(':').map(Number);
    const busMins = hour * 60 + min;
    if (busMins >= nowMins) return busMins - nowMins;
  }
  return null; // No more buses today
};

const findRoutesBetweenStops = (routes: Route[], from: string, to: string) => {
  const results: Array<{ route: Route; travelTime: string }> = [];
  const normFrom = normalize(from);
  const normTo = normalize(to);

  routes.forEach(route => {
    const fromIndex = route.stops.findIndex(stop => normalize(stop) === normFrom);
    const toIndex = route.stops.findIndex(stop => normalize(stop) === normTo);
    if (fromIndex !== -1 && toIndex > fromIndex) {
      const stopCount = toIndex - fromIndex;
      results.push({ route, travelTime: `${stopCount * 2}-${stopCount * 4} mins` });
    }
  });

  return results;
};

const getClosestOption = (input: string, options: string[]): string => {
  const normInput = normalize(input);
  if (!normInput) return options[0] || '';
  let best = '';
  let bestScore = Infinity;

  for (const opt of options) {
    const normOpt = normalize(opt);
    if (normOpt === normInput) return opt;
    if (normOpt.includes(normInput) || normInput.includes(normOpt)) {
      const score = Math.abs(normOpt.length - normInput.length);
      if (score < bestScore) { best = opt; bestScore = score; }
    }
  }

  return best || options[0] || '';
};

const parseTravelTime = (timeStr: string) => {
  const match = timeStr.match(/(\d+)-(\d+)/);
  return match ? (Number(match[1]) + Number(match[2])) / 2 : 3;
};

// ## 2. Main Component
export function TripPlannerScreen({ routes, onRouteSelect, userLocation }: TripPlannerScreenProps) {
  const [fromStopRaw, setFromStop] = useState('');
  const [toStopRaw, setToStop] = useState('');
  const [tripResults, setTripResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [searching, setSearching] = useState(false);
  const [noBusRouteMessage, setNoBusRouteMessage] = useState<string | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [fromFocused, setFromFocused] = useState(false);
  const [toFocused, setToFocused] = useState(false);

  const LOCATIONS = useLocations();
  const STOP_LOCATIONS = LOCATIONS.stops;
  const BUILDING_LOCATIONS = LOCATIONS.buildings;

  const allStopsAndBuildings = { ...STOP_LOCATIONS, ...BUILDING_LOCATIONS };
  const allOptions = Object.keys(allStopsAndBuildings);

  const getNearestLocation = (lat: number, lng: number) => {
    let nearest: { name: string; type: 'stop' | 'building' } | null = null;
    let minDist = Infinity;
    for (const [name, loc] of Object.entries(allStopsAndBuildings)) {
      const dist = getDistance(lat, lng, loc.lat, loc.lng);
      if (dist < minDist) {
        minDist = dist;
        nearest = { name, type: STOP_LOCATIONS[name] ? 'stop' : 'building' };
      }
    }
    return nearest;
  };

  const handleUseCurrentLocation = async () => {
    setLoadingLocation(true);
    try {
      const permission = await Geolocation.requestPermissions();
      if (permission.location === 'granted') {
        const position = await Geolocation.getCurrentPosition();
        const nearest = getNearestLocation(position.coords.latitude, position.coords.longitude);
        if (nearest) setFromStop(nearest.name);
      } else alert('Location permission denied.');
    } catch (error) { console.error(error); }
    finally { setLoadingLocation(false); }
  };

  const handleSearch = () => {
    setSearching(true);
    setNoBusRouteMessage(null);
    setTripResults([]);

    setTimeout(() => {
      try {
        const fromInput = getClosestOption(fromStopRaw, allOptions);
        const toInput = getClosestOption(toStopRaw, allOptions);
        setFromStop(fromInput);
        setToStop(toInput);

        const fromCoords = allStopsAndBuildings[fromInput];
        const toCoords = allStopsAndBuildings[toInput];
        if (!fromCoords || !toCoords) {
          setNoBusRouteMessage('Could not find one of the locations. Please try again.');
          setShowResults(true);
          setSearching(false);
          return;
        }

        const directWalkTime = walkingTimeMeters(getDistance(fromCoords.lat, fromCoords.lng, toCoords.lat, toCoords.lng));
        if (directWalkTime < 15) {
          setNoBusRouteMessage(`This trip is a short ${directWalkTime}-minute walk. Consider walking or the subway for the fastest route.`);
          setShowResults(true);
          setSearching(false);
          return;
        }

        // Determine boarding stop if user starts at a building
        let boardingStop = fromInput;
        let initialWalkTime = 0;
        if (BUILDING_LOCATIONS[fromInput]) {
          boardingStop = Object.keys(STOP_LOCATIONS).reduce((closest, stopName) => {
            const distToStop = getDistance(fromCoords.lat, fromCoords.lng, STOP_LOCATIONS[stopName].lat, STOP_LOCATIONS[stopName].lng);
            const distToClosest = getDistance(fromCoords.lat, fromCoords.lng, STOP_LOCATIONS[closest].lat, STOP_LOCATIONS[closest].lng);
            return distToStop < distToClosest ? stopName : closest;
          });
          initialWalkTime = walkingTimeMeters(getDistance(fromCoords.lat, fromCoords.lng, STOP_LOCATIONS[boardingStop].lat, STOP_LOCATIONS[boardingStop].lng));
        }

        // Candidate alighting stops
        const candidateStops = Object.keys(STOP_LOCATIONS).filter(stopName => walkingTimeMeters(getDistance(STOP_LOCATIONS[stopName].lat, STOP_LOCATIONS[stopName].lng, toCoords.lat, toCoords.lng)) < 20);

        const allPossibleTrips: any[] = [];
        candidateStops.forEach(alightingStop => {
          findRoutesBetweenStops(routes, boardingStop, alightingStop).forEach(r => {
            const busWaitTime = getNextBusEta(boardingStop, r.route);
            if (busWaitTime === null) return;
            const busTravelTime = parseTravelTime(r.travelTime);
            const finalWalkTime = walkingTimeMeters(getDistance(STOP_LOCATIONS[alightingStop].lat, STOP_LOCATIONS[alightingStop].lng, toCoords.lat, toCoords.lng));
            allPossibleTrips.push({ ...r, origin: fromInput, destination: toInput, boardingStop, alightingStop, initialWalkTime, busWaitTime, busTravelTime, finalWalkTime, totalTime: initialWalkTime + busWaitTime + busTravelTime + finalWalkTime });
          });
        });

        const bestTrips: { [key: string]: any } = {};
        allPossibleTrips.forEach(trip => {
          if (!bestTrips[trip.route.name] || trip.totalTime < bestTrips[trip.route.name].totalTime) bestTrips[trip.route.name] = trip;
        });

        setTripResults(Object.values(bestTrips).sort((a, b) => a.totalTime - b.totalTime));
        setShowResults(true);
      } catch (err) {
        console.error('Search error:', err);
        setTripResults([]);
        setShowResults(true);
      } finally {
        setSearching(false);
      }
    }, 10);
  };

  const getFilteredOptions = (query: string, excludeValue: string) => query ? allOptions.filter(opt => opt.toLowerCase().includes(query.toLowerCase()) && opt !== excludeValue).slice(0, 6) : [];
  const fromSuggestions = getFilteredOptions(fromStopRaw, toStopRaw);
  const toSuggestions = getFilteredOptions(toStopRaw, fromStopRaw);

  return (
    <div className="flex flex-col min-h-screen bg-gray-30 overflow-y-auto p-4">
      <div className="mb-4"><h1 className="text-2xl font-bold">Trip Planner</h1></div>
      <div className="grid grid-cols-1 gap-4">
        {/* Trip Search Card */}
        <Card>
          <CardHeader><CardTitle>Plan Your Trip</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              {/* From Input */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label htmlFor="from-stop" className="font-medium">From</label>
                  <Button variant="ghost" size="sm" onClick={handleUseCurrentLocation} disabled={loadingLocation} className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 p-1 h-auto">
                    <MapPin className="w-4 h-4 mr-1 inline" />{loadingLocation ? 'Finding...' : 'Use this location'}
                  </Button>
                </div>
                <div className="relative">
                  <Input id="from-stop" value={fromStopRaw} onChange={(e) => setFromStop(e.target.value)} placeholder="Enter a building or stop" autoComplete="off" onFocus={() => setFromFocused(true)} onBlur={() => setTimeout(() => setFromFocused(false), 150)} />
                  {fromSuggestions.length > 0 && fromFocused && (
                    <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-y-auto mt-1">
                      {fromSuggestions.map(option => (
                        <button key={option} type="button" onMouseDown={() => { setFromStop(option); setFromFocused(false); }} className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm border-b last:border-b-0">{option}</button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {/* To Input */}
              <div className="flex flex-col gap-1">
                <label htmlFor="to-stop" className="font-medium">To</label>
                <div className="relative">
                  <Input id="to-stop" value={toStopRaw} onChange={(e) => setToStop(e.target.value)} placeholder="Enter a building or stop" autoComplete="off" onFocus={() => setToFocused(true)} onBlur={() => setTimeout(() => setToFocused(false), 150)} />
                  {toSuggestions.length > 0 && toFocused && (
                    <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-y-auto mt-1">
                      {toSuggestions.map(option => (
                        <button key={option} type="button" onMouseDown={() => { setToStop(option); setToFocused(false); }} className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm border-b last:border-b-0">{option}</button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <Button onClick={handleSearch} className="mt-2" disabled={searching || !fromStopRaw || !toStopRaw}>{searching ? 'Searching...' : 'Find Trip'}</Button>
            </div>
          </CardContent>
        </Card>

        {/* Trip Results */}
        {showResults && (
          <div className="md:col-span-1">
            <Card>
              <CardHeader><CardTitle>Trip Results</CardTitle></CardHeader>
              <CardContent className="max-h-[500px] overflow-y-auto">
                {tripResults.length > 0 ? (
                  <div className="flex flex-col gap-4">
                    {tripResults.map((result, index) => {
                      const { initialWalkTime, busWaitTime, boardingStop } = result;
                      let firstStep;

                      // Case 1: There's an initial walk to the bus stop.
                      if (initialWalkTime > 0) {
                        // Time from now until user must leave to arrive ~5 mins before the bus.
                        const timeUntilDeparture = busWaitTime - initialWalkTime - 5;

                        if (timeUntilDeparture <= 1) { // If departure is imminent
                          firstStep = (
                            <div className="flex items-center gap-3">
                              <PersonStanding className="w-5 h-5 text-gray-500 flex-shrink-0" />
                              <div>
                                <strong>Leave now</strong> and walk to <strong>{boardingStop}</strong>
                                <div className="text-xs text-gray-500">(~{initialWalkTime} min walk, bus arrives in ~{busWaitTime} min)</div>
                              </div>
                            </div>
                          );
                        } else { // If there's time to wait before leaving
                          const now = new Date();
                          const leaveByTime = new Date(now.getTime() + timeUntilDeparture * 60000);
                          let hours = leaveByTime.getHours();
                          const minutes = leaveByTime.getMinutes();
                          const ampm = hours >= 12 ? 'PM' : 'AM';
                          hours = hours % 12;
                          hours = hours || 12; // handle midnight
                          const minutesStr = minutes < 10 ? `0${minutes}` : minutes;

                          firstStep = (
                            <div className="flex items-center gap-3">
                              <PersonStanding className="w-5 h-5 text-gray-500 flex-shrink-0" />
                              <div>
                                Leave by <strong>{`${hours}:${minutesStr} ${ampm}`}</strong> to walk to <strong>{boardingStop}</strong>
                                <div className="text-xs text-gray-500">(~{initialWalkTime} min walk, then ~5 min wait)</div>
                              </div>
                            </div>
                          );
                        }
                      } else {
                        // Case 2: No initial walk, user starts at the bus stop.
                        if (busWaitTime <= 5) {
                          firstStep = (
                            <div className="flex items-center gap-3">
                              <Clock className="w-5 h-5 text-gray-500 flex-shrink-0" />
                              <div>{busWaitTime <= 1 ? 'Bus is arriving now' : `Bus arrives in ~${busWaitTime} min`}</div>
                            </div>
                          );
                        } else {
                          const now = new Date();
                          const arriveByTime = new Date(now.getTime() + (busWaitTime - 5) * 60000);
                          let hours = arriveByTime.getHours();
                          const minutes = arriveByTime.getMinutes();
                          const ampm = hours >= 12 ? 'PM' : 'AM';
                          hours = hours % 12;
                          hours = hours || 12;
                          const minutesStr = minutes < 10 ? `0${minutes}` : minutes;
                          firstStep = (
                            <div className="flex items-center gap-3">
                              <Clock className="w-5 h-5 text-gray-500 flex-shrink-0" />
                              <div>Bus arrives in ~{busWaitTime} min. Be at the stop by <strong>{`${hours}:${minutesStr} ${ampm}`}</strong>.</div>
                            </div>
                          );
                        }
                      }

                      return (
                        <div key={index} className="border p-4 rounded-lg flex flex-col gap-3 bg-gray-50/50">
                          <div className="flex justify-between items-center">
                            <button onClick={() => onRouteSelect(result.route)} className="font-bold text-lg text-purple-700 hover:underline">{result.route.name}</button>
                            <div className="text-right">
                              <div className="font-semibold text-lg">{Math.round(result.totalTime)} min</div>
                              <div className="text-xs text-gray-500">Total Trip Time</div>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 text-sm">
                            {firstStep}
                            <div className="flex items-center gap-3"><Bus className="w-5 h-5 text-gray-500 flex-shrink-0" /><div>Ride from <strong>{result.boardingStop}</strong> to <strong>{result.alightingStop}</strong> (~{Math.round(result.busTravelTime)} min)</div></div>
                            {result.finalWalkTime > 0 && <div className="flex items-center gap-3"><PersonStanding className="w-5 h-5 text-gray-500 flex-shrink-0" /><div>Walk to <strong>{result.destination}</strong> (~{result.finalWalkTime} min)</div></div>}
                            <div className="flex items-center gap-3 mt-1"><CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" /><div className="font-semibold">You've arrived at {result.destination}</div></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center font-semibold p-4">
                    <div className="flex justify-center gap-4 text-gray-500 mb-2"><Footprints size={24} /><Train size={24} /></div>
                    {noBusRouteMessage || 'No direct bus route found. Please check your locations or consider another mode of transport.'}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Suggested Locations */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold">Suggested Locations</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mt-2 max-h-40 overflow-y-auto">
          {['Bobst Library', 'Kimmel Center for University Life', 'Tisch School of the Arts', 'Stern School of Business, Undergraduate College', 'NYU Langone Health', 'Palladium Athletic Facility', '370 Jay Street', 'Dibner Building'].map(location => (
            <button key={location} type="button" className="p-2 border rounded-lg w-full text-left hover:bg-purple-50 text-sm" onClick={() => { setToStop(location); }}>
              {location}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

