import { pricing } from "../data/landingContent";
import { SectionHeader } from "./SectionHeader";

export function PricingSection() {
  return (
    <section className="section" id="pricing">
      <SectionHeader
        eyebrow="Pricing"
        title="Start small, scale into serious agentic builds."
        copy="Simple plans for solo builders, pros, and teams that need reliable coding workflows."
      />
      <div className="pricing-grid">
        {pricing.map((plan) => (
          <article className={plan.featured ? "price-card featured" : "price-card"} key={plan.name}>
            <p>{plan.name}</p>
            <h3>{plan.price}<span>{plan.price === "Custom" ? "" : "/mo"}</span></h3>
            <small>{plan.copy}</small>
            <ul>{plan.perks.map((perk) => <li key={perk}>{perk}</li>)}</ul>
            <a className="button primary" href="mailto:hello@flowpilot.example?subject=Start%20building%20with%20FlowPilot">Start free</a>
          </article>
        ))}
      </div>
    </section>
  );
}
