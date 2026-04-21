import { useEffect, useRef, useState, useCallback } from "react";
import type { Database } from "@/integrations/supabase/types";

function calcWalkingMinutes(from: [number, number], to: [number, number]): number {
  const R = 6371000;
  const lat1 = (from[0] * Math.PI) / 180;
  const lat2 = (to[0] * Math.PI) / 180;
  const dLat = ((to[0] - from[0]) * Math.PI) / 180;
  const dLon = ((to[1] - from[1]) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return Math.max(1, Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) / 80));
}

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

  // Reactで描画するプレビューカード
  const [previewSpot, setPreviewSpot] = useState<Spot | null>(null);
  const [previewPixel, setPreviewPixel] = useState<{ x: number; y: number } | null>(null);
  const previewSpotRef = useRef<Spot | null>(null);

  const refreshPixel = useCallback((spot: Spot) => {
    if (!leafletMap.current) return;
    const p = leafletMap.current.latLngToContainerPoint([spot.latitude, spot.longitude]);
    setPreviewPixel({ x: p.x, y: p.y });
  }, []);

  const clearPreview = useCallback(() => {
    setPreviewSpot(null);
    setPreviewPixel(null);
    previewSpotRef.current = null;
  }, []);

  // 地図移動・ズーム時にプレビューカードの位置を更新
  useEffect(() => {
    if (!ready || !leafletMap.current) return;
    const handler = () => {
      if (previewSpotRef.current) refreshPixel(previewSpotRef.current);
    };
    leafletMap.current.on("move zoom", handler);
    return () => { leafletMap.current?.off("move zoom", handler); };
  }, [ready, refreshPixel]);

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

      // 地図背景クリックでプレビューを閉じる
      leafletMap.current.on("click", () => clearPreview());

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

  // interactive フラグで地図操作をロック
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
    clearPreview();

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

      // アイコンタップ → プレビューカード表示
      // プレビュー中に同じアイコンを再タップ → 詳細シート
      marker.on("click", (e: any) => {
        Leaf.DomEvent.stopPropagation(e);
        if (previewSpotRef.current?.id === spot.id) {
          onSpotSelect(spot);
          clearPreview();
        } else {
          previewSpotRef.current = spot;
          setPreviewSpot(spot);
          const p = leafletMap.current.latLngToContainerPoint([spot.latitude, spot.longitude]);
          setPreviewPixel({ x: p.x, y: p.y });
        }
      });

      marker.addTo(leafletMap.current!);
      markersRef.current.push(marker);
    });
  }, [spots, selectedSpotId, onSpotSelect, ready, clearPreview]);

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

  return (
    <div className="w-full h-full relative">
      <div ref={mapRef} className="w-full h-full" />

      {/* Reactプレビューカード（Leafletツールチップの代替） */}
      {previewSpot && previewPixel && (
        <div
          className="absolute z-[3000] pointer-events-auto"
          style={{
            left: previewPixel.x,
            top: previewPixel.y - 152,
            transform: "translateX(-50%)",
          }}
          onClick={(e) => {
            e.stopPropagation();
            onSpotSelect(previewSpot);
            clearPreview();
          }}
        >
          <div style={{
            width: 160,
            borderRadius: 12,
            overflow: "hidden",
            boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
            cursor: "pointer",
            background: "#fff",
          }}>
            {previewSpot.photo_url && (
              <img
                src={previewSpot.photo_url}
                alt={previewSpot.title}
                style={{ width: "100%", height: 100, objectFit: "cover", display: "block" }}
              />
            )}
            <div style={{ padding: "8px 10px" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#333", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {previewSpot.title}
              </div>
              <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>
                徒歩{userLocation
                  ? calcWalkingMinutes(userLocation, [previewSpot.latitude, previewSpot.longitude])
                  : previewSpot.walking_minutes}分
              </div>
            </div>
          </div>
          {/* 吹き出しの三角 */}
          <div style={{
            width: 0,
            height: 0,
            borderLeft: "8px solid transparent",
            borderRight: "8px solid transparent",
            borderTop: "8px solid #fff",
            margin: "0 auto",
            filter: "drop-shadow(0 2px 2px rgba(0,0,0,0.08))",
          }} />
        </div>
      )}
    </div>
  );
}
