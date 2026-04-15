import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "../AuthContext";

export default function AuthRolePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [role, setRole] = useState<"learner" | "teacher" | "">("");

  if (!user) return null;

  return (
    <div className="min-h-screen grid place-items-center bg-background px-4 py-10">
      <Card className="w-full max-w-xl shadow-card">
        <CardHeader>
          <CardTitle>Choose your role</CardTitle>
          <CardDescription>We use this to personalize your onboarding flow.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              className={`rounded-lg border p-4 text-left transition ${role === "learner" ? "border-primary bg-primary/10" : "border-border"}`}
              onClick={() => setRole("learner")}
            >
              <p className="font-semibold">Learner</p>
              <p className="text-sm text-muted-foreground">Track progress and learn new skills.</p>
            </button>
            <button
              className={`rounded-lg border p-4 text-left transition ${role === "teacher" ? "border-primary bg-primary/10" : "border-border"}`}
              onClick={() => setRole("teacher")}
            >
              <p className="font-semibold">Teacher</p>
              <p className="text-sm text-muted-foreground">Create content and mentor learners.</p>
            </button>
          </div>

          <Button className="w-full" disabled={!role} onClick={() => navigate(`/auth/onboard/${role}`)}>
            Continue
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
