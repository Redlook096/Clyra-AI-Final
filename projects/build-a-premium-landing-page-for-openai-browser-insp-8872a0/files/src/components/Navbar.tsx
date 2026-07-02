import { useState, useEffect } from 'react';

interface NavbarProps {
  onOpenAuth: (tab?: 'login' | 'signup') => void;
}

export default function Navbar({ onOpenAuth }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 60);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [mobileMenuOpen]);

  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'FAQ', href: '#faq' },
  ];

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const target = document.querySelector(href);
    if (target) {
      const offset = 80;
      const top = target.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  return (
    <>
      <nav
        id="navbar"
        className={`navbar ${scrolled ? 'scrolled' : ''}`}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex items-center justify-between h-16 md:h-20">
            <a href="#" className="flex items-center gap-2 text-white font-bold text-lg no-underline" aria-label="OpenAI Browser home">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
                <rect x="2" y="2" width="24" height="24" rx="8" stroke="#21c55e" strokeWidth="2.5" fill="none" />
                <path d="M9 14l3.5 3.5L19 10.5" stroke="#21c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>OpenAI Browser</span>
            </a>

            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className="text-[#a1a1aa] hover:text-white text-sm font-medium transition-colors no-underline"
                >
                  {link.label}
                </a>
              ))}
              <button
                onClick={() => onOpenAuth('login')}
                className="text-[#a1a1aa] hover:text-white text-sm font-medium bg-transparent border-0 cursor-pointer"
              >
                Sign In
              </button>
              <button
                onClick={() => onOpenAuth()}
                className="text-white text-sm font-semibold px-5 py-2.5 rounded-full border-0 cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(33,197,94,0.2)]"
                style={{ background: '#21c55e' }}
              >
                Get Started
              </button>
            </div>

            <button
              id="hamburger"
              className="md:hidden flex flex-col gap-1.5 bg-transparent border-0 cursor-pointer p-1"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              <span className="block w-6 h-0.5 bg-white rounded transition-all"></span>
              <span className="block w-6 h-0.5 bg-white rounded transition-all"></span>
              <span className="block w-6 h-0.5 bg-white rounded transition-all"></span>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      <div
        className={`mobile-menu-overlay ${mobileMenuOpen ? 'active' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
      />

      {/* Mobile menu panel */}
      <div
        className={`mobile-menu-panel ${mobileMenuOpen ? 'active' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation"
      >
        <div className="flex items-center justify-between mb-6">
          <span className="font-bold text-white">Menu</span>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="bg-transparent border-0 cursor-pointer text-[#a1a1aa] hover:text-white"
            aria-label="Close menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18" /><path d="M6 6l12 12" />
            </svg>
          </button>
        </div>

        {navLinks.map((link) => (
          <a
            key={link.href}
            href={link.href}
            onClick={(e) => handleNavClick(e, link.href)}
            className="text-[#a1a1aa] hover:text-white text-sm font-medium py-3 px-3 rounded-xl no-underline transition-colors hover:bg-white hover:bg-opacity-5"
          >
            {link.label}
          </a>
        ))}

        <button
          onClick={() => { setMobileMenuOpen(false); onOpenAuth('login'); }}
          className="text-[#a1a1aa] hover:text-white text-sm font-medium py-3 px-3 rounded-xl text-left bg-transparent border-0 cursor-pointer transition-colors hover:bg-white hover:bg-opacity-5"
        >
          Sign In
        </button>

        <button
          onClick={() => { setMobileMenuOpen(false); onOpenAuth(); }}
          className="text-white text-sm font-semibold py-3 px-3 rounded-xl border-0 cursor-pointer text-center transition-all hover:brightness-110 mt-2"
          style={{ background: '#21c55e' }}
        >
          Get Started
        </button>
      </div>
    </>
  );
}
