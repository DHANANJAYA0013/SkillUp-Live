import { useEffect, useMemo, useState } from "react";
import { Calendar, Clock, BookOpen, TrendingUp, Star, ArrowRight, Video, PlayCircle, Users, PlusCircle, BarChart3, Radio, UserPlus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
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

const DashboardPage = () => {
  const { user: authUser, token, logout } = useAuth();
  const navigate = useNavigate();
  const [sessionsData, setSessionsData] = useState<DbSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
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
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h1 className="text-2xl font-bold text-foreground">Please sign in to view your dashboard.</h1>
          <p className="text-muted-foreground mt-2">Your dashboard will switch automatically based on your role after login.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-70" aria-hidden="true">
        {particlesReady && <Particles id="dashboard-particles" className="h-full w-full" options={particlesOptions} />}
      </div>

      <div className="relative z-10">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            {isMentor ? (
              <>
                Mentor Dashboard,
                <br />
                {authUser.name}!
              </>
            ) : (
              <>
                Learner Dashboard,
                <br />
                {authUser.name}!
              </>
            )}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isMentor
              ? "Manage your sessions, control live rooms, and track teaching activity."
              : "Track your learning progress, join live sessions, and jump into what matters next."}
          </p>
        </div>

        {isLearner && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {learnerStats.map((stat) => (
              <div key={stat.label} className="bg-card rounded-xl shadow-card border border-border/50 p-5 text-center">
                <div className="flex items-center justify-center mb-3">
                  <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center`}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        )}

        {isLearner ? (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-card rounded-xl shadow-card border border-border/50 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-foreground">Next Upcoming Session</h2>
                  <Link to="/sessions" className="text-sm text-primary hover:underline">View all</Link>
                </div>
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
              </div>

              <div className="bg-card rounded-xl shadow-card border border-border/50 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-foreground">Live Sessions</h2>
                  <Link to="/sessions" className="text-sm text-primary hover:underline">Open Sessions</Link>
                </div>
                <div className="space-y-3">
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
                </div>
              </div>

            </div>

            <div className="space-y-6">
              <div className="bg-card rounded-xl shadow-card border border-border/50 p-6">
                <h3 className="font-semibold text-foreground mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <Link to="/sessions">
                    <Button variant="outline" className="w-full justify-start gap-2 mb-2">
                      <BookOpen className="w-4 h-4" /> Browse Sessions
                    </Button>
                  </Link>

                  
                  <Link to="/mentors">
                    <Button variant="outline" className="w-full justify-start gap-2">
                      <Star className="w-4 h-4" /> Find Mentors
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="bg-card rounded-xl shadow-card border border-border/50 p-6">
                <h3 className="font-semibold text-foreground mb-4">Popular Topics</h3>
                <div className="flex flex-wrap gap-2">
                  {skills.slice(0, 5).map((skill) => (
                    <Badge key={skill.id} variant="secondary" className="bg-muted text-muted-foreground border-0">
                      {skill.category}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {mentorStats.map((stat) => (
                  <div key={stat.label} className="bg-card rounded-xl shadow-card border border-border/50 p-5 text-center">
                    <div className="flex items-center justify-center mb-3">
                      <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center`}>
                        <stat.icon className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>

              <div className="bg-card rounded-xl shadow-card border border-border/50 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-foreground">Create Session</h2>
                  <Link to="/profile" className="text-sm text-primary hover:underline">Manage Profile</Link>
                </div>
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
              </div>

              <div className="bg-card rounded-xl shadow-card border border-border/50 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-foreground">My Upcoming Sessions</h2>
                  <Link to="/sessions" className="text-sm text-primary hover:underline">View all</Link>
                </div>
                <div className="space-y-3">
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
                </div>
              </div>

              <div className="bg-card rounded-xl shadow-card border border-border/50 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-foreground">Live Session Control</h2>
                  <Link to="/sessions" className="text-sm text-primary hover:underline">Open Live Board</Link>
                </div>
                <div className="space-y-3">
                  {mentorLive.length > 0 ? (
                    mentorLive.map((session) => (
                      <div key={session._id} className="bg-muted/30 rounded-xl border border-border/50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                            <Radio className="w-5 h-5 text-destructive" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-medium text-foreground">{session.title}</h3>
                            <p className="text-sm text-muted-foreground truncate">Room {session.roomId}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <Button asChild>
                            <Link to={`/room/${session.roomId}?name=${encodeURIComponent(authUser.name)}`}>Enter Session</Link>
                          </Button>
                          <Button variant="outline" asChild>
                            <Link to="/sessions">End Session</Link>
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground">No live sessions at the moment.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-card rounded-xl shadow-card border border-border/50 p-6">
                <h3 className="font-semibold text-foreground mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start gap-2" asChild>
                    <Link to="/profile"><PlusCircle className="w-4 h-4" /> Create Session</Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2" asChild>
                    <Link to="/sessions"><BarChart3 className="w-4 h-4" /> Manage Sessions</Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2" asChild>
                    <Link to="/dashboard"><Users className="w-4 h-4" /> View Students</Link>
                  </Button>
                </div>
              </div>

              <div className="bg-card rounded-xl shadow-card border border-border/50 p-6">
                <h3 className="font-semibold text-foreground mb-4">Session Statistics</h3>
                <div className="space-y-3">
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
                </div>
              </div>

              <div className="bg-card rounded-xl shadow-card border border-border/50 p-6">
                <h3 className="font-semibold text-foreground mb-4">Teaching Tools</h3>
                <div className="space-y-3">
                  <Link to="/profile" className="block text-sm text-primary hover:underline">Update mentor profile</Link>
                  <Link to="/sessions" className="block text-sm text-primary hover:underline">Review session status</Link>
                  <Link to="/mentors" className="block text-sm text-primary hover:underline">See mentor directory</Link>
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
