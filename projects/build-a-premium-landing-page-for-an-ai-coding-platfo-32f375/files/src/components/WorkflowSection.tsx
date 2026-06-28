import { workflow } from "../data/landingContent";
import { SectionHeader } from "./SectionHeader";

export function WorkflowSection() {
  return (
    <section className="section" id="workflow">
      <SectionHeader
        eyebrow="Workflow"
        title="Prompt → Plan → Code → Check → Preview → Ship"
        copy="The workflow is calm and visible, so users can see progress without losing control of the build."
      />
      <div className="workflow">
        {workflow.map(([title, copy], index) => (
          <article key={title}>
            <span>{index + 1}</span>
            <h3>{title}</h3>
            <p>{copy}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
