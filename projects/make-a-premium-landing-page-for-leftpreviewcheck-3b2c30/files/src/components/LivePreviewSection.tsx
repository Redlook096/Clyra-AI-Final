import { SectionHeader } from "./SectionHeader";

export function LivePreviewSection() {
  return (
    <section className="section split" id="preview">
      <SectionHeader
        eyebrow="Live preview"
        title="See the running app, not an explanation of the app."
        copy="LeftPreviewCheck starts a real preview server, refreshes after safe changes, and reports runtime errors honestly."
      />
      <div className="browser-mock">
        <div className="browser-bar">
          <span>←</span><span>↻</span><strong>localhost:5174</strong><em>Desktop</em><em>Mobile</em>
        </div>
        <div className="browser-canvas">
          <div className="ready-pill">Preview ready</div>
          <div className="site-skeleton" />
          <div className="error-overlay">Runtime errors appear here with a fix action.</div>
        </div>
      </div>
    </section>
  );
}
