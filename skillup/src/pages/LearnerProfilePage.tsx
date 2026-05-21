import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, BookOpen, GraduationCap, Languages, Sparkles, ShieldCheck, Users, ChevronRight, MapPin, Clock } from "lucide-react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import type { ISourceOptions } from "@tsparticles/engine";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import { API_BASE } from "@/features/authsystem/config";
import { useAuth } from "@/features/authsystem/AuthContext";

interface LearnerDetails {
  _id: string;
  name: string;
  email: string;
  avatar?: string | null;
  googleId?: string;
  githubId?: string;
  role?: "learner" | "mentor" | null;
  followers?: string[];
  following?: string[];
  profileCompleted?: boolean;
  learningInterests: string[];
  preferredLanguages: string[];
  experienceLevel: string;
  skills?: string[];
  yearsOfExperience?: number | null;
  bio?: string;
  certifications?: string[];
  portfolioLinks?: string[];
  disabled?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface NetworkUser {
  _id: string;
  name: string;
  email: string;
  avatar?: string | null;
  role?: "learner" | "mentor" | null;
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

const backdropStyles = `
  @keyframes floatSoft {
    0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
    50% { transform: translate3d(0, -18px, 0) scale(1.04); }
  }
`;

const formatDateTime = (value?: string) => {
  if (!value) return "Not set";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
};

const LearnerProfilePage = () => {
  const { id } = useParams();
  const { token } = useAuth();
  const [learner, setLearner] = useState<LearnerDetails | null>(null);
  const [loadingLearner, setLoadingLearner] = useState(true);
  const [learnerError, setLearnerError] = useState("");
  const [particlesReady, setParticlesReady] = useState(false);
  const [followingUsers, setFollowingUsers] = useState<NetworkUser[]>([]);
  const [loadingFollowingUsers, setLoadingFollowingUsers] = useState(false);
  const [followingUsersError, setFollowingUsersError] = useState("");

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      setParticlesReady(true);
    });
  }, []);

  useEffect(() => {
    if (!id) {
      setLoadingLearner(false);
      setLearnerError("Learner id is missing");
      return;
    }

    const controller = new AbortController();

    const loadLearner = async () => {
      setLoadingLearner(true);
      setLearnerError("");

      try {
        const res = await fetch(`${API_BASE}/auth/learners/${id}`, {
          signal: controller.signal,
        });

        const data = await parseApiResponse(res);
        if (!res.ok) {
          const message =
            data && typeof data === "object" && "error" in data
              ? String((data as { error: unknown }).error)
              : "Failed to fetch learner";
          throw new Error(message);
        }

        const fetchedLearner =
          data && typeof data === "object" && "learner" in data
            ? (data as { learner: LearnerDetails }).learner
            : null;

        if (!fetchedLearner) {
          throw new Error("Learner not found");
        }

        setLearner(fetchedLearner);
      } catch (error) {
        if (controller.signal.aborted) return;
        setLearner(null);
        setLearnerError(error instanceof Error ? error.message : "Failed to fetch learner");
      } finally {
        if (!controller.signal.aborted) {
          setLoadingLearner(false);
        }
      }
    };

    loadLearner();

    return () => controller.abort();
  }, [id]);

  useEffect(() => {
    const followingIds = Array.isArray(learner?.following) ? learner.following.filter((value): value is string => typeof value === "string" && value.trim().length > 0) : [];

    if (!followingIds.length) {
      setFollowingUsers([]);
      setFollowingUsersError("");
      setLoadingFollowingUsers(false);
      return;
    }

    if (!token) {
      setFollowingUsers([]);
      setFollowingUsersError("Sign in again to load profile details.");
      setLoadingFollowingUsers(false);
      return;
    }

    const controller = new AbortController();

    const loadFollowingUsers = async () => {
      setLoadingFollowingUsers(true);
      setFollowingUsersError("");

      try {
        const users = await Promise.all(
          followingIds.map(async (userId) => {
            const res = await fetch(`${API_BASE}/auth/users/${userId}`, {
              headers: { Authorization: `Bearer ${token}` },
              signal: controller.signal,
            });

            const data = await parseApiResponse(res);
            if (!res.ok || !data || typeof data !== "object" || !("user" in data)) {
              return null;
            }

            const user = (data as { user: Record<string, unknown> }).user;
            if (!user || typeof user !== "object" || typeof user._id !== "string") {
              return null;
            }

            return {
              _id: user._id,
              name: typeof user.name === "string" ? user.name : "Unknown",
              email: typeof user.email === "string" ? user.email : "",
              avatar: typeof user.avatar === "string" ? user.avatar : null,
              role: user.role === "mentor" || user.role === "learner" ? user.role : null,
            } as NetworkUser;
          })
        );

        if (!controller.signal.aborted) {
          setFollowingUsers(users.filter((user): user is NetworkUser => Boolean(user)));
        }
      } catch {
        if (!controller.signal.aborted) {
          setFollowingUsers([]);
          setFollowingUsersError("Failed to load followed users.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingFollowingUsers(false);
        }
      }
    };

    loadFollowingUsers();

    return () => controller.abort();
  }, [learner?.following, token]);

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
          value: "#8ac6ff",
        },
        links: {
          color: "#95d5ff",
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
          value: 0.4,
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

  if (loadingLearner) {
    return (
      <div className="relative min-h-screen bg-background overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-95" aria-hidden="true">
          {particlesReady && <Particles id="learner-profile-particles-loading" className="h-full w-full" options={particlesOptions} />}
        </div>

        <div className="relative z-10">
          <Navbar />
          <div className="text-center py-20">
            <p className="text-muted-foreground">Loading learner profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!learner) {
    return (
      <div className="relative min-h-screen bg-background overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-95" aria-hidden="true">
          {particlesReady && <Particles id="learner-profile-particles-empty" className="h-full w-full" options={particlesOptions} />}
        </div>

        <div className="relative z-10">
          <Navbar />
          <div className="text-center py-20">
            <p className="text-muted-foreground">{learnerError || "Learner not found."}</p>
            <Link to="/dashboard" className="text-primary hover:underline mt-2 inline-block">Back to Dashboard</Link>
          </div>
        </div>
      </div>
    );
  }

  const learnerInterests = Array.isArray(learner.learningInterests) ? learner.learningInterests : [];
  const learnerLanguages = Array.isArray(learner.preferredLanguages) ? learner.preferredLanguages : [];
  const learnerSkills = Array.isArray(learner.skills) ? learner.skills : [];
  const learnerCertifications = Array.isArray(learner.certifications) ? learner.certifications : [];
  const learnerPortfolioLinks = Array.isArray(learner.portfolioLinks) ? learner.portfolioLinks : [];
  const followers = Array.isArray(learner.followers) ? learner.followers : [];
  const following = Array.isArray(learner.following) ? learner.following : [];
  const authProviders = [
    learner.googleId ? "Google" : null,
    learner.githubId ? "GitHub" : null,
  ].filter(Boolean) as string[];
  const accountStatus = learner.disabled ? "Disabled" : "Active";
  const profileCompletion = learner.profileCompleted ? "Completed" : "Incomplete";
  const learnerRole = learner.role || "learner";
  const learnerStats = [
    { label: "Followers", value: String(followers.length), icon: Users },
    { label: "Following", value: String(following.length), icon: ShieldCheck },
    { label: "Joined", value: formatDateTime(learner.createdAt), icon: Clock },
  ];
  const learnerHighlights = [
    {
      label: "Learning Interests",
      value: learnerInterests.length > 0 ? learnerInterests.join(", ") : "No interests added yet.",
    },
    {
      label: "Preferred Languages",
      value: learnerLanguages.length > 0 ? learnerLanguages.join(", ") : "No preferred languages added yet.",
    },
    {
      label: "Experience Level",
      value: learner.experienceLevel || "Not set",
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.14),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.12),_transparent_28%),linear-gradient(135deg,_#f7faff_0%,_#eef4ff_46%,_#fcfdff_100%)]">
      <style>{backdropStyles}</style>
      <div className="absolute inset-0 pointer-events-none opacity-95" aria-hidden="true">
        {particlesReady && <Particles id="learner-profile-particles" className="h-full w-full" options={particlesOptions} />}
      </div>

      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute -left-24 top-12 h-72 w-72 rounded-full bg-sky-300/20 blur-3xl" />
        <div className="absolute -right-20 bottom-8 h-80 w-80 rounded-full bg-indigo-300/20 blur-3xl" />
        <div className="absolute left-1/3 top-1/3 h-40 w-40 rounded-full bg-fuchsia-300/15 blur-3xl" style={{ animation: "floatSoft 9s ease-in-out infinite" }} />
      </div>

      <div className="relative z-10">
        <Navbar />
        <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:space-y-8 sm:px-6 sm:py-10 lg:px-8">
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="w-4 h-4" /> Back
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
                  <Sparkles className="h-3.5 w-3.5" /> Learner profile
                </div>

                <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-start">
                  <img
                    src={learner.avatar || fallbackAvatar}
                    alt={learner.name}
                    className="h-24 w-24 rounded-[1.5rem] object-cover ring-1 ring-white/80 shadow-lg shadow-indigo-500/10 sm:h-28 sm:w-28"
                  />
                  <div className="min-w-0">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{learner.name}</h1>
                    <p className="mt-2 text-sm font-medium text-indigo-700 sm:text-base">Learner</p>
                    <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">{learner.email}</p>

                    <div className="mt-5 flex flex-wrap items-center gap-3">
                      <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/70 px-4 py-2 text-sm text-slate-700 shadow-sm backdrop-blur-md">
                        <Clock className="h-4 w-4 text-indigo-600" /> Active learner
                      </div>
                      <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/70 px-4 py-2 text-sm text-slate-700 shadow-sm backdrop-blur-md">
                        <MapPin className="h-4 w-4 text-indigo-600" /> {learner.experienceLevel || "Not set"}
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-1">
                {learnerStats.map((item, index) => {
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
                <CardTitle className="text-lg sm:text-xl">Profile Snapshot</CardTitle>
                <CardDescription className="text-xs sm:text-sm">A quick summary of the learner profile at a glance.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-4 sm:p-6">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/70 bg-white/75 p-4 shadow-sm backdrop-blur-md">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Role</p>
                    <p className="mt-1 text-sm font-semibold text-foreground capitalize">{learnerRole}</p>
                  </div>

                  <div className="rounded-2xl border border-white/70 bg-white/75 p-4 shadow-sm backdrop-blur-md">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Profile Status</p>
                    <p className="mt-1 text-sm font-semibold text-foreground">{profileCompletion}</p>
                  </div>

                  <div className="rounded-2xl border border-white/70 bg-white/75 p-4 shadow-sm backdrop-blur-md">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Account Status</p>
                    <p className="mt-1 text-sm font-semibold text-foreground">{accountStatus}</p>
                  </div>

                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/70 bg-white/75 p-4 shadow-sm backdrop-blur-md">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Joined</p>
                    <p className="mt-1 text-sm font-semibold text-foreground">{formatDateTime(learner.createdAt)}</p>
                  </div>

                  <div className="rounded-2xl border border-white/70 bg-white/75 p-4 shadow-sm backdrop-blur-md">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Updated</p>
                    <p className="mt-1 text-sm font-semibold text-foreground">{formatDateTime(learner.updatedAt)}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-2">Auth Providers</p>
                  <div className="flex flex-wrap gap-2">
                    {authProviders.length > 0 ? (
                      authProviders.map((provider) => (
                        <Badge key={provider} variant="outline" className="rounded-full border-white/70 bg-white/80 px-3 py-1 shadow-sm">
                          {provider}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No connected auth providers.</p>
                    )}
                  </div>
                </div>

              </CardContent>
            </Card>

            <Card className="overflow-hidden border-white/70 bg-white/80 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.08)] lg:sticky lg:top-24">
              <CardHeader className="space-y-2 border-b border-white/60 bg-gradient-to-r from-white/80 to-indigo-50/40">
                <CardTitle className="text-lg sm:text-xl">Learning Details</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Database-backed learner information shown in one place.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-4 sm:p-6">
                {learnerHighlights.map((item) => (
                  <div key={item.label} className="rounded-2xl border border-white/70 bg-white/75 p-4 shadow-sm backdrop-blur-md">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{item.label}</p>
                    <p className="mt-1 text-sm font-semibold text-foreground">{item.value}</p>
                  </div>
                ))}

                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-2">Auth Providers</p>
                  <div className="flex flex-wrap gap-2">
                    {authProviders.length > 0 ? (
                      authProviders.map((provider) => (
                        <Badge key={provider} variant="outline" className="rounded-full border-white/70 bg-white/80 px-3 py-1 shadow-sm">
                          {provider}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No connected auth providers.</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          <section>
            <Card className="overflow-hidden border-white/70 bg-white/80 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
              <CardHeader className="space-y-2 border-b border-white/60 bg-gradient-to-r from-white/80 to-indigo-50/40">
                <CardTitle className="text-lg sm:text-xl">Additional Profile Fields</CardTitle>
                <CardDescription className="text-xs sm:text-sm">More profile details gathered for this learner.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 p-4 sm:p-6">
                <div>
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground"><BookOpen className="h-4 w-4" /> Summary</h3>
                  <p className="text-sm leading-7 text-muted-foreground">{learner.bio || "No bio provided."}</p>
                </div>

                <div>
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground"><ChevronRight className="h-4 w-4" /> Following</h3>
                  <div className="rounded-2xl border border-white/70 bg-white/70 p-4 shadow-sm backdrop-blur-md">
                    <div className="max-h-40 space-y-1 overflow-auto pr-1">
                      {loadingFollowingUsers ? (
                        <p className="text-sm text-muted-foreground">Loading followed users...</p>
                      ) : followingUsersError ? (
                        <p className="text-sm text-muted-foreground">{followingUsersError}</p>
                      ) : followingUsers.length > 0 ? (
                        followingUsers.map((user) => (
                          <div key={user._id} className="rounded-xl border border-white/60 bg-white/80 px-3 py-2 shadow-sm">
                            <p className="text-sm font-medium text-foreground">{user.name}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No following records.</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        </main>
      </div>
    </div>
  );
};

export default LearnerProfilePage;
