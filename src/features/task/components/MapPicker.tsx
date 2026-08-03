"use client";

import React, { useEffect, useRef, useState } from "react";
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

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // Address search using OpenStreetMap Nominatim
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        const newLat = parseFloat(lat);
        const newLng = parseFloat(lon);
        
        leafletMap.current?.flyTo([newLat, newLng], 16);
        
        if (onLocationSelect) {
          onLocationSelect(newLat, newLng);
          
          if (clickMarker.current) {
            clickMarker.current.setLatLng([newLat, newLng]);
          } else {
            clickMarker.current = L.marker([newLat, newLng], { draggable: true }).addTo(leafletMap.current!);
            clickMarker.current.on("dragend", () => {
              const position = clickMarker.current!.getLatLng();
              onLocationSelect(position.lat, position.lng);
            });
          }
        }
      } else {
        alert("Alamat tidak ditemukan.");
      }
    } catch (err) {
      console.error(err);
      alert("Gagal mencari alamat.");
    } finally {
      setIsSearching(false);
    }
  };

  // Get current GPS location
  const handleCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLat = position.coords.latitude;
          const newLng = position.coords.longitude;
          
          leafletMap.current?.flyTo([newLat, newLng], 16);
          
          if (onLocationSelect) {
            onLocationSelect(newLat, newLng);
            
            if (clickMarker.current) {
              clickMarker.current.setLatLng([newLat, newLng]);
            } else {
              clickMarker.current = L.marker([newLat, newLng], { draggable: true }).addTo(leafletMap.current!);
              clickMarker.current.on("dragend", () => {
                const position = clickMarker.current!.getLatLng();
                onLocationSelect(position.lat, position.lng);
              });
            }
          }
        },
        (error) => {
          alert("Gagal mendapatkan lokasi saat ini: " + error.message);
        },
        { enableHighAccuracy: true }
      );
    } else {
      alert("Browser Anda tidak mendukung GPS / Geolocation.");
    }
  };

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
    <div className="w-full h-full flex flex-col relative rounded-lg overflow-hidden border border-outline-variant">
      
      {/* Search overlay: only when onLocationSelect is provided */}
      {onLocationSelect && (
        <div className="absolute top-2 left-2 right-2 z-[400] flex flex-col sm:flex-row gap-2 pointer-events-none">
          <div className="flex-1 flex pointer-events-auto bg-white rounded-lg shadow-md overflow-hidden border border-outline-variant">
            <input
              type="text"
              placeholder="Cari alamat atau lokasi..."
              className="flex-1 px-3 py-2 text-sm focus:outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSearch(e as any);
                }
              }}
            />
            <button
              type="button"
              onClick={handleSearch}
              disabled={isSearching}
              className="px-3 py-2 bg-surface-container-low text-on-surface hover:bg-surface-container transition-colors border-l border-outline-variant flex items-center justify-center disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">
                {isSearching ? "hourglass_empty" : "search"}
              </span>
            </button>
          </div>
          <button
            type="button"
            onClick={handleCurrentLocation}
            className="pointer-events-auto bg-primary text-on-primary px-3 py-2 rounded-lg shadow-md hover:bg-primary/90 transition-colors flex items-center justify-center gap-1 shrink-0"
            title="Gunakan Lokasi Saat Ini"
          >
            <span className="material-symbols-outlined text-[18px]">my_location</span>
            <span className="text-sm font-semibold hidden sm:inline">Lokasi Saya</span>
          </button>
        </div>
      )}

      {/* Map container */}
      <div ref={mapRef} className="w-full h-full flex-1 z-0" style={{ minHeight: "250px" }} />
    </div>
  );
}
