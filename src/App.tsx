import React, { useEffect, useState } from "react";
import { RouteListScreen } from "./components/RouteListScreen";
import { NearbyStopsScreen } from "./components/NearbyStopsScreen";
import { TripPlannerScreen } from "./components/TripPlannerScreen";
import { RouteDetailScreen } from "./components/RouteDetailScreen";
import { StopETAScreen } from "./components/StopETAScreen";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "./components/ui/tabs";
import { Bus, MapPin, Navigation } from "lucide-react";
import { Geolocation } from "@capacitor/geolocation";

// ## Type Definitions
export type StopSchedule = {
  stop: string;
  times: string[];
};

export type Route = {
  id: string;
  name: string;
  stops: string[];
  availableDays: string[];
  schedules: {
    "Mon-Thu"?: StopSchedule[];
    Fri?: StopSchedule[];
    Weekend?: StopSchedule[];
  };
};

export type AppState = {
  currentScreen: "main" | "routeDetail" | "stopETA";
  selectedRoute: Route | null;
  selectedStopName: string | null;
  selectedStopRoutes: Route[] | null;
  activeTab: "routes" | "stops" | "planner";
};

type UserLocation = { lat: number; lng: number } | null;

// ## Main App Component
export default function App() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [appState, setAppState] = useState<AppState>({
    currentScreen: "main",
    selectedRoute: null,
    selectedStopName: null,
    selectedStopRoutes: null,
    activeTab: "routes",
  });
  const [userLocation, setUserLocation] = useState<UserLocation>(null);

  // Get user location (with fallback to location.json)
  useEffect(() => {
    async function getLocation() {
      try {
        const permission = await Geolocation.requestPermissions();
        if (permission.location === 'granted') {
          const position = await Geolocation.getCurrentPosition();
          setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
          return;
        }
      } catch (err) {
        console.error("Geolocation failed:", err)
      }
      // Fallback: load from location.json
      fetch('/location.json')
        .then(res => res.json())
        .then(data => {
          if (data && data.lat && data.lng) setUserLocation({ lat: data.lat, lng: data.lng });
        })
        .catch(() => setUserLocation(null));
    }
    getLocation();
  }, []);

  // Load routes.json (with reload every 60 seconds)
  useEffect(() => {
    function loadRoutes() {
      fetch('/routes.json')
        .then(res => res.json())
        .then(data => {
          const loadedRoutes: Route[] = Object.entries(data).map(([id, routeData]: [string, any]) => {
            const allStops = new Set<string>();
            Object.values(routeData.schedules).forEach((schedule: any) => {
              if (Array.isArray(schedule)) {
                schedule.forEach((stopInfo: any) => allStops.add(stopInfo.stop));
              }
            });
            return {
              id,
              name: routeData.name,
              stops: Array.from(allStops),
              availableDays: Object.keys(routeData.schedules).filter(key => routeData.schedules[key].length > 0),
              schedules: routeData.schedules,
            };
          });
          setRoutes(loadedRoutes);
          setLoading(false);
        })
        .catch(err => {
          console.error('❌ Failed to load routes.json', err);
          setLoading(false);
        });
    }
    loadRoutes();
    const interval = setInterval(loadRoutes, 60000);
    return () => clearInterval(interval);
  }, []);

  // --- Navigation and State Handlers ---
  const navigateToRouteDetail = (route: Route) => {
    setAppState({ ...appState, currentScreen: "routeDetail", selectedRoute: route });
  };

  const navigateToStopETA = (stopName: string, stopRoutes: Route[]) => {
    setAppState({ ...appState, currentScreen: "stopETA", selectedStopName: stopName, selectedStopRoutes: stopRoutes });
  };

  const navigateBack = () => {
    setAppState({ ...appState, currentScreen: "main", selectedRoute: null, selectedStopName: null, selectedStopRoutes: null });
  };

  const handleTabChange = (value: string) => {
    setAppState({ ...appState, activeTab: value as AppState['activeTab'] });
  };


  if (loading) {
    return <div className="p-4">Loading routes…</div>;
  }

  return (
    // This root container should now correctly fill the screen height
    <div className="h-screen bg-gray-50 max-w-md mx-auto">
      {appState.currentScreen === "main" && (
        // The Tabs component is now the primary flex container for the main screen
        <Tabs value={appState.activeTab} onValueChange={handleTabChange} className="flex flex-col h-full">
          {/* == STATIC HEADER PART == */}
          <div className="bg-white border-b border-gray-200 pt-safe">
            <div className="px-4 py-3 pt-10">
              <h1 className="text-2xl font-semibold text-gray-900">University Shuttle</h1>
            </div>
            <div className="px-4 pb-3">
              <TabsList className="grid w-full grid-cols-3 h-12">
                <TabsTrigger value="routes" className="flex items-center gap-2"><Bus className="w-4 h-4" /> Routes</TabsTrigger>
                <TabsTrigger value="stops" className="flex items-center gap-2"><MapPin className="w-4 h-4" /> Nearby Stops</TabsTrigger>
                <TabsTrigger value="planner" className="flex items-center gap-2"><Navigation className="w-4 h-4" /> Plan Trip</TabsTrigger>
              </TabsList>
            </div>
          </div>

          {/* == SCROLLABLE CONTENT PART == */}
          {/* Each TabsContent now grows to fill available space and scrolls internally */}
          <TabsContent value="routes" className="flex-1 overflow-y-auto m-0">
            <RouteListScreen routes={routes} onRouteSelect={navigateToRouteDetail} />
          </TabsContent>
          <TabsContent value="stops" className="flex-1 overflow-y-auto m-0">
            <NearbyStopsScreen routes={routes} onStopSelect={navigateToStopETA} onRouteSelect={navigateToRouteDetail} userLocation={userLocation} />
          </TabsContent>
          <TabsContent value="planner" className="flex-1 overflow-y-auto m-0">
            <TripPlannerScreen routes={routes} onRouteSelect={navigateToRouteDetail} />
          </TabsContent>
        </Tabs>
      )}

      {/* --- Screens for Route Detail and Stop ETA --- */}
      {appState.currentScreen === "routeDetail" && appState.selectedRoute && (
        <RouteDetailScreen route={appState.selectedRoute} onBack={navigateBack} />
      )}
      {appState.currentScreen === "stopETA" && appState.selectedStopName && appState.selectedStopRoutes && (
        <StopETAScreen stopName={appState.selectedStopName} routes={appState.selectedStopRoutes} onBack={navigateBack} onRouteSelect={navigateToRouteDetail} />
      )}
    </div>
  );
}