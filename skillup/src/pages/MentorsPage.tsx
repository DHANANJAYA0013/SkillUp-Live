import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Sparkles,
  Users,
  Star,
  BadgeCheck,
  MessageSquareMore,
  WandSparkles,
  BrainCircuit,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import type { ISourceOptions } from "@tsparticles/engine";
import MentorCard from "@/components/MentorCard";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { API_BASE } from "@/features/authsystem/config";

interface ApiMentor {
  _id: string;
  name: string;
  email: string;
  avatar?: string | null;
  skills: string[];
}

interface MentorListItem {
  id: string;
  name: string;
  avatar: string;
  title: string;
  skills: string[];
  rating: number;
  reviewCount: number;
  pricePerSession: number;
  category: string;
}

const heroFeatures = [
  {
    title: "Curated mentor discovery",
    description: "Explore mentors across high-signal learning paths and creative skills.",
    icon: Sparkles,
  },
  {
    title: "Community-powered growth",
    description: "Learn alongside active mentors and learners in a shared public space.",
    icon: Users,
  },
  {
    title: "Real guidance, faster progress",
    description: "Find experts who can help you move from curiosity to momentum.",
    icon: BadgeCheck,
  },
];

const parseApiResponse = async (res: Response) => {
  const raw = await res.text();
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return raw;
  }
};

const fallbackAvatar = "https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=400&q=80";

const mentorMotion = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.45 },
};

const MentorsBackdrop = () => (
  <>
    <style>{`
      @keyframes floatGlow {
        0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
        50% { transform: translate3d(0, -18px, 0) scale(1.05); }
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
            radial-gradient(ellipse 50% 40% at 10% 80%, rgba(99,102,241,0.12) 0%, transparent 60%),
            linear-gradient(180deg, #f5f3ff 0%, #eef2ff 52%, #f8fbff 100%)
        `,
      }}
      aria-hidden="true"
    />
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }} aria-hidden="true">
        <div style={{ position: "absolute", width: 520, height: 520, borderRadius: "50%", background: "radial-gradient(circle, rgba(167,139,250,0.18) 0%, transparent 70%)", top: "-10%", right: "-5%", animation: "orbFloat1 8s ease-in-out infinite" }} />
        <div style={{ position: "absolute", width: 380, height: 380, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.13) 0%, transparent 70%)", bottom: "5%", left: "-8%", animation: "orbFloat2 10s ease-in-out infinite" }} />
        <div style={{ position: "absolute", width: 260, height: 260, borderRadius: "50%", background: "radial-gradient(circle, rgba(196,181,253,0.15) 0%, transparent 70%)", top: "45%", left: "40%", animation: "orbFloat3 7s ease-in-out infinite" }} />
        <div style={{ position: "absolute", top: "20%", right: "24%", width: 12, height: 12, borderRadius: "50%", background: "rgba(129,140,248,0.85)", boxShadow: "0 0 34px rgba(129,140,248,0.9)", animation: "floatGlow 5s ease-in-out infinite" }} />
        <div style={{ position: "absolute", bottom: "18%", left: "18%", width: 10, height: 10, borderRadius: "50%", background: "rgba(168,85,247,0.7)", boxShadow: "0 0 26px rgba(168,85,247,0.85)", animation: "floatGlow 6s ease-in-out infinite" }} />
    </div>
  </>
);

