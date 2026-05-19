import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  Calendar,
  ChevronRight,
  Layers3,
  MessageSquareMore,
  Radio,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  Zap,
} from "lucide-react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import type { ISourceOptions } from "@tsparticles/engine";
import Navbar from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import SessionAttendanceView from "@/components/SessionAttendanceView";
import { useAuth } from "@/features/authsystem/AuthContext";
import { API_BASE } from "@/features/authsystem/config";

const ATTENTION_KEYS = [
  { key: "engaged", label: "Engaged" },
  { key: "focused", label: "Focused" },
  { key: "distracted", label: "Distracted" },
  { key: "inactive", label: "Inactive" },
] as const;

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
  createdAt?: string;
}

interface AttentionSummaryStudent {
  userId: string | null;
  userRole: string | null;
  studentName: string;
  totalSamples: number;
  counts: Record<string, number>;
  percentages: Record<string, number>;
  attentionScore: number;
  allCounts?: Record<string, number>;
  allPercentages?: Record<string, number>;
  lastSeenAt: string | null;
}

interface AttentionSummaryResponse {
  sessionId?: string;
  summary: {
    counts: Record<string, number>;
    percentages: Record<string, number>;
    totalSamples: number;
    totalLearners: number;
    attentionScore: number;
    scoredSamples: number;
  };
  students: AttentionSummaryStudent[];
}

interface EmotionSample {
  emotion?: string;
  status?: string;
  timestamp?: string | number | Date;
}

interface EmotionDoc {
  name?: string;
  userId?: string | { _id?: string } | null;
  sessionId?: string;
  emotions?: EmotionSample[];
}

const parseApiResponse = async (res: Response) => {
  const raw = await res.text();
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return raw;
  }
};

const ATTENTION_SCORE_WEIGHTS: Record<string, number> = {
  engaged: 1,
  focused: 1,
  present: 0.8,
  rejoining: 0.7,
  distracted: 0.4,
  inactive: 0,
};

const normalizeAttentionKey = (value: unknown) => (typeof value === "string" ? value.trim().toLowerCase() : "");

