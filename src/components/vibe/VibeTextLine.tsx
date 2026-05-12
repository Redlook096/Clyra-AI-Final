"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";

const DWELL_MS = 650;
const MS_PER_CHARACTER = 7;

/**
 * Tiny one- or two-sentence narration line that the agent emits between blocks
 * (e.g. "Now let me run lint to verify.").
 *
   * - Appears as a smooth narration beat.
 * - Once typed AND the model has flushed it (a later segment exists), holds briefly then signals
 *   the parent so the next agent step can start.
 */
export function VibeTextLine({
  body,
  complete,
  active,
  onCompleted,
  archived = false,
}: {
  body: string;
  complete: boolean;
  active: boolean;
  onCompleted?: () => void;
  archived?: boolean;
}) {
  const [revealed, setRevealed] = useState(() => (archived ? body.length : 0));
  const [done, setDone] = useState(() => !!archived);
  const notifiedRef = useRef(false);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (archived) {
      setRevealed(body.length);
      setDone(true);
      return;
    }
    if (!active || done) return;
    if (revealed >= body.length) return;

    let cancelled = false;
    let last = performance.now();
    let carry = 0;

    const tick = (now: number) => {
      if (cancelled) return;
      carry += now - last;
      last = now;
      let keepGoing = true;
      if (carry >= MS_PER_CHARACTER) {
        carry = carry % MS_PER_CHARACTER;
        setRevealed((r) => {
          if (r >= body.length) {
            keepGoing = false;
            return r;
          }
          const next = Math.min(r + 1, body.length);
          keepGoing = next < body.length;
          return next;
        });
      }
      if (keepGoing && !cancelled) {
        rafRef.current = window.requestAnimationFrame(tick);
      }
    };

    rafRef.current = window.requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      if (rafRef.current != null) window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [archived, active, done, body.length, revealed]);

  useEffect(() => {
    if (archived) return;
    if (!active || done) return;
    if (!complete) return;
    if (revealed < body.length) return;
    const id = window.setTimeout(() => setDone(true), DWELL_MS);
    return () => window.clearTimeout(id);
  }, [archived, active, done, complete, revealed, body.length]);

  useEffect(() => {
    if (archived) return;
    if (!done || notifiedRef.current) return;
    notifiedRef.current = true;
    onCompleted?.();
  }, [done, onCompleted]);

  if (!body) return null;

  return (
    <motion.p
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      className="max-w-[640px] whitespace-pre-wrap text-[14px] leading-[1.55] text-slate-600"
    >
      {body.slice(0, revealed)}
    </motion.p>
  );
}
