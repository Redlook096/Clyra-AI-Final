import { promises as fs } from "node:fs";
import * as path from "node:path";
import type { PlannedFile } from "./plan-md-writer";

function inferKind(prompt: string) {
  const lower = prompt.toLowerCase();
  if (/\b(calculator|calculate|math|counter)\b/.test(lower)) return "calculator";
  return "product";
}

function projectTitle(prompt: string) {
  const cleaned = prompt.trim().replace(/\s+/g, " ");
  return cleaned.length > 60 ? `${cleaned.slice(0, 60).trim()}…` : cleaned || "Vibe project";
}

function packageJson(name: string) {
  return JSON.stringify(
    {
      name: name.replace(/[^a-z0-9-]/gi, "-").toLowerCase().slice(0, 40) || "vibe-project",
      version: "1.0.0",
      private: true,
      type: "module",
      scripts: { dev: "vite", build: "vite build", preview: "vite preview" },
      dependencies: {
        "@vitejs/plugin-react": "^5.0.4",
        vite: "^6.2.0",
        typescript: "~5.8.2",
        react: "^19.0.0",
        "react-dom": "^19.0.0",
      },
      devDependencies: {},
    },
    null,
    2,
  );
}

function calculatorApp(title: string) {
  const titleLiteral = JSON.stringify(title);
  return `import { useMemo, useState } from "react";

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
    if (stored === null || operator === null) return "Ready";
    return \`\${format(stored)} \${operator} \${display}\`;
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
      const line = \`\${format(stored)} \${operator} \${format(current)} = \${format(result)}\`;
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
    setHistory((items) => [\`\${format(stored)} \${operator} \${format(current)} = \${format(result)}\`, ...items].slice(0, 5));
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
    setDisplay(display.slice(0, -1) || "0");
  }

  return (
    <main className="app-shell">
      <section className="calculator">
        <header>
          <p className="eyebrow">Clyra Vibe</p>
          <h1>{${titleLiteral}}</h1>
          <p className="preview">{preview}</p>
        </header>
        <output className="display" aria-live="polite">{display}</output>
        <div className="keypad">
          <button type="button" className="key utility" onClick={clear}>AC</button>
          <button type="button" className="key utility" onClick={backspace}>DEL</button>
          <button type="button" className="key utility" onClick={() => setDisplay(format(Number(display) / 100))}>%</button>
          {operatorKeys.map((key) => (
            <button key={key} type="button" className="key operator" onClick={() => chooseOperator(key)}>{key}</button>
          ))}
          {digitKeys.map((key) => (
            <button key={key} type="button" className={\`key \${key === "0" ? "zero" : ""}\`} onClick={() => inputDigit(key)}>{key}</button>
          ))}
          <button type="button" className="key equals" onClick={equals}>=</button>
        </div>
        <ul className="history">
          {history.map((line) => <li key={line}>{line}</li>)}
        </ul>
      </section>
    </main>
  );
}
`;
}

function productApp(title: string, prompt: string) {
  const titleLiteral = JSON.stringify(title);
  const promptLiteral = JSON.stringify(prompt);
  return `export default function App() {
  const title = ${titleLiteral};
  const prompt = ${promptLiteral};

  return (
    <main className="app-shell">
      <nav className="nav">
        <strong>{title}</strong>
        <button type="button">Get started</button>
      </nav>
      <section className="hero">
        <p className="eyebrow">Built with Clyra Vibe</p>
        <h1>{title}</h1>
        <p>{prompt}</p>
        <div className="hero-actions">
          <button type="button" className="primary">Launch preview</button>
          <button type="button" className="secondary">View features</button>
        </div>
      </section>
      <section className="features">
        {["Responsive layout", "Polished interactions", "Preview-ready React app"].map((feature) => (
          <article key={feature} className="feature-card">
            <h2>{feature}</h2>
            <p>Generated locally when the remote coding agent was unavailable, so the workspace still ships a complete preview.</p>
          </article>
        ))}
      </section>
    </main>
  );
}
`;
}

