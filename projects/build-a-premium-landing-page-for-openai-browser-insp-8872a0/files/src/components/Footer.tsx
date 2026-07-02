export default function Footer() {
  return (
    <footer className="border-t py-16" style={{ borderColor: '#23262d', background: 'rgba(20,21,26,0.5)' }}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <svg width="22" height="22" viewBox="0 0 28 28" fill="none" aria-hidden="true">
                <rect x="2" y="2" width="24" height="24" rx="8" stroke="#21c55e" strokeWidth="2.5" fill="none" />
                <path d="M9 14l3.5 3.5L19 10.5" stroke="#21c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="font-bold text-white">OpenAI Browser</span>
            </div>
            <p className="text-sm leading-relaxed max-w-xs" style={{ color: '#a1a1aa' }}>
              The AI-native browser that thinks alongside you. Summarize, rewrite, research, and reason — all while keeping your data private.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold text-sm mb-4 text-white">Product</h4>
            <ul className="space-y-3" style={{ listStyle: 'none' }}>
              {['Features', 'Pricing', 'Changelog', 'Documentation'].map((item) => (
                <li key={item}>
                  <a
                    href={item === 'Features' ? '#features' : item === 'Pricing' ? '#pricing' : '#'}
                    className="text-sm no-underline transition-colors hover:text-white"
                    style={{ color: '#a1a1aa' }}
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-sm mb-4 text-white">Company</h4>
            <ul className="space-y-3" style={{ listStyle: 'none' }}>
              {['About', 'Blog', 'Privacy Policy', 'Terms of Service', 'Contact'].map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    className="text-sm no-underline transition-colors hover:text-white"
                    style={{ color: '#a1a1aa' }}
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4" style={{ borderColor: '#23262d' }}>
          <p className="text-sm" style={{ color: '#a1a1aa' }}>&copy; 2025 OpenAI Browser. All rights reserved.</p>
          <div className="flex items-center gap-4">
            {/* Twitter/X icon */}
            <a href="#" className="transition-colors hover:text-white" style={{ color: '#a1a1aa' }} aria-label="Twitter">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
              </svg>
            </a>
            {/* GitHub icon */}
            <a href="#" className="transition-colors hover:text-white" style={{ color: '#a1a1aa' }} aria-label="GitHub">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
