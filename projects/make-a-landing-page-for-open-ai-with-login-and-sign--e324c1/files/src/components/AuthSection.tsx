import { useState, type FormEvent } from "react";
import { SectionHeader } from "./SectionHeader";

type AuthMode = "signin" | "signup" | "forgot";

export function AuthSection() {
  const [mode, setMode] = useState<AuthMode>("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");

  const isSignup = mode === "signup";
  const isForgot = mode === "forgot";

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!email.includes("@")) {
      setStatus("Enter a valid email to continue.");
      return;
    }
    if (!isForgot && password.length < 8) {
      setStatus("Password must be at least 8 characters.");
      return;
    }
    setStatus(isForgot ? "Reset link ready to send." : isSignup ? "Demo account created." : "Signed in with demo state.");
  }

  return (
    <section className="section auth-section" id="auth">
      <SectionHeader
        eyebrow="Account flow"
        title="Sign in, sign up, and recover access without leaving the page."
        copy="A polished front-end auth flow gives the landing page a complete SaaS feel while staying honest about demo-only state."
      />
      <div className="auth-card">
        <div className="auth-tabs" aria-label="Authentication mode">
          <button className={mode === "signin" ? "active" : ""} onClick={() => setMode("signin")}>Sign in</button>
          <button className={mode === "signup" ? "active" : ""} onClick={() => setMode("signup")}>Sign up</button>
          <button className={mode === "forgot" ? "active" : ""} onClick={() => setMode("forgot")}>Recover</button>
        </div>
        <form onSubmit={submit} className="auth-form">
          <label>
            Work email
            <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" />
          </label>
          {!isForgot && (
            <label>
              Password
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="8+ characters" />
            </label>
          )}
          <button className="button primary" type="submit">
            {isForgot ? "Prepare reset link" : isSignup ? "Create demo account" : "Sign in"}
          </button>
          <p className="auth-status" role="status">{status || "Demo UI only. Connect your auth provider when backend accounts are ready."}</p>
        </form>
      </div>
    </section>
  );
}
