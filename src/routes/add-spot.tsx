import { useState, useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CameraIcon, ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { LocationPicker } from "@/components/LocationPicker";

const DEFAULT_REST_CUE = "空を10秒見る";

export const Route = createFileRoute("/add-spot")({
  component: AddSpotPage,
  head: () => ({
    meta: [{ title: "投稿 — 目の前" }, { name: "description", content: "投稿" }],
  }),
});

function AddSpotPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const restCue = DEFAULT_REST_CUE;
  const [submitting, setSubmitting] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [lat, setLat] = useState(35.0116);
  const [lng, setLng] = useState(135.7681);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc: [number, number] = [
            Number(pos.coords.latitude.toFixed(6)),
            Number(pos.coords.longitude.toFixed(6)),
          ];
          setUserLocation(loc);
          setLat(loc[0]);
          setLng(loc[1]);
        },
        () => {},
      );
    }
  }, []);

  const handlePhotoChange = (file: File | null) => {
    setPhotoFile(file);
    if (file) {
      setPhotoPreview(URL.createObjectURL(file));
    } else {
      setPhotoPreview(null);
    }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setLocError("この端末では位置情報が使えません");
      return;
    }
    setLocating(true);
    setLocError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(Number(pos.coords.latitude.toFixed(6)));
        setLng(Number(pos.coords.longitude.toFixed(6)));
        setLocating(false);
      },
      () => {
        setLocError("位置情報の取得に失敗しました");
        setLocating(false);
      },
    );
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 pb-20">
        <p className="text-muted-foreground text-sm mb-4">投稿するにはログインが必要です</p>
        <button
          onClick={() => navigate({ to: "/login" })}
          className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium"
        >
          ログイン
        </button>
      </div>
    );
  }

  const handleSubmit = async () => {
    setSubmitting(true);

    let photo_url: string | null = null;
    if (photoFile) {
      const ext = photoFile.name.split(".").pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("spot-photos").upload(path, photoFile);
      if (!error) {
        const { data } = supabase.storage.from("spot-photos").getPublicUrl(path);
        photo_url = data.publicUrl;
      }
    }

    const { error } = await supabase.from("spots").insert({
      title: "",
      description: null,
      latitude: lat,
      longitude: lng,
      tags: [],
      rest_cue: restCue,
      photo_url,
      user_id: user.id,
    });

    setSubmitting(false);
    if (!error) navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen pb-20">
      <div className="px-5 pt-12 pb-4">
        <h1 className="text-lg font-semibold text-foreground">投稿</h1>
      </div>

      <div className="px-5 space-y-6">
        {/* 写真 */}
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1.5">写真</label>
          {photoPreview ? (
            <div className="relative rounded-xl overflow-hidden mb-2" style={{ height: 180 }}>
              <img src={photoPreview} alt="プレビュー" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => handlePhotoChange(null)}
                className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full bg-black/50 text-white text-xs"
              >
                ✕
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <label className="flex min-h-24 flex-col items-center justify-center gap-2 rounded-xl border border-border/70 bg-card cursor-pointer text-muted-foreground text-xs font-medium transition-colors active:bg-secondary">
                <ImageIcon size={22} strokeWidth={1.8} />
                アルバムから選ぶ
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handlePhotoChange(e.target.files?.[0] || null)}
                />
              </label>
              <label className="flex min-h-24 flex-col items-center justify-center gap-2 rounded-xl border border-border/70 bg-card cursor-pointer text-muted-foreground text-xs font-medium transition-colors active:bg-secondary">
                <CameraIcon size={22} strokeWidth={1.8} />
                写真を撮る
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => handlePhotoChange(e.target.files?.[0] || null)}
                />
              </label>
            </div>
          )}
        </div>

        {/* 場所をピンで指定 */}
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1.5">
            場所をピンで指定
          </label>
          <LocationPicker
            lat={lat}
            lng={lng}
            onChange={(newLat, newLng) => {
              setLat(newLat);
              setLng(newLng);
            }}
            userLocation={userLocation}
          />
          <button
            type="button"
            onClick={handleGetLocation}
            disabled={locating}
            className="w-full py-2 rounded-xl border border-primary text-primary text-sm font-medium mt-2 disabled:opacity-50 transition-opacity"
          >
            {locating ? "取得中..." : "現在地にピンを移動"}
          </button>
          {locError && <p className="text-xs text-destructive mt-1">{locError}</p>}
        </div>

        {/* 投稿ボタン */}
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 transition-opacity"
        >
          {submitting ? "投稿中..." : "投稿する"}
        </button>
      </div>
    </div>
  );
}
