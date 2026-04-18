import { Link, useLocation } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";

export function NavBar() {
  const location = useLocation();
  const { user } = useAuth();
  const path = location.pathname;

  const navItems = [
    { to: "/" as const, label: "地図", icon: "🗺️" },
    { to: "/saved" as const, label: "保存", icon: "♡" },
    { to: "/add-spot" as const, label: "投稿", icon: "＋" },
    { to: "/settings" as const, label: "設定", icon: "⚙️" },
  ];

  // Hide navbar on rest mode
  if (path.startsWith("/rest")) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-card/95 backdrop-blur-sm border-t border-border/50 safe-area-bottom">
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
              <span className="text-lg leading-none">{item.icon}</span>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
