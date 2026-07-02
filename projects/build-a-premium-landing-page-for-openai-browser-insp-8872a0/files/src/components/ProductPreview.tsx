export default function ProductPreview() {
  return (
    <section id="preview" className="py-20 sm:py-28">
      <div className="max-w-5xl mx-auto px-4">
        <div className="browser-mockup">
          {/* Title bar with traffic light dots */}
          <div className="titlebar">
            <div className="dot" style={{ background: '#ff5f57' }} />
            <div className="dot" style={{ background: '#febc2e' }} />
            <div className="dot" style={{ background: '#28c840' }} />
            <div className="urlbar">https://arxiv.org/abs/2405.12345</div>
          </div>

          {/* Browser content */}
          <div className="grid grid-cols-1 lg:grid-cols-3">
            {/* Main content area */}
            <div className="lg:col-span-2 p-6 border-r border-[#23262d]">
              <div className="flex items-center gap-2 mb-4">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                <span className="text-xs font-medium" style={{ color: '#a1a1aa', fontFamily: "'JetBrains Mono', monospace" }}>
                  research-paper-v2.pdf
                </span>
              </div>
              <h3 className="text-lg font-bold mb-3 text-white">Large Language Models as Browser Agents</h3>
              <p className="text-sm leading-relaxed" style={{ color: '#a1a1aa' }}>
                We present a novel approach to web browsing using large language models that can understand, navigate, and interact with web pages through natural language instructions. Our model achieves state-of-the-art performance on the WebArena benchmark, demonstrating significant improvements in task completion rate and efficiency.
              </p>
              <div className="mt-4 pt-4 border-t border-[#23262d]">
                <div className="flex items-center gap-4 text-xs" style={{ color: '#a1a1aa' }}>
                  <span>Authors: Wang et al.</span>
                  <span>Date: May 2025</span>
                  <span>Citations: 142</span>
                </div>
              </div>
            </div>

            {/* AI reasoning panel */}
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2 h-2 rounded-full animate-ping" style={{ background: '#21c55e' }} />
                <span className="text-xs font-semibold" style={{ color: '#21c55e' }}>AI Reasoning Panel</span>
              </div>
              <div className="space-y-4">
                <div className="p-3 rounded-lg" style={{ background: 'rgba(33,197,94,0.05)', border: '1px solid rgba(33,197,94,0.15)' }}>
                  <p className="text-xs font-semibold mb-1 text-white">Summary</p>
                  <p className="text-xs leading-relaxed" style={{ color: '#a1a1aa' }}>This paper introduces a browser-agent framework using fine-tuned LLMs that can navigate web interfaces autonomously through natural language commands.</p>
                </div>
                <div className="p-3 rounded-lg" style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.15)' }}>
                  <p className="text-xs font-semibold mb-1 text-white">Key Insight</p>
                  <p className="text-xs leading-relaxed" style={{ color: '#a1a1aa' }}>Chain-of-thought reasoning combined with visual grounding yields 34% better task completion compared to baseline methods.</p>
                </div>
                <div className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid #23262d' }}>
                  <p className="text-xs font-semibold mb-1 text-white">Citation</p>
                  <p className="text-xs leading-relaxed" style={{ color: '#a1a1aa' }}>Wang, T., et al. (2025). Large Language Models as Browser Agents. arXiv:2405.12345.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
