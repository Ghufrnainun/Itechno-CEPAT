"use client";

import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Task } from "@/types/database";

interface MapPickerProps {
  center: { latitude: number; longitude: number };
  tasks?: Task[];
  radiusKm?: number;
  onLocationSelect?: (lat: number, lng: number) => void;
  selectedTaskId?: string | null;
  onTaskClick?: (taskId: string) => void;
}

export default function MapPicker({
  center,
  tasks = [],
  radiusKm = 2,
  onLocationSelect,
  selectedTaskId,
  onTaskClick,
}: MapPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const circleMarker = useRef<L.Circle | null>(null);
  const clickMarker = useRef<L.Marker | null>(null);
  const userMarker = useRef<L.CircleMarker | null>(null);
  const taskMarkers = useRef<{ [id: string]: L.Marker }>({});

  useEffect(() => {
    if (!mapRef.current) return;

    // Fixed default icon issue in Leaflet
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
      iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
      shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    });

    // Initialize map
    leafletMap.current = L.map(mapRef.current).setView(
      [center.latitude, center.longitude],
      14
    );

    // Add OpenStreetMap tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>',
    }).addTo(leafletMap.current);

    // Draw search radius circle
    circleMarker.current = L.circle([center.latitude, center.longitude], {
      radius: radiusKm * 1000,
      color: "#0F766E",
      fillColor: "#0F766E",
      fillOpacity: 0.08,
      weight: 1.5,
      dashArray: "4, 4",
    }).addTo(leafletMap.current);

    // Draw user location marker
    userMarker.current = L.circleMarker([center.latitude, center.longitude], {
      radius: 8,
      color: "#ffffff",
      fillColor: "#0F766E",
      fillOpacity: 1,
      weight: 2,
    }).addTo(leafletMap.current).bindPopup("Lokasi Anda saat ini");

    // Add map click listener for selecting location (Requester form mode)
    if (onLocationSelect) {
      leafletMap.current.on("click", (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        
        if (clickMarker.current) {
          clickMarker.current.setLatLng(e.latlng);
        } else {
          clickMarker.current = L.marker(e.latlng, { draggable: true }).addTo(
            leafletMap.current!
          );
          clickMarker.current.on("dragend", () => {
            const position = clickMarker.current!.getLatLng();
            onLocationSelect(position.lat, position.lng);
          });
        }
        
        onLocationSelect(lat, lng);
      });
    }

    return () => {
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
      }
    };
  }, []);

  // Update map view and user markers when center or radius changes
  useEffect(() => {
    if (leafletMap.current) {
      leafletMap.current.setView([center.latitude, center.longitude]);
      
      if (circleMarker.current) {
        circleMarker.current.setLatLng([center.latitude, center.longitude]);
        circleMarker.current.setRadius(radiusKm * 1000);
      }
      
      if (userMarker.current) {
        userMarker.current.setLatLng([center.latitude, center.longitude]);
      }
    }
  }, [center.latitude, center.longitude, radiusKm]);

  // Update center, circle and task markers
  useEffect(() => {
    if (!leafletMap.current) return;

    // Remove old task markers
    Object.values(taskMarkers.current).forEach((m) => m.remove());
    taskMarkers.current = {};

    // Add task markers
    tasks.forEach((task) => {
      const isSelected = selectedTaskId === task.id_task;
      
      const customIcon = L.divIcon({
        className: "custom-div-icon",
        html: `<div class="w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-white shadow transition-all duration-150 ${isSelected ? "bg-amber-500 border-white scale-110" : "bg-primary border-white"}" style="font-size:12px;">Rp</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const m = L.marker([task.latitude, task.longitude], { icon: customIcon })
        .addTo(leafletMap.current!)
        .bindPopup(`<b>${task.title}</b><br/>Rp${task.compensation.toLocaleString()}`);

      if (onTaskClick) {
        m.on("click", () => {
          onTaskClick(task.id_task);
        });
      }

      taskMarkers.current[task.id_task] = m;
    });
  }, [tasks, selectedTaskId]);

  return (
    <div className="w-full h-full relative rounded-lg overflow-hidden border border-outline-variant">
      <div ref={mapRef} className="w-full h-full" style={{ minHeight: "250px" }} />
    </div>
  );
}
