import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/features/authsystem/AuthContext";
import { API_BASE } from "@/features/authsystem/config";

const C = {
  bg: "#F0EEFF",
};

const particlesOptions = {
  background: {
    color: {
      value: "transparent",
    },
  },
  fpsLimit: 60,
  interactivity: {
    events: {
      onHover: {
        enable: true,
        mode: "grab" as const,
      },
      resize: {
        enable: true,
      },
    },
    modes: {
      grab: {
        distance: 140,
        links: {
          opacity: 0.3,
        },
      },
    },
  },
  particles: {
    color: {
      value: "#6b8cff",
    },
    links: {
      color: "#8aa6ff",
      distance: 140,
      enable: true,
      opacity: 0.2,
      width: 1,
    },
    move: {
      direction: "none" as const,
      enable: true,
      outModes: {
        default: "out" as const,
      },
      random: false,
      speed: 0.8,
      straight: false,
    },
    number: {
      density: {
        enable: true,
      },
      value: 55,
    },
    opacity: {
      value: 0.22,
    },
    shape: {
      type: "circle" as const,
    },
    size: {
      value: { min: 1, max: 3 },
    },
  },
  detectRetina: true,
};

function FloatingOrbs() {
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(167,139,250,0.18) 0%, transparent 70%)",
          top: "-10%",
          right: "-5%",
          animation: "orbFloat1 8s ease-in-out infinite",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 380,
          height: 380,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(99,102,241,0.13) 0%, transparent 70%)",
          bottom: "5%",
          left: "-8%",
          animation: "orbFloat2 10s ease-in-out infinite",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 260,
          height: 260,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(196,181,253,0.15) 0%, transparent 70%)",
          top: "45%",
          left: "40%",
          animation: "orbFloat3 7s ease-in-out infinite",
        }}
      />
    </div>
  );
}

const parseApiResponse = async (res: Response) => {
  const raw = await res.text();
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return raw;
  }
};

const ScheduleSessionPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user: authUser, token } = useAuth();

  const [sessionTitle, setSessionTitle] = useState("");
  const [sessionDescription, setSessionDescription] = useState("");
  const [sessionDateTime, setSessionDateTime] = useState("");
  const [sessionDuration, setSessionDuration] = useState("");
  const [sessionTopic, setSessionTopic] = useState("");
  const [creatingSession, setCreatingSession] = useState(false);
  const [particlesReady, setParticlesReady] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      setParticlesReady(true);
    });
  }, []);

  useEffect(() => {
    if (!authUser) {
      navigate("/signin", { replace: true });
      return;
    }

    if (authUser.role !== "mentor") {
      toast({
        title: "Access denied",
        description: "Only mentors can schedule sessions.",
        variant: "destructive",
      });
      navigate("/profile", { replace: true });
    }
  }, [authUser, navigate, toast]);

  const handleCreateSession = async () => {
    if (!token) {
      toast({ title: "Not signed in", description: "Sign in to create sessions.", variant: "destructive" });
      return;
    }

    if (authUser?.role !== "mentor") {
      toast({ title: "Access denied", description: "Only mentors can create sessions.", variant: "destructive" });
      return;
    }

    const normalizedTitle = sessionTitle.trim();
    const normalizedDescription = sessionDescription.trim();
    const normalizedTopic = sessionTopic.trim();
    const durationValue = Number(sessionDuration);

    if (!normalizedTitle || !normalizedDescription || !sessionDateTime || !normalizedTopic || !Number.isFinite(durationValue) || durationValue <= 0) {
      toast({
        title: "Missing fields",
        description: "Provide title, description, date and time, duration, and topic.",
        variant: "destructive",
      });
      return;
    }

    setCreatingSession(true);

    try {
      const res = await fetch(`${API_BASE}/sessions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: normalizedTitle,
          description: normalizedDescription,
          dateTime: new Date(sessionDateTime).toISOString(),
          date: sessionDateTime.split("T")[0] || "",
          startTime: sessionDateTime.split("T")[1] || "",
          duration: durationValue,
          topic: normalizedTopic,
        }),
      });

      const data = await parseApiResponse(res);
      if (!res.ok) {
        const message =
          data && typeof data === "object" && "error" in data
            ? String((data as { error: unknown }).error)
            : typeof data === "string" && data.trim()
              ? data
              : "Failed to create session";
        throw new Error(message);
      }

      setSessionTitle("");
      setSessionDescription("");
      setSessionDateTime("");
      setSessionDuration("");
      setSessionTopic("");

      toast({
        title: "Session created",
        description: "Your session was saved in the sessions collection.",
      });
    } catch (error) {
      toast({
        title: "Creation failed",
        description: error instanceof Error ? error.message : "Try again.",
        variant: "destructive",
      });
    } finally {
      setCreatingSession(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: C.bg }}>
      <style>{`
        @keyframes orbFloat1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-30px, 40px) scale(1.08); }
        }
        @keyframes orbFloat2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(40px, -30px) scale(1.06); }
        }
        @keyframes orbFloat3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-20px, -20px) scale(1.05); }
        }
      `}</style>

      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
          background: `
            radial-gradient(ellipse 80% 60% at 80% 30%, rgba(167,139,250,0.16) 0%, transparent 60%),
            radial-gradient(ellipse 50% 40% at 10% 80%, rgba(99,102,241,0.09) 0%, transparent 60%),
            ${C.bg}
          `,
        }}
      />
      <FloatingOrbs />
      <div className="fixed inset-0 pointer-events-none opacity-70 z-[1]" aria-hidden="true">
        {particlesReady && <Particles id="schedule-page-particles" className="h-full w-full" options={particlesOptions} />}
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6 relative z-10">
        <Button variant="ghost" size="sm" onClick={() => navigate("/profile")}> 
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Profile
        </Button>

        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Schedule Session</h1>
          <p className="text-muted-foreground mt-1">Create a session to teach any skill — from coding to music, fitness, or art.</p>
        </div>

        {/* Helper hint */}
        <div className="mb-4 rounded-md border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700">
          You can create sessions for any skill.
        </div>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-lg">New Session</CardTitle>
            <CardDescription>Fill in all required details to publish your session.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="sessionTitle">Session Title</Label>
                <Input
                  id="sessionTitle"
                  value={sessionTitle}
                  onChange={(e) => setSessionTitle(e.target.value)}
                  placeholder="e.g., Guitar Basics, Yoga for Beginners, UI Design, Public Speaking"
                  className="bg-card"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="sessionDescription">Description</Label>
                <Textarea
                  id="sessionDescription"
                  rows={4}
                  value={sessionDescription}
                  onChange={(e) => setSessionDescription(e.target.value)}
                  placeholder="Describe what learners will gain from this session (skills, outcomes, level, etc.)"
                  className="bg-card"
                />
                <p className="text-xs text-muted-foreground mt-1">This can be any skill — not just technical topics.</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sessionDateTime">Date & Time</Label>
                <Input
                  id="sessionDateTime"
                  type="datetime-local"
                  value={sessionDateTime}
                  onChange={(e) => setSessionDateTime(e.target.value)}
                  className="bg-card"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sessionDuration">Duration (minutes)</Label>
                <Input
                  id="sessionDuration"
                  type="number"
                  min="1"
                  value={sessionDuration}
                  onChange={(e) => setSessionDuration(e.target.value)}
                  placeholder="60"
                  className="bg-card"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="sessionTopic">Category / Skill</Label>
                <select
                  id="sessionTopic"
                  value={sessionTopic}
                  onChange={(e) => setSessionTopic(e.target.value)}
                  className="w-full rounded-md border bg-white/80 px-3 py-2 text-sm shadow-sm"
                >
                  <option value="">Select a category</option>
                  <option value="Programming">Programming</option>
                  <option value="Music">Music</option>
                  <option value="Art & Drawing">Art & Drawing</option>
                  <option value="Fitness">Fitness</option>
                  <option value="Public Speaking">Public Speaking</option>
                  <option value="Business">Business</option>
                  <option value="Language Learning">Language Learning</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <Button onClick={handleCreateSession} disabled={creatingSession}>
                  {creatingSession ? "Publishing..." : "Publish Session"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ScheduleSessionPage;
