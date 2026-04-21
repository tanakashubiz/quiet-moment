import { useEffect, useRef, useState } from "react";
import type { Database } from "@/integrations/supabase/types";

type Spot = Database["public"]["Tables"]["spots"]["Row"];

interface SpotMapProps {
  spots: Spot[];
  onSpotSelect: (spot: Spot) => void;
  selectedSpotId?: string;
  center?: [number, number];
  zoom?: number;
  userLocation?: [number, number] | null;
  interactive?: boolean;
}

export function SpotMap({
  spots,
  onSpotSelect,
  selectedSpotId,
  center = [35.0116, 135.7681],
  zoom = 14,
  interactive = true,
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
        zoomControl: false,
        attributionControl: false,
      }).setView(center, zoom);

      // ズームコントロールをナビバーの上（右下）に配置
      Leaf.control.zoom({ position: "bottomright" }).addTo(leafletMap.current);

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

  // 詳細シートが開いているとき地図操作をロック
  useEffect(() => {
    if (!ready || !leafletMap.current) return;
    const map = leafletMap.current;
    if (interactive) {
      map.dragging.enable();
      map.touchZoom.enable();
      map.scrollWheelZoom.enable();
      map.doubleClickZoom.enable();
    } else {
      map.dragging.disable();
      map.touchZoom.disable();
      map.scrollWheelZoom.disable();
      map.doubleClickZoom.disable();
    }
  }, [ready, interactive]);

  useEffect(() => {
    if (!ready || !leafletMap.current || !LRef.current) return;
    const Leaf = LRef.current;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    spots.forEach((spot) => {
      const isSelected = spot.id === selectedSpotId;

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
              border: ${isSelected ? "3px" : "2px"} solid ${isSelected ? "#5a8a6a" : "#f8f6f0"};
              box-shadow: 0 2px 6px rgba(0,0,0,0.3);
              overflow: hidden;
              cursor: pointer;
              background: #e8e4dc;
            ">
              <img src="${spot.photo_url}" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display='none'" />
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
          color: "#f8f6f0",
          weight: 2,
          opacity: 1,
          fillOpacity: isSelected ? 1 : 0.85,
        });
      }

      if (spot.photo_url) {
        const tooltipHtml = `
          <div style="width:160px;padding:0;border-radius:10px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.15);cursor:pointer;">
            <img src="${spot.photo_url}" style="width:100%;height:100px;object-fit:cover;display:block;" onerror="this.style.display='none'" />
            <div style="padding:8px 10px;background:#fff;">
              <div style="font-size:12px;font-weight:600;color:#333;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${spot.title}</div>
              <div style="font-size:11px;color:#888;margin-top:2px;">徒歩${spot.walking_minutes}分</div>
            </div>
          </div>
        `;
        marker.bindTooltip(tooltipHtml, {
          direction: "top",
          permanent: false,
          opacity: 1,
          className: "spot-photo-tooltip",
          offset: [0, -24],
        });

        // ツールチップのカードをタップ/クリックしても詳細を開く
        marker.on("tooltipopen", (e: any) => {
          const el = e.tooltip.getElement();
          if (el) {
            el.addEventListener("click", () => onSpotSelect(spot));
            el.addEventListener("touchend", (te: TouchEvent) => {
              te.preventDefault();
              onSpotSelect(spot);
            });
          }
        });
      }

      marker.on("click", () => onSpotSelect(spot));
      marker.addTo(leafletMap.current!);
      markersRef.current.push(marker);
    });
  }, [spots, selectedSpotId, onSpotSelect, ready]);

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
