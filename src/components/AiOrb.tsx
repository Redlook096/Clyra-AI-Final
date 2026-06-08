export type OrbColorTheme = "default" | "ocean" | "sunset" | "forest" | "mono";

const ORB_GRADIENTS: Record<OrbColorTheme, string> = {
  default: "conic-gradient(from 45deg, #0f172a, #2563eb, #22d3ee, #8b5cf6, #0f172a)",
  ocean:   "conic-gradient(from 45deg, #0c4a6e, #0284c7, #06b6d4, #0ea5e9, #0c4a6e)",
  sunset:  "conic-gradient(from 45deg, #7c2d12, #ea580c, #f472b6, #a855f7, #7c2d12)",
  forest:  "conic-gradient(from 45deg, #14532d, #16a34a, #2dd4bf, #059669, #14532d)",
  mono:    "conic-gradient(from 45deg, #1e293b, #64748b, #cbd5e1, #94a3b8, #1e293b)",
};

interface AiOrbProps {
  colorTheme?: OrbColorTheme;
}

export function AiOrb({ colorTheme = "default" }: AiOrbProps) {
  const gradient = ORB_GRADIENTS[colorTheme];

  return (
    <div className="clyra-ai-orb-shell" aria-hidden="true">
      <div className="clyra-ai-orb">
        <span className="clyra-ai-orb-icons">
          <svg
            className="clyra-ai-orb-svg"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
          >
            <path
              d="M20.53 6.35 20.35 6.77a.38.38 0 0 1-.7 0l-.18-.42a3.62 3.62 0 0 0-1.66-1.69l-.58-.25a.4.4 0 0 1 0-.72l.54-.25a3.62 3.62 0 0 0 1.69-1.74l.19-.46a.38.38 0 0 1 .7 0l.19.46a3.62 3.62 0 0 0 1.69 1.74l.54.24a.4.4 0 0 1 0 .73l-.57.25a3.62 3.62 0 0 0-1.67 1.69Z"
              fill="currentColor"
            />
            <path
              d="M3 14v-4M21 14v-4M16.5 18V8M12 22V2M7.5 18V6"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="2"
            />
          </svg>
        </span>
        <span
          className="clyra-ai-orb-ball"
          style={{ background: gradient }}
        >
          <span className="clyra-ai-orb-lines" />
          <span className="clyra-ai-orb-rings" />
          <span className="clyra-ai-orb-glow" />
        </span>
        <svg className="clyra-ai-orb-filter" focusable="false">
          <filter
            id="clyra-ai-orb-gooey"
            x="-80%"
            y="-80%"
            width="260%"
            height="260%"
            colorInterpolationFilters="sRGB"
          >
            <feGaussianBlur in="SourceGraphic" stdDeviation="4.5" />
            <feColorMatrix
              values="1 0 0 0 0
              0 1 0 0 0
              0 0 1 0 0
              0 0 0 18 -8"
            />
          </filter>
        </svg>
      </div>
    </div>
  );
}
