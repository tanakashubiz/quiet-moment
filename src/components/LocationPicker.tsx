import { useEffect, useRef } from "react";

interface LocationPickerProps {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
  userLocation?: [number, number] | null;
}

export function LocationPicker({ lat, lng, onChange, userLocation }: LocationPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<any>(null);
  const pinRef = useRef<any>(null);
  const LRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;

    Promise.all([
      import("leaflet"),
      import("leaflet/dist/leaflet.css"),
    ]).then(([L]) => {
      if (cancelled || !mapRef.current || leafletMap.current) return;
      const Leaf = L.default || L;
      LRef.current = Leaf;

      const center: [number, number] = userLocation ?? [lat, lng];

      leafletMap.current = Leaf.map(mapRef.current!, {
        zoomControl: true,
        attributionControl: false,
      }).setView(center, 15);

      Leaf.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        maxZoom: 19,
      }).addTo(leafletMap.current);

      // 現在地ドット
      if (userLocation) {
        const userIcon = Leaf.divIcon({
          className: "",
          html: `<div style="width:14px;height:14px;border-radius:50%;background:#4a90e2;border:3px solid #fff;box-shadow:0 0 0 3px rgba(74,144,226,0.3);"></div>`,
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        });
        Leaf.marker(userLocation, { icon: userIcon, interactive: false }).addTo(leafletMap.current);
      }

      // ドラッグ可能なピン
      const pinIcon = Leaf.divIcon({
        className: "",
        html: `
          <div style="display:flex;flex-direction:column;align-items:center;">
            <div style="
              width:28px;height:28px;border-radius:50% 50% 50% 0;
              background:#5a8a6a;border:3px solid #fff;
              box-shadow:0 2px 8px rgba(0,0,0,0.3);
              transform:rotate(-45deg);
            "></div>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 28],
      });

      pinRef.current = Leaf.marker([lat, lng], { icon: pinIcon, draggable: true })
        .addTo(leafletMap.current);

      pinRef.current.on("dragend", () => {
        const { lat: newLat, lng: newLng } = pinRef.current.getLatLng();
        onChange(Number(newLat.toFixed(6)), Number(newLng.toFixed(6)));
      });

      // タップで移動
      leafletMap.current.on("click", (e: any) => {
        const { lat: newLat, lng: newLng } = e.latlng;
        pinRef.current.setLatLng([newLat, newLng]);
        onChange(Number(newLat.toFixed(6)), Number(newLng.toFixed(6)));
      });
    });

    return () => {
      cancelled = true;
      leafletMap.current?.remove();
      leafletMap.current = null;
    };
  }, []);

  // ピン位置を外部から変更された場合（現在地ボタンなど）に同期
  useEffect(() => {
    if (!pinRef.current || !leafletMap.current) return;
    pinRef.current.setLatLng([lat, lng]);
    leafletMap.current.setView([lat, lng], leafletMap.current.getZoom());
  }, [lat, lng]);

  return (
    <div className="rounded-xl overflow-hidden border border-input" style={{ height: 220 }}>
      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
}
