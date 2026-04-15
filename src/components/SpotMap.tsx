import { useEffect, useRef, useState } from "react";
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
  const leafletMap = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [ready, setReady] = useState(false);
  const LRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let cancelled = false;

    Promise.all([
      import("leaflet"),
      import("leaflet/dist/leaflet.css"),
    ]).then(([L]) => {
      if (cancelled || !mapRef.current || leafletMap.current) return;
      LRef.current = L.default || L;
      const Leaf = LRef.current;

      leafletMap.current = Leaf.map(mapRef.current!, {
        zoomControl: true,
        attributionControl: false,
      }).setView(center, zoom);

      Leaf.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        maxZoom: 19,
      }).addTo(leafletMap.current);

      setReady(true);
    });

    return () => {
      cancelled = true;
      leafletMap.current?.remove();
      leafletMap.current = null;
    };
  }, []);

  useEffect(() => {
    if (!ready || !leafletMap.current || !LRef.current) return;
    const Leaf = LRef.current;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    spots.forEach((spot) => {
      const isSelected = spot.id === selectedSpotId;
      const marker = Leaf.circleMarker([spot.latitude, spot.longitude], {
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
  }, [spots, selectedSpotId, onSpotSelect, ready]);

  return <div ref={mapRef} className="w-full h-full" />;
}
