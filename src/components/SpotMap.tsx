import { useEffect, useRef, useState } from "react";
import type { Database } from "@/integrations/supabase/types";

type Spot = Database["public"]["Tables"]["spots"]["Row"];

interface SpotMapProps {
  spots: Spot[];
  onSpotSelect: (spot: Spot) => void;
  selectedSpotId?: string;
  favoriteSpotIds?: Set<string>;
  visitedSpotIds?: Set<string>;
  currentUserId?: string;
  center?: [number, number];
  zoom?: number;
  userLocation?: [number, number] | null;
}

export function SpotMap({
  spots,
  onSpotSelect,
  selectedSpotId,
  favoriteSpotIds = new Set(),
  visitedSpotIds = new Set(),
  currentUserId,
  center = [35.0116, 135.7681],
  zoom = 14,
  userLocation,
}: SpotMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const userMarkerRef = useRef<any>(null);
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
        zoomDelta: 0.5,
        zoomSnap: 0.5,
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

  // center が変わったら地図を移動
  useEffect(() => {
    if (!ready || !leafletMap.current) return;
    leafletMap.current.setView(center, leafletMap.current.getZoom(), { animate: true });
  }, [ready, center]);

  useEffect(() => {
    if (!ready || !leafletMap.current || !LRef.current) return;
    const Leaf = LRef.current;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    spots.forEach((spot) => {
      const isSelected = spot.id === selectedSpotId;
      const isFavoriteSpot = favoriteSpotIds.has(spot.id);
      const isOwnSpot = !!currentUserId && spot.user_id === currentUserId;
      const isVisitedSpot =
        !!currentUserId && spot.user_id !== currentUserId && visitedSpotIds.has(spot.id);
      const statusBorderColor = isOwnSpot ? "#f97316" : isVisitedSpot ? "#2563eb" : null;
      const borderColor =
        statusBorderColor ?? (isFavoriteSpot ? "#f9a8d4" : isSelected ? "#5a8a6a" : "#f8f6f0");
      const borderWidth = statusBorderColor || isSelected || isFavoriteSpot ? 3 : 2;
      const favoriteBadge = isFavoriteSpot
        ? `
          <div style="
            position: absolute;
            top: -6px;
            right: -6px;
            width: 19px;
            height: 19px;
            border-radius: 50%;
            background: #fde7ef;
            color: #b8325f;
            border: 2px solid #fff;
            box-shadow: 0 2px 5px rgba(0,0,0,0.18);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor" aria-hidden="true">
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
            </svg>
          </div>
        `
        : "";

      let marker: any;

      if (spot.photo_url) {
        const size = isSelected ? 48 : 40;
        const icon = Leaf.divIcon({
          className: "",
          html: `
            <div style="
              width: ${size}px;
              height: ${size}px;
              border-radius: 50%;
              border: ${borderWidth}px solid ${borderColor};
              box-shadow: 0 2px 6px rgba(0,0,0,0.3);
              cursor: pointer;
              background: ${isFavoriteSpot ? "#fde7ef" : "#e8e4dc"};
              position: relative;
            ">
              <img src="${spot.photo_url}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:block;" onerror="this.style.display='none'" />
              ${favoriteBadge}
            </div>
          `,
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
          popupAnchor: [0, -(size / 2)],
        });
        marker = Leaf.marker([spot.latitude, spot.longitude], { icon });
      } else {
        marker = Leaf.circleMarker([spot.latitude, spot.longitude], {
          radius: isSelected ? 10 : 7,
          fillColor: isSelected ? "#5a8a6a" : "#7aab8a",
          color: borderColor,
          weight: borderWidth,
          opacity: 1,
          fillOpacity: isSelected ? 1 : 0.85,
        });
      }

      if (spot.photo_url) {
        const tooltipHtml = `
          <div style="width:160px;padding:0;border-radius:10px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.15);">
            <img src="${spot.photo_url}" style="width:100%;height:100px;object-fit:cover;display:block;" onerror="this.style.display='none'" />
          </div>
        `;
        marker.bindTooltip(tooltipHtml, {
          direction: "top",
          permanent: false,
          opacity: 1,
          className: "spot-photo-tooltip",
          offset: [0, -24],
        });
      }

      marker.on("click", () => onSpotSelect(spot));
      marker.addTo(leafletMap.current!);
      markersRef.current.push(marker);
    });
  }, [spots, selectedSpotId, favoriteSpotIds, visitedSpotIds, currentUserId, onSpotSelect, ready]);

  // 現在地マーカー
  useEffect(() => {
    if (!ready || !leafletMap.current || !LRef.current) return;
    const Leaf = LRef.current;

    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }

    if (userLocation) {
      const icon = Leaf.divIcon({
        className: "",
        html: `
          <div style="
            width: 16px; height: 16px;
            border-radius: 50%;
            background: #4a90e2;
            border: 3px solid #fff;
            box-shadow: 0 0 0 3px rgba(74,144,226,0.3), 0 2px 6px rgba(0,0,0,0.2);
          "></div>
        `,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });
      userMarkerRef.current = Leaf.marker(userLocation, { icon, zIndexOffset: 1000 })
        .bindTooltip("現在地", { direction: "top", offset: [0, -10] })
        .addTo(leafletMap.current);
    }
  }, [ready, userLocation]);

  return <div ref={mapRef} className="w-full h-full" />;
}
