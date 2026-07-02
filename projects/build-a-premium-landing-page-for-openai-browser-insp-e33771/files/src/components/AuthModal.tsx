import { useState, useEffect, useRef } from "react";
import { X, Mail, Lock, Eye, EyeOff } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AuthTab = "signin" | "signup";

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [tab, setTab] = useState<AuthTab>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    setTimeout(() => firstInputRef.current?.focus(), 100);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="auth-backdrop" onClick={handleBackdropClick}
      role="dialog" aria-modal="true" aria-label="Authentication"
      style={{ position: "fixed", inset: 0, zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: "var(--space-6)", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", animation: "fadeIn 0.2s ease-out" }}
    >
      <div className="auth-modal"
        style={{ width: "100%", maxWidth: 420, borderRadius: "var(--radius-lg)", background: "var(--color-bg-primary)", border: "1px solid var(--color-border-strong)", boxShadow: "var(--shadow-lg)", animation: "scaleIn 0.25s ease-out", overflow: "hidden" }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "var(--space-6) var(--space-6) 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <svg width="24" height="24" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="8" fill="#10A37F" /><text x="16" y="22" fontSize="18" textAnchor="middle" fill="white" fontFamily="system-ui" fontWeight="bold">O</text></svg>
            <span style={{ fontWeight: 600, fontSize: "1rem", color: "var(--color-text-primary)" }}>OpenAI Browser</span>
          </div>
          <button onClick={onClose} aria-label="Close authentication modal"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: "var(--radius-sm)", color: "var(--color-text-secondary)", border: "none", cursor: "pointer", background: "none" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-bg-elevated)"; e.currentTarget.style.color = "var(--color-text-primary)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--color-text-secondary)"; }}
          >
            <X size={18} />
          </button>
        </div>

        <div role="tablist"
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0, margin: "var(--space-5) var(--space-6) 0", borderRadius: "var(--radius-sm)", background: "var(--color-bg-surface)", border: "1px solid var(--color-border-subtle)", overflow: "hidden" }}
        >
          <button role="tab" aria-selected={tab === "signin"} onClick={() => setTab("signin")}
            style={{ padding: "10px 16px", border: "none", fontWeight: 600, fontSize: "0.875rem", cursor: "pointer", background: tab === "signin" ? "var(--color-accent)" : "transparent", color: tab === "signin" ? "#ffffff" : "var(--color-text-secondary)" }}
          >Sign In</button>
          <button role="tab" aria-selected={tab === "signup"} onClick={() => setTab("signup")}
            style={{ padding: "10px 16px", border: "none", fontWeight: 600, fontSize: "0.875rem", cursor: "pointer", background: tab === "signup" ? "var(--color-accent)" : "transparent", color: tab === "signup" ? "#ffffff" : "var(--color-text-secondary)" }}
          >Sign Up</button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: "var(--space-6)" }}>
          {tab === "signup" && (
            <div style={{ marginBottom: "var(--space-4)" }}>
              <label htmlFor="auth-name" style={{ display: "block", marginBottom: "var(--space-2)", fontSize: "0.85rem", fontWeight: 600, color: "var(--color-text-primary)" }}>Full Name</label>
              <input id="auth-name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" required
                style={{ width: "100%", padding: "12px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border-subtle)", background: "var(--color-bg-surface)", color: "var(--color-text-primary)", fontSize: "0.925rem", outline: "none" }}
                onFocus={(e) => (e.target.style.borderColor = "var(--color-accent)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--color-border-subtle)")}
              />
            </div>
          )}
          <div style={{ marginBottom: "var(--space-4)" }}>
            <label htmlFor="auth-email" style={{ display: "block", marginBottom: "var(--space-2)", fontSize: "0.85rem", fontWeight: 600, color: "var(--color-text-primary)" }}>Email Address</label>
            <div style={{ position: "relative" }}>
              <Mail size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-tertiary)", pointerEvents: "none" }} />
              <input id="auth-email" ref={firstInputRef} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required
                style={{ width: "100%", padding: "12px 14px 12px 40px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border-subtle)", background: "var(--color-bg-surface)", color: "var(--color-text-primary)", fontSize: "0.925rem", outline: "none" }}
                onFocus={(e) => (e.target.style.borderColor = "var(--color-accent)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--color-border-subtle)")}
              />
            </div>
          </div>
          <div style={{ marginBottom: "var(--space-6)" }}>
            <label htmlFor="auth-password" style={{ display: "block", marginBottom: "var(--space-2)", fontSize: "0.85rem", fontWeight: 600, color: "var(--color-text-primary)" }}>Password</label>
            <div style={{ position: "relative" }}>
              <Lock size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-tertiary)", pointerEvents: "none" }} />
              <input id="auth-password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={tab === "signin" ? "Enter your password" : "Create a strong password"} required minLength={8}
                style={{ width: "100%", padding: "12px 40px 12px 40px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border-subtle)", background: "var(--color-bg-surface)", color: "var(--color-text-primary)", fontSize: "0.925rem", outline: "none" }}
                onFocus={(e) => (e.target.style.borderColor = "var(--color-accent)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--color-border-subtle)")}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"}
                style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-tertiary)", border: "none", background: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <button type="submit"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", padding: "12px 24px", borderRadius: "var(--radius-sm)", background: "var(--color-accent)", color: "#ffffff", fontWeight: 600, fontSize: "0.9rem", border: "none", cursor: "pointer" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-accent-hover)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "var(--color-accent)")}
          >
            {tab === "signin" ? "Sign In" : "Create Account"}
          </button>
        </form>
      </div>
    </div>
  );
}
