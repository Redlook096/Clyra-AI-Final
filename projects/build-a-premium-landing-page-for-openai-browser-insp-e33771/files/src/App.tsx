import { useState } from "react";
import { useTheme } from "./hooks/useTheme";
import Navbar from "./components/Navbar";
import MobileNav from "./components/MobileNav";
import Hero from "./components/Hero";
import ProductPreview from "./components/ProductPreview";
import Features from "./components/Features";
import Pricing from "./components/Pricing";
import FAQ from "./components/FAQ";
import Footer from "./components/Footer";
import AuthModal from "./components/AuthModal";

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-bg-primary)", color: "var(--color-text-primary)" }}>
      <Navbar
        theme={theme}
        toggleTheme={toggleTheme}
        mobileNavOpen={mobileNavOpen}
        setMobileNavOpen={setMobileNavOpen}
        onGetStarted={() => setAuthModalOpen(true)}
      />
      <MobileNav
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        onGetStarted={() => setAuthModalOpen(true)}
      />
      <main>
        <Hero onGetStarted={() => setAuthModalOpen(true)} />
        <ProductPreview />
        <Features />
        <Pricing />
        <FAQ />
        <Footer />
      </main>
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </div>
  );
}
