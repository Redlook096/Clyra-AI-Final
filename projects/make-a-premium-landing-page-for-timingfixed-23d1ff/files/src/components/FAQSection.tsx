import { useState } from "react";
import { faqs } from "../data/landingContent";
import { SectionHeader } from "./SectionHeader";

export function FAQSection() {
  const [open, setOpen] = useState(0);
  return (
    <section className="section faq" id="faq">
      <SectionHeader
        eyebrow="FAQ"
        title="Built for people who care about the code path."
        copy="Straight answers about how TimingFixed plans, generates, previews, fixes, and saves projects."
      />
      <div className="faq-list">
        {faqs.map(([question, answer], index) => (
          <article className={open === index ? "faq-item open" : "faq-item"} key={question}>
            <button onClick={() => setOpen(open === index ? -1 : index)}>
              <span>{question}</span><strong>{open === index ? "−" : "+"}</strong>
            </button>
            <p>{answer}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
