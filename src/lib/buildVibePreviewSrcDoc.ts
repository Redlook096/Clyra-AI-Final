/**
 * Self-contained iframe HTML: React 18 UMD + Tailwind CDN + Babel (react + typescript presets).
 * Bundles streamed vibe files in dependency-ish order. The real dev server is already `npm run dev`
 * (this app); preview compiles generated TSX in-browser without a second Node process.
 */

function orderPaths(paths: string[]): string[] {
  const rank = (p: string) => {
    if (/\/types\//.test(p) || /\/types\.ts$/i.test(p)) return 0;
    if (/\/hooks\//.test(p)) return 1;
    if (/\/components\//.test(p)) return 2;
    if (/App\.tsx$/i.test(p)) return 10;
    return 5;
  };
  return [...paths].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
}

export function pickPrimaryPreviewPath(files: Record<string, string>): string {
  const keys = Object.keys(files);
  const comp = keys.find((k) => /\/components\/.+\.tsx$/i.test(k) && !/App\.tsx$/i.test(k));
  if (comp) return comp;
  const app = keys.find((k) => /App\.tsx$/i.test(k));
  if (app) return app;
  return keys[0] ?? "";
}

function inferDefaultExportName(code: string): string | null {
  const a = code.match(/export\s+default\s+function\s+(\w+)/);
  if (a?.[1]) return a[1];
  const b = code.match(/export\s+default\s+memo\s*\(\s*(\w+)\s*\)/);
  if (b?.[1]) return b[1];
  const c = code.match(/export\s+default\s+(\w+)\s*;/);
  if (c?.[1]) return c[1];
  return null;
}

/** Replace lucide named imports with tiny placeholder icons so preview does not throw. */
function stubLucideReact(src: string): string {
  return src.replace(
    /import\s*\{([^}]+)\}\s*from\s*['"]lucide-react['"]\s*;?/g,
    (_, raw: string) => {
      const names = raw
        .split(",")
        .map((s: string) => s.trim().split(/\s+as\s+/i)[0]?.trim())
        .filter(Boolean);
      if (names.length === 0) return "";
      // Use var to avoid redeclaration errors across bundled files
      const lines = names.map(
        (n) =>
          `var ${n} = function (props) { return React.createElement('span', Object.assign({}, props, { 'data-lucide': '${n}', className: ((props && props.className) || '') + ' inline-block w-3.5 h-3.5 rounded-sm bg-slate-200/80' })); };`,
      );
      return lines.join("\n");
    },
  );
}

function stripModuleImports(src: string): string {
  let s = src;
  // Strip static imports (single or multi-line)
  s = s.replace(/import\s+[\s\S]*?from\s+['"][^'"]+['"]\s*;?/g, "");
  // Strip side-effect imports
  s = s.replace(/import\s+['"][^'"]+['"]\s*;?/g, "");
  return s;
}

/**
 * Defensive: strip any leftover Vibe protocol markers if they accidentally landed inside a
 * code body (e.g. AI emitted nested/malformed `<<<VIBE_CODE>>>` tokens). Without this Babel
 * fails to parse with an "Unexpected token" SyntaxError and the iframe shows "Script error".
 */
function stripVibeProtocolMarkers(src: string): string {
  return src
    .replace(/<<<VIBE_[A-Z_]+(?:\s+[^>]*)?>>>/g, "")
    .replace(/<<<END_VIBE_[A-Z_]+>>>/g, "");
}

function stripExportKeyword(src: string): string {
  return src.replace(/^\s*export\s+(?=type|interface|function|const|enum)/gm, "");
}

function preparePrimaryMount(src: string): { code: string; mount: string } {
  let code = src;
  
  // Handle "export default function Name() {}"
  const fnM = code.match(/export\s+default\s+function\s+(\w+)/);
  if (fnM?.[1]) {
    const name = fnM[1];
    code = code.replace(/export\s+default\s+function\s+(\w+)/, "function $1");
    return { code, mount: name };
  }

  // Handle "export default memo(Name)"
  const memoM = code.match(/export\s+default\s+memo\s*\(\s*(\w+)\s*\)/);
  if (memoM?.[1]) {
    const inner = memoM[1];
    code = code.replace(
      /export\s+default\s+memo\s*\(\s*\w+\s*\)/,
      `const __VibePreviewRoot = React.memo(${inner})`,
    );
    return { code, mount: "__VibePreviewRoot" };
  }

  // Handle "export default Name;" at the end
  const name = inferDefaultExportName(code);
  if (name) {
    code = code.replace(/export\s+default\s+[^;\n]+;?\s*$/gm, "");
    return { code, mount: name };
  }

  // Handle anonymous "export default () => {}" or "export default function() {}"
  if (/export\s+default\s+/.test(code)) {
    code = code.replace(/export\s+default\s+/, "const __VibePreviewRoot = ");
    return { code, mount: "__VibePreviewRoot" };
  }

  return { code, mount: "App" };
}

export function buildVibePreviewSrcDoc(filesByPath: Record<string, string>): string {
  const paths = orderPaths(Object.keys(filesByPath));
  if (paths.length === 0) {
    return `<!DOCTYPE html><html><body style="font:14px system-ui;padding:16px;color:#64748b">No code to preview.</body></html>`;
  }

  const primary = pickPrimaryPreviewPath(filesByPath);
  const parts: string[] = [];

  for (const p of paths) {
    if (p === primary) continue;
    let body = filesByPath[p] ?? "";
    body = stripVibeProtocolMarkers(body);
    body = stubLucideReact(body);
    body = stripModuleImports(body);
    body = stripExportKeyword(body);
    body = body.replace(/export\s+default\s+[^;\n]+;?\s*$/gm, "");
    parts.push(`\n/* --- ${p} --- */\n${body}\n`);
  }

  let main = filesByPath[primary] ?? "";
  main = stripVibeProtocolMarkers(main);
  main = stubLucideReact(main);
  main = stripModuleImports(main);
  main = stripExportKeyword(main);
  const { code: primaryBody, mount } = preparePrimaryMount(main);
  parts.push(`\n/* --- ${primary} (root) --- */\n${primaryBody}\n`);

  const bundle = parts.join("\n");
  const boot = `
try {
  if (typeof ${mount} !== 'function' && typeof ${mount} !== 'object') {
    throw new Error("Component '${mount}' was not defined by the generated bundle.");
  }
  var __mountEl = document.getElementById('root');
  __mountEl.innerHTML = '';
  var __root = ReactDOM.createRoot(__mountEl);
  __root.render(React.createElement(${mount}, null));
} catch (e) {
  var __err = document.createElement('div');
  __err.className = 'vibe-runtime-error';
  var __h = document.createElement('h3'); __h.textContent = 'Preview error · mount';
  var __p = document.createElement('pre'); __p.textContent = String((e && e.stack) || e);
  __err.appendChild(__h); __err.appendChild(__p);
  document.body.appendChild(__err);
}
`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Vibe preview · localhost</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone@7/babel.min.js"></script>
  <style>
    html,body,#root{height:100%;margin:0;background:#fff;color:#0f172a;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Inter,sans-serif}
    .vibe-runtime-error{padding:18px;color:#b91c1c;font:12px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace;white-space:pre-wrap;background:#fff5f5;border:1px solid #fecaca;border-radius:10px;margin:16px}
    .vibe-runtime-error h3{font:600 13px ui-sans-serif,system-ui;margin:0 0 6px;color:#7f1d1d}
  </style>
</head>
<body>
  <div id="root"></div>
  <script>
    (function () {
      var rootEl = document.getElementById('root');
      function showError(label, err) {
        try {
          var box = document.createElement('div');
          box.className = 'vibe-runtime-error';
          var h = document.createElement('h3');
          h.textContent = 'Preview error · ' + label;
          var pre = document.createElement('pre');
          pre.textContent = String((err && (err.stack || err.message)) || err || '');
          box.appendChild(h);
          box.appendChild(pre);
          rootEl.appendChild(box);

          // Notify parent of error for auto-fix feature
          if (window.parent) {
            window.parent.postMessage({
              type: 'VIBE_PREVIEW_ERROR',
              label: label,
              message: String((err && err.message) || err),
              stack: String((err && err.stack) || '')
            }, '*');
          }
        } catch (_) {}
      }
      window.addEventListener('error', function (e) { showError('runtime', e.error || e.message); });
      window.addEventListener('unhandledrejection', function (e) { showError('promise', e.reason); });
    })();
  </script>
  <script type="text/babel" data-presets="react,typescript">
    const { useState, useEffect, useMemo, useCallback, useRef, useLayoutEffect, useReducer, useContext, createContext, memo, forwardRef, Fragment, Children } = React;
    
    // Common utility stubs
    window.clsx = function() {
      var i=0, arr=[], arg;
      while (i < arguments.length) {
        if (arg = arguments[i++]) {
          if (typeof arg === 'string') arr.push(arg);
          else if (Array.isArray(arg)) arr.push(window.clsx.apply(null, arg));
          else if (typeof arg === 'object') for (var k in arg) if (arg[k]) arr.push(k);
        }
      }
      return arr.join(' ');
    };
    window.twMerge = function() { return window.clsx.apply(null, arguments); };
    window.cn = window.twMerge;

    const motion = new Proxy({}, {
      get: function (_, prop) {
        var tag = typeof prop === "string" ? prop : "div";
        return forwardRef(function (props, ref) {
          var safe = Object.assign({}, props);
          delete safe.initial; delete safe.animate; delete safe.exit; delete safe.transition;
          delete safe.whileHover; delete safe.whileTap; delete safe.whileFocus; delete safe.whileInView;
          delete safe.layout; delete safe.layoutId; delete safe.variants; delete safe.drag;
          return React.createElement(tag, Object.assign({}, safe, { ref: ref }));
        });
      },
    });
    function AnimatePresence(props) { return React.createElement(Fragment, null, props.children); }
    function LayoutGroup(props) { return React.createElement(Fragment, null, props.children); }
    function MotionConfig(props) { return React.createElement(Fragment, null, props.children); }
    var _vibeNoop = function () {};
    var useAnimation = function () { return { start: _vibeNoop, stop: _vibeNoop, set: _vibeNoop }; };
    var useMotionValue = function (init) { return { get: function () { return init; }, set: _vibeNoop, on: _vibeNoop }; };
    var useTransform = function () { return useMotionValue(0); };
    var useSpring = function (v) { return useMotionValue(v); };
${bundle}
${boot}
  </script>
</body>
</html>`;
}
