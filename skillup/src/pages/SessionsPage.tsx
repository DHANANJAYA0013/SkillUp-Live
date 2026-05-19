import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  CalendarDays,
  Clock,
  UserRound,
  Radio,
  PlayCircle,
  DoorOpen,
  CircleCheck,
  Sparkles,
  BrainCircuit,
  Bot,
  Users,
  ArrowRight,
  BookOpen,
  ClipboardList,
  GraduationCap,
  MessageSquareMore,
  WandSparkles,
  Flame,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import type { ISourceOptions } from "@tsparticles/engine";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { API_BASE } from "@/features/authsystem/config";
import { useAuth } from "@/features/authsystem/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface DbSession {
  _id: string;
  mentorId: string;
  title: string;
  description: string;
  date: string;
  startTime: string;
  scheduledAt: string;
  durationMinutes: number;
  topic: string;
  roomId: string;
  status: "scheduled" | "live" | "completed";
  mentorName: string;
  mentorEmail: string;
}

const parseApiResponse = async (res: Response) => {
  const raw = await res.text();
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return raw;
  }
};

const getMentorInitials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "M";

const getTopicIcon = (topic: string) => {
  const normalizedTopic = topic.toLowerCase();
  if (normalizedTopic.includes("ai") || normalizedTopic.includes("ml") || normalizedTopic.includes("machine")) return Bot;
  if (normalizedTopic.includes("design") || normalizedTopic.includes("ui") || normalizedTopic.includes("ux")) return WandSparkles;
  if (normalizedTopic.includes("code") || normalizedTopic.includes("development") || normalizedTopic.includes("web")) return BrainCircuit;
  if (normalizedTopic.includes("product") || normalizedTopic.includes("strategy")) return ClipboardList;
  if (normalizedTopic.includes("career") || normalizedTopic.includes("mentor")) return GraduationCap;
  if (normalizedTopic.includes("communication") || normalizedTopic.includes("community")) return MessageSquareMore;
  return BookOpen;
};

const getTopicTone = (topic: string) => {
  const normalizedTopic = topic.toLowerCase();
  if (normalizedTopic.includes("ai") || normalizedTopic.includes("ml") || normalizedTopic.includes("machine")) {
    return "from-violet-500/20 to-indigo-500/20 text-violet-700 border-violet-200/60";
  }
  if (normalizedTopic.includes("design") || normalizedTopic.includes("ui") || normalizedTopic.includes("ux")) {
    return "from-fuchsia-500/20 to-violet-500/20 text-fuchsia-700 border-fuchsia-200/60";
  }
  if (normalizedTopic.includes("code") || normalizedTopic.includes("development") || normalizedTopic.includes("web")) {
    return "from-indigo-500/20 to-blue-500/20 text-indigo-700 border-indigo-200/60";
  }
  return "from-slate-500/20 to-indigo-500/20 text-slate-700 border-slate-200/60";
};

const getParticipantCount = (session: DbSession) => {
  const countCandidate =
    (session as DbSession & { participantCount?: number; participantsCount?: number; attendeesCount?: number }).participantCount ??
    (session as DbSession & { participantCount?: number; participantsCount?: number; attendeesCount?: number }).participantsCount ??
    (session as DbSession & { participantCount?: number; participantsCount?: number; attendeesCount?: number }).attendeesCount;
  return Number.isFinite(Number(countCandidate)) ? Number(countCandidate) : 0;
};

const getSessionActivityLabel = (session: DbSession) => {
  if (session.status === "live") return "Live now";
  if (session.status === "scheduled") return "Starts soon";
  return "Session archived";
};

type SessionView = "live" | "upcoming" | "past";

const motionItem = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.45 },
};

