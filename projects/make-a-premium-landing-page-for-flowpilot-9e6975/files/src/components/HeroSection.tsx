import { navLinks, trustPills } from "../data/landingContent";

export function HeroSection() {
  return (
    <header className="hero-shell" id="top">
      <nav className="nav">
        <a className="brand" href="#top" aria-label="FlowPilot home">
          <span className="brand-mark">F</span>
          <span>FlowPilot</span>
        </a>
        <div className="nav-links" aria-label="Main navigation">
          {navLinks.map((item) => (
            <a key={item} href={`#${item.toLowerCase().replaceAll(" ", "-")}`}>
              {item}
            </a>
          ))}
        </div>
        <a className="nav-cta" href="#pricing">Start free</a>
      </nav>

      <section className="hero">
        <div className="hero-copy">
          <div className="status-row">
            {trustPills.map((pill) => <span key={pill}>{pill}</span>)}
          </div>
          <h1>Plan projects, automate workflows, and track team progress in one calm dashboard.</h1>
          <p className="hero-lead">
            FlowPilot gives developers a premium team productivity workspace with structured planning, automated workflows, progress dashboards, smart reminders, and team reporting.
          </p>
          <div className="hero-actions">
            <a className="button primary" href="#pricing">Start planning</a>
            <a className="button secondary" href="#product">View dashboard</a>
          </div>
          <div className="hero-proof" aria-label="Product stats">
            <strong>30k+</strong><span>tasks coordinated</span>
            <strong>92%</strong><span>faster status clarity</span>
            <strong>1:1</strong><span>owner-to-task clarity</span>
          </div>
        </div>
        <div className="orb-visual" aria-hidden="true">
          <div className="orb-core" />
          <div className="code-ribbon ribbon-a">Goals → automations → progress</div>
          <div className="code-ribbon ribbon-b">blocked task → owner → next step</div>
        </div>
      </section>
    </header>
  );
}
