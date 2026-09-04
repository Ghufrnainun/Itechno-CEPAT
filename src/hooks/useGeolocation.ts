import { useState, useEffect } from "react";

export interface Coordinates {
  latitude: number;
  longitude: number;
}

const CACHE_KEY = "itechno_location_cache";

export function useGeolocation() {
  const [coords, setCoords] = useState<Coordinates>(() => {
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch (e) {}
      }
    }
    // Default fallback only if no cache
    return {
      latitude: -7.774532,
      longitude: 110.372134,
    };
  });
  
  const [error, setError] = useState<string | null>(null);
  
  // Start loading as false if we have a cache, so UI renders instantly
  const [loading, setLoading] = useState<boolean>(() => {
    if (typeof window !== "undefined" && localStorage.getItem(CACHE_KEY)) {
      return false;
    }
    return true;
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newCoords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setCoords(newCoords);
        localStorage.setItem(CACHE_KEY, JSON.stringify(newCoords));
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
      { enableHighAccuracy: false, timeout: 4000, maximumAge: 60000 }
    );
  }, []);

  return { coords, setCoords, error, loading };
}
