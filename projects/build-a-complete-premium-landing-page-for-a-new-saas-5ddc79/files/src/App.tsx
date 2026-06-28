import { AssignGenerationSection } from "./components/AssignGenerationSection";
import { FAQSection } from "./components/FAQSection";
import { FeatureGrid } from "./components/FeatureGrid";
import { Footer } from "./components/Footer";
import { HeroSection } from "./components/HeroSection";
import { LiveTrackSection } from "./components/LiveTrackSection";
import { PlanModeSection } from "./components/PlanModeSection";
import { PricingSection } from "./components/PricingSection";
import { ProductTrack } from "./components/ProductTrack";
import { WorkflowSection } from "./components/WorkflowSection";
import { AuthSection } from "./components/AuthSection";

export default function App() {
  return (
    <main>
      <HeroSection />
      <ProductTrack />
      <PlanModeSection />
      <AssignGenerationSection />
      <LiveTrackSection />
      <FeatureGrid />
      <WorkflowSection />
      <AuthSection />
      <PricingSection />
      <FAQSection />
      <section className="final-cta">
        <p className="eyebrow">Ready when the plan is clear</p>
        <h2>Build like your AI agent has a real engineering process.</h2>
        <a className="button primary" href="mailto:hello@flowpilot.example?subject=Start%20FlowPilot">Start free with FlowPilot</a>
      </section>
      <Footer />
    </main>
  );
}
