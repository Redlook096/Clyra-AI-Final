export function ProductPreview() {
  return (
    <section className="section product-preview" id="product">
      <div className="workspace-mock">
        <aside className="mock-chat">
          <span className="tiny-label">Chat</span>
          <div className="user-bubble">Plan the next product launch.</div>
          <div className="thinking-line"><span /> FlowPilot is turning scattered work into a clear project plan.</div>
          <div className="mini-code">
            <div><strong>Launch timeline</strong><em>+82</em></div>
            <pre>{`Milestone: pricing review\nOwner: Maya\nStatus: ready`}</pre>
          </div>
        </aside>
        <main className="mock-main">
          <div className="mock-toolbar">
            <span>projects</span><span>dashboard</span><span>activity</span>
          </div>
          <div className="mock-grid">
            <div className="file-tree">
              <p>Launch plan</p><p>Roadmap</p><p>Automation rules</p><p>Team report</p>
            </div>
            <div className="preview-card">
              <div className="preview-top" />
              <div className="preview-hero" />
              <div className="preview-columns"><span /><span /><span /></div>
            </div>
          </div>
          <div className="terminal">$ workflow synced<br />✓ 18 tasks updated<br />Dashboard ready</div>
        </main>
      </div>
    </section>
  );
}
