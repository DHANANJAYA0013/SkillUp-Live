import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Star, Clock, Calendar, MapPin, ArrowLeft, CheckCircle2, Sparkles, ShieldCheck, Users, ChevronRight, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import type { ISourceOptions } from "@tsparticles/engine";
import Navbar from "@/components/Navbar";
import { reviews } from "@/data/mockData";
import { API_BASE } from "@/features/authsystem/config";
import { useAuth } from "@/features/authsystem/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface MentorDetails {
  _id: string;
  name: string;
  email: string;
  avatar?: string | null;
  skills: string[];
  bio: string;
  followersCount?: number;
}

interface MentorSession {
  mentorId: string;
  mentorEmail?: string;
  status?: "scheduled" | "live" | "completed";
}

const parseApiResponse = async (res: Response) => {
  const raw = await res.text();
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return raw;
  }
};

const fallbackAvatar = "https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=400&q=80";

const MentorProfilePage = () => {
  const { id } = useParams();
  const { user: authUser, token } = useAuth();
  const { toast } = useToast();
  const [mentor, setMentor] = useState<MentorDetails | null>(null);
  const [loadingMentor, setLoadingMentor] = useState(true);
  const [mentorError, setMentorError] = useState("");
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [sessionsDoneCount, setSessionsDoneCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);

  const [particlesReady, setParticlesReady] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      setParticlesReady(true);
    });
  }, []);

  useEffect(() => {
    if (!id) {
      setLoadingMentor(false);
      setMentorError("Mentor id is missing");
      return;
    }

    const controller = new AbortController();

    const loadMentor = async () => {
      setLoadingMentor(true);
      setMentorError("");

      try {
        const res = await fetch(`${API_BASE}/auth/mentors/${id}`, {
          signal: controller.signal,
        });

        const data = await parseApiResponse(res);
        if (!res.ok) {
          const message =
            data && typeof data === "object" && "error" in data
              ? String((data as { error: unknown }).error)
              : "Failed to fetch mentor";
          throw new Error(message);
        }

        const fetchedMentor =
          data && typeof data === "object" && "mentor" in data
            ? (data as { mentor: MentorDetails }).mentor
            : null;

        if (!fetchedMentor) {
          throw new Error("Mentor not found");
        }

        setMentor(fetchedMentor);
        setFollowersCount(typeof fetchedMentor.followersCount === "number" ? fetchedMentor.followersCount : 0);
      } catch (error) {
        if (controller.signal.aborted) return;
        setMentor(null);
        setMentorError(error instanceof Error ? error.message : "Failed to fetch mentor");
      } finally {
        if (!controller.signal.aborted) {
          setLoadingMentor(false);
        }
      }
    };

    loadMentor();

    return () => controller.abort();
  }, [id]);

  useEffect(() => {
    if (!id || !token) {
      setIsFollowing(false);
      return;
    }

    const controller = new AbortController();

    const loadFollowState = async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/mentors/${id}/follow-state`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        const data = await parseApiResponse(res);
        if (!res.ok) return;

        const nextIsFollowing = Boolean(
          data && typeof data === "object" && "isFollowing" in data && (data as { isFollowing: boolean }).isFollowing
        );
        const nextFollowersCount =
          data && typeof data === "object" && "followersCount" in data
            ? Number((data as { followersCount: number }).followersCount)
            : 0;

        setIsFollowing(nextIsFollowing);
        if (Number.isFinite(nextFollowersCount)) {
          setFollowersCount(nextFollowersCount);
        }
      } catch {
        setIsFollowing(false);
      }
    };

    loadFollowState();

    return () => controller.abort();
  }, [id, token]);

  useEffect(() => {
    if (!id) {
      setSessionsDoneCount(0);
      return;
    }

    const controller = new AbortController();

    const loadSessionCount = async () => {
      try {
        const res = await fetch(`${API_BASE}/sessions`, { signal: controller.signal });
        const data = await parseApiResponse(res);
        if (!res.ok) return;

        const sessions =
          data && typeof data === "object" && "sessions" in data && Array.isArray((data as { sessions: unknown[] }).sessions)
            ? ((data as { sessions: MentorSession[] }).sessions)
            : Array.isArray(data)
              ? (data as MentorSession[])
              : [];

        const normalizedMentorId = id.trim();
        const mentorEmail = mentor?.email?.trim().toLowerCase() || "";

        const completedCount = sessions.filter((session) => {
          const sessionMentorId = String(session.mentorId || "").trim();
          const sessionMentorEmail = String(session.mentorEmail || "").trim().toLowerCase();
          const matchesMentor = sessionMentorId === normalizedMentorId || (mentorEmail && sessionMentorEmail === mentorEmail);
          return matchesMentor && session.status === "completed";
        }).length;

        setSessionsDoneCount(completedCount);
      } catch {
        if (!controller.signal.aborted) {
          setSessionsDoneCount(0);
        }
      }
    };

    loadSessionCount();

    return () => controller.abort();
  }, [id, mentor?.email]);

  const handleFollowToggle = async () => {
    if (!token) {
      toast({ title: "Sign in required", description: "Please sign in to follow mentors.", variant: "destructive" });
      return;
    }

    if (!authUser || !["learner", "mentor"].includes(authUser.role || "")) {
      toast({
        title: "Access denied",
        description: "Only learners or mentors can follow mentors.",
        variant: "destructive",
      });
      return;
    }

    setFollowLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/mentors/${id}/follow`, {
        method: isFollowing ? "DELETE" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await parseApiResponse(res);
      if (!res.ok) {
        const message =
          data && typeof data === "object" && "error" in data
            ? String((data as { error: unknown }).error)
            : "Failed to update follow status";
        throw new Error(message);
      }

      const nextIsFollowing = Boolean(
        data && typeof data === "object" && "isFollowing" in data && (data as { isFollowing: boolean }).isFollowing
      );
      const nextFollowersCount =
        data && typeof data === "object" && "followersCount" in data
          ? Number((data as { followersCount: number }).followersCount)
          : followersCount;

      setIsFollowing(nextIsFollowing);
      if (Number.isFinite(nextFollowersCount)) setFollowersCount(nextFollowersCount);

      toast({
        title: nextIsFollowing ? "Following mentor" : "Unfollowed mentor",
        description: nextIsFollowing ? "You are now following this mentor." : "You stopped following this mentor.",
      });
    } catch (error) {
      toast({
        title: "Action failed",
        description: error instanceof Error ? error.message : "Try again.",
        variant: "destructive",
      });
    } finally {
      setFollowLoading(false);
    }
  };

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

  if (loadingMentor) {
    return (
      <div className="relative min-h-screen bg-background overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-95" aria-hidden="true">
          {particlesReady && <Particles id="mentor-profile-particles-loading" className="h-full w-full" options={particlesOptions} />}
        </div>

        <div className="relative z-10">
          <Navbar />
          <div className="text-center py-20">
            <p className="text-muted-foreground">Loading mentor profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!mentor) {
    return (
      <div className="relative min-h-screen bg-background overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-95" aria-hidden="true">
          {particlesReady && <Particles id="mentor-profile-particles-empty" className="h-full w-full" options={particlesOptions} />}
        </div>

        <div className="relative z-10">
          <Navbar />
          <div className="text-center py-20">
            <p className="text-muted-foreground">{mentorError || "Mentor not found."}</p>
            <Link to="/mentors" className="text-primary hover:underline mt-2 inline-block">Back to Mentors</Link>
          </div>
        </div>
      </div>
    );
  }

  const mentorSkills = Array.isArray(mentor.skills) ? mentor.skills : [];
  const mentorTitle = mentorSkills.length > 0 ? `${mentorSkills[0]} Mentor` : "Mentor";
  const mentorCategory = mentorSkills.length > 0 ? mentorSkills[0] : "General";
  const mentorTags = mentorSkills.slice(0, 4);
  const profileStats = [
    { label: "Followers", value: String(followersCount), icon: Users },
    { label: "Skills", value: String(mentorSkills.length), icon: GraduationCap },
    { label: "Status", value: isFollowing ? "Following" : "Not following", icon: ShieldCheck },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.14),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.12),_transparent_28%),linear-gradient(135deg,_#f7faff_0%,_#eef4ff_46%,_#fcfdff_100%)]">
      <style>{`
        @keyframes floatSoft {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          50% { transform: translate3d(0, -18px, 0) scale(1.04); }
        }
      `}</style>
      <div className="absolute inset-0 pointer-events-none opacity-95" aria-hidden="true">
        {particlesReady && <Particles id="mentor-profile-particles" className="h-full w-full" options={particlesOptions} />}
      </div>

      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute -left-24 top-12 h-72 w-72 rounded-full bg-sky-300/20 blur-3xl" />
        <div className="absolute -right-20 bottom-8 h-80 w-80 rounded-full bg-indigo-300/20 blur-3xl" />
        <div className="absolute left-1/3 top-1/3 h-40 w-40 rounded-full bg-fuchsia-300/15 blur-3xl" style={{ animation: "floatSoft 9s ease-in-out infinite" }} />
      </div>

      <div className="relative z-10">
        <Navbar />
        <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:space-y-8 sm:px-6 sm:py-10 lg:px-8">
          <Link to="/mentors" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to Mentors
          </Link>

          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/45 p-6 shadow-[0_30px_80px_rgba(91,80,171,0.14)] backdrop-blur-2xl sm:p-8"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-white/25 to-indigo-100/30" aria-hidden="true" />
            <div className="absolute -right-10 top-0 h-40 w-40 rounded-full bg-fuchsia-400/20 blur-3xl" aria-hidden="true" />
            <div className="absolute bottom-0 left-1/2 h-44 w-44 -translate-x-1/2 rounded-full bg-sky-400/20 blur-3xl" aria-hidden="true" />

            <div className="relative z-10 grid gap-8 lg:grid-cols-[1.12fr_0.88fr] lg:items-center">
              <div className="flex h-full flex-col justify-center">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-indigo-700 shadow-sm backdrop-blur-md">
                  <Sparkles className="h-3.5 w-3.5" /> Mentor profile
                </div>

                <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-start">
                  <img
                    src={mentor.avatar || fallbackAvatar}
                    alt={mentor.name}
                    className="h-24 w-24 rounded-[1.5rem] object-cover ring-1 ring-white/80 shadow-lg shadow-indigo-500/10 sm:h-28 sm:w-28"
                  />
                  <div className="min-w-0">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{mentor.name}</h1>
                    <p className="mt-2 text-sm font-medium text-indigo-700 sm:text-base">{mentorTitle}</p>
                    <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                      {mentor.bio || "This mentor has not added a bio yet."}
                    </p>

                    <div className="mt-5 flex flex-wrap items-center gap-3">
                      <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/70 px-4 py-2 text-sm text-slate-700 shadow-sm backdrop-blur-md">
                        <Star className="h-4 w-4 fill-accent text-accent" /> 5.0 <span className="text-muted-foreground">(0 reviews)</span>
                      </div>
                      <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/70 px-4 py-2 text-sm text-slate-700 shadow-sm backdrop-blur-md">
                        <Clock className="h-4 w-4 text-indigo-600" /> Mentor profile
                      </div>
                      <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/70 px-4 py-2 text-sm text-slate-700 shadow-sm backdrop-blur-md">
                        <MapPin className="h-4 w-4 text-indigo-600" /> {mentorCategory}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-1">
                {profileStats.map((item, index) => {
                  const StatIcon = item.icon;
                  return (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, delay: 0.05 * index }}
                      whileHover={{ y: -4, scale: 1.01 }}
                      className="group relative overflow-hidden rounded-[1.5rem] border border-white/70 bg-white/65 p-4 shadow-lg shadow-indigo-500/10 backdrop-blur-xl"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/15 via-sky-500/10 to-violet-500/15 opacity-80" aria-hidden="true" />
                      <div className="relative z-10 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{item.label}</p>
                          <p className="mt-1 text-lg font-bold text-foreground">{item.value}</p>
                        </div>
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/75 text-indigo-700 shadow-sm ring-1 ring-white/80 backdrop-blur-md">
                          <StatIcon className="h-5 w-5" />
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.section>

          <section className="grid gap-4 lg:grid-cols-[1.08fr_0.92fr] sm:gap-6">
            <Card className="overflow-hidden border-white/70 bg-white/80 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
              <CardHeader className="space-y-2 border-b border-white/60 bg-gradient-to-r from-white/80 to-indigo-50/40">
                <CardTitle className="text-lg sm:text-xl">About</CardTitle>
                <CardDescription className="text-xs sm:text-sm">A quick introduction to the mentor and their focus areas.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5 p-4 sm:p-6">
                <p className="text-sm leading-7 text-muted-foreground sm:text-base">{mentor.bio || "This mentor has not added a bio yet."}</p>

                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3">Skills Offered</h3>
                  <div className="flex flex-wrap gap-2">
                    {mentorSkills.length > 0 ? mentorSkills.map((skill) => (
                      <Badge key={skill} variant="secondary" className="border-0 bg-primary/10 px-3 py-1 text-primary shadow-sm">
                        <CheckCircle2 className="mr-1 h-3 w-3" /> {skill}
                      </Badge>
                    )) : (
                      <p className="text-sm text-muted-foreground">No skills added yet.</p>
                    )}
                  </div>
                </div>

                {mentorTags.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-3">Top Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {mentorTags.map((skill) => (
                        <span key={skill} className="rounded-full border border-white/70 bg-white/70 px-3 py-1 text-xs text-muted-foreground shadow-sm backdrop-blur-md">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="overflow-hidden border-white/70 bg-white/80 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.08)] lg:sticky lg:top-24">
                <CardHeader className="space-y-2 border-b border-white/60 bg-gradient-to-r from-white/80 to-indigo-50/40">
                  <CardTitle className="text-lg sm:text-xl">Follow Mentor</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Stay connected to this mentor and receive updates.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5 p-4 sm:p-6">
                  <div className="rounded-2xl border border-white/70 bg-white/75 p-4 text-center shadow-sm backdrop-blur-md">
                    <div className="text-3xl font-bold text-foreground">{followersCount}</div>
                    <div className="text-sm text-muted-foreground">followers</div>
                  </div>

                  <Button
                    className="w-full gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/20 hover:opacity-95"
                    onClick={handleFollowToggle}
                    disabled={followLoading}
                  >
                    {followLoading ? "Please wait..." : isFollowing ? "Following" : "Follow"}
                    <ChevronRight className="h-4 w-4" />
                  </Button>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-2xl border border-white/70 bg-white/70 p-3 shadow-sm backdrop-blur-md">
                      <p className="text-muted-foreground">Sessions done</p>
                      <p className="mt-1 font-semibold text-foreground">{sessionsDoneCount}</p>
                    </div>
                    <div className="rounded-2xl border border-white/70 bg-white/70 p-3 shadow-sm backdrop-blur-md">
                      <p className="text-muted-foreground">Following</p>
                      <p className="mt-1 font-semibold text-foreground">{isFollowing ? "Yes" : "No"}</p>
                    </div>
                    <div className="rounded-2xl border border-white/70 bg-white/70 p-3 shadow-sm backdrop-blur-md">
                      <p className="text-muted-foreground">Experience</p>
                      <p className="mt-1 font-semibold text-foreground">Mentor</p>
                    </div>
                    <div className="rounded-2xl border border-white/70 bg-white/70 p-3 shadow-sm backdrop-blur-md">
                      <p className="text-muted-foreground">Category</p>
                      <p className="mt-1 font-semibold text-foreground">{mentorCategory}</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/70 bg-white/70 p-4 shadow-sm backdrop-blur-md">
                    <h3 className="text-sm font-semibold text-foreground mb-2">Availability</h3>
                    <Badge variant="outline" className="rounded-full text-xs border-white/70 bg-white/80">
                      To be updated
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default MentorProfilePage;
