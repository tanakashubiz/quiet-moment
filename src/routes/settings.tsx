import { useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
  head: () => ({
    meta: [{ title: "設定 — 目の前" }],
  }),
});

function SettingsPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  // ── パスワード変更 ──────────────────────────────────────────
  const [pwOpen, setPwOpen] = useState(false);
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwLoading, setPwLoading] = useState(false);

  const handleChangePassword = async () => {
    if (newPw.length < 6) {
      toast.error("パスワードは6文字以上で入力してください");
      return;
    }
    if (newPw !== confirmPw) {
      toast.error("パスワードが一致しません");
      return;
    }
    setPwLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPw });
    setPwLoading(false);
    if (error) {
      toast.error("変更に失敗しました: " + error.message);
    } else {
      toast.success("パスワードを変更しました");
      setNewPw("");
      setConfirmPw("");
      setPwOpen(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen pb-20">
      <div className="px-5 pt-12 pb-4">
        <h1 className="text-lg font-semibold text-foreground">設定</h1>
      </div>

      <div className="px-5 space-y-4">

        {/* アカウント */}
        <section>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">アカウント</p>
          <div className="bg-card rounded-2xl border border-border overflow-hidden divide-y divide-border">
            {user ? (
              <>
                <div className="px-4 py-3">
                  <p className="text-xs text-muted-foreground">メールアドレス</p>
                  <p className="text-sm text-foreground mt-0.5">{user.email}</p>
                </div>

                {/* パスワード変更 */}
                <button
                  onClick={() => setPwOpen((v) => !v)}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm text-foreground"
                >
                  <span>パスワードを変更</span>
                  <span className="text-muted-foreground text-xs">{pwOpen ? "▲" : "▼"}</span>
                </button>

                {pwOpen && (
                  <div className="px-4 py-3 space-y-2 bg-muted/30">
                    <input
                      type="password"
                      value={newPw}
                      onChange={(e) => setNewPw(e.target.value)}
                      placeholder="新しいパスワード（6文字以上）"
                      className="w-full px-3 py-2 rounded-xl border border-input bg-card text-sm text-foreground placeholder:text-muted-foreground/50 focus-calm"
                    />
                    <input
                      type="password"
                      value={confirmPw}
                      onChange={(e) => setConfirmPw(e.target.value)}
                      placeholder="もう一度入力"
                      className="w-full px-3 py-2 rounded-xl border border-input bg-card text-sm text-foreground placeholder:text-muted-foreground/50 focus-calm"
                    />
                    <button
                      onClick={handleChangePassword}
                      disabled={pwLoading || !newPw || !confirmPw}
                      className="w-full py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-40 transition-opacity"
                    >
                      {pwLoading ? "変更中..." : "変更する"}
                    </button>
                  </div>
                )}

                <button
                  onClick={handleSignOut}
                  className="w-full px-4 py-3 text-left text-sm text-destructive font-medium"
                >
                  ログアウト
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="block px-4 py-3 text-sm text-primary font-medium"
              >
                ログイン・アカウント作成
              </Link>
            )}
          </div>
        </section>

        {/* アプリについて */}
        <section>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">アプリについて</p>
          <div className="bg-card rounded-2xl border border-border overflow-hidden divide-y divide-border">
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm text-foreground">バージョン</span>
              <span className="text-sm text-muted-foreground">1.0.0</span>
            </div>
            <div className="px-4 py-3">
              <p className="text-sm text-foreground">目の前</p>
              <p className="text-xs text-muted-foreground mt-0.5">5分だけ、今ここに戻る</p>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
