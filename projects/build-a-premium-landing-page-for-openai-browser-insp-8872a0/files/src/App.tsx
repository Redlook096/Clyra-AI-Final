import { useState, useCallback } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ProductPreview from './components/ProductPreview';
import Features from './components/Features';
import Pricing from './components/Pricing';
import FAQ from './components/FAQ';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';
import './index.css';

export default function App() {
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'signup'>('login');

  const handleOpenAuth = useCallback((tab?: 'login' | 'signup') => {
    if (tab) setAuthTab(tab);
    setAuthOpen(true);
  }, []);

  const handleCloseAuth = useCallback(() => {
    setAuthOpen(false);
  }, []);

  return (
    <div className="min-h-screen">
      <Navbar onOpenAuth={handleOpenAuth} />
      <main>
        <Hero onOpenAuth={() => handleOpenAuth()} />
        <ProductPreview />
        <Features />
        <Pricing onOpenAuth={() => handleOpenAuth()} />
        <FAQ />
      </main>
      <Footer />
      <AuthModal isOpen={authOpen} onClose={handleCloseAuth} initialTab={authTab} />
    </div>
  );
}
