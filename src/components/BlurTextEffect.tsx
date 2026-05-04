'use client';

import React, { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';

interface BlurTextEffectProps {
  children: string;
  className?: string;
  isStreaming?: boolean;
}

export const BlurTextEffect: React.FC<BlurTextEffectProps> = ({ children, className = '', isStreaming = false }) => {
  const containerRef = useRef<HTMLSpanElement>(null);
  const nextStartTimeRef = useRef(0);
  const lastScrollTimeRef = useRef(0);
  const hasAnimated = useRef(false);

  useLayoutEffect(() => {
    if (!containerRef.current) return;

    const chars = containerRef.current.querySelectorAll('span.char:not(.animated)');
    if (chars.length === 0) return;

    // Immediately mark as animated so we don't pick them up on the next render
    chars.forEach(char => char.classList.add('animated'));

    if (!isStreaming && !hasAnimated.current) {
      gsap.set(chars, { opacity: 1, y: 0, filter: 'blur(0px)' });
      return;
    }
    
    hasAnimated.current = true;

    gsap.set(chars, { opacity: 0, y: 4, filter: 'blur(4px)' });

    const now = performance.now() / 1000;
    
    const startTime = Math.max(now, nextStartTimeRef.current);
    const delay = startTime - now;

    // Use a fixed stagger so it always flows smoothly left to right
    const stagger = 0.005;

    gsap.to(chars, {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      duration: 0.25, // fast character animation
      ease: 'power1.out',
      delay: delay,
      stagger: {
        each: stagger,
        onStart: function() {
          const char = this.targets()[0] as HTMLElement;
          const chatContainer = document.getElementById('chat-container');
          if (chatContainer) {
            const charRect = char.getBoundingClientRect();
            const containerRect = chatContainer.getBoundingClientRect();
            
            // Sensor: if the character is close to the bottom of the visible container
            // and the user hasn't explicitly scrolled far above it.
            if (charRect.bottom > containerRect.bottom - 40 && charRect.bottom < containerRect.bottom + 150) {
               const nowTime = performance.now();
               if (nowTime - lastScrollTimeRef.current > 250) {
                 lastScrollTimeRef.current = nowTime;
                 // Scroll down ~1 line smoothly
                 chatContainer.scrollBy({
                    top: 32,
                    behavior: 'smooth'
                 });
               }
            }
          }
        }
      },
      clearProps: 'filter',
    });

    window.dispatchEvent(new CustomEvent('ai-animation-active'));
    const totalDelay = delay + 0.2 + (chars.length * stagger);
    clearTimeout((window as any)._aiAnimationTimeout);
    (window as any)._aiAnimationTimeout = setTimeout(() => {
        window.dispatchEvent(new CustomEvent('ai-animation-complete'));
    }, totalDelay * 1000 + 100);

    nextStartTimeRef.current = startTime + (chars.length * stagger);
  }, [children, isStreaming]);

  return (
    <span className={`inline ${className}`} ref={containerRef}>
      {children.split(/(\s+)/).map((segment, index) => {
        if (/^\s+$/.test(segment)) {
          return segment;
        }

        return (
          <span key={`word-${index}`} className="inline-block whitespace-nowrap">
            {segment.split('').map((char, charIndex) => (
              <span key={`char-${index}-${charIndex}`} className="char inline-block">
                {char}
              </span>
            ))}
          </span>
        );
      })}
    </span>
  );
};

