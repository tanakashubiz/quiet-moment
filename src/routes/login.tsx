import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

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
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [signUpSuccess, setSignUpSuccess] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password });
      setLoading(false);
      if (error) { setError(error.message); } else { setSignUpSuccess(true); }
    } else {
      const result = await signIn(email, password);
      setLoading(false);
      if (result.error) { setError(result.error.message); } else { navigate({ to: "/" }); }
    }
  };

  if (signUpSuccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 pb-20">
        <p className="text-lg font-medium text-foreground mb-2">登録完了</p>
        <p className="text-sm text-muted-foreground text-center mb-6">
          確認メールを送信しました。メール内のリンクをクリックしてアカウントを有効化してください。
        </p>
        <button
          onClick={() => { setSignUpSuccess(false); setIsSignUp(false); }}
          className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium"
        >
          ログインへ
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 pb-20">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-foreground tracking-wide">目の前</h1>
          <p className="text-xs text-muted-foreground mt-2">
            {isSignUp ? "アカウントを作成" : "ログイン"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="メールアドレス" required
            className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-card text-sm text-foreground placeholder:text-muted-foreground/50 focus-calm" />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder="パスワード" required minLength={6}
            className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-card text-sm text-foreground placeholder:text-muted-foreground/50 focus-calm" />
          {error && <p className="text-xs text-destructive text-center">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50">
            {loading ? "処理中..." : isSignUp ? "登録する" : "ログイン"}
          </button>
        </form>

        <button onClick={() => { setIsSignUp(!isSignUp); setError(""); }}
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
