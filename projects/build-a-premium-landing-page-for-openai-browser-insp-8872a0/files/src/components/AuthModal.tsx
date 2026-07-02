import { useState, useEffect, useCallback } from 'react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'login' | 'signup';
}

export default function AuthModal({ isOpen, onClose, initialTab = 'login' }: AuthModalProps) {
  const [tab, setTab] = useState<'login' | 'signup'>(initialTab);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab, isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleEsc = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      // Focus first input when modal opens
      setTimeout(() => {
        const input = document.querySelector<HTMLInputElement>(
          tab === 'login' ? '#login-email' : '#signup-email'
        );
        input?.focus();
      }, 350);
    }
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, tab, handleEsc]);

  return (
    <div
      className={"`auth-overlay ${isOpen ? 'active' : ''}`"}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Sign in or sign up"
    >
      <div className="auth-modal">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex gap-6 relative">
            <button
              className={"`tab-btn ${tab === 'login' ? 'active' : ''}`"}
              onClick={() => setTab('login')}
            >
              Sign In
            </button>
            <button
              className={"`tab-btn ${tab === 'signup' ? 'active' : ''}`"}
              onClick={() => setTab('signup')}
            >
              Sign Up
            </button>
          </div>
          <button onClick={onClose} className="bg-transparent border-0 cursor-pointer text-[#a1a1aa] hover:text-white" aria-label="Close modal">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18" /><path d="M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Login form */}
        <form
          id="auth-login-form"
          onSubmit={(e) => e.preventDefault()}
          style={{ display: tab === 'login' ? 'block' : 'none' }}
        >
          <div className="space-y-4">
            <div>
              <label htmlFor="login-email" className="text-sm block mb-1.5" style={{ color: '#a1a1aa' }}>Email</label>
              <input
                id="login-email"
                type="email"
                placeholder="you@example.com"
                className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-colors"
                style={{
                  background: 'rgba(11,11,15,0.6)',
                  border: '1px solid #23262d',
                  color: 'white',
                }}
              />
            </div>
            <div>
              <label htmlFor="login-password" className="text-sm block mb-1.5" style={{ color: '#a1a1aa' }}>Password</label>
              <input
                id="login-password"
                type="password"
                placeholder="Enter your password"
                className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-colors"
                style={{
                  background: 'rgba(11,11,15,0.6)',
                  border: '1px solid #23262d',
                  color: 'white',
                }}
              />
            </div>
            <button
              type="submit"
              className="w-full text-white font-semibold py-3 rounded-xl border-0 cursor-pointer transition-all hover:brightness-110"
              style={{ background: '#21c55e' }}
            >
              Sign In
            </button>
          </div>
        </form>

        {/* Signup form */}
        <form
          id="auth-signup-form"
          onSubmit={(e) => e.preventDefault()}
          style={{ display: tab === 'signup' ? 'block' : 'none' }}
        >
          <div className="space-y-4">
            <div>
              <label htmlFor="signup-email" className="text-sm block mb-1.5" style={{ color: '#a1a1aa' }}>Email</label>
              <input
                id="signup-email"
                type="email"
                placeholder="you@example.com"
                className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-colors"
                style={{
                  background: 'rgba(11,11,15,0.6)',
                  border: '1px solid #23262d',
                  color: 'white',
                }}
              />
            </div>
            <div>
              <label htmlFor="signup-password" className="text-sm block mb-1.5" style={{ color: '#a1a1aa' }}>Password</label>
              <input
                id="signup-password"
                type="password"
                placeholder="Create a password"
                className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-colors"
                style={{
                  background: 'rgba(11,11,15,0.6)',
                  border: '1px solid #23262d',
                  color: 'white',
                }}
              />
            </div>
            <button
              type="submit"
              className="w-full text-white font-semibold py-3 rounded-xl border-0 cursor-pointer transition-all hover:brightness-110"
              style={{ background: '#21c55e' }}
            >
              Create Account
            </button>
          </div>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <span className="flex-1 h-px" style={{ background: '#23262d' }} />
          <span className="text-xs" style={{ color: '#a1a1aa' }}>or continue with</span>
          <span className="flex-1 h-px" style={{ background: '#23262d' }} />
        </div>

        {/* Social buttons */}
        <div className="flex gap-3">
          <button className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 cursor-pointer transition-all" style={{ border: '1px solid #23262d', background: 'transparent' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            <span className="text-sm font-medium text-white">Google</span>
          </button>
          <button className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 cursor-pointer transition-all" style={{ border: '1px solid #23262d', background: 'transparent' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.62 6.04.52 7.21-.62 1.64-1.43 3.26-2.57 4zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" fill="#a1a1aa" />
            </svg>
            <span className="text-sm font-medium text-white">Apple</span>
          </button>
        </div>
      </div>
    </div>
  );
}
