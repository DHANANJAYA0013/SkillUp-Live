import { useRef, useEffect, useState } from "react";
import * as THREE from "three";

/* ─────────────────────────────────────────────
   COLOUR TOKENS
───────────────────────────────────────────── */
const C = {
  purple: "#7C3AED",
  purpleLight: "#A78BFA",
  purpleDark: "#5B21B6",
  lavender: "#EDE9FE",
  indigo: "#4F46E5",
  sky: "#E0F2FE",
  bg: "#F0EEFF",
  text: "#1E1B4B",
  muted: "#6B7280",
};

function useResponsive() {
  const getWidth = () => (typeof window === "undefined" ? 1280 : window.innerWidth);
  const [width, setWidth] = useState(getWidth);

  useEffect(() => {
    const onResize = () => setWidth(getWidth());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return {
    width,
    isMobile: width <= 768,
    isTablet: width <= 1024,
    isCompact: width <= 900,
  };
}

/* ─────────────────────────────────────────────
   SHARED: floating orb background decoration
───────────────────────────────────────────── */
function FloatingOrbs() {
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
      <div style={{
        position: "absolute", width: 500, height: 500, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(167,139,250,0.18) 0%, transparent 70%)",
        top: "-10%", right: "-5%", animation: "orbFloat1 8s ease-in-out infinite",
      }} />
      <div style={{
        position: "absolute", width: 380, height: 380, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(99,102,241,0.13) 0%, transparent 70%)",
        bottom: "5%", left: "-8%", animation: "orbFloat2 10s ease-in-out infinite",
      }} />
      <div style={{
        position: "absolute", width: 260, height: 260, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(196,181,253,0.15) 0%, transparent 70%)",
        top: "45%", left: "40%", animation: "orbFloat3 7s ease-in-out infinite",
      }} />
    </div>
  );
}

/* ─────────────────────────────────────────────
   NAVBAR  (page-aware)
───────────────────────────────────────────── */
function Navbar({ activePage, setPage }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isMobile, isCompact } = useResponsive();

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  useEffect(() => {
    if (!isCompact) setMobileOpen(false);
  }, [isCompact]);

  const navLinks = ["Home", "About", "Features", "How It Works"];

  return (
    <nav style={{
      position: "fixed", top: isMobile ? 10 : 16, left: "50%", transform: "translateX(-50%)",
      width: isMobile ? "calc(100% - 20px)" : "calc(100% - 48px)", maxWidth: 1100,
      background: scrolled ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.78)",
      backdropFilter: "blur(20px)",
      borderRadius: isMobile ? 16 : 20, border: "1px solid rgba(124,58,237,0.12)",
      boxShadow: scrolled ? "0 8px 40px rgba(124,58,237,0.14)" : "0 4px 24px rgba(124,58,237,0.08)",
      zIndex: 200, display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: isMobile ? "10px 14px" : "12px 28px", transition: "all 0.3s ease",
    }}>
      {/* Logo */}
      <div onClick={() => setPage("Home")} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
        <div style={{
          width: 36, height: 36,
          background: `linear-gradient(135deg, ${C.purple}, ${C.indigo})`,
          borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <span style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 18, color: C.text, letterSpacing: -0.5 }}>
          BuildSphere
        </span>
      </div>

      {/* Nav links */}
      {!isCompact && (
        <div style={{ display: "flex", gap: 28, alignItems: "center" }} className="nav-links">
          {navLinks.map((l) => {
            const isActive = activePage === l;
            return (
              <button key={l} onClick={() => setPage(l)} style={{
                background: "none", border: "none", cursor: "pointer",
                fontSize: 14, fontWeight: isActive ? 600 : 500,
                color: isActive ? C.purple : C.muted,
                borderBottom: isActive ? `2px solid ${C.purple}` : "2px solid transparent",
                paddingBottom: 2, fontFamily: "'DM Sans', sans-serif",
                transition: "color 0.2s, border-color 0.2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.color = C.purple; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = C.muted; }}
              >{l}</button>
            );
          })}
        </div>
      )}

      {/* Auth */}
      {!isCompact && <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <button style={{
          background: `linear-gradient(135deg, ${C.purple}, ${C.indigo})`, border: "none",
          borderRadius: 12, padding: "9px 20px", fontSize: 14, fontWeight: 600,
          color: "white", cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
          fontFamily: "'DM Sans', sans-serif", boxShadow: `0 4px 16px rgba(124,58,237,0.35)`,
          transition: "all 0.2s",
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = `0 8px 24px rgba(124,58,237,0.45)`; }}
        onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = `0 4px 16px rgba(124,58,237,0.35)`; }}
        onClick={() => { window.location.href = "/auth"; }}>
          <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
          </svg>
          Sign Up
        </button>
      </div>}

      {isCompact && (
        <button
          aria-label="Toggle navigation"
          onClick={() => setMobileOpen(v => !v)}
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            border: "1px solid rgba(124,58,237,0.2)",
            background: "rgba(255,255,255,0.95)",
            color: C.purple,
            display: "grid",
            placeItems: "center",
            cursor: "pointer",
          }}
        >
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            {mobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      )}

      {isCompact && mobileOpen && (
        <div style={{
          position: "absolute",
          top: "calc(100% + 10px)",
          left: 0,
          right: 0,
          background: "rgba(255,255,255,0.98)",
          border: "1px solid rgba(124,58,237,0.14)",
          borderRadius: 16,
          boxShadow: "0 16px 40px rgba(124,58,237,0.14)",
          padding: 14,
          display: "grid",
          gap: 8,
        }}>
          {navLinks.map((l) => {
            const isActive = activePage === l;
            return (
              <button
                key={l}
                onClick={() => {
                  setPage(l);
                  setMobileOpen(false);
                }}
                style={{
                  border: "none",
                  background: isActive ? "rgba(124,58,237,0.12)" : "transparent",
                  color: isActive ? C.purple : C.text,
                  borderRadius: 10,
                  padding: "10px 12px",
                  textAlign: "left",
                  fontSize: 15,
                  fontWeight: isActive ? 700 : 600,
                  fontFamily: "'DM Sans', sans-serif",
                  cursor: "pointer",
                }}
              >
                {l}
              </button>
            );
          })}
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 8, marginTop: 4 }}>
            <button style={{
              background: `linear-gradient(135deg, ${C.purple}, ${C.indigo})`, border: "none",
              borderRadius: 10, padding: "10px 12px", fontSize: 14, fontWeight: 700,
              color: "white", cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
            }}
            onClick={() => { window.location.href = "/auth"; }}>Sign Up</button>
          </div>
        </div>
      )}
    </nav>
  );
}

