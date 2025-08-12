import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AuthGateProps {
  children: (userId: string) => JSX.Element;
}

const STORAGE_KEY = "wt:userId";

function getStoredUserId() {
  return localStorage.getItem(STORAGE_KEY);
}
function setStoredUserId(id: string) {
  localStorage.setItem(STORAGE_KEY, id);
}
export function clearLocalUser() {
  localStorage.removeItem(STORAGE_KEY);
}

function simpleHash(input: string) {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h << 5) - h + input.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h).toString(36);
}

export const AuthGate = ({ children }: AuthGateProps) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = getStoredUserId();
    setUserId(id);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-[50vh] grid place-items-center">
        <div className="size-10 rounded-full border-4 border-muted border-t-primary animate-spin" aria-label="Loading" />
      </div>
    );
  }

  if (!userId) {
    return <AuthForm onAuthed={(email) => {
      const id = `local_${simpleHash(email)}`;
      setStoredUserId(id);
      setUserId(id);
    }} />;
  }

  return children(userId);
};

const AuthForm = ({ onAuthed }: { onAuthed: (email: string) => void }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      onAuthed(email);
      setSubmitting(false);
    }, 400);
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <Card className="w-full max-w-md shadow-elevated tilt-hover">
        <CardHeader>
          <CardTitle className="text-center">Welcome to WakeTrack</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm text-muted-foreground">Email</label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm text-muted-foreground">Password (stored locally)</label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Starting..." : "Start tracking"}
            </Button>
            <p className="text-xs text-muted-foreground text-center">No server account yet—data is stored in your browser.</p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthGate;
