import React, { useState } from 'react';
import { Search, Navigation, ArrowRight, Clock, Bus } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import type { Route } from '../App';

interface TripPlannerScreenProps {
  onRouteSelect: (route: Route) => void;
}

// All routes data
const ROUTES: Route[] = [
  {
    id: 'route-a',
    name: 'Route A',
    availableDays: ['Mon–Thu', 'Fri'],
    stops: [
      'Washington Square',
      '715 Broadway',
      'Broadway and Broome Street',
      '80 Lafayette (select trips)',
      'MetroTech Roadway At Bridge Street',
      '6 MetroTech Center At Jay Street',
      'Cadman Plaza & Clark Street (after 6:30 pm)',
      'Cleveland & Spring St.'
    ],
    schedules: {
      'Mon-Thu': ['7:30 AM', '8:00 AM', '8:30 AM', '9:00 AM', '9:30 AM', '10:00 AM'],
      'Fri': ['7:30 AM', '8:00 AM', '8:30 AM', '9:00 AM'],
      'Weekend': [],
    },
  },
  {
    id: 'route-b',
    name: 'Route B',
    availableDays: ['Mon–Thu', 'Fri'],
    stops: [
      '715 Broadway',
      'Broadway & Broome St',
      '80 Lafayette Street',
      'Cleveland Pl & Spring St.',
      'Lafayette & E 4th St.'
    ],
    schedules: {
      'Mon-Thu': ['8:00 AM', '8:30 AM', '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM'],
      'Fri': ['8:00 AM', '8:30 AM', '9:00 AM', '9:30 AM'],
      'Weekend': [],
    },
  },
  {
    id: 'route-c',
    name: 'Route C',
    availableDays: ['Mon–Thu'],
    stops: [
      '20th Street At Loop Exit',
      'Avenue C At 18th Street',
      'Avenue C At 16th Street',
      'Avenue C At 14th Street',
      '14th Street At Avenue B',
      '14th Street At Avenue A',
      '14th Street At 1st Avenue',
      'Third Avenue At 13th Street',
      '715 Broadway'
    ],
    schedules: {
      'Mon-Thu': ['7:45 AM', '8:15 AM', '8:45 AM', '9:15 AM', '9:45 AM'],
      'Fri': [],
      'Weekend': [],
    },
  },
  {
    id: 'route-e',
    name: 'Route E',
    availableDays: ['Mon–Thu', 'Fri'],
    stops: [
      '715 Broadway',
      'East 14th Street and Irving Place (Eastbound)',
      'Third Avenue and East 14th Street',
      'First Avenue and East 14th Street',
      'First Avenue and East 24th Street',
      'First Avenue and East 26th Street',
      'NYU Langone Health',
      'Lexington Avenue and East 31st Street',
      'Gramercy Green',
      'Third Avenue and East 17th Street',
      'East 14th Street and Irving Place (Westbound)'
    ],
    schedules: {
      'Mon-Thu': ['7:00 AM', '7:30 AM', '8:00 AM', '8:30 AM', '9:00 AM'],
      'Fri': ['7:00 AM', '7:30 AM', '8:00 AM'],
      'Weekend': [],
    },
  },
  {
    id: 'route-f',
    name: 'Route F',
    availableDays: ['Mon–Thu', 'Fri'],
    stops: [
      '715 Broadway',
      'Northbound Third Avenue At East 11th Street',
      'Northbound Third Avenue At East 14th Street',
      'Northbound Third Avenue At East 17th Street',
      'Gramercy Green (Drop off)',
      'Third Avenue At East 30th Street',
      'Gramercy Green (Pickup)',
      'Southbound Third Avenue At East 17th Street',
      'Southbound Third Avenue At East 14th Street',
      'Southbound Third Avenue At East 11th Street'
    ],
    schedules: {
      'Mon-Thu': ['8:00 AM', '8:30 AM', '9:00 AM', '9:30 AM'],
      'Fri': ['8:00 AM', '8:30 AM', '9:00 AM'],
      'Weekend': [],
    },
  },
  {
    id: 'route-g',
    name: 'Route G',
    availableDays: ['Mon–Thu', 'Fri'],
    stops: [
      '715 Broadway',
      'Morton & Greenwich Street'
    ],
    schedules: {
      'Mon-Thu': ['8:00 AM', '8:30 AM', '9:00 AM', '9:30 AM'],
      'Fri': ['8:00 AM', '8:30 AM', '9:00 AM'],
      'Weekend': [],
    },
  },
  {
    id: 'route-w',
    name: 'Route W',
    availableDays: ['Mon–Thu', 'Fri', 'Weekend'],
    stops: [
      '715 Broadway',
      'Broadway & Broome Street',
      '80 Lafayette Street',
      'Centre Street & Broome Street',
      'East 14th Street At Irving Place (Eastbound)',
      'First Avenue At East 17th Street',
      'First Avenue At East 24th Street',
      'First Avenue At East 26th Street',
      'NYU Langone Medical Center',
      'Lexington Avenue at East 31st Street',
      'Gramercy Green',
      'Third Avenue at East 17th Street',
      'East 14th St at Irving Place (Westbound)'
    ],
    schedules: {
      'Mon-Thu': ['7:30 AM', '8:00 AM', '8:30 AM', '9:00 AM'],
      'Fri': ['7:30 AM', '8:00 AM', '8:30 AM'],
      'Weekend': ['10:00 AM', '11:00 AM', '12:00 PM'],
    },
  },
];

