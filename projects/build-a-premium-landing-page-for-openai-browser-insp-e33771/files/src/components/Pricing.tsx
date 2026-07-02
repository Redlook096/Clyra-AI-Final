import { useState } from "react";
import { Check, X } from "lucide-react";
import { useIntersectionObserver } from "../hooks/useIntersectionObserver";

const plans = [
  {
    name: "Free",
    id: "free",
    monthlyPrice: 0,
    annualPrice: 0,
    description: "Perfect for getting started with AI browsing.",
    features: [
      { text: "AI-Powered Search", included: true },
      { text: "5 Smart Tab Groups", included: true },
      { text: "Built-in Chat (100 queries/day)", included: true },
      { text: "Basic Privacy Mode", included: true },
      { text: "Cross-Device Sync", included: false },
      { text: "AI Extensions", included: false },
      { text: "Priority Support", included: false },
    ],
    cta: "Get Started Free",
    featured: false,
  },
  {
    name: "Pro",
    id: "pro",
    monthlyPrice: 20,
    annualPrice: 16,
    description: "For power users who want the full AI experience.",
    features: [
      { text: "AI-Powered Search", included: true },
      { text: "Unlimited Smart Tab Groups", included: true },
      { text: "Unlimited Chat Queries", included: true },
      { text: "Advanced Privacy Mode", included: true },
      { text: "Cross-Device Sync", included: true },
      { text: "AI Extensions", included: true },
      { text: "Priority Support", included: false },
    ],
    cta: "Start Free Trial",
    featured: true,
  },
  {
    name: "Enterprise",
    id: "enterprise",
    monthlyPrice: 40,
    annualPrice: 32,
    description: "For teams and organisations with advanced needs.",
    features: [
      { text: "AI-Powered Search", included: true },
      { text: "Unlimited Smart Tab Groups", included: true },
      { text: "Unlimited Chat Queries", included: true },
      { text: "Advanced Privacy Mode", included: true },
      { text: "Cross-Device Sync", included: true },
      { text: "AI Extensions", included: true },
      { text: "Priority Support", included: true },
    ],
    cta: "Contact Sales",
    featured: false,
  },
];

