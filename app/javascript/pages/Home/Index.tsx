import { useEffect, useRef, useState, useCallback } from "react";
import { motion, useScroll, useTransform, useSpring, AnimatePresence, useInView } from "framer-motion";

// ─── Types ────────────────────────────────────────────────────────────────────
interface FeatureCard {
  icon: string;
  title: string;
  description: string;
}

interface Testimonial {
  quote: string;
  name: string;
  role: string;
  initials: string;
}

interface StatItem {
  value: string;
  suffix: string;
  label: string;
  prefix?: string;
}

interface NavLink {
  label: string;
  href: string;
}

interface FooterSection {
  title: string;
  links: { label: string; href: string }[];
}

// ─── Constants ────────────────────────────────────────────────────────────────
const NAV_LINKS: NavLink[] = [
  { label: "Features", href: "#features" },
  { label: "Demo", href: "#demo" },
  { label: "Pricing", href: "#pricing" },
  { label: "API", href: "#api" },
];

const STATS: StatItem[] = [
  { value: "342", suffix: "+", label: "Tickets Processed Daily" },
  { value: "3", suffix: "s", label: "Average AI Classification", prefix: "< " },
  { value: "91", suffix: "%", label: "SLA Compliance Rate" },
  { value: "60", suffix: "%", label: "Reduction in Manual Overhead" },
];

const FEATURES: FeatureCard[] = [
  {
    icon: "⚡",
    title: "Smart Ticket Engine",
    description: "Auto-classify, prioritize, and route tickets in under 3 seconds with GPT-4o.",
  },
  {
    icon: "🤖",
    title: "AI Agent Orchestrator",
    description: "Let AI resolve routine tickets automatically with full audit trail and human approval.",
  },
  {
    icon: "🔔",
    title: "Predictive SLA Engine",
    description: "Know which tickets will breach SLA before they do. Act before the deadline.",
  },
  {
    icon: "📍",
    title: "Facilities & Space Mgmt",
    description: "Interactive floor maps, room reservations, and AI-powered space optimization.",
  },
  {
    icon: "📈",
    title: "Operational Twin",
    description: "Real-time visualization of your entire operations. Live. Interactive. Actionable.",
  },
  {
    icon: "🛡",
    title: "Enterprise Compliance",
    description: "SOC 2-ready audit logs, GDPR right to forget, and data retention policies built in.",
  },
];

const TESTIMONIALS: Testimonial[] = [
  {
    quote: "PulseDesk AI reduced our ticket classification time from 15 minutes to 3 seconds. The ROI was immediate.",
    name: "Carlos Mendez",
    role: "IT Director · TechCorp",
    initials: "CM",
  },
  {
    quote: "The XAI panel was the feature that got our compliance team to approve the rollout. Transparency matters.",
    name: "Sarah Chen",
    role: "VP Operations · HealthCo",
    initials: "SC",
  },
  {
    quote: "QR Demo Mode let us onboard 50 employees in one session. Unbelievable experience for our HR team.",
    name: "Miguel Torres",
    role: "HR Manager · RetailPlus",
    initials: "MT",
  },
];

const TECH_STACK = [
  { name: "Rails", icon: "🔶" },
  { name: "PostgreSQL", icon: "🐘" },
  { name: "Redis", icon: "🔴" },
  { name: "OpenAI", icon: "⚫" },
  { name: "Anthropic", icon: "🟠" },
  { name: "Google AI", icon: "🔵" },
  { name: "React", icon: "⚛" },
  { name: "pgvector", icon: "🔍" },
];

const FOOTER_SECTIONS: FooterSection[] = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "Pricing", href: "#pricing" },
      { label: "Changelog", href: "#" },
      { label: "Roadmap", href: "#" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#" },
      { label: "Blog", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Press", href: "#" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Documentation", href: "#" },
      { label: "API Reference", href: "#" },
      { label: "Status", href: "#" },
      { label: "Support", href: "#" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "#" },
      { label: "Terms of Service", href: "#" },
      { label: "GDPR", href: "#" },
      { label: "Security", href: "#" },
    ],
  },
];

