import { useIntersectionObserver } from "../hooks/useIntersectionObserver";
import { Search, LayoutGrid, MessageSquare, Shield, Smartphone, Puzzle } from "lucide-react";

const features = [
  { icon: Search, title: "AI-Powered Search", desc: "Context-aware, semantic browser search that understands what you mean, not just what you type.", color: "#10A37F" },
  { icon: LayoutGrid, title: "Smart Tab Groups", desc: "Automatic tab organisation by topic, project, or priority — reclaim your tab bar.", color: "#0EA5E9" },
  { icon: MessageSquare, title: "Built-in Chat", desc: "OpenAI chat sidebar on any page. Ask questions, summarise, translate, and code.", color: "#8B5CF6" },
  { icon: Shield, title: "Privacy Mode", desc: "Local-first AI processing. Your data stays on your device with on-device models.", color: "#10A37F" },
  { icon: Smartphone, title: "Cross-Device Sync", desc: "Seamless experience across desktop, tablet, and mobile — pick up where you left off.", color: "#0EA5E9" },
  { icon: Puzzle, title: "Extensions", desc: "Open ecosystem for AI plugins. Extend your browser with community-built tools.", color: "#F59E0B" },
];

export default function Features() {
  const { ref, isVisible } = useIntersectionObserver({ threshold: 0.1 });

  return (
    <section id="features" ref={ref} className="section-padding" style={{ position: "relative" }}>
      <div className="container">
        <div style={{ textAlign: "center", marginBottom: "var(--space-16)", opacity: isVisible ? 1 : 0, transform: isVisible ? "translateY(0)" : "translateY(24px)", transition: "opacity 0.6s ease-out, transform 0.6s ease-out" }}>
          <h2 style={{ fontSize: "clamp(1.8rem, 3vw, 2.5rem)", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "var(--space-4)", letterSpacing: "-0.02em" }}>
            Everything you need to browse smarter
          </h2>
          <p style={{ fontSize: "1.05rem", color: "var(--color-text-secondary)", maxWidth: 560, margin: "0 auto" }}>
            Six powerful features designed to transform how you interact with the web.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "var(--space-6)" }}>
          {features.map((feat, i) => (
            <FeatureCard key={feat.title} {...feat} index={i} isVisible={isVisible} />
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          #features > .container > div:last-child { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 768px) {
          #features > .container > div:last-child { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}

function FeatureCard({ icon: Icon, title, desc, color, index, isVisible }: {
  icon: React.ElementType; title: string; desc: string; color: string; index: number; isVisible: boolean;
}) {
  return (
    <div
      className="feature-card"
      style={{
        padding: "var(--space-8)",
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--color-border-subtle)",
        background: "var(--color-bg-surface)",
        transition: "transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease",
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(24px)",
        transitionDelay: `${index * 100}ms`,
        transitionProperty: "opacity, transform",
        transitionDuration: "0.6s",
        transitionTimingFunction: "ease-out",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "var(--shadow-md)";
        e.currentTarget.style.borderColor = "var(--color-border-strong)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.borderColor = "var(--color-border-subtle)";
      }}
    >
      <div style={{ width: 44, height: 44, borderRadius: "var(--radius-sm)", background: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "var(--space-4)" }}>
        <Icon size={22} color={color} />
      </div>
      <h3 style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--color-text-primary)", marginBottom: "var(--space-2)" }}>
        {title}
      </h3>
      <p style={{ fontSize: "0.9rem", color: "var(--color-text-secondary)", lineHeight: 1.7 }}>
        {desc}
      </p>
    </div>
  );
}
