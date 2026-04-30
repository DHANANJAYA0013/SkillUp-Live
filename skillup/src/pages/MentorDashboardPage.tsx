import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { BarChart3, Calendar, ChevronRight, MessageSquareMore, Radio, ShieldCheck, Sparkles, Users } from "lucide-react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import type { ISourceOptions } from "@tsparticles/engine";
import Navbar from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/features/authsystem/AuthContext";
import { API_BASE } from "@/features/authsystem/config";

const EMOTION_KEYS = ["happy", "neutral", "sad", "angry", "surprised", "fearful", "disgusted"] as const;

interface DbSession {
  _id: string;
  mentorId: string;
  mentorName: string;
  mentorEmail: string;
  title: string;
  description: string;
  date: string;
  startTime: string;
  scheduledAt: string;
  durationMinutes: number;
  topic: string;
  roomId: string;
  status: "scheduled" | "live" | "completed";
}

interface EmotionSummaryStudent {
  userId: string | null;
  studentName: string;
  total: number;
  counts: Record<string, number>;
  percentages: Record<string, number>;
  engagement: number;
  latestEmotion: string;
  lastSeenAt: string;
}

interface EmotionSummaryResponse {
  sessionId: string;
  total: number;
  counts: Record<string, number>;
  percentages: Record<string, number>;
  engagement: number;
  students: EmotionSummaryStudent[];
}

const parseApiResponse = async (res: Response) => {
  const raw = await res.text();
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return raw;
  }
};

const particlesOptions: ISourceOptions = {
  background: { color: { value: "transparent" } },
  fpsLimit: 60,
  interactivity: {
    events: { onHover: { enable: true, mode: "grab" }, resize: { enable: true } },
    modes: { grab: { distance: 140, links: { opacity: 0.3 } } },
  },
  particles: {
    color: { value: "#6b8cff" },
    links: { color: "#8aa6ff", distance: 140, enable: true, opacity: 0.25, width: 1 },
    move: { direction: "none", enable: true, outModes: { default: "out" }, random: false, speed: 0.8, straight: false },
    number: { density: { enable: true }, value: 60 },
    opacity: { value: 0.25 },
    shape: { type: "circle" },
    size: { value: { min: 1, max: 3 } },
  },
  detectRetina: true,
};

