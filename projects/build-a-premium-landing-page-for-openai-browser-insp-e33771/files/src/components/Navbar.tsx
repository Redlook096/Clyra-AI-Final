import { useScrollPosition } from "../hooks/useScrollPosition";
import { Menu, X, Sun, Moon } from "lucide-react";

interface NavbarProps {
  theme: "dark" | "light";
  toggleTheme: () => void;
  mobileNavOpen: boolean;
  setMobileNavOpen: (open: boolean) => void;
  onGetStarted: () => void;
}

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

export default function Navbar({ theme, toggleTheme, mobileNavOpen, setMobileNavOpen, onGetStarted }: NavbarProps) {
  const scrollY = useScrollPosition();
  const isScrolled = scrollY > 100;

  return (
    <header
      className="navbar"
      style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000,
        height: "var(--navbar-height)", display: "flex", alignItems: "center", justifyContent: "center",
        background: isScrolled ? "var(--color-bg-primary)" : "transparent",
        borderBottom: isScrolled ? "1px solid var(--color-border-subtle)" : "1px solid transparent",
        backdropFilter: isScrolled ? "blur(12px)" : "none",
        WebkitBackdropFilter: isScrolled ? "blur(12px)" : "none",
        transition: "background 0.3s ease, border-color 0.3s ease, backdrop-filter 0.3s ease",
      }}
    >
      <nav className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "100%" }}>
        {/* Logo */}
        <a href="#" className="navbar-logo" aria-label="OpenAI Browser Home" style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none" style={{ flexShrink: 0 }}>
            <rect width="32" height="32" rx="8" fill="#10A37F" />
            <text x="16" y="22" fontSize="18" textAnchor="middle" fill="white" fontFamily="system-ui" fontWeight="bold">O</text>
          </svg>
          <span style={{ marginLeft: 10, fontWeight: 600, fontSize: "1.1rem", color: "var(--color-text-primary)", letterSpacing: "-0.02em" }}>
            OpenAI Browser
          </span>
        </a>

        {/* Desktop Nav Links */}
        <ul className="navbar-links" style={{ display: "flex", alignItems: "center", gap: "var(--space-8)", listStyle: "none" }}>
          {navLinks.map((link) => (
            <li key={link.href}>
              <a href={link.href} style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem", fontWeight: 500, transition: "color 0.2s ease" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-text-primary)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-secondary)")}>
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Right actions */}
        <div className="navbar-actions" style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
          <button onClick={toggleTheme} className="theme-toggle" aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 40, height: 40, borderRadius: "var(--radius-sm)", color: "var(--color-text-secondary)", transition: "background 0.2s ease, color 0.2s ease" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-bg-elevated)"; e.currentTarget.style.color = "var(--color-text-primary)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--color-text-secondary)"; }}>
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <button className="btn-primary navbar-cta" onClick={onGetStarted}
            style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "10px 20px", borderRadius: "var(--radius-sm)", background: "var(--color-accent)", color: "#ffffff", fontWeight: 600, fontSize: "0.875rem", transition: "background 0.2s ease, transform 0.2s ease", border: "none" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-accent-hover)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "var(--color-accent)"; e.currentTarget.style.transform = "translateY(0)"; }}>
            Get Started
          </button>

          <button className="hamburger-btn" onClick={() => setMobileNavOpen(!mobileNavOpen)}
            aria-label={mobileNavOpen ? "Close navigation menu" : "Open navigation menu"} aria-expanded={mobileNavOpen}
            style={{ display: "none", alignItems: "center", justifyContent: "center", width: 40, height: 40, borderRadius: "var(--radius-sm)", color: "var(--color-text-primary)" }}>
            {mobileNavOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      <style>{`
        @media (max-width: 768px) {
          .navbar-links { display: none !important; }
          .navbar-cta { display: none !important; }
          .hamburger-btn { display: flex !important; }
        }
      `}</style>
    </header>
  );
}