const SessionsBackdrop = () => (
  <>
    <style>{`
      @keyframes floatSlow {
        0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
        50% { transform: translate3d(0, -22px, 0) scale(1.04); }
      }
      @keyframes pulseGlow {
        0%, 100% { opacity: 0.35; transform: scale(1); }
        50% { opacity: 0.7; transform: scale(1.08); }
      }
      @keyframes livePing {
        0% { transform: scale(0.9); opacity: 0.7; }
        70% { transform: scale(1.6); opacity: 0; }
        100% { transform: scale(1.6); opacity: 0; }
      }
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
          radial-gradient(ellipse 80% 60% at 80% 20%, rgba(167,139,250,0.18) 0%, transparent 60%),
          radial-gradient(ellipse 50% 40% at 10% 80%, rgba(99,102,241,0.12) 0%, transparent 62%),
          linear-gradient(180deg, #f5f3ff 0%, #eef2ff 52%, #f8fbff 100%)
        `,
      }}
      aria-hidden="true"
    />
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }} aria-hidden="true">
      <div style={{ position: "absolute", width: 540, height: 540, borderRadius: "50%", background: "radial-gradient(circle, rgba(167,139,250,0.18) 0%, transparent 70%)", top: "-12%", right: "-6%", animation: "orbFloat1 9s ease-in-out infinite" }} />
      <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)", bottom: "2%", left: "-10%", animation: "orbFloat2 11s ease-in-out infinite" }} />
      <div style={{ position: "absolute", width: 280, height: 280, borderRadius: "50%", background: "radial-gradient(circle, rgba(196,181,253,0.18) 0%, transparent 70%)", top: "48%", left: "40%", animation: "orbFloat3 8s ease-in-out infinite" }} />
      <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(rgba(255,255,255,0.75) 1px, transparent 1px)", backgroundSize: "28px 28px", opacity: 0.14, animation: "floatSlow 18s ease-in-out infinite" }} />
      <div style={{ position: "absolute", top: "18%", left: "22%", width: 10, height: 10, borderRadius: "50%", background: "rgba(129,140,248,0.85)", boxShadow: "0 0 32px rgba(129,140,248,0.9)", animation: "pulseGlow 4s ease-in-out infinite" }} />
      <div style={{ position: "absolute", top: "62%", right: "18%", width: 8, height: 8, borderRadius: "50%", background: "rgba(168,85,247,0.8)", boxShadow: "0 0 28px rgba(168,85,247,0.9)", animation: "pulseGlow 5s ease-in-out infinite" }} />
    </div>
  </>
);

