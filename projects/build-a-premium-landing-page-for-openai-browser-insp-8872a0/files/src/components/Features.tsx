import { useScrollReveal } from '../hooks/useScrollReveal';

interface Feature {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  span?: boolean;
}

function ZapIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
      <path d="M11 8v6" />
      <path d="M8 11h6" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function SyncIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  );
}

const features: Feature[] = [
  {
    title: 'Real-Time Summaries',
    description: 'Instantly distill any article, research paper, or documentation into concise, accurate summaries powered by GPT-4o.',
    icon: <ZapIcon />,
    color: '#21c55e',
    span: true,
  },
  {
    title: 'Smart Rewriting',
    description: 'Rewrite selected text in any tone or length — simplify, expand, or translate with one click.',
    icon: <EditIcon />,
    color: '#3b82f6',
  },
  {
    title: 'Source-Aware Citations',
    description: 'Every AI output is grounded in the page you are viewing, with inline citations you can trust and verify.',
    icon: <CheckIcon />,
    color: '#21c55e',
  },
  {
    title: 'One-Click Deep Research',
    description: 'One click launches a multi-page research agent that finds, cross-references, and synthesizes information.',
    icon: <SearchIcon />,
    color: '#3b82f6',
  },
  {
    title: 'Privacy-First Architecture',
    description: 'All AI processing happens on-device. Your browsing data never leaves your machine.',
    icon: <ShieldIcon />,
    color: '#21c55e',
  },
  {
    title: 'Cross-Device Sync',
    description: 'Your bookmarks, history, and AI preferences sync seamlessly across all your devices via end-to-end encryption.',
    icon: <SyncIcon />,
    color: '#3b82f6',
  },
];

function FeatureCard({ feature, index }: { feature: Feature; index: number }) {
  const ref = useScrollReveal<HTMLDivElement>();
  
  return (
    <div
      ref={ref}
      className={`bento-card reveal reveal-delay-${index + 1} ${feature.span ? 'span-2' : ''}`}
    >
      <div className="card-glow" />
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
        style={{ background: `${feature.color}1a` }}
      >
        <span style={{ color: feature.color }}>{feature.icon}</span>
      </div>
      <h3 className="text-lg font-bold mb-2 text-white">{feature.title}</h3>
      <p className="text-sm" style={{ color: '#a1a1aa' }}>{feature.description}</p>
    </div>
  );
}

export default function Features() {
  return (
    <section id="features" className="py-20 sm:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4 text-white">Built for the way you think</h2>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: '#a1a1aa' }}>
            Six powerful capabilities that transform how you interact with the web.
          </p>
        </div>
        <div className="bento-grid">
          {features.map((feature, index) => (
            <FeatureCard key={feature.title} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
