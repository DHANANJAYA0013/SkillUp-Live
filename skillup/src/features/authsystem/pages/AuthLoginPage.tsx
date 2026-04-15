import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "../AuthContext";
import { API_BASE, GITHUB_CLIENT_ID, GOOGLE_CLIENT_ID } from "../config";

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (config: { client_id: string; callback: (payload: { credential?: string }) => void }) => void;
          renderButton: (el: HTMLElement, options: Record<string, unknown>) => void;
          prompt: () => void;
        };
      };
    };
  }
}

export default function AuthLoginPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login, user, loading } = useAuth();
  const googleButtonRef = useRef<HTMLDivElement | null>(null);
  const [googleReady, setGoogleReady] = useState(false);
  const [authDebug, setAuthDebug] = useState<{
    status: number;
    body: string;
    url: string;
  } | null>(null);

  useEffect(() => {
    if (!loading && user) {
      navigate(user.profileCompleted ? "/landing" : "/auth/onboard", { replace: true });
    }
  }, [user, loading, navigate]);

  const handleGoogleAuth = async (credential?: string) => {
    if (!credential) {
      toast({ title: "Google login failed", description: "Credential missing from Google response.", variant: "destructive" });
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential }),
      });

      const rawBody = await res.text();
      let data: any = {};

      if (rawBody) {
        try {
          data = JSON.parse(rawBody);
        } catch {
          data = { error: "Server returned non-JSON response" };
        }
      }

      setAuthDebug({
        status: res.status,
        body: rawBody || "<empty response>",
        url: `${API_BASE}/auth/google`,
      });

      if (!res.ok) throw new Error(data.details || data.error || "Google authentication failed");

      login(data.token, data.user);
      setAuthDebug(null);
      navigate(data.profileCompleted ? "/landing" : "/auth/onboard", { replace: true });
    } catch (error) {
      toast({
        title: "Unable to continue",
        description: error instanceof SyntaxError
          ? "The server returned an empty or invalid response. Check the auth API response in the backend logs."
          : error instanceof Error
            ? error.message
            : "Google authentication failed",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    const init = () => {
      const googleId = window.google?.accounts?.id;
      if (!googleId || !googleButtonRef.current) return false;

      googleId.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: ({ credential }) => {
          void handleGoogleAuth(credential);
        },
      });

      googleButtonRef.current.innerHTML = "";
      googleId.renderButton(googleButtonRef.current, {
        theme: "outline",
        size: "large",
        width: 320,
        text: "continue_with",
      });
      setGoogleReady(true);
      return true;
    };

    if (init()) return;

    const timer = setInterval(() => {
      if (init()) clearInterval(timer);
    }, 250);

    return () => clearInterval(timer);
  }, []);

  const handleGithubLogin = () => {
    if (!GITHUB_CLIENT_ID) {
      toast({ title: "Missing configuration", description: "Set VITE_GITHUB_CLIENT_ID in skillup env.", variant: "destructive" });
      return;
    }

    const params = new URLSearchParams({
      client_id: GITHUB_CLIENT_ID,
      scope: "user:email",
      redirect_uri: `${window.location.origin}/auth/github-callback`,
    });

    window.location.href = `https://github.com/login/oauth/authorize?${params.toString()}`;
  };

  return (
    <div className="min-h-screen grid place-items-center bg-background px-4 py-10">
      <Card className="w-full max-w-md shadow-card">
        <CardHeader>
          <CardTitle>Auth Feature (from authsystem)</CardTitle>
          <CardDescription>Continue with Google or GitHub to onboard as learner or teacher.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div ref={googleButtonRef} className="min-h-10" />

          <Button variant="outline" className="w-full" onClick={handleGithubLogin}>
            <Github className="mr-2 h-4 w-4" />
            Continue with GitHub
          </Button>

          {GOOGLE_CLIENT_ID ? (
            <p className="text-xs text-muted-foreground">Google SDK: {googleReady ? "ready" : "loading"}</p>
          ) : (
            <p className="text-xs text-destructive">Set VITE_GOOGLE_CLIENT_ID to enable Google sign-in.</p>
          )}

          {authDebug && (
            <div className="rounded-md border border-border bg-muted/40 p-3 text-xs space-y-2">
              <div className="font-semibold text-foreground">Auth Debug</div>
              <div className="text-muted-foreground">Request: {authDebug.url}</div>
              <div className="text-muted-foreground">Status: {authDebug.status}</div>
              <pre className="whitespace-pre-wrap break-words rounded bg-background p-2 text-[11px] leading-5 text-foreground overflow-auto max-h-48">
                {authDebug.body}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
