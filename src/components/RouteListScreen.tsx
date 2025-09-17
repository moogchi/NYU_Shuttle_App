import React from "react";
import { Card, CardContent } from "./ui/card";
import { ChevronRight } from "lucide-react";
import type { Route } from "../App";

interface RouteListScreenProps {
  routes: Route[];
  onRouteSelect: (route: Route) => void;
}

export function RouteListScreen({
  routes,
  onRouteSelect,
}: RouteListScreenProps) {
  return (
    <div className="p-4 pb-safe">
      <div className="mb-6">
        <p className="text-gray-600">
          Select a route to view details and schedules
        </p>
      </div>
      <div
        className="space-y-3 overflow-y-auto"
        style={{ maxHeight: "70vh" }}a
      >
        {routes.map((route) => (
          <Card
            key={route.id}
            className="cursor-pointer transition-all duration-200 hover:shadow-md active:scale-[0.98] border-gray-200 bg-white"
            onClick={() => onRouteSelect(route)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {route.name}
                  </h3>
                  <div className="flex flex-wrap gap-1">
                    {route.availableDays.map((day, index) => (
                      <span
                        key={index}
                        className="inline-block px-2 py-1 bg-purple-100 text-purple-800 text-sm rounded-full"
                      >
                        {day}
                      </span>
                    ))}
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 ml-3 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}