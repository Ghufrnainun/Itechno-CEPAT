import { useState, useEffect } from "react";

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export function useGeolocation() {
  // Default coordinates (UGM, Yogyakarta)
  const [coords, setCoords] = useState<Coordinates>({
    latitude: -7.774532,
    longitude: 110.372134,
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // For development/mock purposes, we bypass the real geolocation
    // to ensure the mock tasks in Yogyakarta are always visible.
    setLoading(false);
    /*
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
    */
  }, []);

  return { coords, setCoords, error, loading };
}
