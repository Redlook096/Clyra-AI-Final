import "./styles.css";

const features = [
  "Polished layout",
  "Responsive sections",
  "Reusable cards",
  "Clear calls to action"
];

export default function App() {
  return (
    <main>
      <nav className="nav">
        <strong>Build a complete product analytics platform with</strong>
        <a href="#features">Features</a>
        <a href="#pricing">Pricing</a>
        <button>Get started</button>
      </nav>
      <section className="hero">
        <p className="eyebrow">Built with Clyra Vibe</p>
        <h1>Build a complete product analytics platform with</h1>
        <p className="lead">A complete, presentable starter that is ready to expand into a production-quality product.</p>
        <div className="actions">
          <button>Start free</button>
          <button className="secondary">View demo</button>
        </div>
      </section>
      <section id="features" className="grid">
        {features.map((feature) => (
          <article key={feature}>
            <span />
            <h2>{feature}</h2>
            <p>Designed with responsive structure, clean spacing, and functional interaction states.</p>
          </article>
        ))}
      </section>
      <section id="pricing" className="cta">
        <h2>Ready to ship the next version?</h2>
        <p>Use the file tree, preview, and validation workflow to keep building.</p>
        <button>Continue building</button>
      </section>
    </main>
  );
}
