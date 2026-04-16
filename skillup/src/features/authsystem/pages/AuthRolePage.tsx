import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, BookOpen, GraduationCap, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "../AuthContext";

export default function AuthRolePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [role, setRole] = useState<"learner" | "mentor" | "">("");

  if (!user) return null;

  const roleCards = [
    {
      value: "learner" as const,
      title: "Learner",
      subtitle: "Build practical skills with guided learning.",
      icon: GraduationCap,
      points: ["Set goals", "Track progress", "Join sessions"],
      accent: "from-sky-500/20 to-cyan-500/10",
    },
    {
      value: "mentor" as const,
      title: "Mentor",
      subtitle: "Share expertise and mentor the next generation.",
      icon: BookOpen,
      points: ["Create profile", "Mentor learners", "Grow your impact"],
      accent: "from-indigo-500/20 to-violet-500/10",
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.14),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(99,102,241,0.12),_transparent_30%),linear-gradient(135deg,_#f8fbff_0%,_#eef3ff_50%,_#fdfdff_100%)] px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.25)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.25)_1px,transparent_1px)] bg-[size:44px_44px] opacity-30" />
      <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl" />
      <div className="absolute -right-24 bottom-8 h-80 w-80 rounded-full bg-indigo-300/20 blur-3xl" />

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-3xl items-center justify-center">
        <Card className="w-full border-border/60 bg-background/80 shadow-2xl backdrop-blur-xl">
          <CardHeader className="space-y-3 pb-5">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-sky-600" />
              Setup your account
            </div>
            <CardTitle className="text-2xl sm:text-3xl">Choose your role</CardTitle>
            <CardDescription className="text-sm sm:text-base">
              We use this to personalize your onboarding flow.
            </CardDescription>
        </CardHeader>
          <CardContent className="space-y-4 pb-6 sm:space-y-5 sm:pb-8">
          <div className="grid gap-3 sm:grid-cols-2">
            {roleCards.map((item) => {
              const Icon = item.icon;
              const selected = role === item.value;

              return (
                <button
                  key={item.value}
                  type="button"
                  className={`group relative overflow-hidden rounded-2xl border p-4 text-left transition-all duration-200 sm:p-5 ${
                    selected
                      ? "border-primary bg-primary/10 shadow-md"
                      : "border-border/80 bg-background/70 hover:border-primary/50 hover:bg-background"
                  }`}
                  onClick={() => setRole(item.value)}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${item.accent} opacity-0 transition-opacity duration-200 ${selected ? "opacity-100" : "group-hover:opacity-100"}`} />

                  <div className="relative z-10 space-y-3">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`inline-flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${
                          selected ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <Icon className="h-4.5 w-4.5" />
                      </span>
                      <p className="font-semibold text-foreground">{item.title}</p>
                    </div>

                    <p className="text-sm leading-6 text-muted-foreground">{item.subtitle}</p>

                    <div className="space-y-1.5">
                      {item.points.map((point) => (
                        <div key={point} className="text-xs text-muted-foreground">
                          • {point}
                        </div>
                      ))}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <Button
            className="h-11 w-full rounded-xl text-sm sm:h-12 sm:text-base"
            disabled={!role}
            onClick={() => navigate(`/auth/onboard/${role}`)}
          >
            Continue
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            You can refine your profile details later from your profile settings.
          </p>
        </CardContent>
        </Card>
      </div>
    </div>
  );
}
