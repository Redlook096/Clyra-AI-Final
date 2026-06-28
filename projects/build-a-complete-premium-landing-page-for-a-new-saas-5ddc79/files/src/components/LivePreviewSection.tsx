import { SectionHeader } from "./SectionHeader";

export function LiveTrackSection() {
  return (
    <section className="section split" id="preview">
      <SectionHeader
        eyebrow="Live dashboard"
        title="See the live team picture, not another scattered status doc."
        copy="FlowPilot keeps your project dashboard current, highlights blockers, and makes next steps obvious."
      />
      <div className="browser-mock">
        <div className="browser-bar">
          <span>←</span><span>↻</span><strong>localhost:5174</strong><em>Desktop</em><em>Mobile</em>
        </div>
        <div className="browser-canvas">
          <div className="ready-pill">Track ready</div>
          <div className="site-skeleton" />
          <div className="error-overlay">Runtime errors appear here with a fix action.</div>
        </div>
      </div>
    </section>
  );
}
