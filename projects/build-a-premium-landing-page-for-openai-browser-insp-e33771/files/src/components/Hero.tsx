import { ArrowRight, Play } from "lucide-react";

interface HeroProps {
  onGetStarted: () => void;
}

export default function Hero({ onGetStarted }: HeroProps) {
  return (
    <section
      className="hero section-gradient"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        paddingTop: "var(--navbar-height)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background decorative elements */}
      <div style={{ position: "absolute", top: "20%", right: "10%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(16,163,127,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "10%", left: "5%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(14,165,233,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />

      <div className="container" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-16)", alignItems: "center", position: "relative", zIndex: 1 }}>
        {/* Left: Text content */}
        <div className="hero-content" style={{ animation: "fadeInUp 0.8s ease-out" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-2)", padding: "6px 14px", borderRadius: 100, background: "var(--color-accent-glow)", color: "var(--color-accent)", fontSize: "0.8rem", fontWeight: 600, marginBottom: "var(--space-6)", letterSpacing: "0.02em", border: "1px solid rgba(16,163,127,0.2)" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--color-accent)", display: "inline-block" }} />
            Now in Public Beta
          </div>

          <h1 style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", fontWeight: 700, lineHeight: 1.1, letterSpacing: "-0.03em", color: "var(--color-text-primary)", marginBottom: "var(--space-6)" }}>
            The browser that{" "}
            <span style={{ background: "linear-gradient(135deg, #10A37F, #0EA5E9)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              thinks with you
            </span>
          </h1>

          <p style={{ fontSize: "clamp(1rem, 1.5vw, 1.2rem)", color: "var(--color-text-secondary)", lineHeight: 1.7, maxWidth: 520, marginBottom: "var(--space-10)" }}>
            Experience the web reimagined. OpenAI Browser brings AI-powered search,
            smart tab organisation, and a built-in assistant to every page you visit.
            Browse smarter, not harder.
          </p>

          <div style={{ display: "flex", gap: "var(--space-4)", flexWrap: "wrap" }}>
            <button onClick={onGetStarted} className="btn-primary"
              style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-2)", padding: "14px 28px", borderRadius: "var(--radius-sm)", background: "var(--color-accent)", color: "#ffffff", fontWeight: 600, fontSize: "1rem", transition: "background 0.2s ease, transform 0.2s ease", border: "none" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-accent-hover)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "var(--color-accent)"; e.currentTarget.style.transform = "translateY(0)"; }}>
              Download Free <ArrowRight size={18} />
            </button>
            <button className="btn-secondary"
              style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-2)", padding: "14px 28px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border-strong)", color: "var(--color-text-primary)", fontWeight: 600, fontSize: "1rem", transition: "background 0.2s ease, border-color 0.2s ease", background: "transparent" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-bg-surface)"; e.currentTarget.style.borderColor = "var(--color-text-secondary)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "var(--color-border-strong)"; }}>
              <Play size={18} /> See Demo
            </button>
          </div>
        </div>

        {/* Right: Browser mockup */}
        <div className="hero-mockup" style={{ animation: "float 4s ease-in-out infinite, fadeInUp 0.8s ease-out 0.2s both", perspective: 1000 }}>
          <div style={{ position: "relative", width: "100%", maxWidth: 540, aspectRatio: "4/3", borderRadius: "var(--radius-lg)", background: "linear-gradient(135deg, rgba(26,26,26,0.9), rgba(34,34,34,0.9))", border: "1px solid var(--color-border-subtle)", boxShadow: "var(--shadow-lg), var(--shadow-glow)", overflow: "hidden", backdropFilter: "blur(4px)", transform: "rotateY(-2deg) rotateX(2deg)", transition: "transform 0.3s ease" }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "rotateY(0deg) rotateX(0deg)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "rotateY(-2deg) rotateX(2deg)"; }}>
            {/* Browser chrome */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", borderBottom: "1px solid var(--color-border-subtle)" }}>
              <div style={{ display: "flex", gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ef4444" }} />
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#f59e0b" }} />
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#22c55e" }} />
              </div>
              <div style={{ flex: 1, height: 24, borderRadius: 6, background: "var(--color-bg-elevated)", display: "flex", alignItems: "center", padding: "0 10px", fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>
                openai.com/browser — AI-Powered Search
              </div>
            </div>
            {/* Mockup body */}
            <div style={{ display: "flex", height: "calc(100% - 48px)" }}>
              <div style={{ flex: 1, padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ height: 12, width: "60%", borderRadius: 4, background: "linear-gradient(90deg, var(--color-border-strong) 0%, transparent 100%)" }} />
                <div style={{ height: 12, width: "40%", borderRadius: 4, background: "linear-gradient(90deg, var(--color-border-strong) 0%, transparent 100%)" }} />
                <div style={{ flex: 1, display: "flex", gap: 8, marginTop: 8 }}>
                  <div style={{ flex: 1, borderRadius: 8, border: "1px solid var(--color-border-subtle)", padding: 12 }}>
                    <div style={{ height: 8, width: "100%", borderRadius: 4, background: "var(--color-border-subtle)", marginBottom: 8 }} />
                    <div style={{ height: 8, width: "80%", borderRadius: 4, background: "var(--color-border-subtle)", marginBottom: 8 }} />
                    <div style={{ height: 8, width: "60%", borderRadius: 4, background: "var(--color-border-subtle)" }} />
                  </div>
                  <div style={{ flex: 1, borderRadius: 8, border: "1px solid var(--color-border-subtle)", padding: 12 }}>
                    <div style={{ height: 8, width: "90%", borderRadius: 4, background: "var(--color-border-subtle)", marginBottom: 8 }} />
                    <div style={{ height: 8, width: "70%", borderRadius: 4, background: "var(--color-border-subtle)" }} />
                  </div>
                </div>
              </div>
              {/* AI Sidebar */}
              <div style={{ width: 120, borderLeft: "1px solid var(--color-border-subtle)", padding: 12, display: "flex", flexDirection: "column", gap: 8, background: "linear-gradient(180deg, rgba(16,163,127,0.05), transparent)" }}>
                <div style={{ width: 20, height: 20, borderRadius: 6, background: "var(--color-accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                </div>
                <div style={{ height: 6, width: "80%", borderRadius: 3, background: "var(--color-accent-glow)" }} />
                <div style={{ height: 6, width: "60%", borderRadius: 3, background: "var(--color-border-subtle)" }} />
                <div style={{ height: 6, width: "70%", borderRadius: 3, background: "var(--color-border-subtle)" }} />
                <div style={{ height: 6, width: "50%", borderRadius: 3, background: "var(--color-border-subtle)" }} />
                <div style={{ marginTop: "auto", display: "flex", gap: 4 }}>
                  <div style={{ flex: 1, height: 24, borderRadius: 4, background: "var(--color-bg-elevated)", border: "1px solid var(--color-border-subtle)" }} />
                  <div style={{ width: 24, height: 24, borderRadius: 4, background: "var(--color-accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          .hero .container { grid-template-columns: 1fr !important; text-align: center; }
          .hero-content { display: flex; flex-direction: column; align-items: center; }
          .hero-content p { max-width: 100%; }
          .hero-mockup { max-width: 480px; margin: 0 auto; }
        }
        @media (max-width: 768px) {
          .hero-mockup { max-width: 100%; }
          .hero-mockup > div { transform: none !important; }
        }
      `}</style>
    </section>
  );
}
