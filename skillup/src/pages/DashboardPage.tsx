import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Clock, BookOpen, TrendingUp, Star, ArrowRight, Video, Users, PlusCircle, BarChart3, Radio, UserPlus, CheckCircle2, Sparkles, ShieldCheck, ChevronRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import SessionAttendanceView from "@/components/SessionAttendanceView";
import { skills } from "@/data/mockData";
import { useAuth } from "@/features/authsystem/AuthContext";
import { API_BASE } from "@/features/authsystem/config";

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

const parseApiResponse = async (res: Response) => {
  const raw = await res.text();
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return raw;
  }
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
      opacity: 0.25,
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
      value: 60,
    },
    opacity: {
      value: 0.25,
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

const C = {
  bg: "transparent",
};

const DashboardBackdrop = () => (
  <>
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
      aria-hidden="true"
    />
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }} aria-hidden="true">
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
  </>
);

const DashboardPage = () => {
  const { user: authUser, token, logout } = useAuth();
  const navigate = useNavigate();
  const [sessionsData, setSessionsData] = useState<DbSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [particlesReady, setParticlesReady] = useState(false);
  const [selectedAttendanceSessionId, setSelectedAttendanceSessionId] = useState<string | null>(null);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      setParticlesReady(true);
    });
  }, []);

  useEffect(() => {
    if (!authUser) {
      navigate("/landing", { replace: true });
    }
  }, [authUser, navigate]);

  useEffect(() => {
    // Keep the current route in history so browser back can be confirmed first.
    window.history.pushState({ dashboardGuard: true }, "", window.location.href);

    const onPopState = () => {
      const shouldExit = window.confirm("Do you want to exit the dashboard?");

      if (shouldExit) {
        logout();
        return;
      }

      window.history.pushState({ dashboardGuard: true }, "", window.location.href);
    };

    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("popstate", onPopState);
    };
  }, [logout, navigate]);

  useEffect(() => {
    let isActive = true;
    let isFetching = false;
    let activeController: AbortController | null = null;

    const loadSessions = async (showLoader = false) => {
      if (isFetching) return;
      isFetching = true;

      if (showLoader && isActive) {
        setLoadingSessions(true);
      }

      const controller = new AbortController();
      activeController = controller;

      try {
        const res = await fetch(`${API_BASE}/sessions`, { signal: controller.signal });
        const data = await parseApiResponse(res);
        if (!res.ok || !isActive) return;
        const list =
          data && typeof data === "object" && "sessions" in data && Array.isArray((data as { sessions: unknown[] }).sessions)
            ? ((data as { sessions: DbSession[] }).sessions)
            : [];
        setSessionsData(list);
      } catch {
        if (!controller.signal.aborted && isActive) setSessionsData([]);
      } finally {
        if (!controller.signal.aborted && isActive) setLoadingSessions(false);
        isFetching = false;
      }
    };

    const refreshIfVisible = () => {
      if (document.visibilityState === "visible") {
        void loadSessions(false);
      }
    };

    void loadSessions(true);

    const refreshInterval = window.setInterval(() => {
      void refreshIfVisible();
    }, 15000);

    window.addEventListener("focus", refreshIfVisible);
    document.addEventListener("visibilitychange", refreshIfVisible);

    return () => {
      isActive = false;
      activeController?.abort();
      window.clearInterval(refreshInterval);
      window.removeEventListener("focus", refreshIfVisible);
      document.removeEventListener("visibilitychange", refreshIfVisible);
    };
  }, []);

  const role = authUser?.role || null;
  const isMentor = role === "mentor";
  const isLearner = role === "learner";

  const dashboardBadge = isMentor ? "Mentor workspace" : "Learner workspace";
  const dashboardTitle = isMentor ? "Mentor Dashboard" : "Learner Dashboard";
  const dashboardDescription = isMentor
    ? "Manage your sessions, control live rooms, and track teaching activity from a polished workspace."
    : "Track your learning progress, join live sessions, and jump into what matters next.";

  const dashboardPills = isMentor
    ? ["Live rooms", "Attendance insights", "Student attention", "Session archive"]
    : ["Live sessions", "Mentor discovery", "Attendance tracking", "Quick actions"];

  const dashboardHighlights = isMentor
    ? [
        {
          title: "Session control",
          description: "Monitor active rooms and attendance in one place.",
          icon: Radio,
          gradient: "from-rose-500/20 via-fuchsia-500/15 to-violet-500/20",
        },
        {
          title: "Student insights",
          description: "Review engagement patterns and session signals.",
          icon: BarChart3,
          gradient: "from-indigo-500/20 via-sky-500/15 to-cyan-500/20",
        },
        {
          title: "Room archive",
          description: "Jump back to completed sessions and attendance.",
          icon: CheckCircle2,
          gradient: "from-emerald-500/20 via-teal-500/15 to-cyan-500/20",
        },
      ]
    : [
        {
          title: "Upcoming sessions",
          description: "See what is next and keep your schedule in view.",
          icon: Calendar,
          gradient: "from-rose-500/20 via-fuchsia-500/15 to-violet-500/20",
        },
        {
          title: "Live rooms",
          description: "Join sessions already in progress without hunting for links.",
          icon: Video,
          gradient: "from-indigo-500/20 via-sky-500/15 to-cyan-500/20",
        },
        {
          title: "Mentor discovery",
          description: "Browse mentors and topics that fit your learning goals.",
          icon: Star,
          gradient: "from-emerald-500/20 via-teal-500/15 to-cyan-500/20",
        },
      ];

  const authEmail = authUser?.email?.trim().toLowerCase() || "";
  const mentorSessions = sessionsData.filter(
    (session) =>
      isMentor &&
      authUser?._id === session.mentorId &&
      authEmail === session.mentorEmail.trim().toLowerCase()
  );

  const learnerUpcoming = sessionsData.filter((session) => session.status === "scheduled").slice(0, 3);
  const learnerLive = sessionsData.filter((session) => session.status === "live").slice(0, 3);
  const mentorUpcoming = mentorSessions.filter((session) => session.status === "scheduled").slice(0, 3);
  const mentorLive = mentorSessions.filter((session) => session.status === "live").slice(0, 3);
  const mentorCompleted = mentorSessions.filter((session) => session.status === "completed");

  const learnerStats = [
    { label: "Sessions Joined", value: "12", icon: Video, color: "bg-primary/10 text-primary" },
    { label: "Upcoming Sessions", value: String(learnerUpcoming.length), icon: Calendar, color: "bg-secondary/10 text-secondary" },
    { label: "Live Sessions", value: String(learnerLive.length), icon: Radio, color: "bg-accent/10 text-accent" },
    { label: "Mentors Followed", value: String(authUser?.following?.length || 0), icon: UserPlus, color: "bg-primary/10 text-primary" },
  ];

  const mentorStats = [
    { label: "Sessions Created", value: String(mentorSessions.length), icon: PlusCircle, color: "bg-primary/10 text-primary" },
    { label: "Completed", value: String(mentorCompleted.length), icon: BarChart3, color: "bg-secondary/10 text-secondary" },
    { label: "Live Sessions", value: String(mentorLive.length), icon: Radio, color: "bg-accent/10 text-accent" },
  ];

  const visibleStats = isMentor ? mentorStats : learnerStats;

  const nextUpcomingSession = isMentor ? mentorUpcoming[0] || mentorLive[0] : learnerUpcoming[0] || learnerLive[0];
  const liveSessions = isMentor ? mentorLive : learnerLive;

  const formatDate = (isoDate: string) => {
    const parsed = new Date(isoDate);
    return Number.isNaN(parsed.getTime()) ? isoDate : parsed.toLocaleDateString();
  };

  const formatTime = (isoDate: string) => {
    const parsed = new Date(isoDate);
    return Number.isNaN(parsed.getTime()) ? "" : parsed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (!authUser) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.14),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.12),_transparent_28%),linear-gradient(135deg,_#f7faff_0%,_#eef4ff_46%,_#fcfdff_100%)]">
        <DashboardBackdrop />
        <div className="absolute inset-0 pointer-events-none opacity-70" aria-hidden="true">
          {particlesReady && <Particles id="dashboard-particles" className="h-full w-full" options={particlesOptions} />}
        </div>
        <div className="relative z-10">
          <Navbar />
          <main className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
            <Card className="overflow-hidden border-white/70 bg-white/75 shadow-[0_24px_70px_rgba(91,80,171,0.12)] backdrop-blur-xl">
              <CardContent className="relative p-6 text-center sm:p-10">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/15 to-violet-500/15 text-indigo-700 shadow-sm ring-1 ring-white/80">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h1 className="mt-5 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Please sign in to view your dashboard.</h1>
                <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                  Your dashboard will switch automatically based on your role after login.
                </p>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.14),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.12),_transparent_28%),linear-gradient(135deg,_#f7faff_0%,_#eef4ff_46%,_#fcfdff_100%)]">
      <DashboardBackdrop />
      <div className="absolute inset-0 pointer-events-none opacity-70" aria-hidden="true">
        {particlesReady && <Particles id="dashboard-particles" className="h-full w-full" options={particlesOptions} />}
      </div>

      <div className="relative z-10">
        <Navbar />
        <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:space-y-8 sm:px-6 sm:py-10 lg:px-8">
          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/45 p-6 shadow-[0_30px_80px_rgba(91,80,171,0.14)] backdrop-blur-2xl sm:p-8"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-white/25 to-indigo-100/30" aria-hidden="true" />
            <div className="absolute -right-10 top-0 h-40 w-40 rounded-full bg-fuchsia-400/20 blur-3xl" aria-hidden="true" />
            <div className="absolute bottom-0 left-1/2 h-44 w-44 -translate-x-1/2 rounded-full bg-sky-400/20 blur-3xl" aria-hidden="true" />

            <div className="relative z-10 grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
              <div className="flex h-full flex-col justify-center">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-indigo-700 shadow-sm backdrop-blur-md">
                  <Sparkles className="h-3.5 w-3.5" /> {dashboardBadge}
                </div>
                <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                  {dashboardTitle},<br />{authUser.name}!
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                  {dashboardDescription}
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  {dashboardPills.map((item) => (
                    <div key={item} className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/65 px-4 py-2 text-sm text-slate-700 shadow-sm backdrop-blur-md">
                      <ShieldCheck className="h-4 w-4 text-indigo-600" />
                      {item}
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link to={isMentor ? "/sessions" : "/sessions"}>
                    <Button className="gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/20">
                      {isMentor ? "Manage sessions" : "Browse sessions"}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link to={isMentor ? "/profile" : "/mentors"}>
                    <Button variant="outline" className="gap-2 rounded-2xl border-white/70 bg-white/75 backdrop-blur-md">
                      {isMentor ? "Update profile" : "Find mentors"}
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-1">
                {dashboardHighlights.map((card, index) => {
                  const CardIcon = card.icon;
                  return (
                    <motion.div
                      key={card.title}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, delay: 0.05 * index }}
                      whileHover={{ y: -4, scale: 1.01 }}
                      className="group relative overflow-hidden rounded-[1.75rem] border border-white/70 bg-white/65 p-4 shadow-lg shadow-indigo-500/10 backdrop-blur-xl"
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

          <section className={`grid grid-cols-2 gap-3 sm:gap-4 ${isMentor ? "lg:grid-cols-3" : "lg:grid-cols-4"}`}>
            {visibleStats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.04 * index }}
                whileHover={{ y: -4 }}
              >
                <Card className="border-white/70 bg-white/70 shadow-[0_18px_40px_rgba(91,80,171,0.08)] backdrop-blur-xl transition-all duration-300 hover:border-indigo-300/50 hover:bg-white/80">
                  <CardContent className="flex items-center justify-between gap-3 p-3 sm:p-5">
                    <div className="min-w-0">
                      <p className="truncate text-xs text-muted-foreground sm:text-sm">{stat.label}</p>
                      <p className="mt-1 text-xl font-bold text-foreground sm:text-2xl">{stat.value}</p>
                    </div>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/15 to-violet-500/15 text-primary shadow-sm">
                      <stat.icon className="h-5 w-5" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </section>

          {isLearner ? (
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <Card className="overflow-hidden border-white/70 bg-white/80 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
                  <CardHeader className="space-y-2 border-b border-white/60 bg-gradient-to-r from-white/80 to-indigo-50/40">
                    <CardTitle className="text-lg sm:text-xl">Next Upcoming Session</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">See your next live room and jump in when it starts.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    {loadingSessions ? (
                      <p className="text-muted-foreground">Loading sessions...</p>
                    ) : nextUpcomingSession ? (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Video className="w-5 h-5 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-medium text-foreground">{nextUpcomingSession.title}</h3>
                            <p className="text-sm text-muted-foreground truncate">with {nextUpcomingSession.mentorName}</p>
                          </div>
                        </div>
                        <div className="text-left sm:text-right">
                          <div className="text-sm font-medium text-foreground">{formatDate(nextUpcomingSession.scheduledAt)}</div>
                          <div className="text-xs text-muted-foreground">{formatTime(nextUpcomingSession.scheduledAt)}</div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No upcoming sessions found.</p>
                    )}
                  </CardContent>
                </Card>

                <Card className="overflow-hidden border-white/70 bg-white/80 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
                  <CardHeader className="space-y-2 border-b border-white/60 bg-gradient-to-r from-white/80 to-indigo-50/40">
                    <CardTitle className="text-lg sm:text-xl">Live Sessions</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">Join active sessions without leaving the dashboard.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 p-4 sm:p-6">
                    {liveSessions.length > 0 ? (
                      liveSessions.map((session) => (
                        <div key={session._id} className="bg-muted/30 rounded-xl border border-border/50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-4 min-w-0">
                            <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                              <Radio className="w-5 h-5 text-destructive" />
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-medium text-foreground">{session.title}</h3>
                              <p className="text-sm text-muted-foreground truncate">with {session.mentorName}</p>
                            </div>
                          </div>
                          <Button asChild>
                            <Link to={`/room/${session.roomId}?name=${encodeURIComponent(authUser.name)}`}>Join</Link>
                          </Button>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground">No live sessions right now.</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="overflow-hidden border-white/70 bg-white/80 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
                  <CardHeader className="space-y-2 border-b border-white/60 bg-gradient-to-r from-white/80 to-indigo-50/40">
                    <CardTitle className="text-lg sm:text-xl">Quick Actions</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">Get to the parts of the app you use most.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 p-4 sm:p-6">
                    <Link to="/sessions">
                      <Button variant="outline" className="w-full justify-start gap-2 mb-2 rounded-2xl border-white/70 bg-white/75 backdrop-blur-md">
                        <BookOpen className="w-4 h-4" /> Browse Sessions
                      </Button>
                    </Link>

                    <Link to="/mentors">
                      <Button variant="outline" className="w-full justify-start gap-2 rounded-2xl border-white/70 bg-white/75 backdrop-blur-md">
                        <Star className="w-4 h-4" /> Find Mentors
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                <Card className="overflow-hidden border-white/70 bg-white/80 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
                  <CardHeader className="space-y-2 border-b border-white/60 bg-gradient-to-r from-white/80 to-indigo-50/40">
                    <CardTitle className="text-lg sm:text-xl">Popular Topics</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">A quick view of the categories you may want to explore.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-wrap gap-2">
                      {skills.slice(0, 5).map((skill) => (
                        <Badge key={skill.id} variant="secondary" className="border-0 bg-muted text-muted-foreground">
                          {skill.category}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <Card className="overflow-hidden border-white/70 bg-white/80 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
                  <CardHeader className="space-y-2 border-b border-white/60 bg-gradient-to-r from-white/80 to-indigo-50/40">
                    <CardTitle className="text-lg sm:text-xl">Create Session</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">Create and publish new sessions from your mentor profile.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    <p className="text-sm text-muted-foreground">
                      Create and publish new sessions from your mentor profile.
                    </p>
                    <div className="mt-4 flex gap-3 flex-wrap">
                      <Button asChild>
                        <Link to="/profile">Create Session</Link>
                      </Button>
                      <Button variant="outline" asChild>
                        <Link to="/sessions">Manage Sessions</Link>
                      </Button>
                      <Button variant="outline" asChild>
                        <Link to="/dashboard">View Students</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="overflow-hidden border-white/70 bg-white/80 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
                  <CardHeader className="space-y-2 border-b border-white/60 bg-gradient-to-r from-white/80 to-indigo-50/40">
                    <CardTitle className="text-lg sm:text-xl">My Upcoming Sessions</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">Review your upcoming schedule and enter live rooms quickly.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 p-4 sm:p-6">
                    {loadingSessions ? (
                      <p className="text-muted-foreground">Loading sessions...</p>
                    ) : mentorUpcoming.length > 0 ? (
                      mentorUpcoming.map((session) => {
                        const isLive = session.status === "live";
                        return (
                          <div key={session._id} className="bg-muted/30 rounded-xl border border-border/50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="min-w-0">
                              <h3 className="font-medium text-foreground">{session.title}</h3>
                              <p className="text-sm text-muted-foreground">{formatDate(session.scheduledAt)} • {formatTime(session.scheduledAt)}</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Badge className={isLive ? "bg-destructive/10 text-destructive border-0" : "bg-primary/10 text-primary border-0"}>
                                {isLive ? "Live" : "Scheduled"}
                              </Badge>
                              {isLive ? (
                                <Button asChild>
                                  <Link to={`/room/${session.roomId}?name=${encodeURIComponent(authUser.name)}`}>Enter Session</Link>
                                </Button>
                              ) : (
                                <Button asChild>
                                  <Link to="/sessions">Start Live</Link>
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-muted-foreground">No upcoming sessions yet.</p>
                    )}
                  </CardContent>
                </Card>

                <Card className="overflow-hidden border-white/70 bg-white/80 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
                  <CardHeader className="space-y-2 border-b border-white/60 bg-gradient-to-r from-white/80 to-indigo-50/40">
                    <CardTitle className="text-lg sm:text-xl">Session Attendance</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">Open the attendance breakdown for completed sessions.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    {selectedAttendanceSessionId ? (
                      <div>
                        <Button
                          variant="ghost"
                          className="mb-4 gap-2"
                          onClick={() => setSelectedAttendanceSessionId(null)}
                        >
                          ← Back to session list
                        </Button>
                        <SessionAttendanceView
                          sessionId={selectedAttendanceSessionId}
                          mentorId={authUser?._id || ""}
                        />
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {loadingSessions ? (
                          <p className="text-muted-foreground">Loading sessions...</p>
                        ) : mentorCompleted.length > 0 ? (
                          mentorCompleted.map((session) => (
                            <div
                              key={session._id}
                              className="bg-muted/30 rounded-xl border border-border/50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                            >
                              <div className="min-w-0">
                                <h3 className="font-medium text-foreground">{session.title}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {formatDate(session.scheduledAt)} • Room {session.roomId}
                                </p>
                              </div>
                              <Button
                                variant="outline"
                                className="gap-2"
                                onClick={() => setSelectedAttendanceSessionId(session._id)}
                              >
                                <CheckCircle2 className="w-4 h-4" /> View Attendance
                              </Button>
                            </div>
                          ))
                        ) : (
                          <p className="text-muted-foreground">No completed sessions yet.</p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="overflow-hidden border-white/70 bg-white/80 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
                  <CardHeader className="space-y-2 border-b border-white/60 bg-gradient-to-r from-white/80 to-indigo-50/40">
                    <CardTitle className="text-lg sm:text-xl">Quick Actions</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">Shortcuts to the tools you use most.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 p-4 sm:p-6">
                    <Button variant="outline" className="w-full justify-start gap-2 rounded-2xl border-white/70 bg-white/75 backdrop-blur-md" asChild>
                      <Link to="/profile"><PlusCircle className="w-4 h-4" /> Create Session</Link>
                    </Button>
                    <Button variant="outline" className="w-full justify-start gap-2 rounded-2xl border-white/70 bg-white/75 backdrop-blur-md" asChild>
                      <Link to="/sessions"><BarChart3 className="w-4 h-4" /> Manage Sessions</Link>
                    </Button>
                    <Button variant="outline" className="w-full justify-start gap-2 rounded-2xl border-white/70 bg-white/75 backdrop-blur-md" asChild>
                      <Link to="/dashboard"><Users className="w-4 h-4" /> View Students</Link>
                    </Button>
                  </CardContent>
                </Card>

                <Card className="overflow-hidden border-white/70 bg-white/80 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
                  <CardHeader className="space-y-2 border-b border-white/60 bg-gradient-to-r from-white/80 to-indigo-50/40">
                    <CardTitle className="text-lg sm:text-xl">Session Statistics</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">A compact summary of your teaching activity.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 p-4 sm:p-6">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Sessions created</span>
                      <span className="font-medium text-foreground">{mentorSessions.length}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Completed</span>
                      <span className="font-medium text-foreground">{mentorCompleted.length}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Live now</span>
                      <span className="font-medium text-foreground">{mentorLive.length}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="overflow-hidden border-white/70 bg-white/80 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
                  <CardHeader className="space-y-2 border-b border-white/60 bg-gradient-to-r from-white/80 to-indigo-50/40">
                    <CardTitle className="text-lg sm:text-xl">Teaching Tools</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">Quick links for profile and session management.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 p-4 sm:p-6">
                    <Link to="/profile" className="block text-sm text-primary hover:underline">Update mentor profile</Link>
                    <Link to="/sessions" className="block text-sm text-primary hover:underline">Review session status</Link>
                    <Link to="/mentors" className="block text-sm text-primary hover:underline">See mentor directory</Link>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default DashboardPage;
