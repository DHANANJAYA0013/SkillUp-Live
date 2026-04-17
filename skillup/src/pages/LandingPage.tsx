import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Users, Zap, Shield, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import type { ISourceOptions } from "@tsparticles/engine";
import MentorCard from "@/components/MentorCard";
import SkillCard from "@/components/SkillCard";
import { mentors, skills } from "@/data/mockData";
import Footer from "@/components/Footer";
import heroBackground from "@/Assets/background_1.webp";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const benefits = [
  { icon: Users, title: "Expert Mentors", desc: "Learn from industry professionals with verified experience." },
  { icon: Zap, title: "Live Sessions", desc: "Interactive 1-on-1 sessions with real-time feedback." },
  { icon: Shield, title: "Secure Booking", desc: "Safe payments and guaranteed session quality." },
  { icon: TrendingUp, title: "Track Progress", desc: "Monitor your learning journey with detailed analytics." },
];

const stats = [
  { value: "25+", label: "Active Mentors" },
  { value: "15+", label: "Sessions Done" },
  { value: "20+", label: "Skill Categories" },
  { value: "4.1★", label: "Avg Rating" },
];

const LandingPage = () => {
  const [particlesReady, setParticlesReady] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });

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
    <div className="relative min-h-screen bg-background overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-95" aria-hidden="true">
        {particlesReady && <Particles id="landing-particles" className="h-full w-full" options={particlesOptions} />}
      </div>

      <div className="relative z-10">
      {/* Hero */}
      <section className="relative overflow-hidden min-h-[92vh]">
        <div
          className="absolute inset-0 bg-center bg-cover bg-no-repeat"
          style={{ backgroundImage: `url(${heroBackground})` }}
        />
        <div className="absolute inset-0 bg-background/10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(239_84%_67%/0.08),transparent_60%)]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-28 pb-24 sm:pb-32 relative">
          <div className="absolute top-4 right-4 sm:top-6 sm:right-6 lg:right-8 z-20">
            <Link to="/auth">
              <Button className="h-9 px-3 text-sm gradient-primary text-primary-foreground border-0 gap-2 hover:opacity-90 sm:h-10 sm:px-4 lg:h-11 lg:px-6">
                Get Started <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          <motion.div
            className="max-w-3xl mx-auto text-center"
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={fadeUp} custom={0}>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                <Zap className="w-3.5 h-3.5" /> Community-Powered Learning
              </span>
            </motion.div>
            <motion.h1 variants={fadeUp} custom={1} className="text-3xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-5 sm:mb-6">
              Learn Any Skill From{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                Real Experts
              </span>
            </motion.h1>
            <motion.p variants={fadeUp} custom={2} className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Connect with experienced mentors, book personalized sessions, and accelerate your growth in programming, design, music, and more.
            </motion.p>

            <motion.div variants={fadeUp} custom={3} className="flex flex-wrap items-center justify-center gap-3">
              <Link to="/auth">
                <Button size="lg" variant="outline" className="gap-2">
                  Sign In
                </Button>
              </Link>
            </motion.div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="mt-14 sm:mt-20 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 max-w-3xl mx-auto"
          >
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Featured Mentors */}
      <section className="py-14 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-8 sm:mb-10">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Top Mentors</h2>
              <p className="text-muted-foreground mt-2">Learn from the best in their fields</p>
            </div>
            <Link to="/mentors" className="text-sm font-medium text-primary hover:underline hidden sm:block">
              View all →
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {mentors.slice(0, 3).map((mentor) => (
              <MentorCard key={mentor.id} mentor={mentor} />
            ))}
          </div>
        </div>
      </section>

      {/* Featured Skills */}
      <section className="py-14 sm:py-20 bg-muted/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-8 sm:mb-10">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Popular Skills</h2>
              <p className="text-muted-foreground mt-2">Most sought-after skills this month</p>
            </div>
            <Link to="/sessions" className="text-sm font-medium text-primary hover:underline hidden sm:block">
              View all →
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {skills.slice(0, 3).map((skill) => (
              <SkillCard key={skill.id} skill={skill} />
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-14 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Why SkillBridge?</h2>
            <p className="text-muted-foreground mt-2 max-w-lg mx-auto">Everything you need for a great learning experience</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((b) => (
              <div key={b.title} className="text-center group">
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200">
                  <b.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{b.title}</h3>
                <p className="text-sm text-muted-foreground">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="gradient-primary rounded-2xl p-6 sm:p-10 md:p-12 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-primary-foreground mb-4">Ready to Start Learning?</h2>
            <p className="text-primary-foreground/80 mb-8 max-w-lg mx-auto">Join thousands of learners and mentors building skills together.</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/signup">
                <Button size="lg" variant="secondary" className="bg-card text-foreground hover:bg-card/90 gap-2">
                  Join as Learner <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/signup">
                <Button size="lg" variant="outline" className="border-primary-foreground/30 text-foreground hover:bg-primary-foreground/10">
                  Become a Mentor
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
      </div>
    </div>
  );
};

export default LandingPage;
