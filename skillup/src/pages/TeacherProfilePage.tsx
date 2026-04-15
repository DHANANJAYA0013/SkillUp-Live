import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, BadgeCheck, BookOpen, Briefcase, Sparkles } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/features/authsystem/AuthContext";
import { API_BASE } from "@/features/authsystem/config";

const splitList = (value: string) => value.split(",").map((v) => v.trim()).filter(Boolean);

export default function TeacherProfilePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, token, updateUser } = useAuth();

  const initial = useMemo(() => {
    const profile = user?.profile || {};
    return {
      skills: Array.isArray(profile.skills) ? profile.skills.join(", ") : "",
      yearsOfExperience:
        profile.yearsOfExperience === null || profile.yearsOfExperience === undefined
          ? ""
          : String(profile.yearsOfExperience),
      bio: typeof profile.bio === "string" ? profile.bio : "",
      certifications: Array.isArray(profile.certifications) ? profile.certifications.join(", ") : "",
      portfolioLinks: Array.isArray(profile.portfolioLinks) ? profile.portfolioLinks.join(", ") : "",
    };
  }, [user]);

  const [skills, setSkills] = useState(initial.skills);
  const [yearsOfExperience, setYearsOfExperience] = useState(initial.yearsOfExperience);
  const [bio, setBio] = useState(initial.bio);
  const [certifications, setCertifications] = useState(initial.certifications);
  const [portfolioLinks, setPortfolioLinks] = useState(initial.portfolioLinks);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!token) {
      toast({ title: "Not signed in", description: "Sign in to edit your profile.", variant: "destructive" });
      return;
    }

    const payload = {
      skills: splitList(skills),
      yearsOfExperience: yearsOfExperience.trim() === "" ? null : Number(yearsOfExperience),
      bio: bio.trim(),
      certifications: splitList(certifications),
      portfolioLinks: splitList(portfolioLinks),
    };

    if (!payload.skills.length || !payload.bio) {
      toast({ title: "Missing fields", description: "Add at least one skill and a bio.", variant: "destructive" });
      return;
    }

    if (payload.yearsOfExperience !== null && Number.isNaN(payload.yearsOfExperience)) {
      toast({ title: "Invalid value", description: "Years of experience must be a number.", variant: "destructive" });
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
        body: JSON.stringify({ role: "teacher", profile: payload }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save teacher profile");

      updateUser(data.user);
      toast({ title: "Profile updated", description: "Teacher profile saved successfully." });
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
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(79,70,229,0.15),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.13),_transparent_30%),linear-gradient(145deg,_#f9fafe_0%,_#eff3ff_50%,_#fdfdff_100%)]">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.24)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.24)_1px,transparent_1px)] bg-[size:42px_42px] opacity-35" />
      <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-indigo-300/20 blur-3xl" />
      <div className="absolute -right-24 bottom-8 h-80 w-80 rounded-full bg-cyan-300/20 blur-3xl" />

      <div className="relative z-10">
        <Navbar />

        <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
          <Card className="w-full border-border/60 bg-background/82 shadow-2xl backdrop-blur-xl">
            <CardHeader className="space-y-4 pb-5 sm:space-y-5 sm:pb-6">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-indigo-500/25 bg-indigo-500/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-700 dark:text-indigo-300">
                <Sparkles className="h-3.5 w-3.5" />
                Teacher profile
              </div>
              <div className="space-y-2">
                <CardTitle className="text-2xl sm:text-3xl">Teacher profile details</CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Keep your expertise and portfolio updated so learners can discover and trust your profile.
                </CardDescription>
              </div>

              <div className="grid gap-2 sm:grid-cols-3 sm:gap-3">
                {[
                  { icon: Briefcase, label: "Show expertise" },
                  { icon: BadgeCheck, label: "Add credentials" },
                  { icon: BookOpen, label: "Attract learners" },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-background/70 px-3 py-2 text-xs font-medium text-muted-foreground shadow-sm">
                    <Icon className="h-3.5 w-3.5 text-indigo-600" />
                    {label}
                  </div>
                ))}
              </div>
            </CardHeader>

            <CardContent className="space-y-4 pb-6 sm:space-y-5 sm:pb-8">
              <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
                <div className="space-y-2 sm:col-span-2">
                  <Label className="text-sm font-medium">Skills (comma separated)</Label>
                  <Input
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    placeholder="React, Node.js, Python"
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Years of experience</Label>
                  <Input
                    type="number"
                    min="0"
                    max="60"
                    value={yearsOfExperience}
                    onChange={(e) => setYearsOfExperience(e.target.value)}
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Certifications (comma separated)</Label>
                  <Input
                    value={certifications}
                    onChange={(e) => setCertifications(e.target.value)}
                    placeholder="AWS SAA, Google ACE"
                    className="h-11"
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label className="text-sm font-medium">Bio</Label>
                  <Textarea
                    rows={5}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell learners about your teaching style, domain expertise, and experience."
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label className="text-sm font-medium">Portfolio links (comma separated)</Label>
                  <Input
                    value={portfolioLinks}
                    onChange={(e) => setPortfolioLinks(e.target.value)}
                    placeholder="https://portfolio.com, https://github.com/username"
                    className="h-11"
                  />
                </div>
              </div>

              <div className="grid gap-2 rounded-xl border border-border/70 bg-background/70 p-3 text-xs text-muted-foreground sm:grid-cols-3 sm:gap-3 sm:p-4">
                <div>Tip: Highlight strongest skills first.</div>
                <div>Tip: Keep your bio concise and clear.</div>
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