// Get all unique stops
const getAllStops = (): string[] => {
  const allStops = new Set<string>();
  ROUTES.forEach(route => {
    route.stops.forEach(stop => {
      allStops.add(stop);
    });
  });
  return Array.from(allStops).sort();
};

// Find routes between two stops
const findRoutesBetweenStops = (from: string, to: string): Array<{route: Route, travelTime: string}> => {
  const results: Array<{route: Route, travelTime: string}> = [];
  
  ROUTES.forEach(route => {
    const fromIndex = route.stops.findIndex(stop => 
      stop.toLowerCase().includes(from.toLowerCase())
    );
    const toIndex = route.stops.findIndex(stop => 
      stop.toLowerCase().includes(to.toLowerCase())
    );
    
    if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex) {
      const stopCount = Math.abs(toIndex - fromIndex);
      const travelTime = `${stopCount * 3}-${stopCount * 5} mins`;
      results.push({ route, travelTime });
    }
  });
  
  return results;
};

export function TripPlannerScreen({ onRouteSelect }: TripPlannerScreenProps) {
  const [fromLocation, setFromLocation] = useState('');
  const [toLocation, setToLocation] = useState('');
  const [tripResults, setTripResults] = useState<Array<{route: Route, travelTime: string}>>([]);
  const [showResults, setShowResults] = useState(false);

  const allStops = getAllStops();

  const handleSearch = () => {
    if (fromLocation.trim() && toLocation.trim()) {
      const results = findRoutesBetweenStops(fromLocation, toLocation);
      setTripResults(results);
      setShowResults(true);
    }
  };

  const getFilteredStops = (query: string, excludeValue: string) => {
    if (!query) return [];
    return allStops
      .filter(stop => 
        stop.toLowerCase().includes(query.toLowerCase()) &&
        stop !== excludeValue
      )
      .slice(0, 5);
  };

  const fromSuggestions = getFilteredStops(fromLocation, toLocation);
  const toSuggestions = getFilteredStops(toLocation, fromLocation);

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Search Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Navigation className="w-5 h-5 text-purple-600" />
              Plan Your Trip
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* From Location */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">From</label>
              <Input
                placeholder="Enter starting location"
                value={fromLocation}
                onChange={(e) => setFromLocation(e.target.value)}
                className="w-full"
              />
              {fromSuggestions.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-md shadow-sm max-h-32 overflow-y-auto">
                  {fromSuggestions.map((stop, index) => (
                    <button
                      key={index}
                      onClick={() => setFromLocation(stop)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm border-b border-gray-100 last:border-b-0"
                    >
                      {stop}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* To Location */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">To</label>
              <Input
                placeholder="Enter destination"
                value={toLocation}
                onChange={(e) => setToLocation(e.target.value)}
                className="w-full"
              />
              {toSuggestions.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-md shadow-sm max-h-32 overflow-y-auto">
                  {toSuggestions.map((stop, index) => (
                    <button
                      key={index}
                      onClick={() => setToLocation(stop)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm border-b border-gray-100 last:border-b-0"
                    >
                      {stop}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Search Button */}
            <Button 
              onClick={handleSearch}
              disabled={!fromLocation.trim() || !toLocation.trim()}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Search className="w-4 h-4 mr-2" />
              Find Routes
            </Button>
          </CardContent>
        </Card>

        {/* Results Section */}
        {showResults && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Trip Options</CardTitle>
              <p className="text-sm text-gray-600">
                From <span className="font-medium">{fromLocation}</span> to <span className="font-medium">{toLocation}</span>
              </p>
            </CardHeader>
            <CardContent>
              {tripResults.length > 0 ? (
                <div className="space-y-3">
                  {tripResults.map((result, index) => (
                    <Card 
                      key={index}
                      className="cursor-pointer transition-all duration-200 hover:shadow-md active:scale-[0.98] border-gray-200"
                      onClick={() => onRouteSelect(result.route)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                              <Bus className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">{result.route.name}</h3>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {result.route.availableDays.map((day, dayIndex) => (
                                  <span 
                                    key={dayIndex}
                                    className="inline-block px-1.5 py-0.5 bg-gray-100 text-gray-700 text-xs rounded"
                                  >
                                    {day}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <Clock className="w-4 h-4" />
                              <span>{result.travelTime}</span>
                            </div>
                            <ArrowRight className="w-4 h-4 text-gray-400 mt-1 ml-auto" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Bus className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-gray-500">No direct routes found between these locations.</p>
                  <p className="text-sm text-gray-400 mt-1">Try different stops or check individual routes for connections.</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Quick Access Destinations */}
        {!showResults && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Popular Destinations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-2">
                {[
                  'Washington Square',
                  '715 Broadway',
                  'NYU Langone Health',
                  'MetroTech Center',
                  'Gramercy Green',
                  '6 MetroTech Center At Jay Street'
                ].map((destination, index) => (
                  <button
                    key={index}
                    onClick={() => setToLocation(destination)}
                    className="p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <div className="font-medium text-gray-900">{destination}</div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}