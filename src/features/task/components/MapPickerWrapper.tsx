"use client";

import dynamic from "next/dynamic";
import React from "react";

// Dynamically import MapPicker with SSR disabled to prevent Leaflet browser dependency crash
const DynamicMapPicker = dynamic(
  () => import("./MapPicker"),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[300px] flex items-center justify-center bg-surface-container-low border border-outline-variant rounded-lg animate-pulse">
        <div className="flex flex-col items-center gap-sm">
          <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          <p className="font-label-sm text-label-sm text-on-surface-variant">
            Memuat Peta...
          </p>
        </div>
      </div>
    )
  }
);

interface MapPickerWrapperProps {
  center: { latitude: number; longitude: number };
  tasks?: any[];
  radiusKm?: number;
  onLocationSelect?: (lat: number, lng: number) => void;
  selectedTaskId?: string | null;
  onTaskClick?: (taskId: string) => void;
}

export default function MapPickerWrapper(props: MapPickerWrapperProps) {
  return <DynamicMapPicker {...props} />;
}