const MentorDashboardPage = () => {
  const { user: authUser, loading } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<DbSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [particlesReady, setParticlesReady] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [emotionSummary, setEmotionSummary] = useState<EmotionSummaryResponse | null>(null);
  const [emotionLoading, setEmotionLoading] = useState(false);
  const [emotionError, setEmotionError] = useState("");

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => setParticlesReady(true));
  }, []);

  useEffect(() => {
    if (!loading && !authUser) {
      navigate("/auth", { replace: true });
    }
  }, [authUser, loading, navigate]);

  useEffect(() => {
    if (!authUser || authUser.role !== "mentor") return;

    const controller = new AbortController();
    const loadSessions = async () => {
      setLoadingSessions(true);
      try {
        const res = await fetch(`${API_BASE}/sessions`, { signal: controller.signal });
        const data = await parseApiResponse(res);
        if (!res.ok) return;

        const list =
          data && typeof data === "object" && "sessions" in data && Array.isArray((data as { sessions: unknown[] }).sessions)
            ? (data as { sessions: DbSession[] }).sessions
            : [];

        const mentorSessions = list.filter(
          (session) =>
            session.mentorId === authUser._id &&
            session.mentorEmail.trim().toLowerCase() === (authUser.email || "").trim().toLowerCase()
        );

        setSessions(mentorSessions);
        if (!selectedSessionId && mentorSessions[0]) {
          setSelectedSessionId(mentorSessions[0]._id);
        }
      } catch {
        setSessions([]);
      } finally {
        setLoadingSessions(false);
      }
    };

    void loadSessions();
    return () => controller.abort();
  }, [authUser, selectedSessionId]);

  useEffect(() => {
    if (!selectedSessionId) {
      setEmotionSummary(null);
      setEmotionError("");
      return;
    }

    const controller = new AbortController();

    const loadSummary = async () => {
      setEmotionLoading(true);
      setEmotionError("");

      try {
        const res = await fetch(`${API_BASE}/emotion/summary?sessionId=${encodeURIComponent(selectedSessionId)}`, {
          signal: controller.signal,
        });
        const data = await parseApiResponse(res);
        if (!res.ok) {
          const message = data && typeof data === "object" && "error" in data
            ? String((data as { error: unknown }).error)
            : "Failed to load emotion summary";
          throw new Error(message);
        }
        setEmotionSummary(data as EmotionSummaryResponse);
      } catch (error) {
        if (!controller.signal.aborted) {
          setEmotionSummary(null);
          setEmotionError(error instanceof Error ? error.message : "Failed to load emotion summary");
        }
      } finally {
        if (!controller.signal.aborted) {
          setEmotionLoading(false);
        }
      }
    };

    void loadSummary();
    return () => controller.abort();
  }, [selectedSessionId]);

  const selectedSession = useMemo(
    () => sessions.find((session) => session._id === selectedSessionId) || sessions[0] || null,
    [selectedSessionId, sessions]
  );

  const metrics = [
    { label: "Sessions Created", value: String(sessions.length), icon: Calendar },
    { label: "Live Now", value: String(sessions.filter((session) => session.status === "live").length), icon: Radio },
    { label: "Completed", value: String(sessions.filter((session) => session.status === "completed").length), icon: BarChart3 },
    { label: "Students Tracked", value: String(emotionSummary?.students.length || 0), icon: Users },
  ];

  if (loading) {
    return <div className="min-h-screen grid place-items-center bg-background text-sm sm:text-base">Loading mentor dashboard...</div>;
  }

  if (!authUser || authUser.role !== "mentor") {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.12),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.12),_transparent_28%),linear-gradient(135deg,_#f7faff_0%,_#eef4ff_46%,_#fcfdff_100%)]">
      <div className="absolute inset-0 pointer-events-none opacity-70" aria-hidden="true">
        {particlesReady && <Particles id="mentor-dashboard-particles" className="h-full w-full" options={particlesOptions} />}
      </div>

      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute -left-24 top-12 h-72 w-72 rounded-full bg-sky-300/20 blur-3xl" />
        <div className="absolute -right-20 bottom-8 h-80 w-80 rounded-full bg-indigo-300/20 blur-3xl" />
      </div>

      <div className="relative z-10">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6 sm:space-y-8">
          <section className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200/60 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-indigo-700 backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" /> Mentor analytics
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground">
              Mentor Dashboard,<br />{authUser.name}!
            </h1>
            <p className="max-w-2xl text-sm sm:text-base text-muted-foreground">
              Review your live sessions, track student emotion trends, and spot engagement patterns without leaving your mentor workspace.
            </p>
          </section>

          <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {metrics.map((metric) => (
              <Card key={metric.label} className="border-border/60 bg-white/80 backdrop-blur-xl shadow-sm">
                <CardContent className="p-3 sm:p-5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">{metric.label}</p>
                    <p className="text-xl sm:text-2xl font-bold text-foreground mt-1">{metric.value}</p>
                  </div>
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary flex-shrink-0">
                    <metric.icon className="h-5 w-5" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </section>

          <section className="grid lg:grid-cols-[1.1fr_0.9fr] gap-4 sm:gap-6">
            <Card className="border-border/60 bg-white/85 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
              <CardHeader className="space-y-2">
                <CardTitle className="text-lg sm:text-xl">Your Sessions</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Pick a session to inspect its emotion breakdown.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {loadingSessions ? (
                  <p className="text-sm text-muted-foreground">Loading your sessions...</p>
                ) : sessions.length > 0 ? (
                  sessions.map((session) => {
                    const isSelected = session._id === selectedSessionId;
                    return (
                      <button
                        key={session._id}
                        type="button"
                        onClick={() => setSelectedSessionId(session._id)}
                        className={`w-full rounded-2xl border p-4 text-left transition-all ${isSelected ? "border-primary bg-primary/5 shadow-sm" : "border-border/60 bg-muted/20 hover:bg-muted/30"}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground truncate">{session.title}</p>
                            <p className="text-xs sm:text-sm text-muted-foreground truncate">{session.topic} · Room {session.roomId}</p>
                          </div>
                          <Badge className="shrink-0 border-0 bg-white/80 text-foreground capitalize">
                            {session.status}
                          </Badge>
                        </div>
                        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                          <span>{new Date(session.scheduledAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</span>
                          <span className="inline-flex items-center gap-1 text-primary font-medium">View <ChevronRight className="h-3.5 w-3.5" /></span>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 p-6 text-sm text-muted-foreground">
                    No mentor sessions found yet. Create one in your profile to start collecting emotion insights.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-white/85 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
              <CardHeader className="space-y-2">
                <CardTitle className="text-lg sm:text-xl">Emotion Summary</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  {selectedSession ? `${selectedSession.title} · Room ${selectedSession.roomId}` : "Select a session to view insights."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {emotionLoading ? (
                  <p className="text-sm text-muted-foreground">Loading emotion data...</p>
                ) : emotionError ? (
                  <p className="text-sm text-destructive">{emotionError}</p>
                ) : emotionSummary ? (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {EMOTION_KEYS.map((key) => (
                        <div key={key} className="rounded-xl border border-border/60 bg-muted/20 p-3">
                          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{key}</p>
                          <p className="mt-1 text-lg font-bold text-foreground">{emotionSummary.percentages[key] ?? 0}%</p>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                        <p className="text-xs text-muted-foreground">Total Samples</p>
                        <p className="text-2xl font-bold text-foreground mt-1">{emotionSummary.total}</p>
                      </div>
                      <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                        <p className="text-xs text-muted-foreground">Engagement Score</p>
                        <p className="text-2xl font-bold text-foreground mt-1">{emotionSummary.engagement}%</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-sm font-semibold text-foreground">Student Breakdown</h3>
                        <Badge className="border-0 bg-primary/10 text-primary">{emotionSummary.students.length} students</Badge>
                      </div>

                      <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                        {emotionSummary.students.length > 0 ? emotionSummary.students.map((student) => (
                          <div key={student.userId || student.studentName} className="rounded-2xl border border-border/60 bg-white/80 p-4">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="font-semibold text-foreground">{student.studentName}</p>
                                <p className="text-xs text-muted-foreground">Latest emotion: {student.latestEmotion}</p>
                              </div>
                              <Badge className="border-0 bg-slate-900 text-white">Engagement {student.engagement}%</Badge>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {EMOTION_KEYS.map((key) => (
                                <span key={key} className="rounded-full border border-border/70 bg-muted/30 px-2.5 py-1 text-[11px] text-muted-foreground">
                                  {key}: {student.percentages[key] ?? 0}%
                                </span>
                              ))}
                            </div>
                          </div>
                        )) : (
                          <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 p-5 text-sm text-muted-foreground">
                            No student emotion samples recorded for this session yet.
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 p-5 text-sm text-muted-foreground">
                    Choose a session to load emotion analytics.
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          <section className="grid md:grid-cols-3 gap-4">
            <Card className="border-border/60 bg-white/80 backdrop-blur-xl">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Need to review participants?</p>
                <p className="mt-1 text-sm font-medium text-foreground">Use your room link to jump into the live session and observe in real time.</p>
                <Button asChild className="mt-4 w-full">
                  <Link to={selectedSession ? `/room/${selectedSession.roomId}?name=${encodeURIComponent(authUser.name)}` : "/sessions"}>
                    Open Live Room
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-white/80 backdrop-blur-xl">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Need learner follow-up?</p>
                <p className="mt-1 text-sm font-medium text-foreground">See your live teaching context and participant conversations in the sessions area.</p>
                <Button asChild variant="outline" className="mt-4 w-full">
                  <Link to="/sessions">
                    Session Management
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-white/80 backdrop-blur-xl">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Mentor profile</p>
                <p className="mt-1 text-sm font-medium text-foreground">Keep your skills and bio up to date so learners can find you.</p>
                <Button asChild variant="outline" className="mt-4 w-full">
                  <Link to="/profile">
                    Update Profile
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </section>
        </main>
      </div>
    </div>
  );
};

export default MentorDashboardPage;