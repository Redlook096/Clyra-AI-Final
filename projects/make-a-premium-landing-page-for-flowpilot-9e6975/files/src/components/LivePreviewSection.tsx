import { SectionHeader } from "./SectionHeader";

export function LivePreviewSection() {
  return (
    <section className="section split" id="preview">
      <SectionHeader
        eyebrow="Live dashboard"
        title="See the live team picture, not another scattered status doc."
        copy="FlowPilot keeps your project dashboard current, highlights blockers, and makes next steps obvious."
      />
      <div className="browser-mock">
        <div className="browser-bar">
          <span>←</span><span>↻</span><strong>flowpilot.app</strong><em>Desktop</em><em>Mobile</em>
        </div>
        <div className="browser-canvas">
          <div className="ready-pill">Preview ready</div>
          <div className="site-skeleton" />
          <div className="error-overlay">Blockers appear here with owner, context, and next action.</div>
        </div>
      </div>
    </section>
  );
}
