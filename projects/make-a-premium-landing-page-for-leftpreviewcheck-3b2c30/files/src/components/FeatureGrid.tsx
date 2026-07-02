import { features } from "../data/landingContent";
import { SectionHeader } from "./SectionHeader";

export function FeatureGrid() {
  return (
    <section className="section" id="features">
      <SectionHeader
        eyebrow="Platform"
        title="Everything a real agentic coding workspace needs."
        copy="A focused toolkit for planning, building, checking, previewing, recovering, and shipping complete interfaces."
      />
      <div className="feature-grid">
        {features.map((feature, index) => (
          <article className="feature-card" key={feature.title}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <h3>{feature.title}</h3>
            <p>{feature.copy}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
