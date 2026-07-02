import { useEffect, useMemo, useState } from "react";

type Operator = "+" | "-" | "×" | "÷" | null;

const digitKeys = ["7", "8", "9", "4", "5", "6", "1", "2", "3", "0", "."];
const operatorKeys: Operator[] = ["÷", "×", "-", "+"];

function format(value: number) {
  if (!Number.isFinite(value)) return "Error";
  return new Intl.NumberFormat("en", { maximumFractionDigits: 8 }).format(value);
}

function calculate(left: number, right: number, operator: Operator) {
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
    if (stored === null || operator === null) return "Primed";
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
    setHistory((items) => [`${format(stored)} ${operator} ${format(current)} = ${format(result)}`, ...items].slice(0, 5));
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
      if (event.key === "/") chooseOperator("÷");
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
        <div className="screen">
          <p>{preview}</p>
          <strong>{display}</strong>
        </div>

        <div className="controls">
          <button onClick={clear}>AC</button>
          <button onClick={sign}>±</button>
          <button onClick={percent}>%</button>
          {operatorKeys.map((item) => (
            <button className={operator === item ? "operator active" : "operator"} key={item ?? ""} onClick={() => chooseOperator(item)}>
              {item}
            </button>
          ))}
          {digitKeys.map((item) => (
            <button className={item === "0" ? "wide" : ""} key={item} onClick={() => inputDigit(item)}>
              {item}
            </button>
          ))}
          <button onClick={backspace}>⌫</button>
          <button className="equals" onClick={equals}>=</button>
        </div>

        <div className="history" aria-live="polite">
          <span>Recent</span>
          {history.length === 0 ? (
            <p>No calculations yet</p>
          ) : (
            history.slice(0, 3).map((item) => <p key={item}>{item}</p>)
          )}
        </div>
      </section>
    </main>
  );
}
