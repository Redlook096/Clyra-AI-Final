'use client';

import React, { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';

/** Beyond this, per-character DOM + GSAP is too heavy for static (finished) text. */
const MAX_CHARS_FOR_STAGGER = 3500;

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

  const usePlainText =
    !isStreaming && children.length > MAX_CHARS_FOR_STAGGER;

  useLayoutEffect(() => {
    if (usePlainText) return;

    const root = containerRef.current;
    if (!root) return;

    const killChars = () => gsap.killTweensOf(root.querySelectorAll(".char"));
    killChars();

    const chars = root.querySelectorAll("span.char:not(.animated)");
    if (chars.length === 0) {
      return killChars;
    }

    chars.forEach((char) => char.classList.add("animated"));

    if (!isStreaming && !hasAnimated.current) {
      gsap.set(chars, { opacity: 1, y: 0, filter: "blur(0px)" });
      return killChars;
    }

    hasAnimated.current = true;

    gsap.set(chars, { opacity: 0, y: 4, filter: "blur(4px)" });

    const now = performance.now() / 1000;
    const startTime = Math.max(now, nextStartTimeRef.current);
    const delay = startTime - now;
    const stagger = 0.005;

    gsap.to(chars, {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      duration: 0.25,
      ease: "power1.out",
      delay,
      stagger: {
        each: stagger,
        onStart() {
          const char = this.targets()[0] as HTMLElement;
          const chatContainer = document.getElementById("chat-container");
          if (!chatContainer) return;
          const charRect = char.getBoundingClientRect();
          const containerRect = chatContainer.getBoundingClientRect();
          if (
            charRect.bottom > containerRect.bottom - 40 &&
            charRect.bottom < containerRect.bottom + 150
          ) {
            const nowTime = performance.now();
            if (nowTime - lastScrollTimeRef.current > 250) {
              lastScrollTimeRef.current = nowTime;
              chatContainer.scrollBy({ top: 32, behavior: "smooth" });
            }
          }
        },
      },
      clearProps: "filter",
    });

    window.dispatchEvent(new CustomEvent("ai-animation-active"));
    const totalDelay = delay + 0.2 + chars.length * stagger;
    const w = window as Window & { _aiAnimationTimeout?: ReturnType<typeof setTimeout> };
    clearTimeout(w._aiAnimationTimeout);
    w._aiAnimationTimeout = setTimeout(() => {
      window.dispatchEvent(new CustomEvent("ai-animation-complete"));
    }, totalDelay * 1000 + 100);

    nextStartTimeRef.current = startTime + chars.length * stagger;

    return () => {
      clearTimeout(w._aiAnimationTimeout);
      killChars();
    };
  }, [children, isStreaming, usePlainText]);

  if (usePlainText) {
    return <span className={`inline ${className}`}>{children}</span>;
  }

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

