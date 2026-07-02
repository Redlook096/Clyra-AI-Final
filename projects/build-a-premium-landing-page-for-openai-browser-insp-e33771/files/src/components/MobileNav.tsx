import { X } from "lucide-react";

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  onGetStarted: () => void;
}

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

export default function MobileNav({ isOpen, onClose, onGetStarted }: MobileNavProps) {
  const handleLinkClick = () => {
    onClose();
  };

  const handleGetStarted = () => {
    onClose();
    onGetStarted();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 998,
          background: "rgba(0,0,0,0.6)",
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
          transition: "opacity 0.3s ease",
        }}
      />

      {/* Slide-in panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "min(320px, 80vw)",
          zIndex: 999,
          background: "var(--color-bg-primary)",
          borderLeft: "1px solid var(--color-border-subtle)",
          padding: "var(--space-6)",
          display: "flex",
          flexDirection: "column",
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.3s ease",
        }}
      >
        {/* Close button */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "var(--space-8)" }}>
          <button
            onClick={onClose}
            aria-label="Close navigation menu"
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 40, height: 40, borderRadius: "var(--radius-sm)",
              color: "var(--color-text-primary)",
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Nav links */}
        <nav>
          <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
            {navLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={handleLinkClick}
                  style={{
                    display: "block",
                    padding: "var(--space-3) var(--space-4)",
                    borderRadius: "var(--radius-sm)",
                    color: "var(--color-text-primary)",
                    fontWeight: 500,
                    fontSize: "1.05rem",
                    transition: "background 0.2s ease",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-bg-elevated)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Mobile CTA */}
        <button
          onClick={handleGetStarted}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: "100%", padding: "14px 24px",
            borderRadius: "var(--radius-sm)",
            background: "var(--color-accent)",
            color: "#ffffff",
            fontWeight: 600,
            fontSize: "1rem",
            border: "none",
            transition: "background 0.2s ease",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-accent-hover)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "var(--color-accent)"; }}
        >
          Get Started
        </button>
      </aside>
    </>
  );
}
