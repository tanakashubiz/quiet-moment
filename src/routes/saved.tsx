import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/saved")({
  component: SavedPage,
  head: () => ({
    meta: [{ title: "目の前 — 京都の静かな休息スポット" }],
  }),
});

function SavedPage() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate({ to: "/", replace: true });
  }, [navigate]);

  return null;
}