/* ─────────────────────────────────────────────
   SHARED: Page hero banner (for inner pages)
───────────────────────────────────────────── */
function PageHero({ badge, title, subtitle, accentWord }) {
  const { isMobile } = useResponsive();
  const parts = title.split(accentWord || "___NONE___");
  return (
    <div style={{
      padding: isMobile ? "118px 18px 42px" : "140px 24px 60px",
      textAlign: "center", maxWidth: 760, margin: "0 auto",
    }}>
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 8,
        background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)",
        borderRadius: 100, padding: "6px 16px", marginBottom: 28,
      }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.purple, animation: "pulse 2s infinite" }} />
        <span style={{ fontSize: 12, fontWeight: 600, color: C.purple, fontFamily: "'DM Sans', sans-serif", letterSpacing: 0.5 }}>{badge}</span>
      </div>
      <h1 style={{
        fontFamily: "'Sora', sans-serif", fontSize: "clamp(36px, 5vw, 58px)",
        fontWeight: 800, color: C.text, letterSpacing: -1.5, lineHeight: 1.1,
        margin: "0 0 20px",
      }}>
        {accentWord ? (
          <>{parts[0]}<span style={{
            background: `linear-gradient(135deg, ${C.purple}, ${C.indigo})`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
          }}>{accentWord}</span>{parts[1]}</>
        ) : title}
      </h1>
      {subtitle && (
        <p style={{
          fontSize: 17, lineHeight: 1.75, color: C.muted,
          fontFamily: "'DM Sans', sans-serif", maxWidth: 600, margin: "0 auto", padding: isMobile ? "0 4px" : 0,
        }}>{subtitle}</p>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   SHARED: Floating 3D mini-scene for inner pages
───────────────────────────────────────────── */
function MiniScene({ variant = "orbs" }) {
  const mountRef = useRef(null);
  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;
    const W = el.clientWidth, H = el.clientHeight;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    el.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 200);
    camera.position.set(0, 0, 12);
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const dLight = new THREE.DirectionalLight(0xfff8e8, 1.2);
    dLight.position.set(8, 12, 8); scene.add(dLight);
    const fLight = new THREE.DirectionalLight(0xc4b5fd, 0.5);
    fLight.position.set(-8, 4, -4); scene.add(fLight);

    const mat = (c, r=0.4, m=0.3) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m });
    const objects = [];

    if (variant === "orbs") {
      // Floating geometric shapes
      const shapes = [
        { geo: new THREE.IcosahedronGeometry(1.1, 1), mat: mat(0x7c3aed), pos: [-3, 1, 0], sp: 0.6, ph: 0 },
        { geo: new THREE.OctahedronGeometry(0.85), mat: mat(0x6366f1), pos: [3, -0.5, -1], sp: 0.8, ph: 1.2 },
        { geo: new THREE.TetrahedronGeometry(0.9), mat: mat(0xa78bfa), pos: [0, -1.5, 1], sp: 0.5, ph: 2.5 },
        { geo: new THREE.BoxGeometry(0.8, 0.8, 0.8), mat: mat(0x4f46e5), pos: [-1.5, 2, -2], sp: 0.9, ph: 0.8 },
        { geo: new THREE.IcosahedronGeometry(0.6, 0), mat: mat(0xc4b5fd), pos: [2, 2, 1], sp: 0.7, ph: 3.1 },
        { geo: new THREE.BoxGeometry(0.55, 0.55, 0.55), mat: mat(0x7c3aed), pos: [-2.5, -1.5, -1], sp: 1.1, ph: 1.8 },
      ];
      shapes.forEach(({ geo, mat: m, pos, sp, ph }) => {
        const mesh = new THREE.Mesh(geo, m);
        mesh.position.set(...pos);
        scene.add(mesh);
        objects.push({ mesh, baseY: pos[1], sp, ph });
      });
    } else if (variant === "steps") {
      // Stacked platforms / steps
      for (let i = 0; i < 5; i++) {
        const w = 4 - i * 0.5;
        const mesh = new THREE.Mesh(
          new THREE.BoxGeometry(w, 0.35, w * 0.7),
          mat(0x7c3aed + i * 0x101010, 0.5, 0.2)
        );
        mesh.position.set(0, -1.5 + i * 0.6, 0);
        scene.add(mesh);
        objects.push({ mesh, baseY: -1.5 + i * 0.6, sp: 0.4, ph: i * 0.4 });
      }
      // Floating cubes around
      [[-3, 1, 0, 0.5], [3, 0, -1, 0.45], [-2, -1, 1, 0.4], [2.5, 2, 0.5, 0.35]].forEach(([x, y, z, s]) => {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(s, s, s), mat(0xa78bfa));
        mesh.position.set(x, y, z); scene.add(mesh);
        objects.push({ mesh, baseY: y, sp: 0.7, ph: x });
      });
    }

    let raf;
    const clock = new THREE.Clock();
    const animate = () => {
      raf = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      objects.forEach(({ mesh, baseY, sp, ph }) => {
        mesh.position.y = baseY + Math.sin(t * sp + ph) * 0.3;
        mesh.rotation.x += 0.006;
        mesh.rotation.y += 0.009;
      });
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      const W2 = el.clientWidth, H2 = el.clientHeight;
      renderer.setSize(W2, H2);
      camera.aspect = W2 / H2;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      renderer.dispose();
      renderer.domElement.remove();
      window.removeEventListener("resize", onResize);
    };
  }, [variant]);

  return <div ref={mountRef} style={{ width: "100%", height: "100%" }} />;
}