// ─── Animated Counter ─────────────────────────────────────────────────────────
function AnimatedCounter({ value, duration = 2 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = value / (duration * 60);
    const timer = setInterval(() => {
      start += step;
      if (start >= value) {
        setDisplay(value);
        clearInterval(timer);
      } else {
        setDisplay(Math.floor(start));
      }
    }, 1000 / 60);
    return () => clearInterval(timer);
  }, [inView, value, duration]);

  return <span ref={ref}>{display}</span>;
}

// ─── Particle Canvas ──────────────────────────────────────────────────────────
function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    const particles: { x: number; y: number; vx: number; vy: number; size: number; opacity: number }[] = [];
    const COUNT = 60;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    for (let i = 0; i < COUNT; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.4 + 0.1,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(2, 195, 154, ${p.opacity})`;
        ctx.fill();
      });

      particles.forEach((p1, i) => {
        particles.slice(i + 1).forEach((p2) => {
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(2, 195, 154, ${0.08 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });

      animationId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden="true"
    />
  );
}

// ─── Dashboard Mockup ─────────────────────────────────────────────────────────
function DashboardMockup() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, rotateX: 5 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 0.9, delay: 0.6, ease: "easeOut" as const }}
      style={{ perspective: "1000px" }}
      className="relative mx-auto mt-16 max-w-3xl"
    >
      <div
        className="rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: "#0D1B2A", border: "1px solid rgba(2,128,144,0.3)" }}
      >
        {/* Browser chrome */}
        <div className="flex items-center gap-2 px-4 py-3" style={{ background: "#0a1520", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="w-3 h-3 rounded-full bg-red-500 opacity-70" />
          <div className="w-3 h-3 rounded-full bg-yellow-500 opacity-70" />
          <div className="w-3 h-3 rounded-full bg-green-500 opacity-70" />
          <div className="flex-1 mx-4 rounded-md px-3 py-1 text-xs" style={{ background: "rgba(255,255,255,0.06)", color: "#64748b" }}>
            app.pulsedesk.ai
          </div>
        </div>

        {/* App layout */}
        <div className="flex" style={{ minHeight: 280 }}>
          {/* Sidebar */}
          <div className="flex flex-col items-center py-4 gap-4 px-3" style={{ background: "#0a1520", borderRight: "1px solid rgba(255,255,255,0.06)", minWidth: 52 }}>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "#028090" }}>
              <span style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>P</span>
            </div>
            {["▦", "☰", "👤", "◉", "📊", "⚙"].map((icon, i) => (
              <div key={i} className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer" style={{ background: i === 0 ? "rgba(2,128,144,0.3)" : "transparent", color: i === 0 ? "#02C39A" : "#475569", fontSize: 14 }}>
                {icon}
              </div>
            ))}
          </div>

          {/* Main content */}
          <div className="flex-1 p-4">
            {/* KPI row */}
            <div className="grid grid-cols-4 gap-3 mb-4">
              {[
                { label: "Open Tickets", value: "47", change: "+12%", color: "#02C39A" },
                { label: "SLA Compliance", value: "91%", change: "-2%", color: "#02C39A" },
                { label: "Avg Resolution", value: "3.8h", change: "-15%", color: "#02C39A" },
                { label: "AI Cost Today", value: "$4.20", change: "normal", color: "#64748b" },
              ].map((kpi, i) => (
                <div key={i} className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <p style={{ color: "#64748b", fontSize: 10, marginBottom: 4 }}>{kpi.label}</p>
                  <p style={{ color: "#f1f5f9", fontSize: 18, fontWeight: 700, lineHeight: 1 }}>{kpi.value}</p>
                  <p style={{ color: kpi.color, fontSize: 10, marginTop: 2 }}>{kpi.change}</p>
                </div>
              ))}
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-2 gap-3">
              {/* Sparkline */}
              <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <p style={{ color: "#64748b", fontSize: 10, marginBottom: 8 }}>Ticket Volume — 30 Days</p>
                <svg viewBox="0 0 160 50" style={{ width: "100%", height: 50 }}>
                  <defs>
                    <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#02C39A" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#02C39A" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d="M0,40 C20,35 30,20 50,22 C70,24 80,15 100,18 C120,21 130,10 160,8" fill="none" stroke="#02C39A" strokeWidth="1.5" />
                  <path d="M0,40 C20,35 30,20 50,22 C70,24 80,15 100,18 C120,21 130,10 160,8 L160,50 L0,50Z" fill="url(#sparkGrad)" />
                </svg>
              </div>

              {/* Recent tickets */}
              <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <p style={{ color: "#64748b", fontSize: 10, marginBottom: 8 }}>Recent Tickets</p>
                {[
                  { id: "TK-00321", title: "VPN issue", status: "AI" },
                  { id: "TK-00258", title: "New employee setup", status: "AI" },
                  { id: "TK-00339", title: "Printer offline", status: "AI" },
                ].map((ticket, i) => (
                  <div key={i} className="flex items-center justify-between mb-2">
                    <span style={{ color: "#028090", fontSize: 10, fontFamily: "monospace" }}>{ticket.id}</span>
                    <span style={{ color: "#94a3b8", fontSize: 10, flex: 1, marginLeft: 8 }}>{ticket.title}</span>
                    <span className="rounded px-1.5 py-0.5" style={{ background: "#028090", color: "#fff", fontSize: 9 }}>AI</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Glow */}
      <div className="absolute inset-0 -z-10 rounded-2xl" style={{ background: "radial-gradient(ellipse at center, rgba(2,128,144,0.15) 0%, transparent 70%)", filter: "blur(20px)", transform: "translateY(20px) scale(0.95)" }} />
    </motion.div>
  );
}

// ─── XAI Panel Mockup ─────────────────────────────────────────────────────────
function XAIPanelMockup() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, ease: "easeOut" as const }}
      className="rounded-2xl overflow-hidden"
      style={{ background: "#0a1520", border: "1px solid rgba(2,195,154,0.3)", maxWidth: 420 }}
    >
      <div className="px-4 py-3 flex items-center justify-between" style={{ background: "#028090" }}>
        <div className="flex items-center gap-2">
          <span style={{ color: "#fff", fontSize: 12 }}>⚡</span>
          <span style={{ color: "#fff", fontSize: 13, fontWeight: 600 }}>AI Risk Assessment — Powered by GPT-4o</span>
        </div>
        <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, fontFamily: "monospace" }}>TK-00291</span>
      </div>

      <div className="p-4 space-y-4">
        <div>
          <p style={{ color: "#64748b", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Classification</p>
          <div className="flex gap-2 flex-wrap">
            {["IT — Network", "Priority: High", "SLA: 4h"].map((tag) => (
              <span key={tag} className="rounded-full px-3 py-1 text-xs" style={{ background: "rgba(2,128,144,0.2)", color: "#02C39A", border: "1px solid rgba(2,195,154,0.3)" }}>
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div>
          <div className="flex justify-between mb-2">
            <p style={{ color: "#64748b", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em" }}>Confidence Score</p>
            <span style={{ color: "#02C39A", fontSize: 13, fontWeight: 700 }}>0.87</span>
          </div>
          <div className="rounded-full h-2" style={{ background: "rgba(255,255,255,0.08)" }}>
            <motion.div
              className="rounded-full h-2"
              style={{ background: "linear-gradient(90deg, #028090, #02C39A)" }}
              initial={{ width: 0 }}
              whileInView={{ width: "87%" }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.3 }}
            />
          </div>
          <p style={{ color: "#02C39A", fontSize: 11, marginTop: 4 }}>High Confidence — Auto-routing enabled</p>
        </div>

        <div>
          <p style={{ color: "#64748b", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Signals</p>
          {[
            { signal: 'Keywords: "VPN", "cannot connect", "remote"', score: "+0.42" },
            { signal: "Requester history: 3 IT tickets prior", score: "+0.28" },
            { signal: 'Ticket time: Monday 9am — peak IT hour', score: "+0.17" },
          ].map((item) => (
            <div key={item.signal} className="flex justify-between items-start py-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <span style={{ color: "#94a3b8", fontSize: 12, flex: 1 }}>{item.signal}</span>
              <span style={{ color: "#02C39A", fontSize: 12, fontWeight: 600, marginLeft: 12 }}>{item.score}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Landing Page ─────────────────────────────────────────────────────────
export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  const handleScroll = useCallback(() => {
    setScrolled(window.scrollY > 20);
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const staggerContainer = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.1 } },
  };

  const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: "#fff", color: "#1E293B", overflowX: "hidden" }}>
      {/* Scroll progress bar */}
      <motion.div
        style={{ scaleX, transformOrigin: "left", position: "fixed", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, #028090, #02C39A)", zIndex: 9999 }}
      />

      {/* ── Navbar ──────────────────────────────────────────────────────────── */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          transition: "background 0.3s, backdrop-filter 0.3s, border-color 0.3s",
          background: scrolled ? "rgba(13, 27, 42, 0.85)" : "transparent",
          backdropFilter: scrolled ? "blur(20px)" : "none",
          borderBottom: scrolled ? "1px solid rgba(2,128,144,0.2)" : "1px solid transparent",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
          {/* Logo */}
          <a href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, #028090, #02C39A)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#fff", fontSize: 16, fontWeight: 700 }}>P</span>
            </div>
            <span style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>
              PulseDesk <span style={{ color: "#02C39A" }}>AI</span>
            </span>
          </a>

          {/* Desktop nav */}
          <div className="hidden md:flex" style={{ gap: 32, alignItems: "center" }}>
            {NAV_LINKS.map((link) => (
              <a key={link.label} href={link.href} style={{ color: "#94a3b8", fontSize: 14, textDecoration: "none", transition: "color 0.2s" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#94a3b8")}
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* CTA */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <a href="/login" style={{ color: "#94a3b8", fontSize: 14, textDecoration: "none", display: "none" }} className="md:inline">
              Sign in
            </a>
            <motion.a
              href="/login"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              style={{
                background: "#028090",
                color: "#fff",
                fontSize: 14,
                fontWeight: 600,
                padding: "8px 20px",
                borderRadius: 8,
                textDecoration: "none",
                display: "inline-block",
              }}
            >
              Request Demo
            </motion.a>

            {/* Mobile menu button */}
            <button
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{ background: "transparent", border: "none", color: "#fff", fontSize: 24, cursor: "pointer" }}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              style={{ overflow: "hidden", background: "rgba(13,27,42,0.97)", borderTop: "1px solid rgba(255,255,255,0.08)" }}
            >
              <div style={{ padding: "16px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
                {NAV_LINKS.map((link) => (
                  <a key={link.label} href={link.href} style={{ color: "#94a3b8", fontSize: 15, textDecoration: "none" }} onClick={() => setMobileMenuOpen(false)}>
                    {link.label}
                  </a>
                ))}
                <a href="/login" style={{ color: "#02C39A", fontSize: 15, fontWeight: 600, textDecoration: "none" }}>
                  Request Demo →
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section style={{ background: "#0D1B2A", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", paddingTop: 80, paddingBottom: 60, position: "relative", overflow: "hidden" }}>
        <ParticleCanvas />

        {/* Radial gradient overlay */}
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 50% at 50% 30%, rgba(2,128,144,0.12) 0%, transparent 60%)", pointerEvents: "none" }} />

        <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 24px", textAlign: "center", position: "relative", zIndex: 1 }}>
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 32 }}
          >
            <motion.div
              animate={{ boxShadow: ["0 0 0 0 rgba(2,195,154,0.4)", "0 0 0 8px rgba(2,195,154,0)", "0 0 0 0 rgba(2,195,154,0)"] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(2,195,154,0.1)", border: "1px solid rgba(2,195,154,0.4)", borderRadius: 100, padding: "6px 16px" }}
            >
              <span style={{ color: "#02C39A", fontSize: 12 }}>✦</span>
              <span style={{ color: "#02C39A", fontSize: 13, fontWeight: 500 }}>Now with AI Agent Orchestration</span>
            </motion.div>
          </motion.div>

          {/* Headline */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            <motion.h1
              variants={fadeUp}
              style={{ fontSize: "clamp(36px, 6vw, 72px)", fontWeight: 800, lineHeight: 1.1, color: "#fff", margin: "0 0 24px", letterSpacing: "-0.02em" }}
            >
              The Operating System{" "}
              <br />
              for Modern{" "}
              <span style={{ background: "linear-gradient(135deg, #028090 0%, #02C39A 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                Enterprises
              </span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              style={{ fontSize: "clamp(16px, 2vw, 20px)", color: "#94a3b8", lineHeight: 1.6, maxWidth: 560, margin: "0 auto 40px" }}
            >
              PulseDesk AI unifies support, HR, IT assets, and facilities under one intelligent platform that classifies, predicts, and acts — automatically.
            </motion.p>

            {/* CTAs */}
            <motion.div
              variants={fadeUp}
              style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap", marginBottom: 48 }}
            >
              <motion.a
                href="/login"
                whileHover={{ scale: 1.04, boxShadow: "0 0 30px rgba(2,128,144,0.5)" }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  background: "#028090",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 16,
                  padding: "14px 32px",
                  borderRadius: 10,
                  textDecoration: "none",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                Request Demo →
              </motion.a>

              <motion.a
                href="/login"
                whileHover={{ scale: 1.04, background: "rgba(255,255,255,0.08)" }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  background: "rgba(255,255,255,0.05)",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: 16,
                  padding: "14px 32px",
                  borderRadius: 10,
                  textDecoration: "none",
                  border: "1px solid rgba(255,255,255,0.15)",
                }}
              >
                View Live Demo →
              </motion.a>
            </motion.div>

            {/* Social proof */}
            <motion.div
              variants={fadeUp}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 24, flexWrap: "wrap" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ display: "flex" }}>
                  {["#e74c3c", "#3498db", "#2ecc71", "#f39c12", "#9b59b6"].map((color, i) => (
                    <div key={i} style={{ width: 28, height: 28, borderRadius: "50%", background: color, border: "2px solid #0D1B2A", marginLeft: i > 0 ? -8 : 0 }} />
                  ))}
                </div>
                <span style={{ color: "#64748b", fontSize: 13 }}>Trusted by 500+ teams</span>
              </div>
              <span style={{ color: "#334155", fontSize: 13 }}>|</span>
              <span style={{ color: "#64748b", fontSize: 13 }}>99.9% uptime</span>
              <span style={{ color: "#334155", fontSize: 13 }}>|</span>
              <span style={{ color: "#64748b", fontSize: 13 }}>&lt; 3s AI classification</span>
            </motion.div>
          </motion.div>

          {/* Dashboard mockup */}
          <DashboardMockup />
        </div>
      </section>

      {/* ── Stats ───────────────────────────────────────────────────────────── */}
      <section style={{ background: "#fff", padding: "64px 24px", borderBottom: "1px solid #e2e8f0" }}>
        <div style={{ maxWidth: 960, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 32, textAlign: "center" }}>
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <p style={{ fontSize: "clamp(32px, 4vw, 48px)", fontWeight: 800, color: "#028090", lineHeight: 1, marginBottom: 8 }}>
                {stat.prefix}
                <AnimatedCounter value={parseInt(stat.value)} />
                {stat.suffix}
              </p>
              <p style={{ color: "#64748b", fontSize: 14 }}>{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────────────── */}
      <section id="features" style={{ background: "#f8fafc", padding: "96px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            style={{ textAlign: "center", marginBottom: 64 }}
          >
            <h2 style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 800, color: "#0f172a", marginBottom: 12, letterSpacing: "-0.02em" }}>
              Everything your operations need
            </h2>
            <p style={{ color: "#64748b", fontSize: 18 }}>One platform. Every team. Full AI.</p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}
          >
            {FEATURES.map((feature) => (
              <motion.div
                key={feature.title}
                variants={fadeUp}
                whileHover={{ y: -4, boxShadow: "0 12px 40px rgba(2,128,144,0.12)" }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                style={{ background: "#fff", borderRadius: 16, padding: 28, border: "1px solid #e2e8f0", cursor: "default" }}
              >
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(2,128,144,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, marginBottom: 16 }}>
                  {feature.icon}
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>{feature.title}</h3>
                <p style={{ color: "#64748b", fontSize: 15, lineHeight: 1.6, margin: 0 }}>{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── AI Explainability ───────────────────────────────────────────────── */}
      <section id="demo" style={{ background: "#0D1B2A", padding: "96px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 64, alignItems: "center" }}>
          {/* Left */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <p style={{ color: "#028090", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 16 }}>
              ✦ Powered by Multi-Provider AI
            </p>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 800, color: "#fff", marginBottom: 20, lineHeight: 1.15, letterSpacing: "-0.02em" }}>
              AI that explains itself
            </h2>
            <p style={{ color: "#64748b", fontSize: 17, lineHeight: 1.7, marginBottom: 40 }}>
              Every decision is transparent, auditable, and reversible. No black boxes.
            </p>

            {[
              { icon: "👁", title: "XAI Panel", desc: "See exactly why the AI classified each ticket — signal by signal." },
              { icon: "📊", title: "Confidence Score", desc: "Red-flag when AI is uncertain. Always know when to review manually." },
              { icon: "📋", title: "Full Audit Log", desc: "Every prompt, token count, and cost tracked and exportable." },
            ].map((item) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                style={{ display: "flex", gap: 16, marginBottom: 24 }}
              >
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(2,195,154,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>
                  {item.icon}
                </div>
                <div>
                  <p style={{ color: "#fff", fontWeight: 600, fontSize: 15, marginBottom: 4 }}>
                    <span style={{ color: "#02C39A" }}>✦ </span>{item.title}
                  </p>
                  <p style={{ color: "#64748b", fontSize: 14, lineHeight: 1.5, margin: 0 }}>{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Right */}
          <div style={{ display: "flex", justifyContent: "center" }}>
            <XAIPanelMockup />
          </div>
        </div>
      </section>

      {/* ── Testimonials ────────────────────────────────────────────────────── */}
      <section style={{ background: "#f8fafc", padding: "96px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 800, color: "#0f172a", textAlign: "center", marginBottom: 56, letterSpacing: "-0.02em" }}
          >
            Built for enterprise teams
          </motion.h2>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}
          >
            {TESTIMONIALS.map((t) => (
              <motion.div
                key={t.name}
                variants={fadeUp}
                whileHover={{ y: -4 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                style={{ background: "#fff", borderRadius: 16, padding: 28, border: "1px solid #e2e8f0" }}
              >
                <div style={{ display: "flex", gap: 2, marginBottom: 16 }}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} style={{ color: "#f59e0b", fontSize: 16 }}>★</span>
                  ))}
                </div>
                <p style={{ color: "#1e293b", fontSize: 15, lineHeight: 1.7, marginBottom: 20 }}>"{t.quote}"</p>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg, #028090, #02C39A)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, fontWeight: 700 }}>
                    {t.initials}
                  </div>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: 14, color: "#0f172a", margin: 0 }}>{t.name}</p>
                    <p style={{ color: "#64748b", fontSize: 13, margin: 0 }}>{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Tech Stack ──────────────────────────────────────────────────────── */}
      <section style={{ background: "#fff", padding: "64px 24px", borderTop: "1px solid #e2e8f0" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 style={{ fontSize: 26, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>Built on technology you trust</h2>
            <p style={{ color: "#64748b", fontSize: 15, marginBottom: 40 }}>Open standards. No vendor lock-in.</p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 24 }}
          >
            {TECH_STACK.map((tech) => (
              <motion.div
                key={tech.name}
                variants={fadeUp}
                whileHover={{ scale: 1.08 }}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, cursor: "default" }}
              >
                <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, border: "1px solid #e2e8f0" }}>
                  {tech.icon}
                </div>
                <span style={{ color: "#64748b", fontSize: 13 }}>{tech.name}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── CTA Final ───────────────────────────────────────────────────────── */}
      <section style={{ background: "linear-gradient(135deg, #028090 0%, #02C39A 100%)", padding: "96px 24px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 30% 50%, rgba(255,255,255,0.08) 0%, transparent 60%)", pointerEvents: "none" }} />
        <div style={{ position: "relative", maxWidth: 600, margin: "0 auto" }}>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 800, color: "#fff", marginBottom: 16, letterSpacing: "-0.02em" }}
          >
            Ready to transform your operations?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            style={{ color: "rgba(255,255,255,0.8)", fontSize: 18, marginBottom: 40 }}
          >
            Start your demo today — no credit card required.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}
          >
            <motion.a
              href="/login"
              whileHover={{ scale: 1.05, boxShadow: "0 8px 30px rgba(0,0,0,0.2)" }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              style={{ background: "#fff", color: "#028090", fontWeight: 700, fontSize: 16, padding: "14px 32px", borderRadius: 10, textDecoration: "none" }}
            >
              Request Demo
            </motion.a>
            <motion.a
              href="/login"
              whileHover={{ scale: 1.05, background: "rgba(255,255,255,0.15)" }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              style={{ background: "rgba(255,255,255,0.1)", color: "#fff", fontWeight: 600, fontSize: 16, padding: "14px 32px", borderRadius: 10, textDecoration: "none", border: "1px solid rgba(255,255,255,0.3)" }}
            >
              Schedule a call →
            </motion.a>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer style={{ background: "#0D1B2A", padding: "64px 24px 32px", color: "#94a3b8" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 48, marginBottom: 48 }}>
            {/* Brand */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, #028090, #02C39A)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ color: "#fff", fontSize: 16, fontWeight: 700 }}>P</span>
                </div>
                <span style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>
                  PulseDesk <span style={{ color: "#02C39A" }}>AI</span>
                </span>
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.7, color: "#64748b", marginBottom: 20 }}>
                The intelligent operating platform for modern enterprises.
              </p>
              <div style={{ display: "flex", gap: 12 }}>
                {["𝕏", "in"].map((icon, i) => (
                  <a key={i} href="#" style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", fontSize: 14, textDecoration: "none", border: "1px solid rgba(255,255,255,0.08)" }}>
                    {icon}
                  </a>
                ))}
              </div>
            </div>

            {/* Footer sections */}
            {FOOTER_SECTIONS.map((section) => (
              <div key={section.title}>
                <p style={{ color: "#94a3b8", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 16 }}>
                  {section.title}
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {section.links.map((link) => (
                    <a
                      key={link.label}
                      href={link.href}
                      style={{ color: "#64748b", fontSize: 14, textDecoration: "none", transition: "color 0.2s" }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "#cbd5e1")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "#64748b")}
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Bottom bar */}
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <p style={{ color: "#334155", fontSize: 13 }}>© 2026 PulseDesk AI. All rights reserved.</p>
            <p style={{ color: "#334155", fontSize: 13 }}>❤ Made in Costa Rica</p>
          </div>
        </div>
      </footer>
    </div>
  );
}