const calculateAttentionSummaryFromDocs = (emotionDocs: EmotionDoc[]): AttentionSummaryResponse => {
  const counts: Record<string, number> = {
    engaged: 0,
    focused: 0,
    distracted: 0,
    inactive: 0,
    present: 0,
    rejoining: 0,
  };

  const studentsByUserId = new Map<string, AttentionSummaryStudent>();

  emotionDocs.forEach((doc) => {
    const userId = typeof doc.userId === "string" ? doc.userId : doc.userId?._id || null;
    const studentKey = userId || doc.name || doc.sessionId || "unknown";
    const studentName = doc.name || "Unknown student";

    if (!studentsByUserId.has(studentKey)) {
      studentsByUserId.set(studentKey, {
        userId: userId || null,
        userRole: "learner",
        studentName,
        totalSamples: 0,
        counts: {
          engaged: 0,
          focused: 0,
          distracted: 0,
          inactive: 0,
        },
        percentages: {
          engaged: 0,
          focused: 0,
          distracted: 0,
          inactive: 0,
        },
        attentionScore: 0,
        allCounts: {
          engaged: 0,
          focused: 0,
          distracted: 0,
          inactive: 0,
          present: 0,
          rejoining: 0,
        },
        allPercentages: {
          engaged: 0,
          focused: 0,
          distracted: 0,
          inactive: 0,
          present: 0,
          rejoining: 0,
        },
        lastSeenAt: null,
      });
    }

    const student = studentsByUserId.get(studentKey)!;
    const samples = Array.isArray(doc.emotions) ? doc.emotions : [];

    samples.forEach((sample) => {
      const key = normalizeAttentionKey(sample?.emotion ?? sample?.status);
      if (!key) return;

      student.totalSamples += 1;

      if (key in counts) {
        counts[key] += 1;
      }

      if (student.allCounts && key in student.allCounts) {
        student.allCounts[key] = (student.allCounts[key] || 0) + 1;
      }

      if (key === "engaged" || key === "focused" || key === "distracted" || key === "inactive") {
        student.counts[key] += 1;
      }

      const timestamp = sample.timestamp ? new Date(sample.timestamp) : null;
      if (timestamp && !Number.isNaN(timestamp.getTime())) {
        const currentLastSeen = student.lastSeenAt ? new Date(student.lastSeenAt).getTime() : 0;
        if (!currentLastSeen || timestamp.getTime() > currentLastSeen) {
          student.lastSeenAt = timestamp.toISOString();
        }
      }
    });

    const sampleTotal = student.totalSamples;
    student.percentages = {
      engaged: sampleTotal ? Number(((student.counts.engaged / sampleTotal) * 100).toFixed(1)) : 0,
      focused: sampleTotal ? Number(((student.counts.focused / sampleTotal) * 100).toFixed(1)) : 0,
      distracted: sampleTotal ? Number(((student.counts.distracted / sampleTotal) * 100).toFixed(1)) : 0,
      inactive: sampleTotal ? Number(((student.counts.inactive / sampleTotal) * 100).toFixed(1)) : 0,
    };

    student.allPercentages = {
      engaged: sampleTotal ? Number(((student.allCounts?.engaged || 0) / sampleTotal * 100).toFixed(1)) : 0,
      focused: sampleTotal ? Number(((student.allCounts?.focused || 0) / sampleTotal * 100).toFixed(1)) : 0,
      distracted: sampleTotal ? Number(((student.allCounts?.distracted || 0) / sampleTotal * 100).toFixed(1)) : 0,
      inactive: sampleTotal ? Number(((student.allCounts?.inactive || 0) / sampleTotal * 100).toFixed(1)) : 0,
      present: sampleTotal ? Number(((student.allCounts?.present || 0) / sampleTotal * 100).toFixed(1)) : 0,
      rejoining: sampleTotal ? Number(((student.allCounts?.rejoining || 0) / sampleTotal * 100).toFixed(1)) : 0,
    };

    const weightedScore =
      (student.allCounts?.engaged || 0) * ATTENTION_SCORE_WEIGHTS.engaged +
      (student.allCounts?.focused || 0) * ATTENTION_SCORE_WEIGHTS.focused +
      (student.allCounts?.present || 0) * ATTENTION_SCORE_WEIGHTS.present +
      (student.allCounts?.rejoining || 0) * ATTENTION_SCORE_WEIGHTS.rejoining +
      (student.allCounts?.distracted || 0) * ATTENTION_SCORE_WEIGHTS.distracted +
      (student.allCounts?.inactive || 0) * ATTENTION_SCORE_WEIGHTS.inactive;

    student.attentionScore = sampleTotal ? Number(((weightedScore / sampleTotal) * 100).toFixed(1)) : 0;
  });

  const students = Array.from(studentsByUserId.values()).sort((a, b) => b.totalSamples - a.totalSamples || a.studentName.localeCompare(b.studentName));
  const totalSamples = students.reduce((acc, student) => acc + student.totalSamples, 0);

  const percentages = Object.keys(counts).reduce((acc, key) => {
    acc[key] = totalSamples ? Number(((counts[key] / totalSamples) * 100).toFixed(1)) : 0;
    return acc;
  }, {} as Record<string, number>);

  const weightedSummaryScore =
    counts.engaged * ATTENTION_SCORE_WEIGHTS.engaged +
    counts.focused * ATTENTION_SCORE_WEIGHTS.focused +
    counts.present * ATTENTION_SCORE_WEIGHTS.present +
    counts.rejoining * ATTENTION_SCORE_WEIGHTS.rejoining +
    counts.distracted * ATTENTION_SCORE_WEIGHTS.distracted +
    counts.inactive * ATTENTION_SCORE_WEIGHTS.inactive;

  const summary: AttentionSummaryResponse = {
    summary: {
      counts: {
        engaged: counts.engaged,
        focused: counts.focused,
        distracted: counts.distracted,
        inactive: counts.inactive,
      },
      percentages,
      totalSamples,
      totalLearners: studentsByUserId.size,
      attentionScore: totalSamples ? Number(((weightedSummaryScore / totalSamples) * 100).toFixed(1)) : 0,
      scoredSamples: totalSamples,
    },
    students,
  };

  console.log("calculated summary:", summary);
  return summary;
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

const dashboardCards = [
  {
    title: "Live session control",
    description: "Monitor active rooms, attendance, and attention insights in one place.",
    icon: Radio,
    gradient: "from-rose-500/20 via-fuchsia-500/15 to-violet-500/20",
  },
  {
    title: "Learner engagement",
    description: "See how students interact with face detection and attention tracking.",
    icon: BrainCircuit,
    gradient: "from-indigo-500/20 via-sky-500/15 to-cyan-500/20",
  },
  {
    title: "Attendance breakdown",
    description: "Open a session to review detected and not detected participants.",
    icon: Target,
    gradient: "from-emerald-500/20 via-teal-500/15 to-cyan-500/20",
  },
];

const backdropStyles = `
  @keyframes floatSoft {
    0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
    50% { transform: translate3d(0, -18px, 0) scale(1.04); }
  }
`;

const MentorDashboardPage = () => {
  const { user: authUser, loading } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<DbSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [particlesReady, setParticlesReady] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [attentionSummary, setAttentionSummary] = useState<AttentionSummaryResponse | null>(null);
  const [attentionLoading, setAttentionLoading] = useState(false);
  const [attentionError, setAttentionError] = useState("");

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
        ).sort((a, b) => {
          const aTime = new Date(a.scheduledAt || a.createdAt || 0).getTime();
          const bTime = new Date(b.scheduledAt || b.createdAt || 0).getTime();

          if (Number.isNaN(aTime) && Number.isNaN(bTime)) return 0;
          if (Number.isNaN(aTime)) return 1;
          if (Number.isNaN(bTime)) return -1;

          return bTime - aTime;
        });

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

  const selectedSession = useMemo(
    () => sessions.find((session) => session._id === selectedSessionId) || sessions[0] || null,
    [selectedSessionId, sessions]
  );

  useEffect(() => {
    const roomId = selectedSession?.roomId?.trim() || "";

    if (!roomId) {
      setAttentionSummary(null);
      setAttentionError("");
      return;
    }

    const controller = new AbortController();

    const loadSummary = async () => {
      setAttentionLoading(true);
      setAttentionError("");

      try {
        const primaryResponse = await fetch(`${API_BASE}/emotion/debug/${encodeURIComponent(roomId)}`, {
          signal: controller.signal,
        });
        const primaryData = await parseApiResponse(primaryResponse);
        console.debug("[mentor-dashboard] fetched attention summary", { roomId, status: primaryResponse.status, body: primaryData });

        if (!primaryResponse.ok) {
          const messageBody = primaryData && typeof primaryData === "object" ? JSON.stringify(primaryData) : String(primaryData);
          throw new Error(`Failed to load attention summary (status: ${primaryResponse.status}) ${messageBody}`);
        }

        const emotionDocs = Array.isArray(primaryData?.emotions)
          ? (primaryData.emotions as EmotionDoc[])
          : Array.isArray(primaryData)
            ? (primaryData as EmotionDoc[])
            : [];

        console.log("emotion docs:", emotionDocs);
        const summary = calculateAttentionSummaryFromDocs(emotionDocs);
        setAttentionSummary(summary);
      } catch (error) {
        if (!controller.signal.aborted) {
          setAttentionSummary(null);
          const msg = error instanceof Error ? error.message : "Failed to load attention summary";
          console.warn("[mentor-dashboard] attention load error:", msg);
          setAttentionError(msg);
        }
      } finally {
        if (!controller.signal.aborted) {
          setAttentionLoading(false);
        }
      }
    };

    void loadSummary();

    return () => {
      controller.abort();
    };
  }, [selectedSession?.roomId]);

  const visibleAttentionSummary = useMemo(() => {
    if (!attentionSummary) return null;

    const filteredStudents = attentionSummary.students.filter((student) => {
      if (!student.userRole) return true;
      return student.userRole === "learner";
    });

    return {
      ...attentionSummary,
      summary: {
        ...attentionSummary.summary,
        totalLearners: filteredStudents.length,
      },
      totalSamples: attentionSummary.summary.totalSamples,
      attentionScore: attentionSummary.summary.attentionScore,
      students: filteredStudents,
    };
  }, [attentionSummary]);

  const metrics = [
    { label: "Sessions Created", value: String(sessions.length), icon: Calendar },
    { label: "Live Now", value: String(sessions.filter((session) => session.status === "live").length), icon: Radio },
    { label: "Completed", value: String(sessions.filter((session) => session.status === "completed").length), icon: BarChart3 },
    { label: "Students Tracked", value: String(visibleAttentionSummary?.summary.totalLearners || 0), icon: Users },
  ];

  if (loading) {
    return <div className="min-h-screen grid place-items-center bg-background text-sm sm:text-base">Loading mentor dashboard...</div>;
  }

  if (!authUser || authUser.role !== "mentor") {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.14),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.12),_transparent_28%),linear-gradient(135deg,_#f7faff_0%,_#eef4ff_46%,_#fcfdff_100%)]">
      <style>{backdropStyles}</style>
      <div className="absolute inset-0 pointer-events-none opacity-70" aria-hidden="true">
        {particlesReady && <Particles id="mentor-dashboard-particles" className="h-full w-full" options={particlesOptions} />}
      </div>

      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute -left-24 top-12 h-72 w-72 rounded-full bg-sky-300/20 blur-3xl" />
        <div className="absolute -right-20 bottom-8 h-80 w-80 rounded-full bg-indigo-300/20 blur-3xl" />
        <div className="absolute left-1/3 top-1/3 h-40 w-40 rounded-full bg-fuchsia-300/15 blur-3xl" style={{ animation: "floatSoft 9s ease-in-out infinite" }} />
      </div>

      <div className="relative z-10">
        <Navbar />
        <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:space-y-8 sm:px-6 sm:py-10 lg:px-8">
          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative overflow-hidden rounded-[2rem] border border-white/60 bg-white/45 p-6 shadow-[0_30px_80px_rgba(91,80,171,0.14)] backdrop-blur-2xl sm:p-8"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-white/25 to-indigo-100/30" aria-hidden="true" />
            <div className="absolute -right-10 top-0 h-40 w-40 rounded-full bg-fuchsia-400/20 blur-3xl" aria-hidden="true" />
            <div className="absolute bottom-0 left-1/2 h-44 w-44 -translate-x-1/2 rounded-full bg-sky-400/20 blur-3xl" aria-hidden="true" />

            <div className="relative z-10 grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
              <div className="flex h-full flex-col justify-center">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-indigo-700 shadow-sm backdrop-blur-md">
                  <Sparkles className="h-3.5 w-3.5" /> Mentor workspace
                </div>
                <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                  Mentor Dashboard,<br />{authUser.name}!
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                  Track live sessions, review attendance intelligence, and spot learner engagement patterns in a polished teaching workspace.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  {["Live rooms", "Attendance insights", "Student attention", "Session archive"].map((item) => (
                    <div key={item} className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/65 px-4 py-2 text-sm text-slate-700 shadow-sm backdrop-blur-md">
                      <ShieldCheck className="h-4 w-4 text-indigo-600" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-1">
                {dashboardCards.map((card, index) => {
                  const CardIcon = card.icon;
                  return (
                    <motion.div
                      key={card.title}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, delay: 0.05 * index }}
                      whileHover={{ y: -4, scale: 1.01 }}
                      className={`group relative overflow-hidden rounded-[1.75rem] border border-white/70 bg-white/65 p-4 shadow-lg shadow-indigo-500/10 backdrop-blur-xl`}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-70`} aria-hidden="true" />
                      <div className="absolute inset-0 bg-white/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100" aria-hidden="true" />
                      <div className="relative z-10 flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/75 shadow-sm ring-1 ring-white/80 backdrop-blur-md">
                          <CardIcon className="h-5 w-5 text-indigo-700" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{card.title}</p>
                          <p className="mt-1 text-xs leading-5 text-muted-foreground">{card.description}</p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.section>

          <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {metrics.map((metric, index) => (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.04 * index }}
                whileHover={{ y: -4 }}
              >
                <Card className="border-white/70 bg-white/70 shadow-[0_18px_40px_rgba(91,80,171,0.08)] backdrop-blur-xl transition-all duration-300 hover:border-indigo-300/50 hover:bg-white/80">
                  <CardContent className="flex items-center justify-between gap-3 p-3 sm:p-5">
                    <div className="min-w-0">
                      <p className="truncate text-xs text-muted-foreground sm:text-sm">{metric.label}</p>
                      <p className="mt-1 text-xl font-bold text-foreground sm:text-2xl">{metric.value}</p>
                    </div>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/15 to-violet-500/15 text-primary shadow-sm">
                      <metric.icon className="h-5 w-5" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </section>

          <section className="grid gap-4 lg:grid-cols-[1.08fr_0.92fr] sm:gap-6">
            <Card className="overflow-hidden border-white/70 bg-white/80 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
              <CardHeader className="space-y-2 border-b border-white/60 bg-gradient-to-r from-white/80 to-indigo-50/40">
                <CardTitle className="text-lg sm:text-xl">Your Sessions</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Choose a session to open its attendance and attention insights.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 p-4 sm:p-6">
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
                        className={`w-full rounded-2xl border p-4 text-left transition-all duration-300 ${isSelected ? "border-indigo-300 bg-gradient-to-r from-indigo-50 via-white to-violet-50 shadow-[0_14px_32px_rgba(91,80,171,0.12)]" : "border-border/60 bg-white/60 hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-white/80"}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground truncate">{session.title}</p>
                            <p className="text-xs sm:text-sm text-muted-foreground truncate">{session.topic} · Room {session.roomId}</p>
                          </div>
                          <Badge className="shrink-0 border-0 bg-white/80 text-foreground capitalize shadow-sm backdrop-blur-md">
                            {session.status}
                          </Badge>
                        </div>
                        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                          <span>{new Date(session.scheduledAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</span>
                          <span className="inline-flex items-center gap-1 font-medium text-indigo-700">View <ChevronRight className="h-3.5 w-3.5" /></span>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/70 bg-white/55 p-6 text-sm text-muted-foreground backdrop-blur-md">
                    No mentor sessions found yet. Create one in your profile to start collecting attention insights.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-white/70 bg-white/80 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
              <CardHeader className="space-y-2 border-b border-white/60 bg-gradient-to-r from-white/80 to-indigo-50/40">
                <CardTitle className="text-lg sm:text-xl">Attention Tracking Summary</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  {selectedSession ? `${selectedSession.title} · Room ${selectedSession.roomId}` : "Select a session to view insights."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-4 sm:p-6">
                {attentionLoading ? (
                  <p className="text-sm text-muted-foreground">Loading attention data...</p>
                ) : attentionError ? (
                  <p className="text-sm text-destructive">{attentionError}</p>
                ) : visibleAttentionSummary ? (
                  <>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {ATTENTION_KEYS.map((entry) => (
                        <div key={entry.key} className="rounded-xl border border-white/70 bg-white/65 p-3 shadow-sm backdrop-blur-md">
                          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{entry.label}</p>
                          <p className="mt-1 text-lg font-bold text-foreground">{visibleAttentionSummary.summary.percentages[entry.key] ?? 0}%</p>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="rounded-xl border border-white/70 bg-white/65 p-4 shadow-sm backdrop-blur-md">
                        <p className="text-xs text-muted-foreground">Total Samples</p>
                        <p className="text-2xl font-bold text-foreground mt-1">{visibleAttentionSummary.summary.totalSamples}</p>
                      </div>
                      <div className="rounded-xl border border-white/70 bg-white/65 p-4 shadow-sm backdrop-blur-md">
                        <p className="text-xs text-muted-foreground">Attention Score</p>
                        <p className="text-2xl font-bold text-foreground mt-1">{visibleAttentionSummary.summary.attentionScore}%</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-sm font-semibold text-foreground">Student Attention Breakdown</h3>
                        <Badge className="border-0 bg-indigo-600/10 text-indigo-700 shadow-sm">{visibleAttentionSummary.summary.totalLearners} students</Badge>
                      </div>

                      <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                        {visibleAttentionSummary.students.length > 0 ? visibleAttentionSummary.students.map((student) => (
                          <div key={student.userId || student.studentName} className="rounded-2xl border border-white/70 bg-white/75 p-4 shadow-sm backdrop-blur-md">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="font-semibold text-foreground">{student.studentName}</p>
                                <p className="text-xs text-muted-foreground capitalize">Role: {student.userRole || "learner"}</p>
                              </div>
                              <Badge className="border-0 bg-slate-900 text-white shadow-sm">Attention {student.attentionScore}%</Badge>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {ATTENTION_KEYS.map((entry) => (
                                <span key={entry.key} className="rounded-full border border-white/70 bg-white/70 px-2.5 py-1 text-[11px] text-muted-foreground shadow-sm backdrop-blur-md">
                                  {entry.label}: {student.percentages[entry.key] ?? 0}%
                                </span>
                              ))}
                              {student.allPercentages?.present !== undefined && (
                                <span className="rounded-full border border-emerald-200/70 bg-emerald-100/50 px-2.5 py-1 text-[11px] text-emerald-700 shadow-sm">
                                  Present: {student.allPercentages.present}%
                                </span>
                              )}
                              {student.allPercentages?.rejoining !== undefined && (
                                <span className="rounded-full border border-blue-200/70 bg-blue-100/50 px-2.5 py-1 text-[11px] text-blue-700 shadow-sm">
                                  Rejoining: {student.allPercentages.rejoining}%
                                </span>
                              )}
                              <span className="rounded-full border border-white/70 bg-white/70 px-2.5 py-1 text-[11px] text-muted-foreground shadow-sm backdrop-blur-md">
                                Samples: {student.totalSamples}
                              </span>
                            </div>
                          </div>
                        )) : (
                          <div className="rounded-2xl border border-dashed border-white/70 bg-white/55 p-5 text-sm text-muted-foreground backdrop-blur-md">
                            No student attention samples recorded for this session yet.
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/70 bg-white/55 p-5 text-sm text-muted-foreground backdrop-blur-md">
                    Choose a session to load attention analytics.
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          {selectedSession && (
            <section>
              <Card className="overflow-hidden border-white/70 bg-white/80 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
                <CardHeader className="space-y-2 border-b border-white/60 bg-gradient-to-r from-white/80 to-indigo-50/40">
                  <CardTitle className="text-lg sm:text-xl">Attendance Breakdown</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Face detected and face not detected users for {selectedSession.title} · Room {selectedSession.roomId}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <SessionAttendanceView sessionId={selectedSession._id} mentorId={selectedSession.mentorId} />
                </CardContent>
              </Card>
            </section>
          )}

          <section className="grid gap-4 md:grid-cols-3">
            <Card className="border-white/70 bg-white/75 backdrop-blur-xl shadow-[0_18px_40px_rgba(91,80,171,0.08)]">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-indigo-700">
                  <Layers3 className="h-3.5 w-3.5" /> Session room
                </div>
                <p className="mt-2 text-sm font-medium text-foreground">Jump into the current live room and observe in real time.</p>
                <Button asChild className="mt-4 w-full gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/20">
                  <Link to={selectedSession ? `/room/${selectedSession.roomId}?name=${encodeURIComponent(authUser.name)}` : "/sessions"}>
                    Open Live Room <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-white/70 bg-white/75 backdrop-blur-xl shadow-[0_18px_40px_rgba(91,80,171,0.08)]">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-indigo-700">
                  <MessageSquareMore className="h-3.5 w-3.5" /> Session hub
                </div>
                <p className="mt-2 text-sm font-medium text-foreground">Review live teaching context and participant activity in the sessions area.</p>
                <Button asChild variant="outline" className="mt-4 w-full rounded-2xl border-white/70 bg-white/75 backdrop-blur-md">
                  <Link to="/sessions">
                    Open Sessions
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-white/70 bg-white/75 backdrop-blur-xl shadow-[0_18px_40px_rgba(91,80,171,0.08)]">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-indigo-700">
                  <Zap className="h-3.5 w-3.5" /> Mentor profile
                </div>
                <p className="mt-2 text-sm font-medium text-foreground">Keep your profile current so learners can discover you faster.</p>
                <Button asChild variant="outline" className="mt-4 w-full rounded-2xl border-white/70 bg-white/75 backdrop-blur-md">
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