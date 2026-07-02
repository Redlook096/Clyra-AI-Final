import { useState } from 'react';
import { useScrollReveal } from '../hooks/useScrollReveal';

interface PricingProps {
  onOpenAuth: () => void;
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#21c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export default function Pricing({ onOpenAuth }: PricingProps) {
  const [yearly, setYearly] = useState(false);
  const headerRef = useScrollReveal<HTMLDivElement>();
  const freeCardRef = useScrollReveal<HTMLDivElement>();
  const proCardRef = useScrollReveal<HTMLDivElement>();

  const plans = [
    {
      name: 'Free',
      description: 'Perfect for getting started',
      monthlyPrice: '$0',
      yearlyPrice: '$0',
      monthlyPeriod: '/month',
      yearlyPeriod: '/year',
      features: [
        'Up to 50 summaries per day',
        'Basic rewriting mode',
        '1 device',
        'Standard support',
      ],
      featured: false,
    },
    {
      name: 'Pro',
      description: 'For power users and professionals',
      monthlyPrice: '$20',
      yearlyPrice: '$190',
      monthlyPeriod: '/month',
      yearlyPeriod: '/year',
      features: [
        'Unlimited summaries',
        'Advanced rewriting with tone control',
        'Up to 5 devices',
        'Priority support',
        'Early access to new features',
        'Deep research agent (100 queries/mo)',
      ],
      featured: true,
      badge: 'Most popular',
    },
  ];

  return (
    <section id="pricing" className="py-20 sm:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div ref={headerRef} className="text-center mb-12 reveal">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4 text-white">
            Simple, transparent pricing
          </h2>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: '#a1a1aa' }}>
            Start free, upgrade when you need more.
          </p>
        </div>

        {/* Toggle */}
        <div className="flex items-center justify-center gap-3 mb-12">
          <span
            className={`text-sm font-medium transition-colors duration-300 ${!yearly ? 'text-white' : 'text-[#a1a1aa]'}`}
          >
            Monthly
          </span>
          <button
            className={`toggle-track ${yearly ? 'active' : ''}`}
            onClick={() => setYearly(!yearly)}
            role="switch"
            aria-checked={yearly}
            aria-label="Toggle yearly pricing"
          />
          <span
            className={`text-sm font-medium transition-colors duration-300 ${yearly ? 'text-white' : 'text-[#a1a1aa]'}`}
          >
            Yearly
          </span>
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ background: 'rgba(33,197,94,0.1)', color: '#21c55e', display: yearly ? 'inline-flex' : 'none' }}
          >
            Save 20%
          </span>
        </div>

        {/* Cards */}
        <div className="pricing-grid">
          {plans.map((plan, index) => (
            <div
              key={plan.name}
              ref={index === 0 ? freeCardRef : proCardRef}
              className={`relative p-8 rounded-2xl text-left reveal reveal-delay-${index + 1} ${
                plan.featured
                  ? 'border'
                  : 'border'
              }`}
              style={{
                background: '#14151a',
                borderColor: plan.featured ? 'rgba(33,197,94,0.3)' : '#23262d',
              }}
            >
              {plan.badge && (
                <span
                  className="absolute top-4 right-4 text-xs font-semibold px-3 py-1 rounded-full"
                  style={{ background: 'rgba(33,197,94,0.1)', color: '#21c55e' }}
                >
                  {plan.badge}
                </span>
              )}
              <h3 className="text-lg font-semibold mb-1 text-white">{plan.name}</h3>
              <p className="text-sm mb-6" style={{ color: '#a1a1aa' }}>{plan.description}</p>
              <div className="mb-6">
                <span className="text-4xl font-extrabold text-white">
                  {yearly ? plan.yearlyPrice : plan.monthlyPrice}
                </span>
                <span className="text-sm" style={{ color: '#a1a1aa' }}>
                  {yearly ? plan.yearlyPeriod : plan.monthlyPeriod}
                </span>
              </div>
              <ul className="space-y-3 mb-8" style={{ listStyle: 'none' }}>
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm" style={{ color: '#a1a1aa' }}>
                    <CheckIcon />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={onOpenAuth}
                className="w-full font-semibold py-3 rounded-xl text-sm border-0 cursor-pointer transition-all duration-200"
                style={{
                  background: plan.featured ? '#21c55e' : 'transparent',
                  color: plan.featured ? 'white' : '#a1a1aa',
                  border: plan.featured ? 'none' : '1px solid #23262d',
                }}
              >
                {plan.featured ? 'Get started with Pro' : 'Get started free'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