function stylesCss(kind: "calculator" | "product") {
  if (kind === "calculator") {
    return `:root {
  color-scheme: light;
  font-family: Inter, system-ui, sans-serif;
  background: radial-gradient(circle at top, #eef6ff, #f8fafc 45%, #ffffff);
  color: #0f172a;
}
* { box-sizing: border-box; }
body { margin: 0; min-height: 100vh; }
.app-shell { min-height: 100vh; display: grid; place-items: center; padding: 24px; }
.calculator { width: min(100%, 420px); border-radius: 28px; background: rgba(255,255,255,0.88); border: 1px solid #e2e8f0; box-shadow: 0 28px 80px rgba(15,23,42,0.12); padding: 24px; }
.eyebrow { margin: 0; font-size: 12px; letter-spacing: 0.18em; text-transform: uppercase; color: #64748b; }
h1 { margin: 8px 0 0; font-size: 28px; }
.preview { margin: 8px 0 0; color: #64748b; font-size: 14px; }
.display { display: block; width: 100%; margin: 20px 0; padding: 18px; border-radius: 18px; background: #0f172a; color: white; font-size: 36px; text-align: right; }
.keypad { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
.key { border: none; border-radius: 16px; padding: 18px 0; font-size: 18px; font-weight: 600; background: #f8fafc; color: #0f172a; cursor: pointer; }
.key.operator, .key.equals { background: #0f172a; color: white; }
.key.utility { background: #e2e8f0; }
.key.zero { grid-column: span 2; }
.history { margin: 18px 0 0; padding: 0; list-style: none; color: #64748b; font-size: 13px; display: grid; gap: 6px; }
`;
  }

  return `:root {
  color-scheme: light;
  font-family: Inter, system-ui, sans-serif;
  background: linear-gradient(180deg, #f8fafc, #ffffff 40%, #f8fafc);
  color: #0f172a;
}
* { box-sizing: border-box; }
body { margin: 0; }
.app-shell { min-height: 100vh; }
.nav, .hero, .features { width: min(1100px, calc(100% - 40px)); margin: 0 auto; }
.nav { display: flex; justify-content: space-between; align-items: center; padding: 24px 0; }
.nav button, .primary, .secondary { border-radius: 999px; border: none; padding: 12px 18px; font-weight: 600; cursor: pointer; }
.nav button, .primary { background: #0f172a; color: white; }
.secondary { background: white; border: 1px solid #cbd5e1; color: #0f172a; }
.hero { padding: 72px 0 40px; }
.eyebrow { margin: 0; font-size: 12px; letter-spacing: 0.18em; text-transform: uppercase; color: #64748b; }
.hero h1 { font-size: clamp(40px, 6vw, 64px); margin: 12px 0; letter-spacing: -0.04em; }
.hero p { max-width: 720px; color: #475569; font-size: 18px; line-height: 1.6; }
.hero-actions { display: flex; gap: 12px; margin-top: 28px; flex-wrap: wrap; }
.features { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 18px; padding: 24px 0 72px; }
.feature-card { background: white; border: 1px solid #e2e8f0; border-radius: 24px; padding: 24px; box-shadow: 0 18px 50px rgba(15,23,42,0.06); }
.feature-card h2 { margin-top: 0; }
.feature-card p { color: #64748b; line-height: 1.6; }
`;
}

function viteConfig() {
  return `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: { host: "127.0.0.1" },
});
`;
}

function mainTsx() {
  return `import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
`;
}

function indexHtml(title: string) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title.replace(/</g, "")}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`;
}

export async function writeLocalScaffold(
  workspacePath: string,
  prompt: string,
  _fileQueue: PlannedFile[],
): Promise<Array<{ path: string; content: string; action: "create" }>> {
  const kind = inferKind(prompt);
  const title = projectTitle(prompt);
  const slug = title.replace(/[^a-z0-9]+/gi, "-").toLowerCase().slice(0, 32) || "vibe-project";

  const files: Array<{ path: string; content: string; action: "create" }> = [
    { path: "package.json", content: packageJson(slug), action: "create" },
    { path: "index.html", content: indexHtml(title), action: "create" },
    { path: "vite.config.ts", content: viteConfig(), action: "create" },
    { path: "src/main.tsx", content: mainTsx(), action: "create" },
    { path: "src/styles.css", content: stylesCss(kind), action: "create" },
    {
      path: "src/App.tsx",
      content: kind === "calculator" ? calculatorApp(title) : productApp(title, prompt),
      action: "create",
    },
  ];

  await fs.mkdir(workspacePath, { recursive: true });
  for (const file of files) {
    const fullPath = path.join(workspacePath, file.path);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, file.content, "utf8");
  }

  return files;
}
