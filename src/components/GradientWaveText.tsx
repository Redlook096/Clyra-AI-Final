"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Align = "left" | "center" | "right";

const defaultColors = ["#256f8f", "#4f46e5", "#0f766e", "#64748b", "#315a73", "#334155"];

interface GradientWaveTextProps {
  children?: React.ReactNode;
  align?: Align;
  className?: string;
  speed?: number;
  paused?: boolean;
  delay?: number;
  repeat?: boolean;
  inView?: boolean;
  once?: boolean;
  radial?: boolean;
  bottomOffset?: number;
  bandGap?: number;
  bandCount?: number;
  customColors?: string[];
  onClick?: (e: React.MouseEvent) => void;
  onMouseEnter?: (e: React.MouseEvent) => void;
  onMouseLeave?: (e: React.MouseEvent) => void;
  ariaLabel?: string;
}

export function GradientWaveText({
  children,
  align = "left",
  className,
  speed = 1.45,
  paused = false,
  delay = 0,
  repeat = false,
  inView = false,
  once = true,
  radial = true,
  bottomOffset = 10,
  bandGap = 4,
  bandCount = 8,
  customColors,
  onClick,
  onMouseEnter,
  onMouseLeave,
  ariaLabel,
}: GradientWaveTextProps) {
  const elRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef(0);
  const tRef = useRef(-25);
  const cyclesDoneRef = useRef(0);
  const finishedRef = useRef(false);
  const startedRef = useRef(false);
  const startAtRef = useRef(0);
  const hasPlayedRef = useRef(false);
  const [isInView, setIsInView] = useState(!inView);
  const cycles = repeat ? 0 : 1;

  useEffect(() => {
    if (!inView) {
      setIsInView(true);
      return;
    }
    const node = elRef.current;
    if (!node) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          if (once && hasPlayedRef.current) return;
          setIsInView(true);
          hasPlayedRef.current = true;
        } else if (!once) {
          setIsInView(false);
        }
      });
    }, { threshold: 0.1 });
    observer.observe(node);
    return () => observer.disconnect();
  }, [inView, once]);

  const resolvedColors = useMemo(
    () => (customColors?.length ? customColors : defaultColors),
    [customColors],
  );

  const stops = useMemo(() => {
    const arr: string[] = [];
    const baseColor = "var(--gradient-wave-base, rgb(23,32,51))";
    arr.push(`${baseColor} calc((var(--gi) + 0) * 1%)`);
    for (let i = 0; i < bandCount && i < resolvedColors.length * 2; i += 1) {
      const color = resolvedColors[i % resolvedColors.length];
      const offset = (i + 2) * bandGap;
      arr.push(`${color} calc((var(--gi) + ${offset}) * 1%)`);
    }
    arr.push(`${baseColor} calc((var(--gi) + ${(bandCount + 2) * bandGap}) * 1%)`);
    return arr.join(", ");
  }, [bandCount, bandGap, resolvedColors]);

  const gradient = useMemo(
    () => radial ? `radial-gradient(circle at 50% bottom, ${stops})` : `linear-gradient(0deg, ${stops})`,
    [radial, stops],
  );

  useEffect(() => {
    const node = elRef.current;
    if (node) node.style.setProperty("--gi", "-25");
  }, []);

  useEffect(() => {
    if (!isInView) return;
    const node = elRef.current;
    if (!node) return;
    tRef.current = -25;
    cyclesDoneRef.current = 0;
    finishedRef.current = false;
    startedRef.current = false;
    startAtRef.current = performance.now() + Math.max(0, delay * 1000);
    node.style.setProperty("--gi", "-25");
  }, [delay, isInView]);

  useEffect(() => {
    const node = elRef.current;
    if (!node || !isInView) return;
    const RANGE = 200;
    let last = performance.now();
    const tick = (now: number) => {
      if (finishedRef.current) return;
      if (!startedRef.current) {
        if (now >= startAtRef.current) {
          startedRef.current = true;
          last = now;
        } else {
          rafRef.current = requestAnimationFrame(tick);
          return;
        }
      }
      const dt = Math.min(64, now - last);
      last = now;
      if (!paused) {
        const increment = (dt * speed) / 16.6667;
        let next = tRef.current + increment;
        if (cycles === 0) {
          if (next >= RANGE) next %= RANGE;
          tRef.current = next;
          node.style.setProperty("--gi", String(next));
        } else {
          while (next >= RANGE && cyclesDoneRef.current < cycles) {
            next -= RANGE;
            cyclesDoneRef.current += 1;
          }
          if (cyclesDoneRef.current >= cycles) {
            tRef.current = RANGE;
            node.style.setProperty("--gi", String(RANGE));
            finishedRef.current = true;
            return;
          }
          tRef.current = next;
          node.style.setProperty("--gi", String(next));
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [cycles, isInView, paused, speed]);

  const justifyContent = align === "left" ? "flex-start" : align === "right" ? "flex-end" : "center";
  const handleClick = useCallback((e: React.MouseEvent) => onClick?.(e), [onClick]);
  const handleMouseEnter = useCallback((e: React.MouseEvent) => onMouseEnter?.(e), [onMouseEnter]);
  const handleMouseLeave = useCallback((e: React.MouseEvent) => onMouseLeave?.(e), [onMouseLeave]);

  return (
    <div
      ref={elRef}
      className={cn("flex h-full w-full items-center [--gradient-wave-base:rgb(23,32,51)]", className)}
      style={{ justifyContent, "--gi": -25 } as React.CSSProperties}
      aria-label={ariaLabel}
      role={ariaLabel ? "img" : undefined}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <span
        style={{
          textAlign: align,
          backgroundImage: gradient,
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          WebkitTextFillColor: "transparent",
          color: "transparent",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          display: "inline-block",
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
          WebkitBackfaceVisibility: "hidden",
          backfaceVisibility: "hidden",
          transform: "translateZ(0)",
          paddingBottom: `${bottomOffset}%`,
          marginBottom: `-${bottomOffset}%`,
          paddingInline: 2,
        }}
      >
        {children}
      </span>
    </div>
  );
}

export default GradientWaveText;
