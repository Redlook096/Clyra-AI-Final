import { useScrollReveal } from '../hooks/useScrollReveal';

interface HeroProps {
  onOpenAuth: () => void;
}

export default function Hero({ onOpenAuth }: HeroProps) {
  const revealRef = useScrollReveal<HTMLDivElement>();

  const handleScrollTo = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const target = document.querySelector(href);
    if (target) {
      const top = target.getBoundingClientRect().top + window.pageYOffset - 80;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  return (
    <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background glows */}
      <div className="hero-glow animate-glow-pulse" style={{ top: '10%', left: '50%', transform: 'translateX(-50%)' }} />
      <div className="hero-glow" style={{ bottom: '20%', right: '-10%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(33,197,94,0.1) 0%, transparent 70%)' }} />

      <div ref={revealRef} className="relative z-10 max-w-5xl mx-auto px-4 text-center">
        {/* Badge */}
        <div className="animate-fade-in inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#23262d] bg-[#14151a] mb-8">
          <span className="w-2 h-2 rounded-full" style={{ background: '#21c55e' }} />
          <span className="text-xs font-medium" style={{ color: '#a1a1aa' }}>Introducing OpenAI Browser</span>
        </div>

        {/* Headline */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold leading-tight mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          The browser that<br />
          <span style={{ color: '#21c55e' }}>thinks with you.</span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg sm:text-xl max-w-2xl mx-auto mb-10 animate-fade-in-up" style={{ animationDelay: '0.2s', color: '#a1a1aa' }}>
          An AI-native browser that summarizes, rewrites, researches, and reasons alongside your browsing.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <button
            onClick={onOpenAuth}
            className="text-white font-semibold px-8 py-3.5 rounded-full text-base border-0 cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_0_24px_rgba(33,197,94,0.25)]"
            style={{ background: '#21c55e' }}
          >
            Start browsing free
          </button>
          <a
            href="#features"
            onClick={(e) => handleScrollTo(e, '#features')}
            className="text-white font-medium px-8 py-3.5 rounded-full text-base no-underline transition-all duration-200 hover:border-gray-500"
            style={{ border: '1px solid #23262d', background: '#14151a' }}
          >
            See how it works
          </a>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 animate-scroll-indicator">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 13l5 5 5-5" />
          <path d="M7 6l5 5 5-5" />
        </svg>
      </div>
    </section>
  );
}
