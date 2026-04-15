import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "../AuthContext";
import { API_BASE } from "../config";

const splitList = (value: string) => value.split(",").map((v) => v.trim()).filter(Boolean);

export default function AuthTeacherProfilePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { token, updateUser } = useAuth();

  const [skills, setSkills] = useState("");
  const [yearsOfExperience, setYearsOfExperience] = useState("");
  const [bio, setBio] = useState("");
  const [certifications, setCertifications] = useState("");
  const [portfolioLinks, setPortfolioLinks] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!token) return;

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
          <CardTitle>Teacher profile</CardTitle>
          <CardDescription>Complete these details to finish onboarding.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Skills (comma separated)</Label>
            <Input value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="React, Node.js, Python" />
          </div>
          <div>
            <Label>Years of experience</Label>
            <Input type="number" min="0" max="60" value={yearsOfExperience} onChange={(e) => setYearsOfExperience(e.target.value)} />
          </div>
          <div>
            <Label>Bio</Label>
            <Textarea rows={4} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell learners about your background" />
          </div>
          <div>
            <Label>Certifications (comma separated)</Label>
            <Input value={certifications} onChange={(e) => setCertifications(e.target.value)} />
          </div>
          <div>
            <Label>Portfolio links (comma separated)</Label>
            <Input value={portfolioLinks} onChange={(e) => setPortfolioLinks(e.target.value)} />
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
