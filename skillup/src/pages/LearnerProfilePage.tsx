import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Compass, GraduationCap, Languages, Sparkles } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/features/authsystem/AuthContext";
import { API_BASE } from "@/features/authsystem/config";

const splitList = (value: string) => value.split(",").map((v) => v.trim()).filter(Boolean);

export default function LearnerProfilePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, token, updateUser } = useAuth();

  const initial = useMemo(() => {
    const profile = user?.profile || {};
    return {
      interests: Array.isArray(profile.learningInterests) ? profile.learningInterests.join(", ") : "",
      languages: Array.isArray(profile.preferredLanguages) ? profile.preferredLanguages.join(", ") : "",
      experienceLevel: typeof profile.experienceLevel === "string" ? profile.experienceLevel : "",
    };
  }, [user]);

  const [interests, setInterests] = useState(initial.interests);
  const [languages, setLanguages] = useState(initial.languages);
  const [experienceLevel, setExperienceLevel] = useState<"beginner" | "intermediate" | "advanced" | "">(
    initial.experienceLevel as "beginner" | "intermediate" | "advanced" | ""
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!token) {
      toast({ title: "Not signed in", description: "Sign in to edit your profile.", variant: "destructive" });
      return;
    }

    const payload = {
      learningInterests: splitList(interests),
      preferredLanguages: splitList(languages),
      experienceLevel,
    };

    if (!payload.learningInterests.length || !payload.experienceLevel) {
      toast({ title: "Missing fields", description: "Add interests and experience level.", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/auth/complete-profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: "learner", profile: payload }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save learner profile");

      updateUser(data.user);
      toast({ title: "Profile updated", description: "Learner profile saved successfully." });
    } catch (error) {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.14),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(99,102,241,0.12),_transparent_30%),linear-gradient(140deg,_#f8fbff_0%,_#eef3ff_52%,_#fdfdff_100%)]">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.24)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.24)_1px,transparent_1px)] bg-[size:42px_42px] opacity-35" />
      <div className="absolute -left-24 top-8 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl" />
      <div className="absolute -right-24 bottom-8 h-80 w-80 rounded-full bg-indigo-300/20 blur-3xl" />

      <div className="relative z-10">
        <Navbar />

        <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
          <Card className="w-full border-border/60 bg-background/82 shadow-2xl backdrop-blur-xl">
            <CardHeader className="space-y-4 pb-5 sm:space-y-5 sm:pb-6">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-sky-500/25 bg-sky-500/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-700 dark:text-sky-300">
                <Sparkles className="h-3.5 w-3.5" />
                Learner profile
              </div>
              <div className="space-y-2">
                <CardTitle className="text-2xl sm:text-3xl">Learner profile details</CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Keep your learning preferences updated to get better mentor and session recommendations.
                </CardDescription>
              </div>

              <div className="grid gap-2 sm:grid-cols-3 sm:gap-3">
                {[
                  { icon: Compass, label: "Discover topics" },
                  { icon: Languages, label: "Learn in your stack" },
                  { icon: GraduationCap, label: "Grow with mentors" },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-background/70 px-3 py-2 text-xs font-medium text-muted-foreground shadow-sm">
                    <Icon className="h-3.5 w-3.5 text-sky-600" />
                    {label}
                  </div>
                ))}
              </div>
            </CardHeader>

            <CardContent className="space-y-4 pb-6 sm:space-y-5 sm:pb-8">
              <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
                <div className="space-y-2 sm:col-span-2">
                  <Label className="text-sm font-medium">Learning interests (comma separated)</Label>
                  <Input
                    value={interests}
                    onChange={(e) => setInterests(e.target.value)}
                    placeholder="Web Development, Machine Learning, Data Science"
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Preferred languages (comma separated)</Label>
                  <Input
                    value={languages}
                    onChange={(e) => setLanguages(e.target.value)}
                    placeholder="JavaScript, Python"
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Experience level</Label>
                  <Select value={experienceLevel} onValueChange={(v) => setExperienceLevel(v as typeof experienceLevel)}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2 rounded-xl border border-border/70 bg-background/70 p-3 text-xs text-muted-foreground sm:grid-cols-3 sm:gap-3 sm:p-4">
                <div>Tip: Keep interests specific.</div>
                <div>Tip: Add languages you use most.</div>
                <div>Tip: These changes sync to MongoDB.</div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button variant="outline" className="h-11 w-full" onClick={() => navigate("/profile")}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to profile
                </Button>
                <Button className="h-11 w-full" onClick={handleSave} disabled={saving}>
                  {saving ? "Saving..." : "Save changes"}
                  {!saving && <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
