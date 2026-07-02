import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useIntersectionObserver } from "../hooks/useIntersectionObserver";

const faqs = [
  {
    q: "What is OpenAI Browser?",
    a: "OpenAI Browser is an AI-powered web browser that integrates OpenAI's language models directly into your browsing experience. It features context-aware search, smart tab organisation, a built-in AI assistant, privacy-focused local processing, and cross-device sync.",
  },
  {
    q: "How does the AI-powered search work?",
    a: "Unlike traditional keyword-based search, OpenAI Browser uses semantic understanding to interpret the intent behind your queries. It processes natural language, retrieves contextually relevant results, and can even summarise findings across multiple sources in real time.",
  },
  {
    q: "Is my data private and secure?",
    a: "Yes. Privacy Mode processes AI tasks locally on your device using on-device models. Your browsing data, chat history, and personal information never leave your machine unless you explicitly enable cloud sync. We also offer end-to-end encryption for synced data.",
  },
  {
    q: "Which platforms does it support?",
    a: "OpenAI Browser is available on macOS, Windows, Linux, iOS, and Android. Your tabs, bookmarks, and preferences sync seamlessly across all devices when you sign in with your OpenAI account.",
  },
  {
    q: "Can I use my existing browser extensions?",
    a: "OpenAI Browser supports most Chrome and Firefox extensions natively. Additionally, you can install AI-specific plugins from our Extensions marketplace — tools for code generation, writing assistance, data analysis, and more.",
  },
  {
    q: "Is there a free tier? What does Pro include?",
    a: "Yes! The Free tier includes AI Search, up to 5 smart tab groups, 100 chat queries per day, and basic privacy mode. Pro removes all limits, adds advanced privacy features, cross-device sync, and access to the full AI extensions library. Enterprise adds team management, admin controls, and priority support.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const { ref, isVisible } = useIntersectionObserver({ threshold: 0.1 });

  const toggle = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  return (
    <section id="faq" ref={ref} className="section-padding" style={{ background: "var(--color-bg-surface)" }}>
      <div className="container" style={{ maxWidth: 720 }}>
        <div
          style={{
            textAlign: "center",
            marginBottom: "var(--space-12)",
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? "translateY(0)" : "translateY(24px)",
            transition: "opacity 0.6s ease-out, transform 0.6s ease-out",
          }}
        >
          <h2
            style={{
              fontSize: "clamp(1.8rem, 3vw, 2.5rem)",
              fontWeight: 700,
              color: "var(--color-text-primary)",
              marginBottom: "var(--space-4)",
              letterSpacing: "-0.02em",
            }}
          >
            Frequently asked questions
          </h2>
          <p style={{ fontSize: "1.05rem", color: "var(--color-text-secondary)" }}>
            Everything you need to know about OpenAI Browser.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="faq-item"
              style={{
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--color-border-subtle)",
                background: "var(--color-bg-primary)",
                overflow: "hidden",
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? "translateY(0)" : "translateY(16px)",
                transition: `opacity 0.5s ease-out ${i * 80}ms, transform 0.5s ease-out ${i * 80}ms`,
              }}
            >
              <button
                onClick={() => toggle(i)}
                aria-expanded={openIndex === i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  padding: "var(--space-5) var(--space-6)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                  color: "var(--color-text-primary)",
                  fontWeight: 600,
                  fontSize: "1rem",
                  lineHeight: 1.4,
                  gap: "var(--space-4)",
                }}
              >
                <span>{faq.q}</span>
                <ChevronDown
                  size={20}
                  style={{
                    flexShrink: 0,
                    color: "var(--color-text-secondary)",
                    transition: "transform 0.3s ease",
                    transform: openIndex === i ? "rotate(180deg)" : "rotate(0deg)",
                  }}
                />
              </button>
              <div
                style={{
                  maxHeight: openIndex === i ? 300 : 0,
                  opacity: openIndex === i ? 1 : 0,
                  overflow: "hidden",
                  transition: "max-height 0.3s ease, opacity 0.3s ease, padding 0.3s ease",
                  padding: openIndex === i ? "0 var(--space-6) var(--space-5)" : "0 var(--space-6)",
                }}
              >
                <p
                  style={{
                    fontSize: "0.925rem",
                    color: "var(--color-text-secondary)",
                    lineHeight: 1.7,
                  }}
                >
                  {faq.a}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
