import { CodeGenerationSection } from "./components/CodeGenerationSection";
import { FAQSection } from "./components/FAQSection";
import { FeatureGrid } from "./components/FeatureGrid";
import { Footer } from "./components/Footer";
import { HeroSection } from "./components/HeroSection";
import { LivePreviewSection } from "./components/LivePreviewSection";
import { PlanModeSection } from "./components/PlanModeSection";
import { PricingSection } from "./components/PricingSection";
import { ProductPreview } from "./components/ProductPreview";
import { WorkflowSection } from "./components/WorkflowSection";
import { AuthSection } from "./components/AuthSection";

export default function App() {
  return (
    <main>
      <HeroSection />
      <ProductPreview />
      <PlanModeSection />
      <CodeGenerationSection />
      <LivePreviewSection />
      <FeatureGrid />
      <WorkflowSection />
      <AuthSection />
      <PricingSection />
      <FAQSection />
      <section className="final-cta">
        <p className="eyebrow">Ready when the plan is clear</p>
        <h2>Build like your AI agent has a real engineering process.</h2>
        <a className="button primary" href="mailto:hello@timingfixed.example?subject=Start%20TimingFixed">Start building with TimingFixed</a>
      </section>
      <Footer />
    </main>
  );
}
