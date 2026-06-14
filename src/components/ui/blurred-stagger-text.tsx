"use client";

import * as React from "react";
import gsap from "gsap";
import { cn } from "@/lib/utils";

/** Smooth character-by-character reveal using GSAP. */
export function BlurredStaggerStream({
  text,
  isStreaming,
  className,
}: {
  text: string;
  isStreaming?: boolean;
  className?: string;
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const tl = React.useRef(gsap.timeline());

  React.useLayoutEffect(() => {
    if (!containerRef.current) return;

    if (!isStreaming) {
      const chars = containerRef.current.querySelectorAll("span.char");
      gsap.set(chars, { opacity: 1, y: 0, filter: "blur(0px)" });
      return;
    }

    const chars = containerRef.current.querySelectorAll("span.char:not(.animated)");
    if (chars.length === 0) return;

    chars.forEach((char) => char.classList.add("animated"));
    gsap.set(chars, { opacity: 0, y: 10, filter: "blur(8px)" });

    tl.current.to(
      chars,
      {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        duration: 0.25,
        ease: "power2.out",
        stagger: 0.015,
        onComplete: () => {
          gsap.set(chars, { clearProps: "filter" });
        },
      },
      ">"
    );
  }, [text, isStreaming]);

  if (!text) return null;

  return (
    <div
      className={cn("whitespace-pre-wrap font-medium leading-relaxed inline-block", className)}
      ref={containerRef}
    >
      {text.split("").map((char, i) =>
        char === "\n" ? (
          <br key={`line-${i}`} />
        ) : (
          <span
            key={i}
            className={`char inline-block ${!isStreaming ? "animated" : ""}`}
            style={{ whiteSpace: "pre" }}
          >
            {char === " " ? "\u00A0" : char}
          </span>
        ),
      )}
    </div>
  );
}
