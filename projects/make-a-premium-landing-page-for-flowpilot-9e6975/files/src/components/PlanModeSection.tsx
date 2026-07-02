import { SectionHeader } from "./SectionHeader";

const planSteps = ["Goal interpretation", "Workspace scan", "Proposed project map", "Task graph", "Validation gates"];

export function PlanModeSection() {
  return (
    <section className="section split" id="plan-mode">
      <SectionHeader
        eyebrow="Planning"
        title="Review the architecture before the first workflow updates."
        copy="FlowPilot writes a detailed PLAN.md with milestones, owners, dependencies, automation rules, risk checks, and launch review criteria."
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
          <span>Timeline check</span>
          <span>Automation check</span>
          <span>Dashboard health</span>
        </div>
      </div>
    </section>
  );
}
