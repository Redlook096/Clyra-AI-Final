import { Github, Twitter } from "lucide-react";

export default function Footer() {
  const year = new Date().getFullYear();
  
  const links = [
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
    { label: "Cookie Policy", href: "#" },
    { label: "Contact", href: "#" },
  ];

  return (
    <footer style={{
      borderTop: "1px solid var(--color-border-subtle)",
      padding: "var(--space-12) 0 var(--space-8)",
      background: "var(--color-bg-primary)",
    }}>
      <div className="container" style={{ display: "flex", flexDirection: "column", gap: "var(--space-8)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "var(--space-6)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="#10A37F" />
              <text x="16" y="22" fontSize="18" textAnchor="middle" fill="white" fontFamily="system-ui" fontWeight="bold">O</text>
            </svg>
            <span style={{ fontWeight: 600, fontSize: "1rem", color: "var(--color-text-primary)" }}>OpenAI Browser</span>
          </div>
          <nav>
            <ul style={{ listStyle: "none", display: "flex", gap: "var(--space-6)", flexWrap: "wrap" }}>
              {links.map((link) => (
                <li key={link.label}>
                  <a href={link.href}
                    style={{ color: "var(--color-text-secondary)", fontSize: "0.85rem", transition: "color 0.2s ease", textDecoration: "none" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-text-primary)")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-secondary)")}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div style={{ display: "flex", gap: "var(--space-3)" }}>
            <a href="#" aria-label="Twitter"
              style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: "var(--radius-sm)", color: "var(--color-text-secondary)", transition: "background 0.2s ease, color 0.2s ease" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-bg-elevated)"; e.currentTarget.style.color = "var(--color-text-primary)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--color-text-secondary)"; }}
            >
              <Twitter size={18} />
            </a>
            <a href="#" aria-label="GitHub"
              style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: "var(--radius-sm)", color: "var(--color-text-secondary)", transition: "background 0.2s ease, color 0.2s ease" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-bg-elevated)"; e.currentTarget.style.color = "var(--color-text-primary)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--color-text-secondary)"; }}
            >
              <Github size={18} />
            </a>
          </div>
        </div>
        <div style={{ textAlign: "center", fontSize: "0.8rem", color: "var(--color-text-tertiary)" }}>
          &copy; {year} OpenAI Browser. All rights reserved. This is a conceptual project.
        </div>
      </div>
    </footer>
  );
}
