import { SectionHeader } from "./SectionHeader";

const planSteps = ["Request interpretation", "Existing project scan", "Proposed file tree", "Task graph", "Validation gates"];

export function PlanModeSection() {
  return (
    <section className="section split" id="plan-mode">
      <SectionHeader
        eyebrow="Plan Mode"
        title="Review the architecture before the first file changes."
        copy="OpenAI writes a detailed PLAN.md with exact file targets, dependencies, validation, preview checks, rollback, and final review criteria."
      />
      <div className="plan-doc">
        <p className="doc-title">PLAN.md</p>
        {planSteps.map((step, index) => (
          <div className="plan-row" key={step}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{step}</strong>
          </div>
        ))}
        <div className="validation-list">
          <p>Validation checklist</p>
          <span>TypeScript check</span>
          <span>Build check</span>
          <span>Preview health</span>
        </div>
      </div>
    </section>
  );
}
