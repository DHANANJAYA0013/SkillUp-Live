import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "../AuthContext";
import { API_BASE } from "../config";

const splitList = (value: string) => value.split(",").map((v) => v.trim()).filter(Boolean);

export default function AuthLearnerProfilePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { token, updateUser } = useAuth();

  const [interests, setInterests] = useState("");
  const [languages, setLanguages] = useState("");
  const [experienceLevel, setExperienceLevel] = useState<"beginner" | "intermediate" | "advanced" | "">("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!token) return;

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
      navigate("/landing", { replace: true });
    } catch (error) {
      toast({
        title: "Profile save failed",
        description: error instanceof Error ? error.message : "Try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-background px-4 py-10">
      <Card className="w-full max-w-xl shadow-card">
        <CardHeader>
          <CardTitle>Learner profile</CardTitle>
          <CardDescription>Complete these details to finish onboarding.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Learning interests (comma separated)</Label>
            <Input value={interests} onChange={(e) => setInterests(e.target.value)} placeholder="Web Dev, ML, Data Science" />
          </div>
          <div>
            <Label>Preferred languages (comma separated)</Label>
            <Input value={languages} onChange={(e) => setLanguages(e.target.value)} placeholder="JavaScript, Python" />
          </div>
          <div>
            <Label>Experience level</Label>
            <Select value={experienceLevel} onValueChange={(v) => setExperienceLevel(v as typeof experienceLevel)}>
              <SelectTrigger>
                <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="w-full" onClick={() => navigate("/auth/onboard")}>Back</Button>
            <Button className="w-full" onClick={handleSubmit} disabled={saving}>{saving ? "Saving..." : "Save and continue"}</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
