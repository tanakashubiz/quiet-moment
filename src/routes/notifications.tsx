import { useEffect, useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import type { Database } from "@/integrations/supabase/types";

type Spot = Database["public"]["Tables"]["spots"]["Row"];
type SpotNotification = Database["public"]["Tables"]["spot_notifications"]["Row"] & {
  spots: Pick<Spot, "id" | "photo_url" | "title"> | null;
};

export const Route = createFileRoute("/notifications")({
  component: NotificationsPage,
  head: () => ({
    meta: [{ title: "通知 — 目の前" }],
  }),
});

function formatNotificationTime(value: string) {
  return new Date(value).toLocaleString("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<SpotNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchNotifications = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("spot_notifications")
        .select(
          "id, recipient_user_id, spot_id, kind, created_at, read_at, spots(id, title, photo_url)",
        )
        .eq("recipient_user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (cancelled) return;

      const rows = (data ?? []) as SpotNotification[];
      setNotifications(rows);
      setLoading(false);

      const unreadIds = rows.filter((n) => !n.read_at).map((n) => n.id);
      if (unreadIds.length > 0) {
        await supabase
          .from("spot_notifications")
          .update({ read_at: new Date().toISOString() })
          .in("id", unreadIds);
      }
    };

    fetchNotifications();

    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen pb-20">
        <div className="px-5 pt-12 pb-4">
          <h1 className="text-lg font-semibold text-foreground">通知</h1>
        </div>
        <div className="px-5">
          <div className="rounded-2xl border border-border bg-card px-4 py-5">
            <p className="text-sm text-foreground">ログインすると通知を確認できます。</p>
            <Link
              to="/login"
              className="mt-4 inline-flex rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              ログインする
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <div className="px-5 pt-12 pb-4">
        <h1 className="text-lg font-semibold text-foreground">通知</h1>
      </div>

      <div className="px-5">
        {loading ? (
          <div className="rounded-2xl border border-border bg-card px-4 py-5">
            <p className="text-sm text-muted-foreground">読み込み中...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card px-4 py-5">
            <p className="text-sm text-foreground">まだ通知はありません。</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-card divide-y divide-border">
            {notifications.map((notification) => {
              const spot = notification.spots;
              const content = (
                <>
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 border-[oklch(0.63_0.075_155)] bg-muted">
                    {spot?.photo_url && (
                      <img
                        src={spot.photo_url}
                        alt=""
                        className="h-full w-full object-cover"
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">
                      あなたのスポットに「行った」がつきました
                    </p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {spot?.title || "削除されたスポット"}
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {formatNotificationTime(notification.created_at)}
                    </p>
                  </div>
                </>
              );

              return spot ? (
                <Link
                  key={notification.id}
                  to="/spot/$spotId"
                  params={{ spotId: spot.id }}
                  className="flex items-center gap-3 px-4 py-3 transition-colors active:bg-muted/50"
                >
                  {content}
                </Link>
              ) : (
                <div key={notification.id} className="flex items-center gap-3 px-4 py-3">
                  {content}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