/* ─────────────────────────────────────────────
   ══════════════  ABOUT PAGE  ══════════════
───────────────────────────────────────────── */
function AboutPage() {
  const { isMobile, isCompact } = useResponsive();
  const cards = [
    {
      icon: (
        <svg width="26" height="26" fill="none" viewBox="0 0 24 24" stroke={C.purple} strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
        </svg>
      ),
      title: "Our Mission",
      text: "Our mission is to simplify programming education by providing clear explanations, structured topics, and an intuitive learning experience that helps beginners understand complex concepts easily.",
    },
    {
      icon: (
        <svg width="26" height="26" fill="none" viewBox="0 0 24 24" stroke={C.purple} strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
        </svg>
      ),
      title: "Our Vision",
      text: "Our vision is to create a platform where anyone can learn programming from beginner to advanced level using modern tools and an engaging interface.",
    },
    {
      icon: (
        <svg width="26" height="26" fill="none" viewBox="0 0 24 24" stroke={C.purple} strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/>
        </svg>
      ),
      title: "About the Platform",
      text: "Learning Hub provides organized programming topics such as arrays, strings, object-oriented programming, and data structures. The platform focuses on making learning simple, practical, and visually engaging.",
    },
  ];

  return (
    <div style={{ minHeight: "100vh", paddingBottom: 80 }}>
      <PageHero
        badge="About Learning Hub"
        title="Empowering Learning Hub"
        accentWord="Learning"
        subtitle="Learning Hub is a modern platform designed to help students and developers learn programming concepts in a structured and interactive way."
      />

      {/* Cards row */}
      <div style={{
        maxWidth: 1100, margin: "0 auto", padding: "0 24px",
        display: "grid", gridTemplateColumns: `repeat(auto-fit, minmax(${isMobile ? 250 : 300}px, 1fr))`, gap: isMobile ? 18 : 28,
      }}>
        {cards.map((card, i) => (
          <div key={i} style={{
            background: "rgba(255,255,255,0.72)", backdropFilter: "blur(14px)",
            border: "1px solid rgba(124,58,237,0.13)", borderRadius: 24,
            padding: isMobile ? "24px 20px" : "36px 32px", transition: "all 0.3s",
            boxShadow: "0 4px 24px rgba(124,58,237,0.07)",
            animation: `fadeUp 0.5s ease ${i * 0.12}s both`,
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-6px)"; e.currentTarget.style.boxShadow = "0 16px 48px rgba(124,58,237,0.15)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 24px rgba(124,58,237,0.07)"; }}
          >
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: `linear-gradient(135deg, rgba(124,58,237,0.10), rgba(99,102,241,0.08))`,
              border: "1px solid rgba(124,58,237,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center",
              marginBottom: 20,
            }}>{card.icon}</div>
            <h3 style={{ fontFamily: "'Sora', sans-serif", fontSize: 19, fontWeight: 700, color: C.text, marginBottom: 12, letterSpacing: -0.5 }}>
              {card.title}
            </h3>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, lineHeight: 1.75, color: C.muted }}>
              {card.text}
            </p>
          </div>
        ))}
      </div>

      {/* Developer section */}
      <div style={{ maxWidth: 1100, margin: "60px auto 0", padding: "0 24px" }}>
        <div style={{
          background: `linear-gradient(135deg, rgba(124,58,237,0.06) 0%, rgba(99,102,241,0.04) 100%)`,
          border: "1px solid rgba(124,58,237,0.15)", borderRadius: 28,
          padding: isMobile ? "28px 20px" : "48px 52px", display: "flex", alignItems: "center",
          gap: 48, flexWrap: "wrap",
          flexDirection: isCompact ? "column" : "row",
          boxShadow: "0 8px 40px rgba(124,58,237,0.08)",
        }}>
          {/* Avatar */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <div style={{
              width: 110, height: 110, borderRadius: "50%",
              background: `linear-gradient(135deg, ${C.purple}, ${C.indigo})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: `0 8px 32px rgba(124,58,237,0.35)`,
            }}>
              <svg width="52" height="52" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              </svg>
            </div>
            <div style={{
              position: "absolute", bottom: 4, right: 4,
              width: 22, height: 22, borderRadius: "50%",
              background: "#10b981", border: "3px solid white",
            }} />
          </div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.18)",
              borderRadius: 100, padding: "4px 12px", marginBottom: 14,
            }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: C.purple, fontFamily: "'DM Sans', sans-serif", letterSpacing: 1, textTransform: "uppercase" }}>Developer</span>
            </div>
            <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 28, fontWeight: 800, color: C.text, letterSpacing: -0.8, margin: "0 0 8px" }}>
              Dhananjay Anchan
            </h2>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, fontWeight: 500, color: C.purple, margin: "0 0 14px" }}>
              MCA Student & Full Stack Developer
            </p>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.muted, lineHeight: 1.7, maxWidth: 480 }}>
              Passionate about building modern, user-friendly web applications that bridge education and technology. Learning Hub is built with a vision to make programming accessible to everyone.
            </p>
          </div>
          {/* Mini 3D */}
          <div style={{ width: isCompact ? "100%" : 200, height: isCompact ? 160 : 180, flexShrink: 0 }}>
            <MiniScene variant="orbs" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   ══════════════  FEATURES PAGE  ══════════════
───────────────────────────────────────────── */
function FeaturesPage() {
  const { isMobile, isCompact } = useResponsive();
  const features = [
    {
      icon: <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>,
      title: "Structured Learning Topics",
      desc: "Organized programming topics that help users easily navigate and understand different concepts.",
      color: "#7c3aed",
      bg: "rgba(124,58,237,0.07)",
    },
    {
      icon: <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>,
      title: "Interactive Interface",
      desc: "A clean and modern user interface designed to make learning comfortable and engaging.",
      color: "#6366f1",
      bg: "rgba(99,102,241,0.07)",
    },
    {
      icon: <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>,
      title: "Real-Time Communication",
      desc: "Users can interact and communicate through integrated communication features.",
      color: "#0ea5e9",
      bg: "rgba(14,165,233,0.07)",
    },
    {
      icon: <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>,
      title: "Progress Tracking",
      desc: "Track learning progress and completed topics to stay motivated and on schedule.",
      color: "#10b981",
      bg: "rgba(16,185,129,0.07)",
    },
    {
      icon: <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>,
      title: "Responsive Design",
      desc: "The platform works smoothly on desktop, tablet, and mobile devices for learning anywhere.",
      color: "#f59e0b",
      bg: "rgba(245,158,11,0.07)",
    },
    {
      icon: <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5"/></svg>,
      title: "Modern 3D Interface",
      desc: "Interactive 3D visual elements create an engaging and modern user experience.",
      color: "#7c3aed",
      bg: "rgba(124,58,237,0.07)",
    },
  ];

  return (
    <div style={{ minHeight: "100vh", paddingBottom: 80 }}>
      <PageHero
        badge="Platform Features"
        title="Powerful Features of Learning Hub"
        accentWord="Features"
        subtitle="Everything you need to learn programming effectively — structured, interactive, and built for modern learners."
      />

      {/* Features grid */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: `repeat(auto-fit, minmax(${isMobile ? 250 : 320}px, 1fr))`,
          gap: isMobile ? 16 : 24,
        }}>
          {features.map((f, i) => (
            <div key={i} style={{
              background: "rgba(255,255,255,0.75)", backdropFilter: "blur(14px)",
              border: "1px solid rgba(124,58,237,0.11)", borderRadius: 22,
              padding: isMobile ? "22px 18px" : "32px 28px", transition: "all 0.3s",
              boxShadow: "0 4px 20px rgba(124,58,237,0.06)",
              animation: `fadeUp 0.5s ease ${i * 0.08}s both`,
              cursor: "default",
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-5px)"; e.currentTarget.style.boxShadow = `0 20px 50px rgba(124,58,237,0.13)`; e.currentTarget.style.borderColor = "rgba(124,58,237,0.22)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(124,58,237,0.06)"; e.currentTarget.style.borderColor = "rgba(124,58,237,0.11)"; }}
            >
              {/* Icon box */}
              <div style={{
                width: 50, height: 50, borderRadius: 14,
                background: f.bg, border: `1.5px solid ${f.color}22`,
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: 18, color: f.color,
              }}>{f.icon}</div>

              {/* Number tag */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <h3 style={{ fontFamily: "'Sora', sans-serif", fontSize: 17, fontWeight: 700, color: C.text, letterSpacing: -0.4, margin: 0 }}>
                  {f.title}
                </h3>
                <span style={{
                  fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 700,
                  color: f.color, background: f.bg, borderRadius: 100,
                  padding: "3px 10px", letterSpacing: 0.5,
                }}>0{i + 1}</span>
              </div>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, lineHeight: 1.75, color: C.muted, margin: 0 }}>
                {f.desc}
              </p>

              {/* Bottom line accent */}
              <div style={{
                marginTop: 22, height: 3, borderRadius: 100,
                background: `linear-gradient(90deg, ${f.color}, transparent)`,
                width: "40%",
              }} />
            </div>
          ))}
        </div>

        {/* Bottom 3D accent strip */}
        <div style={{
          marginTop: 64, borderRadius: 28, overflow: "hidden",
          background: `linear-gradient(135deg, rgba(124,58,237,0.05), rgba(99,102,241,0.04))`,
          border: "1px solid rgba(124,58,237,0.12)",
          display: "flex", alignItems: "center", gap: 0, height: isCompact ? "auto" : 200,
          flexDirection: isCompact ? "column" : "row",
        }}>
          <div style={{ flex: 1, padding: isCompact ? "24px 20px 8px" : "0 48px", width: "100%" }}>
            <h3 style={{ fontFamily: "'Sora', sans-serif", fontSize: 24, fontWeight: 800, color: C.text, letterSpacing: -0.8, margin: "0 0 10px" }}>
              Ready to start learning?
            </h3>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: C.muted, margin: "0 0 22px", maxWidth: 380 }}>
              Join thousands of learners who are mastering programming with Learning Hub.
            </p>
            <button style={{
              background: `linear-gradient(135deg, ${C.purple}, ${C.indigo})`, border: "none",
              borderRadius: 12, padding: "12px 24px", fontSize: 14, fontWeight: 700,
              color: "white", cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
              boxShadow: `0 4px 16px rgba(124,58,237,0.35)`, transition: "all 0.2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}
            >Get Started Free →</button>
          </div>
          <div style={{ width: isCompact ? "100%" : 260, height: isCompact ? 170 : "100%", flexShrink: 0 }}>
            <MiniScene variant="orbs" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   ══════════════  HOW IT WORKS PAGE  ══════════
───────────────────────────────────────────── */
function HowItWorksPage() {
  const { isMobile, isCompact } = useResponsive();
  const steps = [
    {
      num: "01",
      title: "Create an Account",
      desc: "Users sign up and create their personal learning profile. Set your goals, choose your skill level, and get a personalized learning path.",
      icon: <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>,
    },
    {
      num: "02",
      title: "Explore Topics",
      desc: "Browse various programming topics and select the concepts you want to learn. Choose from arrays, strings, OOP, data structures, and much more.",
      icon: <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>,
    },
    {
      num: "03",
      title: "Learn Concepts",
      desc: "Read clear explanations and understand programming concepts with structured examples. Complex topics broken down into digestible lessons.",
      icon: <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>,
    },
    {
      num: "04",
      title: "Practice and Apply",
      desc: "Practice the learned concepts through hands-on exercises and real-world examples. Reinforce your understanding by building and experimenting.",
      icon: <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/></svg>,
    },
    {
      num: "05",
      title: "Track Progress",
      desc: "Monitor your learning journey and track completed topics. View statistics, revisit completed lessons, and celebrate your milestones.",
      icon: <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>,
    },
  ];

  const accentColors = [C.purple, C.indigo, "#0ea5e9", "#10b981", "#f59e0b"];

  return (
    <div style={{ minHeight: "100vh", paddingBottom: 80 }}>
      <PageHero
        badge="How It Works"
        title="How Learning Hub Works"
        accentWord="Works"
        subtitle="Getting started is simple. Follow these five steps to begin your programming learning journey today."
      />

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px" }}>
        {/* Top mini 3D + intro row */}
        <div style={{
          background: `linear-gradient(135deg, rgba(124,58,237,0.05), rgba(99,102,241,0.04))`,
          border: "1px solid rgba(124,58,237,0.12)", borderRadius: 28,
          display: "flex", alignItems: "center", marginBottom: 56,
          flexDirection: isCompact ? "column" : "row",
          overflow: "hidden",
        }}>
          <div style={{ flex: 1, padding: isMobile ? "24px 20px 8px" : "40px 48px", width: "100%" }}>
            <h3 style={{ fontFamily: "'Sora', sans-serif", fontSize: 22, fontWeight: 800, color: C.text, margin: "0 0 12px", letterSpacing: -0.6 }}>
              A structured path to mastery
            </h3>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: C.muted, lineHeight: 1.7, maxWidth: 420, margin: 0 }}>
              Learning Hub is designed so every step builds on the last. From signup to progress tracking, the entire experience is seamless and encouraging.
            </p>
          </div>
          <div style={{ width: isCompact ? "100%" : 240, height: isCompact ? 150 : 180, flexShrink: 0 }}>
            <MiniScene variant="steps" />
          </div>
        </div>

        {/* Steps timeline */}
        <div style={{ position: "relative" }}>
          {/* Connector line */}
          {!isMobile && <div style={{
            position: "absolute", left: 35, top: 50, bottom: 50, width: 3,
            background: `linear-gradient(to bottom, ${C.purple}, ${C.indigo}, #0ea5e9, #10b981, #f59e0b)`,
            borderRadius: 100, opacity: 0.25,
          }} />}

          <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            {steps.map((step, i) => (
              <div key={i} style={{
                display: "flex", gap: isMobile ? 16 : 32, alignItems: "flex-start",
                flexDirection: isMobile ? "column" : "row",
                animation: `fadeUp 0.5s ease ${i * 0.1}s both`,
              }}>
                {/* Step circle */}
                <div style={{ flexShrink: 0, position: "relative", zIndex: 1 }}>
                  <div style={{
                    width: 70, height: 70, borderRadius: "50%",
                    background: `linear-gradient(135deg, ${accentColors[i]}, ${accentColors[(i + 1) % accentColors.length]})`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: `0 6px 24px ${accentColors[i]}40`,
                    border: "3px solid rgba(255,255,255,0.8)",
                  }}>
                    {step.icon}
                  </div>
                  {/* Step number badge */}
                  <div style={{
                    position: "absolute", top: -4, right: -4,
                    width: 22, height: 22, borderRadius: "50%",
                    background: "white", border: `2px solid ${accentColors[i]}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 9, fontWeight: 800, color: accentColors[i],
                    fontFamily: "'DM Sans', sans-serif",
                  }}>{step.num}</div>
                </div>

                {/* Content card */}
                <div style={{
                  flex: 1, background: "rgba(255,255,255,0.75)", backdropFilter: "blur(14px)",
                  border: "1px solid rgba(124,58,237,0.11)", borderRadius: 20,
                  padding: isMobile ? "20px 18px" : "28px 32px", transition: "all 0.3s",
                  boxShadow: "0 4px 20px rgba(124,58,237,0.06)",
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateX(6px)"; e.currentTarget.style.boxShadow = `0 8px 36px ${accentColors[i]}20`; e.currentTarget.style.borderColor = `${accentColors[i]}30`; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateX(0)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(124,58,237,0.06)"; e.currentTarget.style.borderColor = "rgba(124,58,237,0.11)"; }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                    <span style={{
                      fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 700,
                      color: accentColors[i], letterSpacing: 1.5, textTransform: "uppercase",
                    }}>Step {step.num}</span>
                    <div style={{ height: 1, flex: 1, background: `${accentColors[i]}20` }} />
                  </div>
                  <h3 style={{ fontFamily: "'Sora', sans-serif", fontSize: 20, fontWeight: 700, color: C.text, margin: "0 0 10px", letterSpacing: -0.5 }}>
                    {step.title}
                  </h3>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, lineHeight: 1.75, color: C.muted, margin: 0 }}>
                    {step.desc}
                  </p>
                  {/* Color accent bar */}
                  <div style={{
                    marginTop: 18, height: 3, width: 60, borderRadius: 100,
                    background: `linear-gradient(90deg, ${accentColors[i]}, transparent)`,
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA bottom */}
        <div style={{
          marginTop: 64, textAlign: "center",
          background: `linear-gradient(135deg, ${C.purple}, ${C.indigo})`,
          borderRadius: 28, padding: isMobile ? "38px 20px" : "56px 40px",
          boxShadow: "0 16px 60px rgba(124,58,237,0.35)",
          position: "relative", overflow: "hidden",
        }}>
          <div style={{
            position: "absolute", inset: 0, opacity: 0.1,
            backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }} />
          <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 30, fontWeight: 800, color: "white", margin: "0 0 12px", letterSpacing: -1 }}>
            Begin your journey today
          </h2>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: "rgba(255,255,255,0.78)", margin: "0 0 28px" }}>
            Five simple steps to becoming a confident programmer.
          </p>
          <button style={{
            background: "white", border: "none", borderRadius: 14,
            padding: "14px 32px", fontSize: 15, fontWeight: 700,
            color: C.purple, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
            boxShadow: "0 4px 20px rgba(0,0,0,0.15)", transition: "all 0.2s",
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 10px 30px rgba(0,0,0,0.2)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.15)"; }}
          >Start Learning Now →</button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   THREE.JS SCENE
───────────────────────────────────────────── */
function Scene3D() {
  const mountRef = useRef(null);
  const stateRef = useRef({});

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    const W = el.clientWidth, H = el.clientHeight;

    /* Renderer */
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    el.appendChild(renderer.domElement);

    /* Scene */
    const scene = new THREE.Scene();

    /* Camera — pulled back to frame the larger house */
    const camera = new THREE.PerspectiveCamera(46, W / H, 0.1, 300);
    camera.position.set(0, 10, 28);
    camera.lookAt(0, 2, 0);

    /* ── LIGHTS ── */
    const ambient = new THREE.AmbientLight(0xffffff, 0.55);
    scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xfff8e8, 1.6);
    sun.position.set(12, 25, 14);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 0.1;
    sun.shadow.camera.far = 80;
    sun.shadow.camera.left = -28;
    sun.shadow.camera.right = 28;
    sun.shadow.camera.top = 28;
    sun.shadow.camera.bottom = -28;
    scene.add(sun);

    const fill = new THREE.DirectionalLight(0xc4b5fd, 0.6);
    fill.position.set(-12, 8, -6);
    scene.add(fill);

    const backLight = new THREE.DirectionalLight(0xa5f3fc, 0.3);
    backLight.position.set(0, 5, -20);
    scene.add(backLight);

    /* ── MATERIAL HELPERS ── */
    const mat = (color, rough = 0.65, met = 0) =>
      new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: met });

    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x93c5fd, roughness: 0.05, metalness: 0.15,
      transparent: true, opacity: 0.50,
    });
    const glassFrameMat = mat(0xddd6fe, 0.4, 0.5);
    const wallMat      = mat(0xf5f0ff, 0.55);
    const wall2Mat     = mat(0xede9fe, 0.55);   // slightly tinted 2nd body
    const accentMat    = mat(0xc4b5fd, 0.45);
    const roofMat      = mat(0xe0d9ff, 0.50);
    const floorMat     = mat(0xd4c8ff, 0.75);
    const concrMat     = mat(0xcfcae8, 0.80);
    const darkMat      = mat(0x4c1d95, 0.55);
    const doorMat      = mat(0x3b0764, 0.50);
    const grassMat     = mat(0x86efac, 0.90);
    const rockMat      = mat(0x8b7eb8, 0.85);
    const treeTrunkMat = mat(0x92400e, 0.90);
    const treeLvMat    = mat(0x4ade80, 0.70);
    const treeLvDkMat  = mat(0x22c55e, 0.70);
    const stairMat     = mat(0xddd6fe, 0.65);
    const metalMat     = mat(0xa78bfa, 0.30, 0.70);
    const glowMat      = new THREE.MeshStandardMaterial({
      color: 0xfde68a, emissive: 0xfde68a, emissiveIntensity: 1.2, roughness: 1,
    });
    const cubeMat1 = mat(0x7c3aed, 0.35, 0.35);
    const cubeMat2 = mat(0x6366f1, 0.35, 0.35);
    const cubeMat3 = mat(0xa78bfa, 0.35, 0.35);

    /* ── PIVOT ── */
    const pivot = new THREE.Group();
    scene.add(pivot);

    /* ── ISLAND BASE (larger to support the bigger house) ── */
    const islandGroup = new THREE.Group();
    pivot.add(islandGroup);

    // Main platform
    const islandMesh = new THREE.Mesh(new THREE.CylinderGeometry(7.5, 5.5, 2.2, 10), rockMat);
    islandMesh.position.y = -1.1;
    islandMesh.castShadow = true; islandMesh.receiveShadow = true;
    islandGroup.add(islandMesh);

    // Grass cap
    const grassMesh = new THREE.Mesh(new THREE.CylinderGeometry(7.6, 7.6, 0.4, 10), grassMat);
    grassMesh.position.y = 0.1; grassMesh.receiveShadow = true;
    islandGroup.add(grassMesh);

    // Rocky bottom stalactite layers
    [
      { r1: 5.5, r2: 3.8, h: 1.8, y: -2.9, seg: 9, c: 0x6d5d9e },
      { r1: 3.8, r2: 2.5, h: 1.4, y: -4.4, seg: 8, c: 0x5b4e8a },
      { r1: 2.5, r2: 1.2, h: 1.2, y: -5.5, seg: 7, c: 0x4a3d78 },
      { r1: 1.2, r2: 0.4, h: 0.8, y: -6.3, seg: 6, c: 0x3b2f66 },
    ].forEach(({ r1, r2, h, y, seg, c }) => {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, seg), mat(c, 0.9));
      m.position.y = y;
      islandGroup.add(m);
    });

    /* ─────────────────────────────────────────
       HOUSE GROUP  (centred slightly back on island)
    ───────────────────────────────────────── */
    const house = new THREE.Group();
    islandGroup.add(house);
    house.position.set(-0.3, 0.3, -0.5);

    // ── helper: add a framed window (glass pane + thin border posts) ──
    function addWindow(parent, x, y, z, w, h, rotY = 0) {
      const g = new THREE.Group();
      parent.add(g);
      g.position.set(x, y, z);
      g.rotation.y = rotY;
      const pane = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.07), glassMat);
      g.add(pane);
      // frame border
      [[w + 0.08, 0.07, 0.09, 0, 0], [0.07, h + 0.08, 0.09, 0, 0]].forEach(() => {});
      const fT = new THREE.Mesh(new THREE.BoxGeometry(w + 0.1, 0.09, 0.11), glassFrameMat);
      const fB = fT.clone(); fT.position.y = h / 2 + 0.045; fB.position.y = -h / 2 - 0.045;
      const fL = new THREE.Mesh(new THREE.BoxGeometry(0.09, h + 0.1, 0.11), glassFrameMat);
      const fR = fL.clone(); fL.position.x = -w / 2 - 0.045; fR.position.x = w / 2 + 0.045;
      g.add(fT, fB, fL, fR);
    }

    // ── helper: railing along X axis ──
    function addRailing(parent, xFrom, xTo, y, z, postSpacing = 0.55) {
      const railMat = metalMat;
      const len = xTo - xFrom;
      const topRail = new THREE.Mesh(new THREE.BoxGeometry(len, 0.07, 0.07), railMat);
      topRail.position.set((xFrom + xTo) / 2, y + 0.52, z);
      parent.add(topRail);
      const midRail = topRail.clone();
      midRail.position.y = y + 0.26;
      parent.add(midRail);
      for (let px = xFrom + 0.12; px < xTo; px += postSpacing) {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.55, 0.07), railMat);
        post.position.set(px, y + 0.275, z);
        parent.add(post);
      }
    }

    // ════════════════════════════════════════
    //  FLOOR 0  —  foundation / base slab
    // ════════════════════════════════════════
    const baseSlab = new THREE.Mesh(new THREE.BoxGeometry(7.8, 0.28, 5.8), concrMat);
    baseSlab.position.y = 0.14;
    baseSlab.castShadow = true; baseSlab.receiveShadow = true;
    house.add(baseSlab);

    // ════════════════════════════════════════
    //  FLOOR 1  —  main ground floor body
    // ════════════════════════════════════════
    const f1 = new THREE.Mesh(new THREE.BoxGeometry(6.0, 2.2, 4.4), wallMat);
    f1.position.set(0, 1.38, 0);
    f1.castShadow = true; f1.receiveShadow = true;
    house.add(f1);

    // Front-facing accent stripe at base
    const stripe1 = new THREE.Mesh(new THREE.BoxGeometry(6.1, 0.18, 0.1), accentMat);
    stripe1.position.set(0, 0.36, 2.25);
    house.add(stripe1);

    // Ground floor front windows (two large panels)
    addWindow(house, -1.55, 1.2, 2.25, 1.5, 1.1);
    addWindow(house, 1.55, 1.2, 2.25, 1.5, 1.1);

    // Ground floor DOOR (double door with surround)
    const doorSurround = new THREE.Mesh(new THREE.BoxGeometry(1.3, 2.05, 0.14), accentMat);
    doorSurround.position.set(0, 1.1, 2.25);
    house.add(doorSurround);
    const doorL = new THREE.Mesh(new THREE.BoxGeometry(0.56, 1.85, 0.09), doorMat);
    doorL.position.set(-0.29, 1.05, 2.27);
    house.add(doorL);
    const doorR = doorL.clone(); doorR.position.x = 0.29;
    house.add(doorR);
    // Door handles
    const handleGeo = new THREE.SphereGeometry(0.06, 6, 6);
    const handleL = new THREE.Mesh(handleGeo, metalMat);
    handleL.position.set(-0.07, 1.05, 2.33);
    house.add(handleL);
    const handleR = handleL.clone(); handleR.position.x = 0.07;
    house.add(handleR);

    // Canopy above door
    const canopy = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.12, 0.8), accentMat);
    canopy.position.set(0, 2.26, 2.65);
    canopy.castShadow = true;
    house.add(canopy);
    // Canopy support brackets
    [-0.6, 0.6].forEach(bx => {
      const br = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.5, 0.55), accentMat);
      br.position.set(bx, 2.0, 2.6); house.add(br);
    });

    // Side windows (left wall)
    addWindow(house, -3.07, 1.3, 0.5, 1.2, 1.0, Math.PI / 2);
    addWindow(house, -3.07, 1.3, -0.7, 0.9, 1.0, Math.PI / 2);

    // Back windows
    addWindow(house, -1.4, 1.2, -2.25, 1.3, 1.0, Math.PI);
    addWindow(house, 1.4, 1.2, -2.25, 1.3, 1.0, Math.PI);

    // RIGHT SIDE WING / GARAGE BLOCK
    const wing = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.0, 3.6), wall2Mat);
    wing.position.set(4.2, 1.22, 0.1);
    wing.castShadow = true; wing.receiveShadow = true;
    house.add(wing);

    // Garage door
    const garageDoor = new THREE.Mesh(new THREE.BoxGeometry(1.9, 1.5, 0.1), mat(0x6d28d9, 0.45));
    garageDoor.position.set(4.2, 0.97, 1.86);
    house.add(garageDoor);
    // Garage door horizontal slats
    for (let gs = 0; gs < 4; gs++) {
      const slat = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.07, 0.12), accentMat);
      slat.position.set(4.2, 0.3 + gs * 0.38, 1.87);
      house.add(slat);
    }
    // Wing side window
    addWindow(house, 5.41, 1.3, -0.2, 1.1, 0.85, Math.PI / 2);

    // Wing roof (slightly lower flat slab)
    const wingRoof = new THREE.Mesh(new THREE.BoxGeometry(2.55, 0.22, 3.75), roofMat);
    wingRoof.position.set(4.2, 2.33, 0.1);
    wingRoof.castShadow = true;
    house.add(wingRoof);
    // Wing roof parapet
    const wpF = new THREE.Mesh(new THREE.BoxGeometry(2.55, 0.28, 0.12), accentMat);
    wpF.position.set(4.2, 2.58, 1.99); house.add(wpF);
    const wpB = wpF.clone(); wpB.position.z = -1.79; house.add(wpB);
    const wpR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.28, 3.75), accentMat);
    wpR.position.set(5.49, 2.58, 0.1); house.add(wpR);

    // ════════════════════════════════════════
    //  INTER-FLOOR SLAB  +  WIDE BALCONY
    // ════════════════════════════════════════
    const midSlab = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.24, 5.4), floorMat);
    midSlab.position.set(0, 2.6, 0.4);
    midSlab.castShadow = true;
    house.add(midSlab);

    // Balcony slab (front overhang)
    const balconySlab = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.22, 1.2), concrMat);
    balconySlab.position.set(0, 2.6, 3.4);
    balconySlab.castShadow = true;
    house.add(balconySlab);

    // Balcony railing
    addRailing(house, -2.8, 2.8, 2.62, 4.0);
    // Side rails
    addRailing(house, 2.8, 2.8, 2.62, 4.0); // right cap
    const lcap = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.55, 1.3), metalMat);
    lcap.position.set(-2.8, 2.9, 3.35); house.add(lcap);
    const rcap = lcap.clone(); rcap.position.x = 2.8; house.add(rcap);

    // ════════════════════════════════════════
    //  FLOOR 2  —  upper floor
    // ════════════════════════════════════════
    const f2 = new THREE.Mesh(new THREE.BoxGeometry(6.0, 2.1, 4.4), wall2Mat);
    f2.position.set(0, 3.85, 0);
    f2.castShadow = true; f2.receiveShadow = true;
    house.add(f2);

    // Accent band at floor 2 base
    const stripe2 = new THREE.Mesh(new THREE.BoxGeometry(6.1, 0.16, 0.1), accentMat);
    stripe2.position.set(0, 2.76, 2.25);
    house.add(stripe2);

    // Floor 2: wide glass facade (3 panels across)
    addWindow(house, -1.8, 3.72, 2.26, 1.1, 1.3);
    addWindow(house, 0, 3.72, 2.26, 1.1, 1.3);
    addWindow(house, 1.8, 3.72, 2.26, 1.1, 1.3);

    // Floor 2: back windows
    addWindow(house, -1.5, 3.85, -2.26, 1.4, 1.1, Math.PI);
    addWindow(house, 1.5, 3.85, -2.26, 1.4, 1.1, Math.PI);

    // Floor 2: side windows
    addWindow(house, -3.07, 3.85, 0.8, 1.1, 1.0, Math.PI / 2);
    addWindow(house, -3.07, 3.85, -0.8, 1.1, 1.0, Math.PI / 2);
    addWindow(house, 3.07, 3.85, 0.8, 1.1, 1.0, -Math.PI / 2);
    addWindow(house, 3.07, 3.85, -0.8, 1.1, 1.0, -Math.PI / 2);

    // Interior warm lights visible through glass
    [
      [0, 1.3, 0.5], [-1.5, 1.3, 0.3], [1.5, 1.3, 0.3],
      [0, 3.8, 0.5], [-1.5, 3.8, 0.3], [1.5, 3.8, 0.3],
    ].forEach(([x, y, z]) => {
      const g = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.45, 0.45), glowMat);
      g.position.set(x, y, z);
      house.add(g);
    });

    // ════════════════════════════════════════
    //  FLOOR 3 PENTHOUSE  (smaller setback box)
    // ════════════════════════════════════════
    const f3 = new THREE.Mesh(new THREE.BoxGeometry(3.8, 1.6, 3.0), wallMat);
    f3.position.set(-0.8, 5.7, -0.5);
    f3.castShadow = true; f3.receiveShadow = true;
    house.add(f3);

    // Penthouse windows
    addWindow(house, -0.8, 5.7, 1.01, 2.4, 1.0);
    addWindow(house, -0.8, 5.7, -2.01, 1.8, 0.9, Math.PI);
    addWindow(house, -2.72, 5.7, -0.5, 1.4, 0.9, Math.PI / 2);

    // Penthouse slab / roof
    const pentRoof = new THREE.Mesh(new THREE.BoxGeometry(4.1, 0.22, 3.3), roofMat);
    pentRoof.position.set(-0.8, 6.61, -0.5);
    pentRoof.castShadow = true;
    house.add(pentRoof);

    // ════════════════════════════════════════
    //  MAIN ROOF SLAB  (floor 2 roof)
    // ════════════════════════════════════════
    const mainRoof = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.24, 4.8), roofMat);
    mainRoof.position.set(0, 5.0, 0);
    mainRoof.castShadow = true;
    house.add(mainRoof);

    // Roof parapet (all 4 sides)
    const rpF = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.38, 0.14), accentMat);
    rpF.position.set(0, 5.31, 2.43); house.add(rpF);
    const rpB = rpF.clone(); rpB.position.z = -2.43; house.add(rpB);
    const rpL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.38, 4.8), accentMat);
    rpL.position.set(-3.2, 5.31, 0); house.add(rpL);
    const rpR = rpL.clone(); rpR.position.x = 3.2; house.add(rpR);

    // ════════════════════════════════════════
    //  ROOFTOP DETAILS
    // ════════════════════════════════════════
    // AC unit boxes
    [[-2.0, 5.18, -1.5], [1.5, 5.18, -1.3], [2.2, 5.18, 0.8]].forEach(([x, y, z]) => {
      const ac = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.45, 0.55), mat(0xd1cce8, 0.7));
      ac.position.set(x, y, z);
      ac.castShadow = true; house.add(ac);
      const grille = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.06, 0.46), mat(0xb8b0d8, 0.6));
      grille.position.set(x, y + 0.22, z); house.add(grille);
    });

    // Chimney / vent stack
    const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.1, 0.5), wall2Mat);
    chimney.position.set(2.4, 5.73, -1.8);
    chimney.castShadow = true; house.add(chimney);
    const chimneyTop = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.15, 0.65), accentMat);
    chimneyTop.position.set(2.4, 6.35, -1.8); house.add(chimneyTop);

    // Water tank cylinder on penthouse
    const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.65, 10), mat(0xccc5e8, 0.6));
    tank.position.set(1.0, 7.0, -0.5); house.add(tank);
    const tankLid = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.08, 10), mat(0xb3acdc, 0.5));
    tankLid.position.set(1.0, 7.37, -0.5); house.add(tankLid);

    // Solar panel array
    const solarFrame = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.07, 0.95), mat(0x1e1b4b, 0.4, 0.3));
    solarFrame.position.set(-1.5, 6.73, -0.1);
    solarFrame.rotation.x = -0.28;
    house.add(solarFrame);
    const solarPanel = new THREE.Mesh(new THREE.BoxGeometry(1.38, 0.04, 0.85), mat(0x312e81, 0.2, 0.4));
    solarPanel.position.set(-1.5, 6.77, -0.08);
    solarPanel.rotation.x = -0.28;
    house.add(solarPanel);

    // ════════════════════════════════════════
    //  FRONT PORCH / LANDING PLATFORM
    // ════════════════════════════════════════
    const porch = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.22, 1.6), concrMat);
    porch.position.set(0, 0.28, 3.4);
    porch.castShadow = true; porch.receiveShadow = true;
    house.add(porch);

    // Porch edge detail
    const porchEdge = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.12, 0.1), accentMat);
    porchEdge.position.set(0, 0.22, 4.19); house.add(porchEdge);

    // Porch steps (3 steps leading from island grass)
    const pStairGroup = new THREE.Group();
    islandGroup.add(pStairGroup);
    pStairGroup.position.set(-0.3, 0.3, 4.1);
    for (let s = 0; s < 5; s++) {
      const step = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.22, 0.42), stairMat);
      step.position.set(0, s * 0.22, s * 0.42);
      step.castShadow = true;
      pStairGroup.add(step);
    }

    // ════════════════════════════════════════
    //  SIDE EXTERIOR STAIRS (right side)
    // ════════════════════════════════════════
    const sStairGroup = new THREE.Group();
    islandGroup.add(sStairGroup);
    sStairGroup.position.set(5.8, 0.3, 2.2);
    sStairGroup.rotation.y = -Math.PI / 2;
    for (let s = 0; s < 7; s++) {
      const step = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.22, 0.4), stairMat);
      step.position.set(0, s * 0.22, s * 0.4);
      step.castShadow = true;
      sStairGroup.add(step);
    }

    /* ── TREES (repositioned for larger island) ── */
    function makeTree(x, z, scale = 1, dark = false) {
      const g = new THREE.Group();
      islandGroup.add(g);
      g.position.set(x, 0.3, z);
      g.scale.setScalar(scale);
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.20, 1.1, 7), treeTrunkMat);
      trunk.position.y = 0.55; trunk.castShadow = true; g.add(trunk);
      const l1 = new THREE.Mesh(new THREE.IcosahedronGeometry(0.75, 1), dark ? treeLvDkMat : treeLvMat);
      l1.position.y = 1.4; l1.castShadow = true; g.add(l1);
      const l2 = new THREE.Mesh(new THREE.IcosahedronGeometry(0.55, 1), dark ? treeLvDkMat : treeLvMat);
      l2.position.y = 2.0; g.add(l2);
      const l3 = new THREE.Mesh(new THREE.IcosahedronGeometry(0.32, 1), dark ? treeLvDkMat : treeLvMat);
      l3.position.y = 2.5; g.add(l3);
    }
    makeTree(-5.5, -2.2, 1.2, false);
    makeTree(5.2, -3.0, 1.0, true);
    makeTree(-5.0, 2.2, 0.9, false);
    makeTree(-3.5, -5.5, 0.75, true);
    makeTree(2.0, -5.8, 0.70, false);
    makeTree(6.0, 1.8, 0.85, true);
    makeTree(-1.5, 5.5, 0.65, false);

    /* ── FLOATING CUBES ── */
    const cubes = [];
    [
      { pos: [9.0, 5, -1.5], size: 0.80, m: cubeMat1, speed: 0.75, phase: 0.0 },
      { pos: [-8.5, 6,  2.5], size: 0.60, m: cubeMat2, speed: 1.05, phase: 1.5 },
      { pos: [ 7.0, 9,  4.0], size: 0.50, m: cubeMat3, speed: 0.65, phase: 3.0 },
      { pos: [-7.0, 3, -4.0], size: 0.40, m: cubeMat1, speed: 1.25, phase: 0.8 },
      { pos: [ 4.0,11, -5.0], size: 0.35, m: cubeMat2, speed: 0.85, phase: 2.1 },
      { pos: [10.0, 2, -6.0], size: 0.65, m: cubeMat3, speed: 0.95, phase: 4.0 },
      { pos: [-4.5, 9,  6.0], size: 0.45, m: cubeMat1, speed: 1.15, phase: 5.2 },
    ].forEach(({ pos, size, m, speed, phase }) => {
      const c = new THREE.Mesh(new THREE.BoxGeometry(size, size, size), m);
      c.position.set(...pos);
      c.castShadow = true;
      scene.add(c);
      cubes.push({ mesh: c, baseY: pos[1], speed, phase });
    });

    /* ── CLOUDS ── */
    const clouds = [];
    function makeCloud(x, y, z, scale) {
      const g = new THREE.Group();
      scene.add(g);
      g.position.set(x, y, z);
      [
        [0, 0, 0, 1.1], [-1.4, -0.2, 0.4, 0.75], [1.3, -0.15, -0.3, 0.85],
        [0.4, 0.55, 0.1, 0.65], [-0.6, 0.4, 0.4, 0.60], [0.9, 0.3, -0.5, 0.50],
      ].forEach(([px, py, pz, r]) => {
        const m = new THREE.Mesh(
          new THREE.SphereGeometry(r, 8, 8),
          new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, transparent: true, opacity: 0.88 })
        );
        m.position.set(px, py, pz);
        g.add(m);
      });
      g.scale.setScalar(scale);
      clouds.push({ group: g, baseX: x, speed: 0.012 + Math.random() * 0.009, phase: Math.random() * Math.PI * 2 });
    }
    makeCloud(-10, 11, -10, 1.4);
    makeCloud( 12, 13,  -6, 1.1);
    makeCloud( -5, 15,   7, 0.9);
    makeCloud(  9,  9,   8, 0.75);
    makeCloud(-12,  8,   3, 0.85);

    /* ── ORBIT CONTROLS (manual, no zoom) ── */
    let isDragging = false;
    let prevMouse = { x: 0, y: 0 };
    let targetRotY = 0.3, targetRotX = 0.22;
    let curRotY = 0.3, curRotX = 0.22;

    const onDown = (e) => {
      isDragging = true;
      const pos = e.touches ? e.touches[0] : e;
      prevMouse = { x: pos.clientX, y: pos.clientY };
    };
    const onUp = () => { isDragging = false; };
    const onMove = (e) => {
      if (!isDragging) return;
      const pos = e.touches ? e.touches[0] : e;
      const dx = pos.clientX - prevMouse.x;
      const dy = pos.clientY - prevMouse.y;
      targetRotY += dx * 0.008;
      targetRotX += dy * 0.006;
      targetRotX = Math.max(-0.55, Math.min(0.75, targetRotX));
      prevMouse = { x: pos.clientX, y: pos.clientY };
    };

    renderer.domElement.addEventListener("mousedown", onDown);
    renderer.domElement.addEventListener("touchstart", onDown, { passive: true });
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchend", onUp);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("touchmove", onMove, { passive: true });

    /* ── RESIZE ── */
    const onResize = () => {
      const W2 = el.clientWidth, H2 = el.clientHeight;
      renderer.setSize(W2, H2);
      camera.aspect = W2 / H2;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", onResize);

    /* ── ANIMATE ── */
    let raf;
    const clock = new THREE.Clock();
    const animate = () => {
      raf = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      curRotY += (targetRotY - curRotY) * 0.07;
      curRotX += (targetRotX - curRotX) * 0.07;
      pivot.rotation.y = curRotY;
      pivot.rotation.x = curRotX;

      islandGroup.position.y = Math.sin(t * 0.45) * 0.20;
      if (!isDragging) targetRotY += 0.0025;

      cubes.forEach(({ mesh, baseY, speed, phase }) => {
        mesh.position.y = baseY + Math.sin(t * speed + phase) * 0.45;
        mesh.rotation.x += 0.005;
        mesh.rotation.y += 0.007;
      });

      clouds.forEach(({ group, baseX, speed, phase }) => {
        group.position.x = baseX + Math.sin(t * speed + phase) * 3.0;
      });

      renderer.render(scene, camera);
    };
    animate();

    stateRef.current = { renderer, raf };
    return () => {
      cancelAnimationFrame(raf);
      renderer.dispose();
      renderer.domElement.remove();
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchend", onUp);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{ width: "100%", height: "100%", cursor: "grab" }}
      onMouseDown={e => { e.currentTarget.style.cursor = "grabbing"; }}
      onMouseUp={e => { e.currentTarget.style.cursor = "grab"; }}
    />
  );
}

/* ─────────────────────────────────────────────
   HOME PAGE (Hero)
───────────────────────────────────────────── */
function HomePage() {
  const { isMobile, isTablet } = useResponsive();
  return (
    <section style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      padding: isTablet ? "108px 16px 28px" : "0 24px",
      maxWidth: 1200,
      margin: "0 auto",
      gap: isTablet ? 28 : 40,
      flexDirection: isTablet ? "column" : "row",
    }}>
      {/* LEFT */}
      <div style={{ flex: isTablet ? "1 1 auto" : "0 0 420px", maxWidth: isTablet ? "100%" : 420, width: "100%" }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)",
          borderRadius: 100, padding: "6px 14px", marginBottom: 28,
        }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.purple, animation: "pulse 2s infinite" }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: C.purple, fontFamily: "'DM Sans', sans-serif", letterSpacing: 0.5 }}>
            All-in-one Platform
          </span>
        </div>

        <h1 style={{
          fontFamily: "'Sora', sans-serif", fontSize: "clamp(52px, 6vw, 76px)",
          lineHeight: 1.0, fontWeight: 800, color: C.text, letterSpacing: -2, margin: "0 0 24px",
        }}>
          Build.<br />Create.<br />
          <span style={{
            background: `linear-gradient(135deg, ${C.purple} 0%, ${C.indigo} 100%)`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
          }}>Innovate.</span>
        </h1>

        <p style={{
          fontSize: 16, lineHeight: 1.7, color: C.muted, margin: "0 0 36px",
          fontFamily: "'DM Sans', sans-serif", maxWidth: isTablet ? "100%" : 340,
        }}>
          BuildSphere is the all-in-one platform to bring your ideas to life with immersive 3D experiences and modern tools.
        </p>

        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center" }}>
          <button style={{
            background: "white", border: `2px solid rgba(124,58,237,0.25)`, borderRadius: 14,
            padding: "14px 28px", fontSize: 15, fontWeight: 700, color: C.text, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 8, fontFamily: "'DM Sans', sans-serif",
            transition: "all 0.25s", letterSpacing: -0.3,
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = C.purple; e.currentTarget.style.color = C.purple; e.currentTarget.style.background = C.lavender; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(124,58,237,0.25)"; e.currentTarget.style.color = C.text; e.currentTarget.style.background = "white"; }}
          onClick={() => { window.location.href = "/auth"; }}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke={C.text} strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"/>
            </svg>
            Sign In
          </button>
        </div>

        <div style={{ marginTop: 32, display: "flex", alignItems: "center", gap: 8 }}>
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke={C.purple} strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
          </svg>
          <span style={{ fontSize: 13, fontWeight: 600, color: C.muted, fontFamily: "'DM Sans', sans-serif", letterSpacing: 0.3 }}>
            Secure. Fast. Reliable.
          </span>
        </div>
      </div>

      {/* RIGHT - 3D Scene */}
      <div style={{
        flex: 1,
        width: "100%",
        height: isMobile ? 360 : (isTablet ? 460 : 600),
        minHeight: isMobile ? 340 : 420,
        position: "relative",
        transform: `translateX(${isMobile ? 0 : (isTablet ? -8 : -50)}px)`,
      }}>
        <div style={{
          position: "absolute", inset: "10%",
          background: `radial-gradient(ellipse at 55% 50%, rgba(167,139,250,0.25) 0%, rgba(99,102,241,0.12) 50%, transparent 75%)`,
          borderRadius: "50%", filter: "blur(24px)", pointerEvents: "none",
        }} />
        <Scene3D />
        <div style={{
          position: "absolute", bottom: 20, left: "50%", transform: "translateX(-50%)",
          background: "rgba(255,255,255,0.7)", backdropFilter: "blur(8px)",
          border: "1px solid rgba(124,58,237,0.15)", borderRadius: 100,
          padding: "6px 16px", fontSize: 12, color: C.muted,
          fontFamily: "'DM Sans', sans-serif", pointerEvents: "none", whiteSpace: "nowrap",
        }}>↔ Drag to rotate</div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   PAGE TRANSITION WRAPPER
───────────────────────────────────────────── */
function PageTransition({ children, pageKey }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    setVisible(false);
    const t = setTimeout(() => setVisible(true), 40);
    window.scrollTo({ top: 0, behavior: "smooth" });
    return () => clearTimeout(t);
  }, [pageKey]);
  return (
    <div style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(16px)",
      transition: "opacity 0.4s ease, transform 0.4s ease",
    }}>
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────
   ROOT
───────────────────────────────────────────── */
export default function App() {
  const [activePage, setActivePage] = useState("Home");

  const renderPage = () => {
    switch (activePage) {
      case "About":        return <AboutPage />;
      case "Features":     return <FeaturesPage />;
      case "How It Works": return <HowItWorksPage />;
      default:             return <HomePage />;
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { background: ${C.bg}; min-height: 100vh; overflow-x: hidden; }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.4); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes orbFloat1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50%       { transform: translate(-30px, 40px) scale(1.08); }
        }
        @keyframes orbFloat2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50%       { transform: translate(40px, -30px) scale(1.06); }
        }
        @keyframes orbFloat3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50%       { transform: translate(-20px, -20px) scale(1.05); }
        }
        @media (max-width: 1024px) {
          button {
            touch-action: manipulation;
          }
        }
        @media (max-width: 768px) {
          h1 {
            letter-spacing: -1.1px !important;
          }
        }
      `}</style>

      {/* Ambient background */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        background: `
          radial-gradient(ellipse 80% 60% at 80% 30%, rgba(167,139,250,0.16) 0%, transparent 60%),
          radial-gradient(ellipse 50% 40% at 10% 80%, rgba(99,102,241,0.09) 0%, transparent 60%),
          ${C.bg}
        `,
      }} />
      <FloatingOrbs />

      <div style={{ position: "relative", zIndex: 1 }}>
        <Navbar activePage={activePage} setPage={setActivePage} />
        <PageTransition pageKey={activePage}>
          {renderPage()}
        </PageTransition>
      </div>
    </>
  );
}
