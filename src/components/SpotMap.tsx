import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Database } from "@/integrations/supabase/types";

type Spot = Database["public"]["Tables"]["spots"]["Row"];

interface SpotMapProps {
  spots: Spot[];
  onSpotSelect: (spot: Spot) => void;
  selectedSpotId?: string;
  center?: [number, number];
  zoom?: number;
}

export function SpotMap({
  spots,
  onSpotSelect,
  selectedSpotId,
  center = [35.0116, 135.7681],
  zoom = 14,
}: SpotMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const markersRef = useRef<L.CircleMarker[]>([]);

  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return;

    leafletMap.current = L.map(mapRef.current, {
      zoomControl: true,
      attributionControl: false,
    }).setView(center, zoom);

    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
    }).addTo(leafletMap.current);

    return () => {
      leafletMap.current?.remove();
      leafletMap.current = null;
    };
  }, []);

  useEffect(() => {
    if (!leafletMap.current) return;

    // Clear existing markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    spots.forEach((spot) => {
      const isSelected = spot.id === selectedSpotId;
      const marker = L.circleMarker([spot.latitude, spot.longitude], {
        radius: isSelected ? 10 : 7,
        fillColor: isSelected ? "#5a8a6a" : "#7aab8a",
        color: "#f8f6f0",
        weight: 2,
        opacity: 1,
        fillOpacity: isSelected ? 1 : 0.85,
      });

      marker.on("click", () => onSpotSelect(spot));
      marker.addTo(leafletMap.current!);
      markersRef.current.push(marker);
    });
  }, [spots, selectedSpotId, onSpotSelect]);

  return <div ref={mapRef} className="w-full h-full" />;
}
