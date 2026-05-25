import { useEffect, useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { BellIcon, MapIcon, PlusIcon, SettingsIcon } from "@/components/Icons";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export function NavBar() {
  const location = useLocation();
  const { user } = useAuth();
  const path = location.pathname;
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const navItems = [
    { to: "/" as const, label: "地図", Icon: MapIcon },
    { to: "/notifications" as const, label: "通知", Icon: BellIcon },
    { to: "/settings" as const, label: "設定", Icon: SettingsIcon },
  ];
  const showPostButton = path !== "/add-spot";

  useEffect(() => {
    if (!user || path === "/notifications") {
      setUnreadNotifications(0);
      return;
    }

    let cancelled = false;

    supabase
      .from("spot_notifications")
      .select("id", { count: "exact", head: true })
      .eq("recipient_user_id", user.id)
      .is("read_at", null)
      .then(({ count }) => {
        if (!cancelled) setUnreadNotifications(count ?? 0);
      });

    return () => {
      cancelled = true;
    };
  }, [path, user]);

  return (
    <>
      {showPostButton && (
        <div className="fixed bottom-20 left-0 right-0 z-[9998] pointer-events-none">
          <div className="max-w-lg mx-auto flex justify-end px-4">
            <Link
              to="/add-spot"
              aria-label="投稿"
              className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-black/15 transition-transform active:scale-95"
            >
              <PlusIcon size={26} strokeWidth={2.3} />
            </Link>
          </div>
        </div>
      )}
      <nav className="fixed bottom-0 left-0 right-0 z-[9999] bg-card/95 backdrop-blur-sm border-t border-border/50 safe-area-bottom">
        <div className="flex items-center justify-around h-14 max-w-lg mx-auto">
          {navItems.map((item) => {
            const isActive = path === item.to || (item.to === "/" && path === "/");
            return (
              <Link
                key={item.label}
                to={item.to}
                className={`flex flex-col items-center gap-0.5 px-3 py-1 transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <span className="relative">
                  <item.Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                  {item.to === "/notifications" && unreadNotifications > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-primary" />
                  )}
                </span>
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
