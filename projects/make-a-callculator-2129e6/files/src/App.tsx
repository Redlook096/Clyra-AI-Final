import { useEffect, useMemo, useState } from "react";

type Operator = "+" | "-" | "×" | "÷" | null;

const digitKeys = ["7", "8", "9", "4", "5", "6", "1", "2", "3", "0", "."];
const operatorKeys: Operator[] = ["÷", "×", "-", "+"];

function format(value: number): string {
  if (!Number.isFinite(value)) return "Error";
  return new Intl.NumberFormat("en", { maximumFractionDigits: 8 }).format(value);
}

function calculate(left: number, right: number, operator: Operator): number {
  if (operator === "+") return left + right;
  if (operator === "-") return left - right;
  if (operator === "×") return left * right;
  if (operator === "÷") return right === 0 ? Number.NaN : left / right;
  return right;
}

export default function App() {
  const [display, setDisplay] = useState("0");
  const [stored, setStored] = useState<number | null>(null);
  const [operator, setOperator] = useState<Operator>(null);
  const [resetNext, setResetNext] = useState(false);
  const [history, setHistory] = useState<string[]>([]);

  const preview = useMemo(() => {
    if (stored === null || operator === null) return "Ready";
    return `${format(stored)} ${operator} ${display}`;
  }, [display, operator, stored]);

  function inputDigit(value: string) {
    if (display === "Error" || resetNext) {
      setDisplay(value === "." ? "0." : value);
      setResetNext(false);
      return;
    }
    if (value === "." && display.includes(".")) return;
    setDisplay(display === "0" && value !== "." ? value : display + value);
  }

  function chooseOperator(nextOperator: Operator) {
    const current = Number(display);
    if (stored !== null && operator && !resetNext) {
      const result = calculate(stored, current, operator);
      const line = `${format(stored)} ${operator} ${format(current)} = ${format(result)}`;
      setHistory((items) => [line, ...items].slice(0, 5));
      setStored(result);
      setDisplay(format(result));
    } else {
      setStored(current);
    }
    setOperator(nextOperator);
    setResetNext(true);
  }

  function equals() {
    if (stored === null || operator === null) return;
    const current = Number(display);
    const result = calculate(stored, current, operator);
    const line = `${format(stored)} ${operator} ${format(current)} = ${format(result)}`;
    setHistory((items) => [line, ...items].slice(0, 5));
    setDisplay(format(result));
    setStored(null);
    setOperator(null);
    setResetNext(true);
  }

  function clear() {
    setDisplay("0");
    setStored(null);
    setOperator(null);
    setResetNext(false);
  }

  function backspace() {
    if (resetNext || display === "Error" || display.length <= 1) {
      setDisplay("0");
      setResetNext(false);
      return;
    }
    setDisplay(display.slice(0, -1));
  }

  function percent() {
    setDisplay(format(Number(display) / 100));
    setResetNext(true);
  }

  function sign() {
    if (display === "0" || display === "Error") return;
    setDisplay(display.startsWith("-") ? display.slice(1) : `-${display}`);
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (/^[0-9.]$/.test(event.key)) inputDigit(event.key);
      if (event.key === "+") chooseOperator("+");
      if (event.key === "-") chooseOperator("-");
      if (event.key === "*") chooseOperator("×");
      if (event.key === "/") { event.preventDefault(); chooseOperator("÷"); }
      if (event.key === "Enter" || event.key === "=") equals();
      if (event.key === "Escape") clear();
      if (event.key === "Backspace") backspace();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <main className="page">
      <section className="calculator-shell" aria-label="Calculator">
        {/* Screen */}
        <div className="screen">
          <div className="screen-preview">{preview}</div>
          <div className="screen-value">{display}</div>
        </div>

        {/* Controls Grid */}
        <div className="controls">
          <button className="utility" onClick={clear}>AC</button>
          <button className="utility" onClick={sign}>±</button>
          <button className="utility" onClick={percent}>%</button>
          {operatorKeys.map((item) => (
            <button
              className={operator === item ? "operator active" : "operator"}
              key={item ?? ""}
              onClick={() => chooseOperator(item)}
            >
              {item}
            </button>
          ))}
          {digitKeys.map((item) => (
            <button
              className={item === "0" ? "digit wide" : "digit"}
              key={item}
              onClick={() => inputDigit(item)}
            >
              {item}
            </button>
          ))}
          <button className="utility" onClick={backspace}>⌫</button>
          <button className="equals" onClick={equals}>=</button>
        </div>

        {/* History */}
        <div className="history" aria-live="polite">
          <div className="history-label">Recent</div>
          {history.length === 0 ? (
            <div className="history-empty">No calculations yet</div>
          ) : (
            history.slice(0, 3).map((item) => (
              <div className="history-item" key={item}>{item}</div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
