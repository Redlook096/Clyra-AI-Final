import { navLinks } from "../data/landingContent";

export function Footer() {
  return (
    <footer className="footer">
      <div>
        <a className="brand" href="#top"><span className="brand-mark">F</span><span>FlowPilot</span></a>
        <p>Agentic coding that plans, builds, checks, previews, and ships.</p>
      </div>
      <nav>
        {navLinks.map((item) => (
          <a key={item} href={`#${item.toLowerCase().replaceAll(" ", "-")}`}>{item}</a>
        ))}
      </nav>
      <small>© 2026 FlowPilot. Built for careful builders.</small>
    </footer>
  );
}
