import { useState } from 'react';
import { useScrollReveal } from '../hooks/useScrollReveal';

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: 'How does the AI summarization work?',
    answer: 'OpenAI Browser uses a fine-tuned model that runs locally on your device. When you visit a page, the AI analyzes the content and generates a concise summary in real time, highlighting key points, findings, and conclusions. No data is sent to external servers.',
  },
  {
    question: 'Is my browsing data private?',
    answer: 'Yes. OpenAI Browser is built with a privacy-first architecture. All AI processing happens on-device using our optimized on-device models. Your browsing history, page content, and personal data never leave your machine. We do not log, track, or store your activity.',
  },
  {
    question: 'What platforms are supported?',
    answer: 'OpenAI Browser is available on macOS, Windows, Linux, iOS, and Android. Your data syncs seamlessly across all platforms using end-to-end encryption. Download the desktop app or mobile browser from your platform app store.',
  },
  {
    question: 'Can I use it with existing bookmarks and extensions?',
    answer: 'Yes. OpenAI Browser supports importing bookmarks from all major browsers and is compatible with most Chrome extensions. Our built-in extension manager lets you control permissions and access for each extension.',
  },
  {
    question: 'How does the deep research agent work?',
    answer: 'The deep research agent autonomously navigates multiple pages, cross-references sources, evaluates credibility, and synthesizes findings into a comprehensive report. You can monitor its progress in real time and refine the direction at any point.',
  },
  {
    question: 'Can I cancel my Pro subscription anytime?',
    answer: 'Absolutely. You can cancel your Pro subscription at any time with no penalty. Your Pro features remain active until the end of your current billing period. We will never lock your data — you can export everything before downgrading.',
  },
];

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0 transition-transform duration-300"
      style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function FAQItem({ item, index }: { item: FAQItem; index: number }) {
  const [open, setOpen] = useState(false);
  const ref = useScrollReveal<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className={`reveal reveal-delay-${index + 1}`}
      style={{
        background: '#14151a',
        border: '1px solid #23262d',
        borderRadius: '12px',
        overflow: 'hidden',
        marginBottom: '8px',
      }}
    >
      <button
        className="w-full flex items-center justify-between p-5 text-left bg-transparent border-0 cursor-pointer text-white font-medium transition-colors hover:bg-white hover:bg-opacity-5"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span>{item.question}</span>
        <ChevronIcon open={open} />
      </button>
      <div
        className="faq-answer"
        style={{ ...(open ? { maxHeight: '300px' } : {}) }}
      >
        <p className="px-5 pb-5 text-sm leading-relaxed" style={{ color: '#a1a1aa' }}>
          {item.answer}
        </p>
      </div>
    </div>
  );
}

export default function FAQ() {
  return (
    <section id="faq" className="py-20 sm:py-28">
      <div className="max-w-3xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4 text-white">
            Frequently asked questions
          </h2>
          <p className="text-lg" style={{ color: '#a1a1aa' }}>
            Everything you need to know about OpenAI Browser.
          </p>
        </div>
        <div className="space-y-2">
          {faqs.map((item, index) => (
            <FAQItem key={index} item={item} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
