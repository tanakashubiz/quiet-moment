import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { RegionPicker } from "@/components/RegionPicker";
import { formatArea, type AreaSelection } from "@/lib/regions";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({
    meta: [
      { title: "ログイン — 目の前" },
      { name: "description", content: "目の前にログインする" },
    ],
  }),
});

function LoginPage() {
  const { user, signIn, signOut } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [signUpSuccess, setSignUpSuccess] = useState(false);

  // 地域選択
  const [mainArea, setMainArea] = useState<AreaSelection | null>(null);
  const [subAreas, setSubAreas] = useState<AreaSelection[]>([]);
  const [addingSubArea, setAddingSubArea] = useState(false);

  const removeSubArea = (i: number) =>
    setSubAreas(prev => prev.filter((_, idx) => idx !== i));

  if (user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 pb-20">
        <p className="text-lg font-medium text-foreground mb-2">ログイン中</p>
        <p className="text-sm text-muted-foreground mb-6">{user.email}</p>
        <button
          onClick={async () => { await signOut(); navigate({ to: "/" }); }}
          className="px-6 py-2.5 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium"
        >
          ログアウト
        </button>
      </div>
    );
  }

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (isSignUp) { setStep(2); } else { handleSignIn(); }
  };

  const handleSignIn = async () => {
    setLoading(true);
    const result = await signIn(email, password);
    setLoading(false);
    if (result.error) { setError(result.error.message); } else { navigate({ to: "/" }); }
  };

  const handleSignUp = async () => {
    if (!mainArea) { setError("メインの地域を選んでください"); return; }
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { main_area: mainArea, sub_areas: subAreas } },
    });
    setLoading(false);
    if (error) { setError(error.message); } else { setSignUpSuccess(true); }
  };

  if (signUpSuccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 pb-20">
        <p className="text-lg font-medium text-foreground mb-2">登録完了</p>
        <p className="text-sm text-muted-foreground text-center mb-6">
          確認メールを送信しました。メール内のリンクをクリックしてアカウントを有効化してください。
        </p>
        <button
          onClick={() => { setSignUpSuccess(false); setIsSignUp(false); setStep(1); }}
          className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium"
        >
          ログインへ
        </button>
      </div>
    );
  }

  // ── Step 2: 地域選択 ──────────────────────────────────────────
  if (isSignUp && step === 2) {
    return (
      <div className="min-h-screen flex flex-col px-5 pt-12 pb-24 overflow-y-auto">
        <div className="max-w-sm w-full mx-auto">
          <button onClick={() => setStep(1)} className="text-xs text-muted-foreground mb-6">
            ← 戻る
          </button>

          <h2 className="text-xl font-semibold text-foreground mb-1">生活エリアを選ぶ</h2>
          <p className="text-xs text-muted-foreground mb-6">
            よく過ごす地域のスポットを優先して表示します
          </p>

          {/* メイン地域 */}
          <div className="mb-6">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              メインの地域
            </p>
            {mainArea ? (
              <div className="flex items-center gap-2 mb-3">
                <span className="px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                  {formatArea(mainArea)}
                </span>
                <button onClick={() => setMainArea(null)}
                  className="text-xs text-muted-foreground">変更</button>
              </div>
            ) : (
              <div className="bg-card border border-border rounded-2xl p-4">
                <RegionPicker onChange={setMainArea} allowAllCity={false} />
              </div>
            )}
          </div>

          {/* サブ地域 */}
          <div className="mb-8">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              サブの地域
            </p>

            {/* 追加済みのサブ地域 */}
            {subAreas.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {subAreas.map((a, i) => (
                  <span key={i} className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-xs font-medium">
                    {formatArea(a)}
                    <button onClick={() => removeSubArea(i)} className="ml-0.5 text-muted-foreground">✕</button>
                  </span>
                ))}
              </div>
            )}

            {/* サブ地域追加ピッカー */}
            {addingSubArea ? (
              <div className="bg-card border border-border rounded-2xl p-4">
                <RegionPicker
                  allowAllCity={true}
                  onChange={(area) => {
                    setSubAreas(prev => [...prev, area]);
                    setAddingSubArea(false);
                  }}
                />
                <button onClick={() => setAddingSubArea(false)}
                  className="mt-3 text-xs text-muted-foreground">キャンセル</button>
              </div>
            ) : (
              <button
                onClick={() => setAddingSubArea(true)}
                className="w-full py-2.5 rounded-xl border border-dashed border-input text-sm text-muted-foreground"
              >
                ＋ サブの地域を追加
              </button>
            )}
          </div>

          {error && <p className="text-xs text-destructive text-center mb-3">{error}</p>}

          <button
            onClick={handleSignUp}
            disabled={loading || !mainArea}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
          >
            {loading ? "登録中..." : "登録する"}
          </button>
          <p className="text-[11px] text-muted-foreground text-center mt-3">
            あとから設定で変更できます
          </p>
        </div>
      </div>
    );
  }

  // ── Step 1: メール + パスワード ─────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 pb-20">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-foreground tracking-wide">目の前</h1>
          <p className="text-xs text-muted-foreground mt-2">
            {isSignUp ? "アカウントを作成" : "ログイン"}
          </p>
        </div>

        <form onSubmit={handleStep1} className="space-y-4">
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="メールアドレス" required
            className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-card text-sm text-foreground placeholder:text-muted-foreground/50 focus-calm" />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder="パスワード" required minLength={6}
            className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-card text-sm text-foreground placeholder:text-muted-foreground/50 focus-calm" />
          {error && <p className="text-xs text-destructive text-center">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50">
            {loading ? "処理中..." : isSignUp ? "次へ →" : "ログイン"}
          </button>
        </form>

        <button onClick={() => { setIsSignUp(!isSignUp); setError(""); setStep(1); }}
          className="w-full text-center mt-4 text-sm text-muted-foreground">
          {isSignUp ? "すでにアカウントをお持ちですか？" : "アカウントを作成する"}
        </button>
        <Link to="/" className="block text-center mt-6 text-xs text-muted-foreground">
          ← 地図に戻る
        </Link>
      </div>
    </div>
  );
}
