import { useEffect, useMemo, useState } from "react";
import { Search, CalendarDays, Clock, UserRound, Radio, PlayCircle, DoorOpen, CircleCheck } from "lucide-react";
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

const SessionsBackdrop = () => (
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
          #F0EEFF
        `,
      }}
      aria-hidden="true"
    />
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }} aria-hidden="true">
      <div style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(167,139,250,0.18) 0%, transparent 70%)", top: "-10%", right: "-5%", animation: "orbFloat1 8s ease-in-out infinite" }} />
      <div style={{ position: "absolute", width: 380, height: 380, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.13) 0%, transparent 70%)", bottom: "5%", left: "-8%", animation: "orbFloat2 10s ease-in-out infinite" }} />
      <div style={{ position: "absolute", width: 260, height: 260, borderRadius: "50%", background: "radial-gradient(circle, rgba(196,181,253,0.15) 0%, transparent 70%)", top: "45%", left: "40%", animation: "orbFloat3 7s ease-in-out infinite" }} />
    </div>
  </>
);

const SessionsPage = () => {
  const navigate = useNavigate();
  const { user: authUser, token } = useAuth();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [activeTopic, setActiveTopic] = useState("All");
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

    return (
      <article key={session._id} className="rounded-2xl border border-border/60 bg-card/80 p-5 shadow-card">
        <div className="flex items-center justify-between gap-3 mb-3">
          <Badge variant="outline" className="text-xs">{session.topic}</Badge>
          {isLive ? (
            <Badge className="bg-destructive/10 text-destructive border-0 inline-flex items-center gap-1">
              <Radio className="w-3 h-3" /> LIVE
            </Badge>
          ) : (
            <Badge className="bg-primary/10 text-primary border-0 capitalize">{session.status}</Badge>
          )}
        </div>

        <h3 className="font-semibold text-foreground mb-2">{session.title}</h3>
        <p className="text-sm text-muted-foreground line-clamp-3 mb-4">{session.description}</p>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p className="flex items-center gap-2"><UserRound className="w-4 h-4" /> {session.mentorName}</p>
          <p className="flex items-center gap-2"><CalendarDays className="w-4 h-4" /> {session.date || formatDate(session.scheduledAt)}</p>
          <p className="flex items-center gap-2"><Clock className="w-4 h-4" /> {session.startTime || formatTime(session.scheduledAt)} • {session.durationMinutes} min</p>
        </div>

        <div className="mt-4">
          {isOwnerMentor && isScheduled && (
            <Button onClick={() => handleStartLive(session._id, session.roomId)} disabled={isBusy} className="w-full gap-2">
              <PlayCircle className="w-4 h-4" /> {isBusy ? "Starting..." : "Start Live"}
            </Button>
          )}

          {isOwnerMentor && isLive && (
            <div className="flex flex-col sm:flex-row gap-2">
              <Button className="flex-1 gap-2" onClick={() => navigate(`/room/${session.roomId}?name=${encodeURIComponent(authUser?.name || "Mentor")}`)}>
                <DoorOpen className="w-4 h-4" /> Enter Room
              </Button>
              <Button variant="outline" className="flex-1 gap-2" onClick={() => handleComplete(session._id)} disabled={isBusy}>
                <CircleCheck className="w-4 h-4" /> {isBusy ? "Ending..." : "End Session"}
              </Button>
            </div>
          )}

          {isLearner && isLive && (
            <Button
              className="w-full gap-2"
              onClick={() =>
                navigate(
                  `/start-live?message=Joining%20live%20session&next=${encodeURIComponent(
                    `/room/${session.roomId}?name=${encodeURIComponent(authUser?.name || "Learner")}`
                  )}`,
                  { replace: true }
                )
              }
            >
              <DoorOpen className="w-4 h-4" /> Join Live Session
            </Button>
          )}

          {!isOwnerMentor && !isLearner && isLive && (
            <Button
              className="w-full gap-2"
              onClick={() =>
                navigate(
                  `/start-live?message=Joining%20live%20session&next=${encodeURIComponent(`/room/${session.roomId}?name=Guest`)}`,
                  { replace: true }
                )
              }
            >
              <DoorOpen className="w-4 h-4" /> Join Live Session
            </Button>
          )}

          {isCompleted && <p className="text-xs text-muted-foreground">Session Ended</p>}
          {isScheduled && !isOwnerMentor && <p className="text-xs text-muted-foreground">Session starts as scheduled by mentor.</p>}
        </div>
      </article>
    );
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <SessionsBackdrop />
      <div className="absolute inset-0 pointer-events-none opacity-95" aria-hidden="true">
        {particlesReady && <Particles id="sessions-particles" className="h-full w-full" options={particlesOptions} />}
      </div>

      <div className="relative z-10">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Sessions</h1>
            <p className="text-muted-foreground mt-1">Track scheduled, live, and completed sessions with real-time action controls.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1 w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search sessions or mentors..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-8">
            {topics.map((topic) => (
              <Button
                key={topic}
                variant={activeTopic === topic ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTopic(topic)}
                className={activeTopic === topic ? "gradient-primary text-primary-foreground border-0" : ""}
              >
                {topic}
              </Button>
            ))}
          </div>

          <section className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-foreground">Upcoming Sessions</h2>
              <Badge variant="outline">{scheduledSessions.length}</Badge>
            </div>

            {loadingSessions ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading sessions...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {scheduledSessions.map(sessionCard)}
              </div>
            )}

            {!loadingSessions && scheduledSessions.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No upcoming sessions found.</p>
              </div>
            )}
          </section>

          <section className="mb-10">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-foreground">Live Sessions</h2>
              <p className="text-sm text-muted-foreground mt-1">Join currently active live sessions.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {liveSessions.map(sessionCard)}
            </div>

            {sessionsError && (
              <div className="text-center py-8">
                <p className="text-destructive">{sessionsError}</p>
              </div>
            )}

            {!loadingSessions && !sessionsError && liveSessions.length === 0 && (
              <div className="text-center py-20">
                <p className="text-muted-foreground">No live sessions right now.</p>
              </div>
            )}
          </section>

          <section>
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-foreground">Past Sessions</h2>
              <p className="text-sm text-muted-foreground mt-1">Completed sessions archive.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {completedSessions.map(sessionCard)}
            </div>
            {!loadingSessions && completedSessions.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No completed sessions yet.</p>
              </div>
            )}
          </section>
        </div>
        <Footer />
      </div>
    </div>
  );
};

export default SessionsPage;
