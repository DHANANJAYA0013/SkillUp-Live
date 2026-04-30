import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, BadgeCheck, BookOpen, Github, ShieldCheck, Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "../AuthContext";
import { API_BASE, GITHUB_CLIENT_ID, GOOGLE_CLIENT_ID } from "../config";
import signinBackground from "@/Assets/background_signin.webp";

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
      navigate(user.profileCompleted ? "/dashboard" : "/auth/onboard", { replace: true });
    }
  }, [user, loading, navigate]);

  const authHighlights = [
    { icon: ShieldCheck, label: "Secure sign-in" },
    { icon: Users, label: "For learners and mentors" },
    { icon: BadgeCheck, label: "Fast onboarding" },
  ];

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
      navigate(data.profileCompleted ? "/dashboard" : "/auth/onboard", { replace: true });
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
      const containerWidth = Math.floor(googleButtonRef.current.getBoundingClientRect().width);
      const googleButtonWidth = Math.max(220, Math.min(340, containerWidth > 0 ? containerWidth - 8 : 280));
      googleId.renderButton(googleButtonRef.current, {
        theme: "outline",
        size: "large",
        width: googleButtonWidth,
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
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.12),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.14),_transparent_28%),linear-gradient(135deg,_#f7faff_0%,_#eef4ff_46%,_#fcfdff_100%)]">
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fadeInUp 0.5s ease-out forwards;
        }
      `}</style>
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.22)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.22)_1px,transparent_1px)] bg-[size:44px_44px] opacity-35" />
      <div className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-sky-300/20 blur-3xl" />
      <div className="absolute -right-20 bottom-10 h-80 w-80 rounded-full bg-indigo-300/20 blur-3xl" />

      <div className="relative z-10 grid min-h-screen lg:grid-cols-2">
        {/* left image */}
        <div
          className="absolute inset-0 overflow-hidden bg-cover bg-center bg-no-repeat opacity-25 lg:relative lg:inset-auto lg:min-h-screen lg:opacity-60"
          style={{ backgroundImage: `url(${signinBackground})` }}
        >
          <div className="absolute inset-0 bg-black/20 lg:bg-gradient-to-br lg:from-slate-950/78 lg:via-slate-900/55 lg:to-sky-950/45" />
          <div className="absolute inset-0 hidden lg:block bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.18),_transparent_35%)]" />

          <div className="relative z-10 hidden h-full items-end p-5 sm:p-8 lg:flex lg:p-12 lg:pb-32 xl:p-16 xl:pb-36">
            <div className="max-w-xl space-y-6 text-primary-foreground">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-medium uppercase tracking-[0.2em] backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5" />
                Personalized onboarding
              </div>

              <div className="space-y-3">
                <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl xl:text-5xl">
                  Learn and grow from one clean starting point.
                </h2>
                {/* <p className="max-w-lg text-sm leading-6 text-white/80 sm:text-base">
                  A focused sign-in experience for learners and mentors, designed to work smoothly on phones, tablets, and large desktop screens.
                </p> */}
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { value: "01", label: "Choose your role" },
                  { value: "02", label: "Complete your profile" },
                  { value: "03", label: "Jump into the app" },
                ].map((item) => (
                  <div key={item.value} className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                    <div className="text-sm font-semibold text-white">{item.value}</div>
                    <div className="mt-1 text-sm text-white/75">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>


        <div className="relative z-20 flex min-h-[100dvh] w-full items-center justify-center px-4 py-6 sm:px-6 sm:py-12 lg:min-h-0 lg:px-10 xl:px-16">
          {/* Subtle glow behind card */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-96 h-96 bg-indigo-500/20 rounded-full blur-[120px] absolute" />
          </div>
          <Card className="relative w-full max-w-[calc(100vw-2rem)] sm:max-w-xl border border-white/20 bg-white/95 dark:bg-slate-900/90 shadow-[0_20px_80px_rgba(0,0,0,0.25)] backdrop-blur-2xl animate-fade-in">
            <CardHeader className="space-y-4 pb-5 sm:space-y-5 sm:pb-6">
              <div className="flex items-start gap-3 sm:items-center">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-sky-500 text-white shadow-lg shadow-sky-500/25 sm:h-12 sm:w-12">
                  <BookOpen className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                </div>
                <div className="min-w-0 space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground sm:text-sm sm:font-medium sm:tracking-[0.18em]">
                    SkillBridge Live
                  </p>
                  <CardTitle className="text-2xl font-bold leading-tight tracking-tight sm:text-3xl">Sign in or create your account</CardTitle>
                  <p className="text-sm text-muted-foreground leading-6">Join live sessions, learn from mentors, and grow your skills.</p>
                </div>
              </div>

              <div className="sm:hidden inline-flex items-center gap-2 rounded-full border border-sky-500/25 bg-sky-500/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-700 dark:text-sky-300">
                <Sparkles className="h-3.5 w-3.5" />
                Fast onboarding flow
              </div>

              {/* <CardDescription className="max-w-lg text-sm sm:text-base leading-6">
                Use Google or GitHub to sign up in seconds. Your profile will guide you into the learner or mentor onboarding flow automatically.
              </CardDescription> */}

              <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:gap-2 sm:pb-0">
                {authHighlights.map(({ icon: Icon, label }) => (
                  <div
                    key={label}
                    className="inline-flex w-full items-center gap-2.5 rounded-xl border border-border/70 bg-background/70 px-3 py-2 text-xs font-medium text-foreground/80 shadow-sm sm:w-auto sm:shrink-0 sm:rounded-full sm:bg-muted/60 sm:px-3 sm:py-1.5 sm:text-xs sm:text-muted-foreground sm:shadow-none"
                  >
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-sky-500/10 sm:h-auto sm:w-auto sm:rounded-none sm:bg-transparent">
                      <Icon className="h-3.5 w-3.5 text-sky-600" />
                    </span>
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </CardHeader>

            <CardContent className="space-y-4 pb-8">
              <div className="space-y-3 rounded-2xl border border-indigo-200/40 bg-indigo-50/40 dark:border-indigo-800/30 dark:bg-indigo-950/20 p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-400">Continue with Google</p>
                    <p className="text-xs text-muted-foreground">Recommended for the fastest sign-in experience.</p>
                  </div>
                  {GOOGLE_CLIENT_ID ? (
                    <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                      {googleReady ? "Ready" : "Loading"}
                    </span>
                  ) : (
                    <span className="rounded-full bg-destructive/10 px-2.5 py-1 text-[11px] font-medium text-destructive">
                      Missing config
                    </span>
                  )}
                </div>
                <div ref={googleButtonRef} className="min-h-11 w-full overflow-hidden" />
              </div>

              <div className="flex items-center gap-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                <span className="h-px flex-1 bg-border" />
                or
                <span className="h-px flex-1 bg-border" />
              </div>

              <Button
                className="h-12 w-full justify-center rounded-xl bg-slate-900 text-white text-sm font-medium shadow-md transition-all hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700"
                onClick={handleGithubLogin}
              >
                <Github className="mr-2 h-4 w-4" />
                Continue with GitHub
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>

              {GOOGLE_CLIENT_ID ? (
                <p className="text-xs text-muted-foreground">Google SDK: {googleReady ? "ready" : "initializing"}</p>
              ) : (
                <p className="text-xs text-destructive">Set VITE_GOOGLE_CLIENT_ID to enable Google sign-in.</p>
              )}

              {authDebug && (
                <div className="rounded-xl border border-border bg-muted/40 p-4 text-xs space-y-2">
                  <div className="font-semibold text-foreground">Auth Debug</div>
                  <div className="text-muted-foreground">Request: {authDebug.url}</div>
                  <div className="text-muted-foreground">Status: {authDebug.status}</div>
                  <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-background p-3 text-[11px] leading-5 text-foreground">
                    {authDebug.body}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
