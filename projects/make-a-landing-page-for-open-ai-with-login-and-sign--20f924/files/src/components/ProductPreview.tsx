export function ProductPreview() {
  return (
    <section className="section product-preview" id="product">
      <div className="workspace-mock">
        <aside className="mock-chat">
          <span className="tiny-label">Chat</span>
          <div className="user-bubble">Build a production SaaS dashboard.</div>
          <div className="thinking-line"><span /> OpenAI is mapping the existing project before writing PLAN.md.</div>
          <div className="mini-code">
            <div><strong>src/components/Hero.tsx</strong><em>+82</em></div>
            <pre>{`export function Hero() {\n  return <section className="hero">...\n}`}</pre>
          </div>
        </aside>
        <main className="mock-main">
          <div className="mock-toolbar">
            <span>files</span><span>preview</span><span>terminal</span>
          </div>
          <div className="mock-grid">
            <div className="file-tree">
              <p>PLAN.md</p><p>src/App.tsx</p><p>components/Pricing.tsx</p><p>styles.css</p>
            </div>
            <div className="preview-card">
              <div className="preview-top" />
              <div className="preview-hero" />
              <div className="preview-columns"><span /><span /><span /></div>
            </div>
          </div>
          <div className="terminal">$ npm run build<br />✓ built in 1.42s<br />Preview ready at localhost</div>
        </main>
      </div>
    </section>
  );
}
