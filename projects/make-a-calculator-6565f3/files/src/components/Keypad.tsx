import { useCallback } from "react";

interface KeypadProps {
  onKeyPress: (key: string) => void;
  onClear: () => void;
  onDelete: () => void;
  onEvaluate: () => void;
  disabled?: boolean;
}

interface KeyConfig {
  label: string;
  value: string;
  variant: "number" | "operator" | "equals" | "utility";
  span?: "full" | "double" | "none";
}

const KEYS: KeyConfig[] = [
  { label: "AC", value: "AC", variant: "utility" },
  { label: "DEL", value: "DEL", variant: "utility" },
  { label: "÷", value: "/", variant: "operator" },
  { label: "×", value: "*", variant: "operator" },
  { label: "7", value: "7", variant: "number" },
  { label: "8", value: "8", variant: "number" },
  { label: "9", value: "9", variant: "number" },
  { label: "−", value: "-", variant: "operator" },
  { label: "4", value: "4", variant: "number" },
  { label: "5", value: "5", variant: "number" },
  { label: "6", value: "6", variant: "number" },
  { label: "+", value: "+", variant: "operator" },
  { label: "1", value: "1", variant: "number" },
  { label: "2", value: "2", variant: "number" },
  { label: "3", value: "3", variant: "number" },
  { label: "=", value: "=", variant: "equals", span: "full" },
  { label: "0", value: "0", variant: "number", span: "double" },
  { label: ".", value: ".", variant: "number" },
];

export default function Keypad({ onKeyPress, onClear, onDelete, onEvaluate, disabled = false }: KeypadProps) {
  const handleClick = useCallback(
    (value: string) => {
      if (disabled) return;
      switch (value) {
        case "AC":
          onClear();
          break;
        case "DEL":
          onDelete();
          break;
        case "=":
          onEvaluate();
          break;
        default:
          onKeyPress(value);
      }
    },
    [disabled, onKeyPress, onClear, onDelete, onEvaluate]
  );

  return (
    <div className="keypad" role="group" aria-label="Calculator keys">
      {KEYS.map((key) => (
        <button
          key={key.value === "=" ? "equals" : key.value === "0" ? "zero" : key.label}
          className={`key key--${key.variant}${key.span && key.span !== "none" ? ` key--${key.span}` : ""}`}
          onClick={() => handleClick(key.value)}
          aria-label={key.label}
          disabled={disabled}
        >
          {key.label}
        </button>
      ))}
    </div>
  );
}