const MentorsPage = () => {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [showCategoryRecommendations, setShowCategoryRecommendations] = useState(false);
  const [particlesReady, setParticlesReady] = useState(false);
  const [mentorsData, setMentorsData] = useState<MentorListItem[]>([]);
  const [loadingMentors, setLoadingMentors] = useState(true);
  const [mentorsError, setMentorsError] = useState("");

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      setParticlesReady(true);
    });
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const loadMentors = async () => {
      setLoadingMentors(true);
      setMentorsError("");

      try {
        const res = await fetch(`${API_BASE}/auth/mentors`, {
          signal: controller.signal,
        });

        const data = await parseApiResponse(res);
        if (!res.ok) {
          const message =
            data && typeof data === "object" && "error" in data
              ? String((data as { error: unknown }).error)
              : "Failed to load mentors";
          throw new Error(message);
        }

        const list =
          data && typeof data === "object" && "mentors" in data && Array.isArray((data as { mentors: unknown[] }).mentors)
            ? ((data as { mentors: ApiMentor[] }).mentors)
            : [];

        const mappedMentors = list.map((mentor) => {
          const skills = Array.isArray(mentor.skills) ? mentor.skills.filter(Boolean) : [];
          const title = skills.length > 0 ? `${skills[0]} Mentor` : "Mentor";
          return {
            id: mentor._id,
            name: mentor.name,
            avatar: mentor.avatar || fallbackAvatar,
            title,
            skills,
            rating: 5,
            reviewCount: 0,
            pricePerSession: 0,
            category: skills[0] || "General",
          };
        });

        setMentorsData(mappedMentors);
      } catch (error) {
        if (controller.signal.aborted) return;
        setMentorsError(error instanceof Error ? error.message : "Failed to load mentors");
        setMentorsData([]);
      } finally {
        if (!controller.signal.aborted) {
          setLoadingMentors(false);
        }
      }
    };

    loadMentors();
    return () => controller.abort();
  }, []);

  const categories = useMemo(() => {
    const unique = new Set<string>();
    mentorsData.forEach((mentor) => {
      if (mentor.category) unique.add(mentor.category);
    });
    return ["All", ...Array.from(unique)];
  }, [mentorsData]);

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

  const filtered = mentorsData.filter((m) => {
    const matchesSearch = m.name.toLowerCase().includes(search.toLowerCase()) || m.skills.some((s) => s.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = activeCategory === "All" || m.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="relative min-h-screen overflow-hidden">
      <MentorsBackdrop />
      <div className="absolute inset-0 pointer-events-none opacity-95" aria-hidden="true">
        {particlesReady && <Particles id="mentors-particles" className="h-full w-full" options={particlesOptions} />}
      </div>

      <div className="relative z-10">
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative overflow-hidden rounded-[2rem] border border-white/60 bg-white/45 p-6 shadow-[0_30px_80px_rgba(91,80,171,0.14)] backdrop-blur-2xl sm:p-8"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/85 via-white/25 to-indigo-100/30" aria-hidden="true" />
            <div className="absolute -top-8 right-0 h-32 w-32 rounded-full bg-fuchsia-400/20 blur-3xl" aria-hidden="true" />
            <div className="absolute bottom-0 left-1/3 h-36 w-36 rounded-full bg-indigo-400/20 blur-3xl" aria-hidden="true" />

            <div className="relative z-10 grid gap-8 lg:grid-cols-[1.2fr_0.9fr] lg:items-center">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-700 shadow-sm backdrop-blur-md">
                  <Sparkles className="h-3.5 w-3.5" /> Mentor discovery
                </div>
                <h1 className="max-w-3xl text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                  Discover mentors who help you learn faster.
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                  Explore premium mentors across design, coding, strategy, and creative growth in a polished public marketplace.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  {heroFeatures.map((feature, index) => {
                    const FeatureIcon = feature.icon;
                    return (
                      <motion.div
                        key={feature.title}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, delay: 0.04 * index }}
                        className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/65 px-4 py-2 text-sm text-slate-700 shadow-sm backdrop-blur-md"
                      >
                        <FeatureIcon className="h-4 w-4 text-indigo-600" />
                        {feature.title}
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              <div className="relative mx-auto flex w-full max-w-md items-center justify-center">
                <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-indigo-500/10 via-fuchsia-500/10 to-cyan-500/10 blur-2xl" aria-hidden="true" />
                <div className="relative grid w-full grid-cols-2 gap-3 rounded-[2rem] border border-white/70 bg-white/60 p-4 shadow-lg shadow-indigo-500/10 backdrop-blur-xl sm:gap-4 sm:p-5">
                  {[
                    { label: "Live guidance", icon: Users, note: "Mentors available in real time." },
                    { label: "Creative skills", icon: WandSparkles, note: "Design, coding, music, and more." },
                    { label: "Smart discovery", icon: BrainCircuit, note: "Find mentors by topic or skill." },
                    { label: "Community growth", icon: MessageSquareMore, note: "Learn with active peers." },
                  ].map((item, index) => {
                    const ItemIcon = item.icon;
                    return (
                      <motion.div
                        key={item.label}
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, delay: 0.05 * index }}
                        whileHover={{ y: -4, scale: 1.02 }}
                        className={`relative overflow-hidden rounded-2xl border border-white/70 bg-gradient-to-br p-4 shadow-sm ${index % 2 === 0 ? "from-violet-500/20 via-indigo-500/15 to-sky-500/20" : "from-fuchsia-500/20 via-violet-500/15 to-indigo-500/20"} backdrop-blur-md`}
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/75 shadow-sm ring-1 ring-white/80">
                          <ItemIcon className="h-4 w-4 text-indigo-700" />
                        </div>
                        <p className="mt-3 text-sm font-semibold text-foreground">{item.label}</p>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.note}</p>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="sticky top-20 z-20 mt-6 rounded-[2rem] border border-white/60 bg-white/50 p-4 shadow-[0_24px_80px_rgba(91,80,171,0.1)] backdrop-blur-2xl"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative w-full lg:max-w-xl">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-indigo-500" />
                <Input
                  placeholder="Search mentors or skills..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onFocus={() => setShowCategoryRecommendations(true)}
                  onBlur={() => {
                    window.setTimeout(() => setShowCategoryRecommendations(false), 120);
                  }}
                  className="h-12 rounded-2xl border-white/70 bg-white/75 pl-11 pr-4 text-sm shadow-inner shadow-white/60 backdrop-blur-xl placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-indigo-400"
                />

                {showCategoryRecommendations && (
                  <div className="absolute left-0 right-0 top-[calc(100%+0.75rem)] z-30 rounded-[1.75rem] border border-white/70 bg-white/80 p-3 shadow-[0_22px_60px_rgba(91,80,171,0.16)] backdrop-blur-2xl">
                    <div className="mb-2 flex items-center justify-between px-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-700">Recommended categories</p>
                      <span className="text-xs text-muted-foreground">Click to filter</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {categories.map((cat) => (
                        <Button
                          key={cat}
                          variant="secondary"
                          size="sm"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => {
                            setActiveCategory(cat);
                            setShowCategoryRecommendations(false);
                          }}
                          className={`rounded-full border border-white/70 px-4 py-2 text-sm shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/90 hover:text-slate-900 ${activeCategory === cat ? "border-transparent bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:bg-gradient-to-r hover:text-white" : "bg-white/70 text-slate-700"}`}
                        >
                          {cat}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.section>

          <motion.section
            {...mentorMotion}
            className="mt-10"
          >
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/65 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-indigo-700 shadow-sm backdrop-blur-md">
                  <MessageSquareMore className="h-3.5 w-3.5" /> All mentors
                </div>
                <h2 className="mt-3 text-xl font-semibold text-foreground">Browse the full mentor marketplace</h2>
                <p className="mt-1 text-sm text-muted-foreground">Search and filter remain the same, now wrapped in a more immersive discovery layout.</p>
              </div>
              <div className="hidden rounded-full border border-white/70 bg-white/65 px-3 py-1 text-sm text-slate-600 shadow-sm backdrop-blur-md sm:block">
                {filtered.length} results
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="rounded-[1.75rem] border border-dashed border-white/70 bg-white/45 py-20 text-center backdrop-blur-xl">
                <p className="text-muted-foreground">No mentors found. Try adjusting your search.</p>
              </div>
            ) : loadingMentors ? (
              <div className="rounded-[1.75rem] border border-white/70 bg-white/55 py-20 text-center backdrop-blur-xl">
                <p className="text-muted-foreground">Loading mentors...</p>
              </div>
            ) : mentorsError ? (
              <div className="rounded-[1.75rem] border border-rose-200/70 bg-rose-500/10 py-20 text-center backdrop-blur-xl">
                <p className="text-destructive">{mentorsError}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
                {filtered.map((mentor) => (
                  <MentorCard key={mentor.id} mentor={mentor} />
                ))}
              </div>
            )}
          </motion.section>
        </main>
      <Footer />
      </div>
    </div>
  );
};

export default MentorsPage;