const SessionsPage = () => {
  const navigate = useNavigate();
  const { user: authUser, token } = useAuth();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [activeTopic, setActiveTopic] = useState("All");
  const [showTopicRecommendations, setShowTopicRecommendations] = useState(false);
  const [activeView, setActiveView] = useState<SessionView>("live");
  const [particlesReady, setParticlesReady] = useState(false);
  const [sessionsData, setSessionsData] = useState<DbSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [sessionsError, setSessionsError] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      setParticlesReady(true);
    });
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const loadSessions = async () => {
      setLoadingSessions(true);
      setSessionsError("");

      try {
        const res = await fetch(`${API_BASE}/sessions`, {
          signal: controller.signal,
        });

        const data = await parseApiResponse(res);
        if (!res.ok) {
          const message =
            data && typeof data === "object" && "error" in data
              ? String((data as { error: unknown }).error)
              : "Failed to fetch sessions";
          throw new Error(message);
        }

        const list =
          data && typeof data === "object" && "sessions" in data && Array.isArray((data as { sessions: unknown[] }).sessions)
            ? ((data as { sessions: DbSession[] }).sessions)
            : [];

        setSessionsData(list);
      } catch (error) {
        if (controller.signal.aborted) return;
        setSessionsData([]);
        setSessionsError(error instanceof Error ? error.message : "Failed to fetch sessions");
      } finally {
        if (!controller.signal.aborted) {
          setLoadingSessions(false);
        }
      }
    };

    loadSessions();

    return () => controller.abort();
  }, []);

  const particlesOptions = useMemo<ISourceOptions>(
    () => ({
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
            mode: "grab",
          },
          resize: {
            enable: true,
          },
        },
        modes: {
          grab: {
            distance: 140,
            links: {
              opacity: 0.35,
            },
          },
        },
      },
      particles: {
        color: {
          value: "#a0b1f3",
        },
        links: {
          color: "#95abf3",
          distance: 140,
          enable: true,
          opacity: 0.35,
          width: 1,
        },
        move: {
          direction: "none",
          enable: true,
          outModes: {
            default: "out",
          },
          random: false,
          speed: 0.7,
          straight: false,
        },
        number: {
          density: {
            enable: true,
          },
          value: 45,
        },
        opacity: {
          value: 0.42,
        },
        shape: {
          type: "circle",
        },
        size: {
          value: { min: 1, max: 3 },
        },
      },
      detectRetina: true,
    }),
    [],
  );

  const normalizedSearch = search.toLowerCase();

  const topics = useMemo(() => {
    const topics = sessionsData
      .map((session) => session.topic)
      .filter((topic) => typeof topic === "string" && topic.trim().length > 0);
    return ["All", ...Array.from(new Set(topics))];
  }, [sessionsData]);

  const filteredSessions = sessionsData.filter((session) => {
    const searchable = `${session.title} ${session.mentorName} ${session.topic}`.toLowerCase();
    const matchesSearch = searchable.includes(normalizedSearch);
    const matchesTopic = activeTopic === "All" || session.topic === activeTopic;
    return matchesSearch && matchesTopic;
  });

  const scheduledSessions = filteredSessions.filter((session) => session.status === "scheduled");
  const liveSessions = filteredSessions.filter((session) => session.status === "live");
  const completedSessions = filteredSessions.filter((session) => session.status === "completed");

  const visibleSessions =
    activeView === "live" ? liveSessions : activeView === "upcoming" ? scheduledSessions : completedSessions;

  const activeViewMeta =
    activeView === "live"
      ? {
          label: "Live Sessions",
          title: "Catch active rooms happening right now.",
          description: "Browse live learning events, see who is teaching, and join the room instantly.",
          accent: "from-rose-500/10 to-fuchsia-500/10",
          icon: Flame,
          count: liveSessions.length,
          cta: "Watch Live",
        }
      : activeView === "upcoming"
        ? {
            label: "Upcoming Sessions",
            title: "Discover what is coming up next.",
            description: "Preview scheduled live-learning sessions and plan your next room to join.",
            accent: "from-indigo-500/10 to-violet-500/10",
            icon: CalendarDays,
            count: scheduledSessions.length,
            cta: "Join Now",
          }
        : {
            label: "Past Sessions",
            title: "Explore completed learning sessions.",
            description: "Revisit archived sessions and spot topics worth watching for the next live drop.",
            accent: "from-emerald-500/10 to-cyan-500/10",
            icon: CircleCheck,
            count: completedSessions.length,
            cta: "View Replay",
          };

  const formatDate = (isoDate: string) => {
    const parsed = new Date(isoDate);
    if (Number.isNaN(parsed.getTime())) return "Invalid date";
    return parsed.toLocaleDateString();
  };

  const formatTime = (isoDate: string) => {
    const parsed = new Date(isoDate);
    if (Number.isNaN(parsed.getTime())) return "Invalid time";
    return parsed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const refreshSessions = async () => {
    try {
      const res = await fetch(`${API_BASE}/sessions`);
      const data = await parseApiResponse(res);
      if (!res.ok) return;
      const list =
        data && typeof data === "object" && "sessions" in data && Array.isArray((data as { sessions: unknown[] }).sessions)
          ? ((data as { sessions: DbSession[] }).sessions)
          : [];
      setSessionsData(list);
    } catch {
      // No-op, existing state remains.
    }
  };

  const handleStartLive = async (sessionId: string, roomId: string) => {
    if (!token) {
      toast({ title: "Sign in required", description: "Please sign in to start live sessions.", variant: "destructive" });
      return;
    }

    setActionLoadingId(sessionId);
    try {
      const res = await fetch(`${API_BASE}/sessions/${sessionId}/start-live`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await parseApiResponse(res);
      if (!res.ok) {
        const message = data && typeof data === "object" && "error" in data
          ? String((data as { error: unknown }).error)
          : "Failed to start session";
        throw new Error(message);
      }

      toast({ title: "Session is live", description: "Status updated to live." });
      await refreshSessions();
      navigate(
        `/start-live?message=Connecting%20to%20live%20session&next=${encodeURIComponent(
          `/room/${roomId}?name=${encodeURIComponent(authUser?.name || "Mentor")}`
        )}`,
        { replace: true }
      );
    } catch (error) {
      toast({ title: "Action failed", description: error instanceof Error ? error.message : "Try again.", variant: "destructive" });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleComplete = async (sessionId: string) => {
    if (!token) return;
    setActionLoadingId(sessionId);
    try {
      const res = await fetch(`${API_BASE}/sessions/${sessionId}/complete`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await parseApiResponse(res);
      if (!res.ok) {
        const message = data && typeof data === "object" && "error" in data
          ? String((data as { error: unknown }).error)
          : "Failed to complete session";
        throw new Error(message);
      }
      toast({ title: "Session completed", description: "Session moved to past sessions." });
      await refreshSessions();
    } catch (error) {
      toast({ title: "Action failed", description: error instanceof Error ? error.message : "Try again.", variant: "destructive" });
    } finally {
      setActionLoadingId(null);
    }
  };

  const sessionCard = (session: DbSession) => {
    const authEmail = authUser?.email?.trim().toLowerCase() || "";
    const sessionEmail = session.mentorEmail?.trim().toLowerCase() || "";
    const isOwnerMentor =
      authUser?.role === "mentor" &&
      authUser?._id === session.mentorId &&
      Boolean(authEmail) &&
      authEmail === sessionEmail;
    const isLearner = authUser?.role === "learner";
    const isLive = session.status === "live";
    const isScheduled = session.status === "scheduled";
    const isCompleted = session.status === "completed";
    const isBusy = actionLoadingId === session._id;
    const TopicIcon = getTopicIcon(session.topic);
    const participantCount = getParticipantCount(session);
    const mentorInitials = getMentorInitials(session.mentorName);
    const activityLabel = getSessionActivityLabel(session);

    return (
      <motion.article
        key={session._id}
        {...motionItem}
        whileHover={{ y: -6, scale: 1.01 }}
        className="group relative overflow-hidden rounded-3xl border border-white/50 bg-white/55 p-5 shadow-[0_20px_50px_rgba(91,80,171,0.12)] backdrop-blur-xl transition-all duration-300 hover:border-indigo-300/50 hover:bg-white/72"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/55 via-white/10 to-indigo-100/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100" aria-hidden="true" />
        <div className="relative z-10">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className={`inline-flex items-center gap-2 rounded-full border bg-gradient-to-r px-3 py-1 text-xs font-medium ${getTopicTone(session.topic)}`}>
              <TopicIcon className="w-3.5 h-3.5" />
              {session.topic}
            </div>
            {isLive ? (
              <div className="inline-flex items-center gap-2 rounded-full border border-rose-200/80 bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-700 shadow-sm">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" style={{ animation: "livePing 1.8s cubic-bezier(0,0,0.2,1) infinite" }} />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-rose-500" />
                </span>
                LIVE
              </div>
            ) : (
              <Badge className="border-0 bg-white/70 text-slate-700 shadow-sm capitalize backdrop-blur-md">{session.status}</Badge>
            )}
          </div>

          <div className="flex items-start gap-4">
            <div className="relative shrink-0">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 ring-4 ring-white/70">
                {mentorInitials}
              </div>
              <div className="absolute -bottom-1 -right-1 rounded-full border border-white bg-white p-1 shadow-sm">
                <div className={`h-3 w-3 rounded-full ${isLive ? "bg-rose-500" : isScheduled ? "bg-amber-500" : "bg-emerald-500"}`} />
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1 rounded-full bg-white/65 px-2.5 py-1 backdrop-blur-sm">
                  <UserRound className="w-3.5 h-3.5" /> {session.mentorName}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-white/65 px-2.5 py-1 backdrop-blur-sm">
                  <Users className="w-3.5 h-3.5" /> {participantCount} participants
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-white/65 px-2.5 py-1 backdrop-blur-sm">
                  <Sparkles className="w-3.5 h-3.5" /> {activityLabel}
                </span>
              </div>
              <h3 className="mt-3 line-clamp-2 text-lg font-semibold text-foreground">{session.title}</h3>
              <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">{session.description}</p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-2 text-sm text-muted-foreground sm:grid-cols-3">
            <div className="flex items-center gap-2 rounded-2xl border border-white/60 bg-white/55 px-3 py-2 backdrop-blur-md">
              <CalendarDays className="w-4 h-4 text-indigo-500" />
              <span>{session.date || formatDate(session.scheduledAt)}</span>
            </div>
            <div className="flex items-center gap-2 rounded-2xl border border-white/60 bg-white/55 px-3 py-2 backdrop-blur-md">
              <Clock className="w-4 h-4 text-violet-500" />
              <span>{session.startTime || formatTime(session.scheduledAt)}</span>
            </div>
            <div className="flex items-center gap-2 rounded-2xl border border-white/60 bg-white/55 px-3 py-2 backdrop-blur-md">
              <Radio className="w-4 h-4 text-fuchsia-500" />
              <span>{session.durationMinutes} min</span>
            </div>
          </div>

          <div className="mt-5">
          {isOwnerMentor && isScheduled && (
            <Button onClick={() => handleStartLive(session._id, session.roomId)} disabled={isBusy} className="w-full gap-2 rounded-2xl border-0 bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 text-white shadow-lg shadow-indigo-500/20 transition-transform duration-300 hover:scale-[1.01] hover:opacity-95">
              <PlayCircle className="w-4 h-4" /> {isBusy ? "Starting..." : "Start Live"}
            </Button>
          )}

          {isOwnerMentor && isLive && (
            <div className="flex flex-col sm:flex-row gap-2">
              <Button className="flex-1 gap-2 rounded-2xl border-0 bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 text-white shadow-lg shadow-indigo-500/20 transition-transform duration-300 hover:scale-[1.01] hover:opacity-95" onClick={() => navigate(`/room/${session.roomId}?name=${encodeURIComponent(authUser?.name || "Mentor")}`)}>
                <DoorOpen className="w-4 h-4" /> Enter Room
              </Button>
              <Button variant="outline" className="flex-1 gap-2 rounded-2xl border-white/70 bg-white/60 backdrop-blur-md transition-transform duration-300 hover:scale-[1.01]" onClick={() => handleComplete(session._id)} disabled={isBusy}>
                <CircleCheck className="w-4 h-4" /> {isBusy ? "Ending..." : "End Session"}
              </Button>
            </div>
          )}

          {isLearner && isLive && (
            <Button
              className="w-full gap-2 rounded-2xl border-0 bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 text-white shadow-lg shadow-indigo-500/20 transition-transform duration-300 hover:scale-[1.01] hover:opacity-95"
              onClick={() =>
                navigate(
                  `/start-live?message=Joining%20live%20session&next=${encodeURIComponent(
                    `/room/${session.roomId}?name=${encodeURIComponent(authUser?.name || "Learner")}`
                  )}`,
                  { replace: true }
                )
              }
            >
              <DoorOpen className="w-4 h-4" /> Join Now
            </Button>
          )}

          {!isOwnerMentor && !isLearner && isLive && (
            <Button
              className="w-full gap-2 rounded-2xl border-0 bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 text-white shadow-lg shadow-indigo-500/20 transition-transform duration-300 hover:scale-[1.01] hover:opacity-95"
              onClick={() =>
                navigate(
                    `/start-live?message=Joining%20live%20session&next=${encodeURIComponent(
                      `/room/${session.roomId}?name=${encodeURIComponent(authUser?.name || "")}`
                    )}`,
                  { replace: true }
                )
              }
            >
              <DoorOpen className="w-4 h-4" /> Watch Live
            </Button>
          )}

          {isCompleted && <p className="text-xs text-muted-foreground">Session Ended</p>}
          {isScheduled && !isOwnerMentor && <p className="text-xs text-muted-foreground">Scheduled learning session by mentor.</p>}
          </div>
        </div>
      </motion.article>
    );
  };

  const heroTopics = topics.slice(0, 4);
  const learningFeatures = [
    {
      title: "Live Mentor Interaction",
      description: "Learn directly from experienced mentors in real time.",
      icon: Users,
      gradient: "from-violet-500/20 via-indigo-500/20 to-sky-500/20",
      iconTint: "text-indigo-700",
    },
    {
      title: "Multi-Skill Learning",
      description: "Explore coding, design, music, fitness, and more.",
      icon: WandSparkles,
      gradient: "from-fuchsia-500/20 via-violet-500/20 to-indigo-500/20",
      iconTint: "text-violet-700",
    },
    {
      title: "Smart Attention Tracking",
      description: "AI-powered participation and attention monitoring during sessions.",
      icon: BrainCircuit,
      gradient: "from-indigo-500/20 via-sky-500/20 to-cyan-500/20",
      iconTint: "text-indigo-700",
    },
    {
      title: "Community-Based Learning",
      description: "Collaborate, discuss, and grow with active learners.",
      icon: MessageSquareMore,
      gradient: "from-emerald-500/20 via-teal-500/20 to-cyan-500/20",
      iconTint: "text-emerald-700",
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden">
      <SessionsBackdrop />
      <div className="absolute inset-0 pointer-events-none opacity-95" aria-hidden="true">
        {particlesReady && <Particles id="sessions-particles" className="h-full w-full" options={particlesOptions} />}
      </div>

      <div className="relative z-10">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative overflow-hidden rounded-[2rem] border border-white/60 bg-white/45 p-6 sm:p-8 shadow-[0_30px_80px_rgba(91,80,171,0.14)] backdrop-blur-2xl"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-white/20 to-indigo-100/30" aria-hidden="true" />
            <div className="absolute -top-10 right-10 h-36 w-36 rounded-full bg-fuchsia-400/20 blur-3xl" aria-hidden="true" />
            <div className="absolute bottom-0 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-indigo-400/20 blur-3xl" aria-hidden="true" />
            
            <div className="relative z-10 grid gap-8 lg:grid-cols-[1.2fr_0.9fr] lg:items-center">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/65 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-700 shadow-sm backdrop-blur-md">
                  <Sparkles className="w-3.5 h-3.5" /> Session Discovery
                </div>
                <h1 className="max-w-3xl text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                  Browse live learning sessions built for curious learners and expert mentors.
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                  Discover live rooms, upcoming events, and archived sessions in one polished, public learning hub.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  {heroTopics.map((topic) => {
                    const TopicIcon = getTopicIcon(topic);
                    return (
                      <div key={topic} className={`inline-flex items-center gap-2 rounded-full border bg-gradient-to-r px-4 py-2 text-sm font-medium shadow-sm backdrop-blur-md ${getTopicTone(topic)}`}>
                        <TopicIcon className="w-4 h-4" />
                        {topic}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 self-center">
                {learningFeatures.map((feature, index) => {
                  const FeatureIcon = feature.icon;
                  return (
                    <motion.div
                      key={feature.title}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.05 * index }}
                      whileHover={{ y: -4, scale: 1.01 }}
                      className="group relative overflow-hidden rounded-[1.75rem] border border-white/70 bg-white/65 p-4 shadow-lg shadow-indigo-500/10 backdrop-blur-xl"
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-70`} aria-hidden="true" />
                      <div className="absolute inset-0 bg-white/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100" aria-hidden="true" />
                      <div className="relative z-10">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/70 shadow-sm ring-1 ring-white/80 backdrop-blur-md">
                          <FeatureIcon className={`h-5 w-5 ${feature.iconTint}`} />
                        </div>
                        <h3 className="mt-4 text-base font-semibold text-foreground">{feature.title}</h3>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">{feature.description}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.section>

          <motion.section
            {...motionItem}
            className="mt-6 rounded-[2rem] border border-white/60 bg-white/40 p-4 sm:p-6 shadow-[0_24px_80px_rgba(91,80,171,0.1)] backdrop-blur-2xl"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative w-full lg:max-w-xl">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-indigo-500" />
                <Input
                  placeholder="Search live rooms, mentors, or topics..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onFocus={() => setShowTopicRecommendations(true)}
                  onBlur={() => {
                    window.setTimeout(() => setShowTopicRecommendations(false), 120);
                  }}
                  className="h-12 rounded-2xl border-white/70 bg-white/70 pl-11 pr-4 text-sm shadow-inner shadow-white/60 backdrop-blur-xl placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-indigo-400"
                />

                {showTopicRecommendations && (
                  <div className="absolute left-0 right-0 top-[calc(100%+0.75rem)] z-30 rounded-[1.75rem] border border-white/70 bg-white/85 p-3 shadow-[0_22px_60px_rgba(91,80,171,0.16)] backdrop-blur-2xl">
                    <div className="mb-2 flex items-center justify-between px-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-700">Recommended topics</p>
                      <span className="text-xs text-muted-foreground">Click to filter</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {topics.map((topic) => {
                        const TopicIcon = getTopicIcon(topic);
                        const isActive = activeTopic === topic;
                        return (
                          <Button
                            key={topic}
                            variant="secondary"
                            size="sm"
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => {
                              setActiveTopic(topic);
                              setShowTopicRecommendations(false);
                            }}
                            className={`rounded-full border border-white/70 px-4 py-2 text-sm shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/90 hover:text-slate-900 ${isActive ? "border-transparent bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:text-white hover:bg-gradient-to-r" : "bg-white/70 text-slate-700"}`}
                          >
                            <TopicIcon className="mr-2 h-4 w-4" />
                            {topic}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2 rounded-[1.5rem] border border-white/70 bg-white/55 p-2 backdrop-blur-xl">
              {[
                { key: "live", label: "Live Sessions", icon: Flame },
                { key: "upcoming", label: "Upcoming Sessions", icon: CalendarDays },
                { key: "past", label: "Past Sessions", icon: CircleCheck },
              ].map((tab) => {
                const TabIcon = tab.icon;
                const isActive = activeView === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveView(tab.key as SessionView)}
                    className={`relative flex min-w-[160px] flex-1 items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-300 ${isActive ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/20" : "text-slate-600 hover:bg-white/70 hover:text-foreground"}`}
                  >
                    <TabIcon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </motion.section>

          <motion.section
            key={activeView}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35 }}
            className="mt-8 mb-10"
          >
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-foreground">{activeViewMeta.label}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{activeViewMeta.description}</p>
              </div>
              <Badge className="rounded-full border border-white/70 bg-white/70 px-3 py-1 text-xs text-indigo-700 shadow-sm backdrop-blur-md">{activeViewMeta.count}</Badge>
            </div>

            {loadingSessions ? (
              <div className="rounded-[1.75rem] border border-white/70 bg-white/55 py-14 text-center backdrop-blur-xl">
                <p className="text-muted-foreground">Loading sessions...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                {visibleSessions.map(sessionCard)}
              </div>
            )}

            {!loadingSessions && visibleSessions.length === 0 && (
              <div className="rounded-[1.75rem] border border-dashed border-white/70 bg-white/45 py-14 text-center backdrop-blur-xl">
                <p className="text-muted-foreground">No sessions found in this tab.</p>
              </div>
            )}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/60 bg-white/50 px-4 py-3 text-sm text-muted-foreground backdrop-blur-md">
              <span>{activeViewMeta.title}</span>
              <span className="inline-flex items-center gap-2 font-medium text-indigo-700">
                {activeViewMeta.cta}
                <ArrowRight className="h-4 w-4" />
              </span>
            </div>

            {sessionsError && activeView === "live" && (
              <div className="mt-4 rounded-2xl border border-rose-200/70 bg-rose-500/10 p-4 text-center backdrop-blur-md">
                <p className="text-destructive">{sessionsError}</p>
              </div>
            )}
          </motion.section>
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default SessionsPage;
