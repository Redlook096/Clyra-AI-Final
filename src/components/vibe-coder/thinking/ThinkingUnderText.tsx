import { memo, useEffect, useRef } from "react";
import type { VisibleThoughtPhase } from "../../../../lib/vibe-coder/llm/visible-thought-preview";
import { TextEffect } from "@/components/ui/text-effect";

/**
 * ThinkingUnderText — smooth AI-generated thought stream.
 *
 * Renders the incoming streamed text from the LLM directly,
 * smoothly scrolls to the bottom, and applies a top fade-out mask.
 */

export const ThinkingUnderText = memo(function ThinkingUnderText({
  text,
  phase,
  isActive,
}: {
  text: string;
  phase: VisibleThoughtPhase;
  isActive: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Smooth scroll to bottom as text streams in
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [text]);

  if (!text) return null;

  const blurSlideVariants: any = {
    container: {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: { staggerChildren: 0.02 },
      },
    },
    item: {
      hidden: { opacity: 0, y: 8 },
      visible: {
        opacity: 1,
        y: 0,
        transition: { type: "spring", stiffness: 180, damping: 20, mass: 0.6 },
      },
    },
  };

  return (
    <div
      ref={containerRef}
      className="clyra-visible-scrollbar mt-1.5 ml-[23px] max-w-[600px] overflow-y-auto max-h-[85px] transition-opacity duration-300"
      style={{
        maskImage: "linear-gradient(to bottom, transparent 0%, black 25%, black 100%)",
        WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 25%, black 100%)",
      }}
      aria-live={isActive ? "polite" : undefined}
    >
      <div className="pb-1">
        <TextEffect
          as="span"
          per="word"
          variants={blurSlideVariants}
          className="text-[14px] sm:text-[15px] font-normal leading-[1.65] text-slate-500 opacity-80 whitespace-pre-wrap m-0"
        >
          {text}
        </TextEffect>
        {isActive && (
          <span
            className="ml-[2px] inline-block h-[12px] w-[1.5px] translate-y-[1px] animate-pulse bg-slate-300"
            aria-hidden
          />
        )}
      </div>
    </div>
  );
});
