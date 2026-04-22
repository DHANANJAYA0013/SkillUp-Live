import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, BookOpen, GraduationCap, Languages } from "lucide-react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import type { ISourceOptions } from "@tsparticles/engine";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import { API_BASE } from "@/features/authsystem/config";

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

const parseApiResponse = async (res: Response) => {
  const raw = await res.text();
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return raw;
  }
};

const fallbackAvatar = "https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=400&q=80";

const formatDateTime = (value?: string) => {
  if (!value) return "Not set";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
};

const LearnerProfilePage = () => {
  const { id } = useParams();
  const [learner, setLearner] = useState<LearnerDetails | null>(null);
  const [loadingLearner, setLoadingLearner] = useState(true);
  const [learnerError, setLearnerError] = useState("");
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

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-95" aria-hidden="true">
        {particlesReady && <Particles id="learner-profile-particles" className="h-full w-full" options={particlesOptions} />}
      </div>

      <div className="relative z-10">
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-card rounded-xl shadow-card border border-border/50 p-5 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-5">
                  <img src={learner.avatar || fallbackAvatar} alt={learner.name} className="w-20 h-20 rounded-xl object-cover" />
                  <div className="min-w-0">
                    <h1 className="text-xl sm:text-2xl font-bold text-foreground">{learner.name}</h1>
                    <p className="text-muted-foreground">Learner</p>
                    <p className="text-sm text-muted-foreground mt-1">{learner.email}</p>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-xl shadow-card border border-border/50 p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" /> Learning Interests
                </h2>
                <div className="flex flex-wrap gap-2">
                  {learnerInterests.map((interest) => (
                    <Badge key={interest} variant="secondary" className="bg-primary/10 text-primary border-0 px-3 py-1">
                      {interest}
                    </Badge>
                  ))}
                  {learnerInterests.length === 0 && (
                    <p className="text-sm text-muted-foreground">No interests added yet.</p>
                  )}
                </div>
              </div>

              <div className="bg-card rounded-xl shadow-card border border-border/50 p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4" /> Profile Data
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border border-border/60 bg-muted/20 p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Experience Level</p>
                    <p className="mt-1 text-sm font-medium text-foreground" style={{ textTransform: "capitalize" }}>
                      {learner.experienceLevel || "Not set"}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-muted/20 p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Followers</p>
                    <p className="mt-1 text-sm font-medium text-foreground">{followers.length}</p>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-muted/20 p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Following</p>
                    <p className="mt-1 text-sm font-medium text-foreground">{following.length}</p>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-muted/20 p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Years of Experience</p>
                    <p className="mt-1 text-sm font-medium text-foreground">
                      {learner.yearsOfExperience === null || learner.yearsOfExperience === undefined
                        ? "Not set"
                        : learner.yearsOfExperience}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-muted/20 p-4 sm:col-span-2">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Bio</p>
                    <p className="mt-1 text-sm leading-6 text-foreground">
                      {learner.bio || "No bio provided."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-xl shadow-card border border-border/50 p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Languages className="w-4 h-4" /> Preferred Languages
                </h2>
                <div className="flex flex-wrap gap-2">
                  {learnerLanguages.map((language) => (
                    <Badge key={language} variant="outline" className="px-3 py-1">
                      {language}
                    </Badge>
                  ))}
                  {learnerLanguages.length === 0 && (
                    <p className="text-sm text-muted-foreground">No preferred languages added yet.</p>
                  )}
                </div>
              </div>

              <div className="bg-card rounded-xl shadow-card border border-border/50 p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4">Additional Profile Fields</h2>

                <div className="space-y-4">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {learnerSkills.map((skill) => (
                        <Badge key={skill} variant="secondary" className="bg-primary/10 text-primary border-0 px-3 py-1">
                          {skill}
                        </Badge>
                      ))}
                      {learnerSkills.length === 0 && <p className="text-sm text-muted-foreground">No skills added.</p>}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Certifications</p>
                    <div className="flex flex-wrap gap-2">
                      {learnerCertifications.map((certification) => (
                        <Badge key={certification} variant="outline" className="px-3 py-1">
                          {certification}
                        </Badge>
                      ))}
                      {learnerCertifications.length === 0 && (
                        <p className="text-sm text-muted-foreground">No certifications added.</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Portfolio Links</p>
                    <div className="space-y-2">
                      {learnerPortfolioLinks.map((link) => (
                        <a
                          key={link}
                          href={link}
                          target="_blank"
                          rel="noreferrer"
                          className="block break-all text-sm text-primary hover:underline"
                        >
                          {link}
                        </a>
                      ))}
                      {learnerPortfolioLinks.length === 0 && (
                        <p className="text-sm text-muted-foreground">No portfolio links added.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-card rounded-xl shadow-card border border-border/50 p-6 lg:sticky lg:top-24 space-y-4">
                <div className="text-center rounded-lg bg-muted/30 py-3 border border-border/60">
                  <div className="text-3xl font-bold text-foreground">{following.length}</div>
                  <div className="text-sm text-muted-foreground">Following</div>
                </div>

                <div className="rounded-lg bg-muted/30 py-3 px-4 border border-border/60">
                  <div className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                    <GraduationCap className="w-4 h-4" /> Experience Level
                  </div>
                  <p className="font-medium text-foreground" style={{ textTransform: "capitalize" }}>
                    {learner.experienceLevel || "Not set"}
                  </p>
                </div>

                <div className="rounded-lg bg-muted/30 py-3 px-4 border border-border/60">
                  <div className="text-sm text-muted-foreground mb-1">Followers IDs</div>
                  <p className="text-sm font-medium text-foreground">{followers.length}</p>
                </div>

                <div className="rounded-lg bg-muted/30 py-3 px-4 border border-border/60">
                  <div className="text-sm text-muted-foreground mb-2">Following IDs</div>
                  <div className="max-h-40 overflow-auto space-y-1 pr-1">
                    {following.length > 0 ? (
                      following.map((idValue) => (
                        <p key={idValue} className="break-all text-xs text-muted-foreground">
                          {idValue}
                        </p>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No following records.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearnerProfilePage;
