import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
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

const parseApiResponse = async (res: Response) => {
  const raw = await res.text();
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return raw;
  }
};

const fallbackAvatar = "https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=400&q=80";

const MentorsPage = () => {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
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
    <div className="relative min-h-screen bg-background overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-95" aria-hidden="true">
        {particlesReady && <Particles id="mentors-particles" className="h-full w-full" options={particlesOptions} />}
      </div>

      <div className="relative z-10">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Find a Mentor</h1>
          <p className="text-muted-foreground mt-1">Browse expert mentors across all categories</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1 w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search mentors or skills..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={activeCategory === cat ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory(cat)}
              className={activeCategory === cat ? "gradient-primary text-primary-foreground border-0" : ""}
            >
              {cat}
            </Button>
          ))}
        </div>

        {/* Grid */}
        {loadingMentors ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground">Loading mentors...</p>
          </div>
        ) : mentorsError ? (
          <div className="text-center py-20">
            <p className="text-destructive">{mentorsError}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((mentor) => (
              <MentorCard key={mentor.id} mentor={mentor} />
            ))}
          </div>
        )}

        {filtered.length === 0 && (
          <div className="text-center py-20">
            <p className="text-muted-foreground">No mentors found. Try adjusting your search.</p>
          </div>
        )}
      </div>
      <Footer />
      </div>
    </div>
  );
};

export default MentorsPage;
