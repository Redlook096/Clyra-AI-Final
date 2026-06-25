import { useMemo, useState } from "react";
import "./styles.css";

const keys = ["7", "8", "9", "/", "4", "5", "6", "*", "1", "2", "3", "-", "0", ".", "=", "+"];

export default function App() {
  const [expression, setExpression] = useState("");
  const preview = useMemo(() => {
    try {
      if (!expression || /[+\-*/.]$/.test(expression)) return "0";
      const result = Function(`"use strict"; return (${expression})`)();
      return Number.isFinite(result) ? String(result) : "0";
    } catch {
      return "0";
    }
  }, [expression]);

  const press = (key: string) => {
    if (key === "=") return setExpression(preview);
    setExpression((value) => value + key);
  };

  return (
    <main className="page">
      <section className="calculator" aria-label="Calculator">
        <p className="eyebrow">Clyra Vibe</p>
        <div className="display">
          <span>{expression || "0"}</span>
          <strong>{preview}</strong>
        </div>
        <div className="keys">
          <button onClick={() => setExpression("")}>AC</button>
          <button onClick={() => setExpression((value) => value.slice(0, -1))}>DEL</button>
          {keys.map((key) => (
            <button key={key} onClick={() => press(key)} className={/[/*+\-=]/.test(key) ? "accent" : ""}>
              {key}
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}
