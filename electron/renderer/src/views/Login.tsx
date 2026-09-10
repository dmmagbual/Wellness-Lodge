import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Card, Field, PrimaryButton, inputClass } from "@/components/ui";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch {
      setError("Sign-in failed. Check your email and password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-50 px-4">
      <Card className="w-full max-w-sm p-8">
        <div className="text-center">
          <p className="text-lg font-bold tracking-tight text-stone-900">Wellness Lodge</p>
          <p className="text-sm text-stone-500">Front Desk &amp; Administration</p>
        </div>
        <form className="mt-6 space-y-4" onSubmit={handleLogin}>
          <Field label="Email">
            <input
              type="email"
              className={inputClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />
          </Field>
          <Field label="Password">
            <input
              type="password"
              className={inputClass}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <PrimaryButton type="submit" className="w-full" disabled={loading || !email || !password}>
            {loading ? "Signing in…" : "Sign in"}
          </PrimaryButton>
        </form>
        <p className="mt-6 text-center text-xs text-stone-400">
          Demo accounts: admin@wellnesslodge.demo / manager@wellnesslodge.demo /
          frontdesk@wellnesslodge.demo — password Demo!Pass123 (see docs/DEMO_ACCOUNTS.md)
        </p>
      </Card>
    </div>
  );
}
