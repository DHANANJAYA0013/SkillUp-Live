import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Sparkles, Rocket, ShieldCheck, Wifi, Layers, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import type { ISourceOptions } from "@tsparticles/engine";

const Index = () => {
  const [particlesReady, setParticlesReady] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      setParticlesReady(true);
    });
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

  return (
    <div className="min-h-screen bg-background">
      <main className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-95" aria-hidden="true">
          {particlesReady && <Particles id="index-particles" className="h-full w-full" options={particlesOptions} />}
        </div>

        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(239_84%_67%/0.1),transparent_60%)]" />

        <section className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-12 sm:pb-16 text-center">
          <div className="relative flex justify-end mb-8 sm:mb-10">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="sm:hidden"
              onClick={() => setMobileMenuOpen((open) => !open)}
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>

            {mobileMenuOpen && (
              <div className="absolute right-0 top-12 w-52 rounded-xl border border-border/60 bg-card/95 backdrop-blur-sm p-3 shadow-card sm:hidden">
                <Link to="/auth" className="block" onClick={() => setMobileMenuOpen(false)}>
                  <Button size="lg" className="w-full gradient-primary text-primary-foreground border-0 gap-2 hover:opacity-90">
                    Get Started <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            )}

            <Link to="/auth" className="hidden sm:block">
              <Button size="lg" className="gradient-primary text-primary-foreground border-0 gap-2 hover:opacity-90">
                Get Started <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            <Sparkles className="h-4 w-4" /> Welcome to SkillBridge
          </span>

          <h1 className="mt-6 text-3xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
            Build momentum from
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary"> your first click</span>
          </h1>

          <p className="mt-5 max-w-2xl mx-auto text-base sm:text-lg text-muted-foreground px-1 sm:px-0">
            SkillBridge is designed as a modern live-learning platform with real-time sessions, smooth onboarding,
            secure access, and a focused interface that helps you move from curiosity to action quickly.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link to="/auth" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="gap-2">
                <BookOpen className="h-4 w-4" /> Sign In
              </Button>
            </Link>
          </div>
        </section>

        <section className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-14 sm:pb-16">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <article className="rounded-2xl border border-border/60 bg-card/70 backdrop-blur-sm p-5 shadow-card">
              <div className="w-10 h-10 rounded-xl gradient-primary text-primary-foreground grid place-items-center mb-3">
                <Rocket className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-foreground">Fast Start Experience</h3>
              <p className="mt-1 text-sm text-muted-foreground">Jump in quickly with a clean flow from signup to live session.</p>
            </article>

            <article className="rounded-2xl border border-border/60 bg-card/70 backdrop-blur-sm p-5 shadow-card">
              <div className="w-10 h-10 rounded-xl gradient-primary text-primary-foreground grid place-items-center mb-3">
                <Wifi className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-foreground">Real-Time Core</h3>
              <p className="mt-1 text-sm text-muted-foreground">Built for live interaction with low-friction room joining.</p>
            </article>

            <article className="rounded-2xl border border-border/60 bg-card/70 backdrop-blur-sm p-5 shadow-card">
              <div className="w-10 h-10 rounded-xl gradient-primary text-primary-foreground grid place-items-center mb-3">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-foreground">Secure by Design</h3>
              <p className="mt-1 text-sm text-muted-foreground">Account, session, and access flows are structured for trust.</p>
            </article>

            <article className="rounded-2xl border border-border/60 bg-card/70 backdrop-blur-sm p-5 shadow-card">
              <div className="w-10 h-10 rounded-xl gradient-primary text-primary-foreground grid place-items-center mb-3">
                <Layers className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-foreground">Scalable Foundation</h3>
              <p className="mt-1 text-sm text-muted-foreground">A modular frontend experience ready for future capabilities.</p>
            </article>
          </div>
        </section>

        <section className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-14 sm:pb-16">
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 sm:p-8 text-center">
            <p className="text-sm uppercase tracking-wider text-primary font-semibold">What makes it interesting</p>
            <p className="mt-2 text-base sm:text-lg text-foreground">
              Every screen is crafted to reduce clutter and increase focus, so users can enter a live environment,
              communicate clearly, and stay engaged without distractions.
            </p>
          </div>
        </section>

        {/* <section className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 text-center">
          <Link to="/landing" className="text-sm font-medium text-primary hover:underline">
            Explore the platform first &rarr;
          </Link>
        </section> */}
      </main>
    </div>
  );
};

export default Index;