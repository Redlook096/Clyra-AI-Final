import { useState } from "react";
import { motion } from "framer-motion";
import { Monitor, Smartphone, Tablet } from "lucide-react";
import { cn } from "../../../lib/utils";

export type PreviewDevice = "desktop" | "tablet" | "mobile";

const devices: Array<{
  id: PreviewDevice;
  label: string;
  icon: typeof Monitor;
}> = [
  { id: "desktop", label: "Desktop", icon: Monitor },
  { id: "tablet", label: "Tablet", icon: Tablet },
  { id: "mobile", label: "Mobile", icon: Smartphone },
];

export function PreviewDeviceSwitcher({
  value,
  onChange,
}: {
  value: PreviewDevice;
  onChange: (value: PreviewDevice) => void;
}) {
  const [hovered, setHovered] = useState<PreviewDevice | null>(null);
  const highlight = hovered ?? value;
  const highlightIndex = Math.max(
    0,
    devices.findIndex((device) => device.id === highlight),
  );

  return (
    <div
      className="relative flex items-center rounded-full border border-slate-200/80 bg-white/84 p-1 opacity-0 transition-opacity duration-180 ease-out group-hover:opacity-100"
      onMouseLeave={() => setHovered(null)}
    >
      <motion.span
        aria-hidden="true"
        className="pointer-events-none absolute left-1 top-1 h-8 w-8 rounded-full bg-slate-950 shadow-[0_8px_18px_rgba(15,23,42,0.12)]"
        animate={{ x: highlightIndex * 32 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      />
      {devices.map((device) => {
        const Icon = device.icon;
        const active = device.id === value;
        const lit = device.id === highlight;
        return (
          <button
            key={device.id}
            type="button"
            onClick={() => onChange(device.id)}
            onMouseEnter={() => setHovered(device.id)}
            className={cn(
              "relative z-10 grid h-8 w-8 place-items-center rounded-full transition-colors duration-150",
              lit || active ? "text-white" : "text-slate-500",
            )}
            aria-label={`Preview ${device.label}`}
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        );
      })}
    </div>
  );
}
