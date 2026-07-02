import { useIntersectionObserver } from "../hooks/useIntersectionObserver";
import { MessageSquare, Sparkles } from "lucide-react";

export default function ProductPreview() {
  const { ref, isVisible } = useIntersectionObserver({ threshold: 0.3 });
  return (
    <section ref={ref} className="section-padding" style={{ background: "var(--color-bg-surface)" }}>
      <div className="container" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--space-12)" }}>
        <SectionHeader isVisible={isVisible} />
        <BrowserMockup isVisible={isVisible} />
      </div>
    </section>
  );
}

function BrowserMockup({ isVisible }: { isVisible: boolean }) {
  return (
    <div style={{ width: "100%", maxWidth: 860, borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border-strong)", overflow: "hidden", boxShadow: "var(--shadow-lg)", opacity: isVisible ? 1 : 0, transform: isVisible ? "translateY(0)" : "translateY(32px)", transition: "opacity 0.6s ease-out 0.15s, transform 0.6s ease-out 0.15s" }}>
      <BrowserChrome />
      <div style={{ display: "flex", minHeight: 380 }}>
        <PageContent />
        <AISidebar />
      </div>
    </div>
  );
}

function BrowserChrome() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 20px", background: "var(--color-bg-primary)", borderBottom: "1px solid var(--color-border-subtle)" }}>
      <div style={{ display: "flex", gap: 8 }}>
        <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#ef4444" }} />
        <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#f59e0b" }} />
        <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#22c55e" }} />
      </div>
      <div style={{ flex: 1, height: 32, borderRadius: 8, background: "var(--color-bg-elevated)", display: "flex", alignItems: "center", padding: "0 14px", gap: 8, fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
        <span>How does AI-powered search work?</span>
      </div>
    </div>
  );
}

function PageContent() {
  return (
    <div style={{ flex: 1, padding: "var(--space-6)", background: "var(--color-bg-primary)" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-text-primary)" }}>Understanding AI-Powered Search</div>
        {[100, 90, 70, 95, 60].map((w, i) => (
          <div key={i} style={{ height: 8, width: w + "%", borderRadius: 4, background: "var(--color-border-subtle)" }} />
        ))}
        <div style={{ marginTop: 12, display: "flex", gap: 12 }}>
          <div style={{ width: 80, height: 80, borderRadius: 12, background: "linear-gradient(135deg, var(--color-accent-glow), transparent)" }} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ height: 8, width: "80%", borderRadius: 4, background: "var(--color-border-subtle)" }} />
            <div style={{ height: 8, width: "60%", borderRadius: 4, background: "var(--color-border-subtle)" }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function AISidebar() {
  const msgs = [
    { side: "right", txt: "How does AI search work?" },
    { side: "left", txt: "AI uses NLP to understand intent behind your query, not just keywords." },
    { side: "right", txt: "Give me an example" },
    { side: "left", txt: 'Instead of "weather NY", ask "Best time to visit NY this fall?" for a full answer.' },
  ];
  return (
    <div style={{ width: 280, borderLeft: "1px solid var(--color-border-subtle)", background: "var(--color-bg-surface)", padding: "var(--space-5)", display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: "var(--color-accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Sparkles size={16} color="white" />
        </div>
        <span style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--color-text-primary)" }}>AI Assistant</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
        {msgs.map((m, i) => (
          <div key={i} style={{
            padding: "10px 14px", borderRadius: 12, fontSize: "0.85rem",
            maxWidth: m.side === "right" ? "85%" : "90%",
            alignSelf: m.side === "right" ? "flex-end" : "flex-start",
            background: m.side === "right" ? "var(--color-accent)" : "var(--color-bg-elevated)",
            color: m.side === "right" ? "#fff" : "var(--color-text-primary)",
            borderBottomRightRadius: m.side === "right" ? 4 : 12,
            borderBottomLeftRadius: m.side === "left" ? 4 : 12,
          }}>
            {m.txt}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, padding: "8px 12px", borderRadius: 8, border: "1px solid var(--color-border-subtle)", background: "var(--color-bg-primary)" }}>
        <MessageSquare size={16} color="var(--color-text-secondary)" />
        <div style={{ flex: 1, height: 6, borderRadius: 3, background: "var(--color-border-subtle)" }} />
        <div style={{ width: 24, height: 24, borderRadius: 6, background: "var(--color-accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ isVisible }: { isVisible: boolean }) {
  return (
    <div style={{ textAlign: "center", maxWidth: 640, opacity: isVisible ? 1 : 0, transform: isVisible ? "translateY(0)" : "translateY(24px)", transition: "opacity 0.6s ease-out, transform 0.6s ease-out" }}>
      <h2 style={{ fontSize: "clamp(1.8rem, 3vw, 2.5rem)", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "var(--space-4)", letterSpacing: "-0.02em" }}>
        Your AI companion, built right in
      </h2>
      <p style={{ fontSize: "1.05rem", color: "var(--color-text-secondary)", lineHeight: 1.7 }}>
        Every tab comes with a powerful AI sidebar. Ask questions, summarise pages, translate content, and generate code.
      </p>
    </div>
  );
}