function PricingCard({
  plan,
  interval,
  index,
  isVisible,
}: {
  plan: (typeof plans)[number];
  interval: "monthly" | "annual";
  index: number;
  isVisible: boolean;
}) {
  const price = interval === "monthly" ? plan.monthlyPrice : plan.annualPrice;

  return (
    <div
      className={`pricing-card ${plan.featured ? "pricing-card-featured" : ""}`}
      style={{
        padding: "var(--space-8)",
        borderRadius: "var(--radius-md)",
        border: plan.featured
          ? "2px solid var(--color-accent)"
          : "1px solid var(--color-border-subtle)",
        background: plan.featured ? "var(--color-bg-elevated)" : "var(--color-bg-surface)",
        position: "relative",
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(24px)",
        transition: `opacity 0.6s ease-out ${index * 100}ms, transform 0.6s ease-out ${index * 100}ms`,
      }}
      onMouseEnter={(e) => {
        if (!plan.featured) {
          e.currentTarget.style.transform = "translateY(-4px)";
          e.currentTarget.style.boxShadow = "var(--shadow-md)";
        }
      }}
      onMouseLeave={(e) => {
        if (!plan.featured) {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "none";
        }
      }}
    >
      {plan.featured && (
        <div
          style={{
            position: "absolute",
            top: -12,
            left: "50%",
            transform: "translateX(-50%)",
            padding: "4px 16px",
            borderRadius: 100,
            background: "var(--color-accent)",
            color: "#ffffff",
            fontSize: "0.75rem",
            fontWeight: 600,
            letterSpacing: "0.03em",
            whiteSpace: "nowrap",
          }}
        >
          Most Popular
        </div>
      )}

      <div style={{ marginBottom: "var(--space-6)" }}>
        <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "var(--space-1)" }}>
          {plan.name}
        </h3>
        <p style={{ fontSize: "0.9rem", color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
          {plan.description}
        </p>
      </div>

      <div style={{ marginBottom: "var(--space-6)" }}>
        <span style={{ fontSize: "clamp(2rem, 3vw, 2.5rem)", fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.03em" }}>
          {price === 0 ? "Free" : `${price}`}
        </span>
        {price > 0 && (
          <span style={{ fontSize: "0.9rem", color: "var(--color-text-secondary)", marginLeft: 4 }}>
            /{interval === "monthly" ? "mo" : "mo, billed annually"}
          </span>
        )}
      </div>

      <button
        className={plan.featured ? "btn-primary" : "btn-secondary"}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          padding: "12px 24px",
          borderRadius: "var(--radius-sm)",
          fontWeight: 600,
          fontSize: "0.9rem",
          marginBottom: "var(--space-6)",
          border: plan.featured ? "none" : "1px solid var(--color-border-strong)",
          background: plan.featured ? "var(--color-accent)" : "transparent",
          color: plan.featured ? "#ffffff" : "var(--color-text-primary)",
          transition: "all 0.2s ease",
          cursor: "pointer",
        }}
        onMouseEnter={(e) => {
          if (plan.featured) {
            e.currentTarget.style.background = "var(--color-accent-hover)";
          } else {
            e.currentTarget.style.background = "var(--color-bg-elevated)";
          }
        }}
        onMouseLeave={(e) => {
          if (plan.featured) {
            e.currentTarget.style.background = "var(--color-accent)";
          } else {
            e.currentTarget.style.background = "transparent";
          }
        }}
      >
        {plan.cta}
      </button>

      <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        {plan.features.map((feat) => (
          <li key={feat.text} style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", fontSize: "0.875rem", color: feat.included ? "var(--color-text-primary)" : "var(--color-text-tertiary)" }}>
            {feat.included ? (
              <Check size={16} color="var(--color-accent)" style={{ flexShrink: 0 }} />
            ) : (
              <X size={16} color="var(--color-text-tertiary)" style={{ flexShrink: 0 }} />
            )}
            {feat.text}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Pricing() {
  const [pricingInterval, setPricingInterval] = useState<"monthly" | "annual">("monthly");
  const { ref, isVisible } = useIntersectionObserver({ threshold: 0.1 });

  return (
    <section id="pricing" ref={ref} className="section-padding" style={{ position: "relative" }}>
      <div className="container">
        <div
          style={{
            textAlign: "center",
            marginBottom: "var(--space-12)",
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? "translateY(0)" : "translateY(24px)",
            transition: "opacity 0.6s ease-out, transform 0.6s ease-out",
          }}
        >
          <h2 style={{ fontSize: "clamp(1.8rem, 3vw, 2.5rem)", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "var(--space-4)", letterSpacing: "-0.02em" }}>
            Simple, transparent pricing
          </h2>
          <p style={{ fontSize: "1.05rem", color: "var(--color-text-secondary)", maxWidth: 520, margin: "0 auto var(--space-8)" }}>
            Choose the plan that fits your needs. No hidden fees, no surprises.
          </p>
          <div className="pricing-toggle"
            style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-3)", padding: "4px", borderRadius: 100, background: "var(--color-bg-surface)", border: "1px solid var(--color-border-subtle)" }}>
            <button onClick={() => setPricingInterval("monthly")}
              style={{ padding: "8px 20px", borderRadius: 100, fontWeight: 600, fontSize: "0.875rem", border: "none", background: pricingInterval === "monthly" ? "var(--color-accent)" : "transparent", color: pricingInterval === "monthly" ? "#ffffff" : "var(--color-text-secondary)", transition: "all 0.3s ease", cursor: "pointer" }}>
              Monthly
            </button>
            <button onClick={() => setPricingInterval("annual")}
              style={{ padding: "8px 20px", borderRadius: 100, fontWeight: 600, fontSize: "0.875rem", border: "none", background: pricingInterval === "annual" ? "var(--color-accent)" : "transparent", color: pricingInterval === "annual" ? "#ffffff" : "var(--color-text-secondary)", transition: "all 0.3s ease", cursor: "pointer" }}>
              Annual <span style={{ opacity: 0.8, fontWeight: 400 }}>— save 20%</span>
            </button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "var(--space-6)", alignItems: "start" }}>
          {plans.map((plan, i) => (
            <PricingCard key={plan.id} plan={plan} interval={pricingInterval} index={i} isVisible={isVisible} />
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          #pricing > .container > div:last-child { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 768px) {
          #pricing > .container > div:last-child { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}
