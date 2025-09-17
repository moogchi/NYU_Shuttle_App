import React from 'react';
import { ArrowLeft, Bus, MapPin } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import type { Route, Stop } from '../App';

interface LiveMapScreenProps {
  route: Route;
  onBack: () => void;
  onStopSelect: (stop: Stop) => void;
}

export function LiveMapScreen({ route, onBack, onStopSelect }: LiveMapScreenProps) {
  // Mock stop data with arrival times
  const stops: Stop[] = route.stops.map((stopName, index) => ({
    id: `stop-${index}`,
    name: stopName,
    nextArrival: `${3 + index * 2} mins`,
    isFavorite: Math.random() > 0.7, // Random favorites for demo
  }));

  const currentStop = stops[2]; // Mock current approaching stop

  return (
    <div className="relative h-screen bg-gray-100 overflow-hidden">
      {/* Mock Map Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-100 via-blue-50 to-purple-50">
        {/* Fake map grid pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="grid grid-cols-12 grid-rows-12 h-full w-full">
            {Array.from({ length: 144 }).map((_, i) => (
              <div key={i} className="border border-gray-300" />
            ))}
          </div>
        </div>
        
        {/* Route path - curved purple line */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path
            d="M20,80 Q30,60 40,70 Q50,80 60,60 Q70,40 80,50 Q90,60 95,30"
            stroke="#9333ea"
            strokeWidth="0.5"
            fill="none"
            className="drop-shadow-sm"
          />
        </svg>
        
        {/* Stop markers */}
        {stops.map((stop, index) => {
          const positions = [
            { x: '20%', y: '80%' },
            { x: '32%', y: '65%' },
            { x: '44%', y: '72%' },
            { x: '60%', y: '58%' },
            { x: '82%', y: '48%' },
          ];
          const pos = positions[index] || positions[0];
          
          return (
            <div
              key={stop.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
              style={{ left: pos.x, top: pos.y }}
              onClick={() => onStopSelect(stop)}
            >
              <div className="bg-white rounded-full p-2 shadow-lg border-2 border-purple-600 hover:scale-110 transition-transform">
                <MapPin className="w-4 h-4 text-purple-600" />
              </div>
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 bg-white px-2 py-1 text-xs rounded shadow-md whitespace-nowrap border">
                {stop.name}
              </div>
            </div>
          );
        })}
        
        {/* Shuttle bus marker - animated */}
        <div 
          className="absolute transform -translate-x-1/2 -translate-y-1/2 animate-pulse"
          style={{ left: '52%', top: '75%' }}
        >
          <div className="bg-purple-600 rounded-full p-3 shadow-lg">
            <Bus className="w-5 h-5 text-white" />
          </div>
        </div>
      </div>

      {/* Back button */}
      <div className="absolute top-0 left-0 p-4 pt-safe z-10">
        <Button
          variant="secondary"
          size="sm"
          onClick={onBack}
          className="bg-white/90 backdrop-blur-sm border border-gray-200 hover:bg-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>

      {/* Bottom floating card */}
      <div className="absolute bottom-0 left-0 right-0 p-4 pb-safe">
        <Card className="bg-white/95 backdrop-blur-sm border border-gray-200 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">{route.name}</h3>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Bus className="w-4 h-4" />
                  <span>Next stop: {currentStop.name}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold text-purple-600">
                  {currentStop.nextArrival}
                </div>
                <div className="text-xs text-gray-500">ETA</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}