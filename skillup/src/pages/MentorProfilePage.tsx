import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Star, Clock, Calendar, MapPin, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-95" aria-hidden="true">
        {particlesReady && <Particles id="mentor-profile-particles" className="h-full w-full" options={particlesOptions} />}
      </div>

      <div className="relative z-10">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <Link to="/mentors" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Mentors
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-card rounded-xl shadow-card border border-border/50 p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-5">
                <img src={mentor.avatar || fallbackAvatar} alt={mentor.name} className="w-20 h-20 rounded-xl object-cover" />
                <div className="min-w-0">
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground">{mentor.name}</h1>
                  <p className="text-muted-foreground">{mentorTitle}</p>
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-3">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-accent text-accent" />
                      <span className="text-sm font-medium">5.0</span>
                      <span className="text-xs text-muted-foreground">(0 reviews)</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground text-sm">
                      <Clock className="w-3.5 h-3.5" /> Mentor
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* About */}
            <div className="bg-card rounded-xl shadow-card border border-border/50 p-6">
              <h2 className="text-lg font-semibold text-foreground mb-3">About</h2>
              <p className="text-muted-foreground leading-relaxed">{mentor.bio || "This mentor has not added a bio yet."}</p>
            </div>

            {/* Skills */}
            <div className="bg-card rounded-xl shadow-card border border-border/50 p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Skills Offered</h2>
              <div className="flex flex-wrap gap-2">
                {mentorSkills.map((skill) => (
                  <Badge key={skill} variant="secondary" className="bg-primary/10 text-primary border-0 px-3 py-1">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> {skill}
                  </Badge>
                ))}
                {mentorSkills.length === 0 && (
                  <p className="text-sm text-muted-foreground">No skills added yet.</p>
                )}
              </div>
            </div>

            {/* Reviews */}
            <div className="bg-card rounded-xl shadow-card border border-border/50 p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Reviews</h2>
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="flex gap-3 pb-4 border-b border-border/50 last:border-0">
                    <img src={review.userAvatar} alt={review.userName} className="w-9 h-9 rounded-full object-cover" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{review.userName}</span>
                        <div className="flex">
                          {Array.from({ length: review.rating }).map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-accent text-accent" />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{review.comment}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-card rounded-xl shadow-card border border-border/50 p-6 lg:sticky lg:top-24">
              <div className="text-center mb-6">
                <div className="text-3xl font-bold text-foreground">{followersCount}</div>
                <div className="text-sm text-muted-foreground">followers</div>
              </div>
              <Button
                className="w-full gradient-primary text-primary-foreground border-0 mb-3 hover:opacity-90"
                onClick={handleFollowToggle}
                disabled={followLoading}
              >
                {followLoading ? "Please wait..." : isFollowing ? "Following" : "Follow"}
              </Button>
              <Link to={`/chat/${mentor._id}`} className="w-full block">
                <Button variant="outline" className="w-full">
                  Send Message
                </Button>
              </Link>

              <div className="mt-6 pt-6 border-t border-border/50 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Sessions done</span>
                  <span className="font-medium text-foreground">0</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Following</span>
                  <span className="font-medium text-foreground">{isFollowing ? "Yes" : "No"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Experience</span>
                  <span className="font-medium text-foreground">Mentor</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Category</span>
                  <span className="font-medium text-foreground">{mentorCategory}</span>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-border/50">
                <h3 className="text-sm font-medium text-foreground mb-2">Availability</h3>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="text-xs">To be updated</Badge>
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

export default MentorProfilePage;
