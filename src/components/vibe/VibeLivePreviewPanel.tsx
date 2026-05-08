"use client";

import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  ChevronLeft,
  ChevronRight,
  Code2,
  Crosshair,
  File,
  FileJson,
  FilePlus,
  FileText,
  Folder,
  FolderPlus,
  LayoutTemplate,
  Maximize2,
  Minimize2,
  RotateCw,
  Sparkles,
  AlertCircle,
  X,
} from "lucide-react";
import { buildVibePreviewSrcDoc, pickPrimaryPreviewPath } from "@/lib/buildVibePreviewSrcDoc";
import { sandboxVibePath } from "@/lib/parseVibeAgentContent";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "clyra_vibe_preview_files";

const Editor = lazy(() =>
  import("@monaco-editor/react").then((m) => ({ default: m.Editor })),
);

type Props = {
  filesByPath: Record<string, string>;
  className?: string;
  /** Patch streamed files into the editor map without wiping user-added paths (active vibe stream). */
  mergeFilesFromStream?: boolean;
  onAutoFix?: (error: { message: string; stack?: string; label?: string }) => void;
  setToastMessage?: (message: string) => void;
  onReferenceElement?: (label: string) => void;
};

type WorkspaceMode = "preview" | "code";

type TreeNode = {
  name: string;
  /** Full path for files; for dirs, path without trailing slash */
  path: string;
  kind: "file" | "dir";
  children: TreeNode[];
};

function normDir(p: string): string {
  return p.replace(/\/+$/, "").replace(/^\/+/, "");
}

function collectDirsFromFiles(files: Record<string, string>): Set<string> {
  const dirs = new Set<string>();
  for (const p of Object.keys(files)) {
    const parts = p.split("/").filter(Boolean);
    let acc = "";
    for (let i = 0; i < parts.length - 1; i++) {
      acc = acc ? `${acc}/${parts[i]}` : parts[i]!;
      dirs.add(acc);
    }
  }
  return dirs;
}

function buildTree(files: Record<string, string>, extraDirs: Set<string>): TreeNode {
  const dirs = collectDirsFromFiles(files);
  for (const d of extraDirs) {
    const n = normDir(d);
    if (n) dirs.add(n);
    const parts = n.split("/").filter(Boolean);
    let acc = "";
    for (const part of parts) {
      acc = acc ? `${acc}/${part}` : part;
      dirs.add(acc);
    }
  }

  const filePaths = Object.keys(files);
  const root: TreeNode = { name: "", path: "", kind: "dir", children: [] };
  const findChild = (parent: TreeNode, name: string) =>
    parent.children.find((c) => c.name === name && c.kind === "dir");

  for (const dir of dirs) {
    const parts = dir.split("/").filter(Boolean);
    let cur = root;
    let acc = "";
    for (const part of parts) {
      acc = acc ? `${acc}/${part}` : part;
      let next = findChild(cur, part);
      if (!next) {
        next = { name: part, path: acc, kind: "dir", children: [] };
        cur.children.push(next);
      }
      cur = next;
    }
  }

  for (const fp of filePaths) {
    const parts = fp.split("/").filter(Boolean);
    if (parts.length === 0) continue;
    let cur = root;
    let acc = "";
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]!;
      const isLast = i === parts.length - 1;
      acc = acc ? `${acc}/${part}` : part;
      if (isLast) {
        cur.children.push({ name: part, path: fp, kind: "file", children: [] });
      } else {
        let next = findChild(cur, part);
        if (!next) {
          next = { name: part, path: acc, kind: "dir", children: [] };
          cur.children.push(next);
        }
        cur = next;
      }
    }
  }

  const sortNodes = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === "dir" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    for (const n of nodes) {
      if (n.kind === "dir") sortNodes(n.children);
    }
  };
  sortNodes(root.children);
  return root;
}

function inferLanguage(path: string): string {
  const lower = path.toLowerCase();
  const dot = lower.lastIndexOf(".");
  const ext = dot >= 0 ? lower.slice(dot) : "";
  const map: Record<string, string> = {
    ".tsx": "typescript",
    ".ts": "typescript",
    ".mts": "typescript",
    ".cts": "typescript",
    ".jsx": "javascript",
    ".js": "javascript",
    ".mjs": "javascript",
    ".cjs": "javascript",
    ".json": "json",
    ".css": "css",
    ".scss": "scss",
    ".less": "less",
    ".html": "html",
    ".htm": "html",
    ".md": "markdown",
    ".mdx": "markdown",
    ".py": "python",
    ".rb": "ruby",
    ".go": "go",
    ".rs": "rust",
    ".java": "java",
    ".kt": "kotlin",
    ".swift": "swift",
    ".cs": "csharp",
    ".fs": "fsharp",
    ".php": "php",
    ".vue": "html",
    ".svelte": "html",
    ".yaml": "yaml",
    ".yml": "yaml",
    ".xml": "xml",
    ".sql": "sql",
    ".graphql": "graphql",
    ".gql": "graphql",
    ".toml": "ini",
    ".ini": "ini",
    ".sh": "shell",
    ".bash": "shell",
    ".zsh": "shell",
    ".dockerfile": "dockerfile",
    ".cpp": "cpp",
    ".cc": "cpp",
    ".cxx": "cpp",
    ".hpp": "cpp",
    ".c": "c",
    ".h": "c",
  };
  if (lower.endsWith("dockerfile") || lower.split("/").pop() === "dockerfile") return "dockerfile";
  return map[ext] ?? "plaintext";
}

function FileGlyph({ path }: { path: string }) {
  const p = path.toLowerCase();
  if (p.endsWith(".json")) return <FileJson className="h-3.5 w-3.5 shrink-0 text-amber-600/90" strokeWidth={1.75} />;
  if (p.endsWith(".md")) return <FileText className="h-3.5 w-3.5 shrink-0 text-sky-600/90" strokeWidth={1.75} />;
  return <File className="h-3.5 w-3.5 shrink-0 text-slate-500" strokeWidth={1.75} />;
}

function TreeRows({
  nodes,
  depth,
  expanded,
  toggle,
  activePath,
  onPick,
}: {
  nodes: TreeNode[];
  depth: number;
  expanded: Record<string, boolean>;
  toggle: (path: string) => void;
  activePath: string;
  onPick: (path: string) => void;
}) {
  return (
    <>
      {nodes.map((n) => {
        if (n.kind === "dir") {
          const open = expanded[n.path] !== false; // default expanded
          return (
            <div key={`d:${n.path}`}>
              <button
                type="button"
                onClick={() => toggle(n.path)}
                className="flex w-full items-center gap-0.5 rounded px-1 py-[3px] text-left text-[12.5px] text-slate-600 hover:bg-slate-200/60"
                style={{ paddingLeft: 6 + depth * 12 }}
              >
                <ChevronRight
                  className={cn("h-3 w-3 shrink-0 text-slate-400 transition-transform", open && "rotate-90")}
                  strokeWidth={2}
                />
                <Folder className="h-3.5 w-3.5 shrink-0 text-slate-500/90" strokeWidth={1.75} />
                <span className="min-w-0 truncate">{n.name}</span>
              </button>
              {open ? (
                <TreeRows
                  nodes={n.children}
                  depth={depth + 1}
                  expanded={expanded}
                  toggle={toggle}
                  activePath={activePath}
                  onPick={onPick}
                />
              ) : null}
            </div>
          );
        }
        const active = n.path === activePath;
        return (
          <button
            key={`f:${n.path}`}
            type="button"
            onClick={() => onPick(n.path)}
            className={cn(
              "flex w-full items-center gap-1.5 rounded px-1 py-[3px] text-left text-[12.5px]",
              active ? "bg-slate-300/50 text-slate-900" : "text-slate-600 hover:bg-slate-200/50",
            )}
            style={{ paddingLeft: 10 + depth * 12 }}
          >
            <span className="inline-block w-3 shrink-0" />
            <FileGlyph path={n.path} />
            <span className="min-w-0 truncate">{n.name}</span>
          </button>
        );
      })}
    </>
  );
}

/**
 * Workbench: file tree + Monaco + mini-browser preview. The iframe loads your running dev server
 * at `?vibe_embed=1` (same as `npm run dev` for this app); files are synced via sessionStorage.
 */
export function VibeLivePreviewPanel({
  filesByPath,
  className,
  mergeFilesFromStream = false,
  onAutoFix,
  setToastMessage,
  onReferenceElement,
}: Props) {
  const [mergedFiles, setMergedFiles] = useState<Record<string, string>>(() => {
    const next: Record<string, string> = {};
    for (const [path, body] of Object.entries(filesByPath)) next[sandboxVibePath(path)] = body;
    return next;
  });
  const [virtualDirs, setVirtualDirs] = useState<Set<string>>(() => new Set());
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ "": true });
  const [iframeReload, setIframeReload] = useState(0);
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>("preview");
  const [addressInput, setAddressInput] = useState("");
  const [lastError, setLastError] = useState<{ message: string; stack?: string; label?: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [sessionUrl, setSessionUrl] = useState("");
  const [sessionStatus, setSessionStatus] = useState<"idle" | "syncing" | "ready" | "offline">("idle");
  const [previewNotice, setPreviewNotice] = useState<string | null>(null);
  const [previewLoaded, setPreviewLoaded] = useState(false);
  const [isPreviewFullscreen, setIsPreviewFullscreen] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    setWorkspaceMode("preview");
    setLastError(null);
  }, [filesByPath]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "VIBE_PREVIEW_ERROR") {
        setLastError({
          message: event.data.message,
          stack: event.data.stack,
          label: event.data.label,
        });
      } else if (event.data?.type === "VIBE_FOCUS_SELECT") {
        const label = typeof event.data.label === "string" ? event.data.label : "preview element";
        onReferenceElement?.(label);
        setFocusMode(false);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onReferenceElement]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsPreviewFullscreen(false);
        setFocusMode(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    iframeRef.current?.contentWindow?.postMessage({ type: "VIBE_FOCUS_MODE", enabled: focusMode }, "*");
  }, [focusMode, iframeReload, sessionUrl, previewLoaded]);

  useEffect(() => {
    if (mergeFilesFromStream) {
      setMergedFiles((prev) => {
        const next = { ...prev };
        for (const k of Object.keys(filesByPath)) {
          next[sandboxVibePath(k)] = filesByPath[k]!;
        }
        return next;
      });
    } else {
      const next: Record<string, string> = {};
      for (const [path, body] of Object.entries(filesByPath)) next[sandboxVibePath(path)] = body;
      setMergedFiles(next);
    }
  }, [filesByPath, mergeFilesFromStream]);

  const defaultPath = useMemo(() => pickPrimaryPreviewPath(mergedFiles), [mergedFiles]);
  const [activePath, setActivePath] = useState(defaultPath);

  useEffect(() => {
    if (mergedFiles[activePath] !== undefined) return;
    setActivePath((defaultPath || Object.keys(mergedFiles)[0]) ?? "");
  }, [activePath, defaultPath, mergedFiles]);

  const tree = useMemo(
    () => buildTree(mergedFiles, virtualDirs),
    [mergedFiles, virtualDirs],
  );

  /** Real isolated dev server rooted at vibe-sandbox/, separate from the Clyra app. */
  const SANDBOX_DEV_HOST = "http://localhost:5174";

  useLayoutEffect(() => {
    setAddressInput(`${SANDBOX_DEV_HOST}/`);
  }, []);

  const externalEmbedUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return new URL("/?vibe_embed=1", window.location.origin).href;
  }, []);

  const previewSrcDoc = useMemo(() => buildVibePreviewSrcDoc(mergedFiles), [mergedFiles]);

  useLayoutEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(mergedFiles));
    } catch {
      /* ignore quota */
    }
  }, [mergedFiles]);

  useEffect(() => {
    const id = window.setTimeout(() => setIframeReload((k) => k + 1), 120);
    setPreviewLoaded(false);
    return () => window.clearTimeout(id);
  }, [mergedFiles]);

  useEffect(() => {
    if (Object.keys(mergedFiles).length === 0) {
      setSessionUrl("");
      setSessionStatus("idle");
      return;
    }
    const controller = new AbortController();
    const id = window.setTimeout(async () => {
      setSessionStatus("syncing");
      try {
        const response = await fetch(`${SANDBOX_DEV_HOST}/api/session`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ files: mergedFiles }),
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`Sandbox sync failed: ${response.status}`);
        const result = (await response.json()) as { url?: string };
        if (!result.url) throw new Error("Sandbox server did not return a preview URL");
        setSessionUrl(result.url);
        setAddressInput(result.url);
        setSessionStatus("ready");
        setPreviewNotice(null);
      } catch (error) {
        if (controller.signal.aborted) return;
        console.warn("Vibe sandbox server unavailable; falling back to inline preview.", error);
        setSessionUrl("");
        setSessionStatus("offline");
        setPreviewNotice("Sandbox offline. Inline fallback is active.");
      }
    }, 220);
    return () => {
      controller.abort();
      window.clearTimeout(id);
    };
  }, [SANDBOX_DEV_HOST, mergedFiles]);

  const toggleDir = useCallback((path: string) => {
    setExpanded((e) => ({ ...e, [path]: e[path] === false ? true : false }));
  }, []);

  const parentDir = useCallback((filePath: string) => {
    const i = filePath.lastIndexOf("/");
    return i === -1 ? "" : filePath.slice(0, i);
  }, []);

  const ensureExpandedPath = useCallback((filePath: string) => {
    const parts = filePath.split("/").filter(Boolean);
    setExpanded((prev) => {
      const next = { ...prev };
      let acc = "";
      for (let i = 0; i < parts.length - 1; i++) {
        acc = acc ? `${acc}/${parts[i]!}` : parts[i]!;
        next[acc] = true;
      }
      return next;
    });
  }, []);

  const handleNewFile = useCallback(() => {
    const base = activePath && mergedFiles[activePath] !== undefined ? parentDir(activePath) : "";
    const suggestion = base ? `${base}/Untitled.tsx` : "src/Untitled.tsx";
    const rel = window.prompt("New file path", suggestion)?.trim();
    if (!rel) return;
    const clean = sandboxVibePath(rel);
    setMergedFiles((m) => ({ ...m, [clean]: "// New file\n" }));
    setActivePath(clean);
    ensureExpandedPath(clean);
  }, [activePath, mergedFiles, parentDir, ensureExpandedPath]);

  const handleNewFolder = useCallback(() => {
    const base = activePath && mergedFiles[activePath] !== undefined ? parentDir(activePath) : "";
    const suggestion = base ? `${base}/new-folder` : "src/new-folder";
    const rel = window.prompt("New folder path", suggestion)?.trim();
    if (!rel) return;
    const clean = normDir(sandboxVibePath(rel));
    if (!clean) return;
    setVirtualDirs((d) => new Set(d).add(clean));
    ensureExpandedPath(`${clean}/.keep`);
    setExpanded((e) => ({ ...e, [clean]: true }));
  }, [activePath, mergedFiles, parentDir, ensureExpandedPath]);

  const editorValue = mergedFiles[activePath] ?? "";

  const testPreview = useCallback(async () => {
    if (Object.keys(mergedFiles).length === 0) return;
    setIsTesting(true);
    setTestResult(null);
    try {
      const response = await fetch(`${SANDBOX_DEV_HOST}/api/test-preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: sessionUrl || `${SANDBOX_DEV_HOST}/`, files: mergedFiles, testPrompt: "landing page" }),
      });
      if (!response.ok) throw new Error(`Preview test failed: ${response.status}`);
      const result = await response.json();
      setTestResult(result);
      if (result.success && !result.blank) {
        setPreviewNotice("Headless preview test passed.");
        setToastMessage?.("Vibe preview test passed");
      } else {
        const reason =
          result.blank ? "Preview looked blank in the headless test." :
          result.pageErrors?.[0] ?? "Preview test found errors.";
        setPreviewNotice(reason);
        setToastMessage?.("Preview test found errors");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setTestResult({ success: false, error: message });
      setPreviewNotice(message);
      setToastMessage?.("Preview test failed");
    } finally {
      setIsTesting(false);
    }
  }, [SANDBOX_DEV_HOST, mergedFiles, sessionUrl, setToastMessage]);

  const reload = useCallback(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(mergedFiles));
    } catch {
      /* ignore */
    }
    if (iframeRef.current?.contentWindow) {
      try {
        iframeRef.current.contentWindow.location.reload();
        return;
      } catch {
        /* cross-origin */
      }
    }
    setIframeReload((k) => k + 1);
  }, [mergedFiles]);

  const goBack = useCallback(() => {
    try {
      iframeRef.current?.contentWindow?.history.back();
    } catch {
      /* ignore cross-origin */
    }
  }, []);

  const goForward = useCallback(() => {
    try {
      iframeRef.current?.contentWindow?.history.forward();
    } catch {
      /* ignore cross-origin */
    }
  }, []);

  const openExternal = useCallback(() => {
    if (sessionUrl) {
      window.open(sessionUrl, "_blank", "noopener,noreferrer");
      return;
    }
    if (!externalEmbedUrl) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(mergedFiles));
    } catch {
      /* ignore */
    }
    window.open(externalEmbedUrl, "_blank", "noopener,noreferrer");
  }, [externalEmbedUrl, mergedFiles]);

  const handleAddressSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(mergedFiles));
      } catch {
        /* ignore */
      }
      setIframeReload((k) => k + 1);
      if (addressInput.startsWith(SANDBOX_DEV_HOST)) setSessionUrl(addressInput);
    },
    [addressInput, mergedFiles, SANDBOX_DEV_HOST],
  );

  const projectLabel = useMemo(() => {
    if (typeof window === "undefined") return "Project";
    const seg = window.location.pathname.split("/").filter(Boolean);
    return seg.length ? seg[seg.length - 1]! : "Project";
  }, []);

  const healthTone = useMemo(() => {
    if (lastError || testResult?.success === false) return "error";
    if (isTesting || sessionStatus === "syncing") return "busy";
    if (sessionStatus === "ready") return "ready";
    if (sessionStatus === "offline") return "warn";
    return "idle";
  }, [isTesting, lastError, sessionStatus, testResult]);

  const healthText = useMemo(() => {
    if (lastError) return "Runtime error";
    if (isTesting) return "Testing preview";
    if (sessionStatus === "syncing") return "Syncing sandbox";
    if (sessionStatus === "ready") return "Sandbox live";
    if (sessionStatus === "offline") return "Inline fallback";
    return "Preview ready";
  }, [isTesting, lastError, sessionStatus]);

  const requestAutoFix = useCallback(() => {
    const message =
      lastError ??
      (testResult?.blank
        ? { label: "blank preview", message: "The Vibe live preview rendered blank in a headless browser test." }
        : testResult?.pageErrors?.length
          ? { label: "preview test", message: testResult.pageErrors.join("\n") }
          : testResult?.error
            ? { label: "preview test", message: testResult.error }
            : null);
    if (!message || !onAutoFix) return;
    onAutoFix(message);
    setLastError(null);
    setPreviewNotice("Auto Fix requested in chat.");
  }, [lastError, onAutoFix, testResult]);

  return (
    <div
      className={cn(
        "flex h-full min-h-0 min-w-0 max-h-full flex-1 flex-col bg-[#f6f6f6]",
        isPreviewFullscreen && "fixed inset-0 z-[300] h-dvh max-h-none shadow-2xl",
        className,
      )}
      data-invert-ignore
    >
      <header className="flex h-11 shrink-0 items-center gap-2 border-b border-slate-200/70 bg-[#f4f4f5] px-2.5 shadow-[inset_0_-1px_0_rgba(255,255,255,0.75)]">
        <button
          type="button"
          onClick={goBack}
          className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-white hover:text-slate-800"
          aria-label="Back"
        >
          <ChevronLeft className="h-4.5 w-4.5" strokeWidth={2.2} />
        </button>
        <button
          type="button"
          onClick={goForward}
          className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-white hover:text-slate-800"
          aria-label="Forward"
        >
          <ChevronRight className="h-4.5 w-4.5" strokeWidth={2.2} />
        </button>
        <button
          type="button"
          onClick={reload}
          className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-white hover:text-slate-800"
          aria-label="Reload"
        >
          <RotateCw className="h-4.5 w-4.5" strokeWidth={2} />
        </button>

        <form onSubmit={handleAddressSubmit} className="mx-1 flex min-w-0 flex-1 items-center">
          <input
            type="text"
            value={addressInput}
            onChange={(e) => setAddressInput(e.target.value)}
            placeholder="http://localhost:5174/sessions/..."
            className="h-8 min-w-0 flex-1 rounded-full border border-slate-300/80 bg-white px-4 text-center font-mono text-[12px] text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-300/70"
            spellCheck={false}
            autoComplete="off"
            aria-label="Preview URL"
          />
          <button
            type="submit"
            className="sr-only"
          >
            Go to preview URL
          </button>
        </form>

        <button
          type="button"
          onClick={() => setFocusMode((enabled) => !enabled)}
          className={cn(
            "rounded-lg p-1.5 transition-colors",
            focusMode ? "bg-blue-50 text-blue-600 ring-1 ring-blue-200" : "text-slate-500 hover:bg-white hover:text-slate-800",
          )}
          aria-label="Inspect preview elements"
          title="Inspect preview elements"
        >
          <Crosshair className="h-4.5 w-4.5" strokeWidth={2} />
        </button>
        <button
          type="button"
          onClick={testPreview}
          disabled={isTesting}
          className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-white hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Test preview"
          title="Run headless preview test"
        >
          <Sparkles className="h-4.5 w-4.5" strokeWidth={2} />
        </button>
        <button
          type="button"
          onClick={() => setIsPreviewFullscreen((full) => !full)}
          className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-white hover:text-slate-800"
          aria-label={isPreviewFullscreen ? "Exit full screen preview" : "Full screen preview"}
          title={isPreviewFullscreen ? "Exit full screen" : "Full screen preview"}
        >
          {isPreviewFullscreen ? <Minimize2 className="h-4.5 w-4.5" strokeWidth={2} /> : <Maximize2 className="h-4.5 w-4.5" strokeWidth={2} />}
        </button>

        <div className="ml-1 flex shrink-0 rounded-full border border-slate-300/70 bg-white p-[2px] shadow-sm" role="tablist" aria-label="Workspace">
          <button
            type="button"
            role="tab"
            aria-selected={workspaceMode === "preview"}
            onClick={() => setWorkspaceMode("preview")}
            className={cn(
              "flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold text-slate-500 transition-all duration-200",
              workspaceMode === "preview" ? "bg-slate-900 text-white shadow-sm" : "hover:text-slate-700",
            )}
          >
            <LayoutTemplate className="h-3 w-3 shrink-0 opacity-90" strokeWidth={2} />
            {sessionStatus === "syncing" ? "Syncing" : "Preview"}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={workspaceMode === "code"}
            onClick={() => setWorkspaceMode("code")}
            className={cn(
              "flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold text-slate-500 transition-all duration-200",
              workspaceMode === "code" ? "bg-slate-900 text-white shadow-sm" : "hover:text-slate-700",
            )}
          >
            <Code2 className="h-3 w-3 shrink-0 opacity-90" strokeWidth={2} />
            Code
          </button>
        </div>
      </header>

      <div className="flex min-h-0 min-w-0 flex-1 flex-row overflow-hidden">
        {workspaceMode === "code" ? (
          <aside className="flex w-[200px] shrink-0 flex-col border-r border-slate-200/70 bg-[#f0f0f0] transition-[width,opacity] duration-300 ease-out">
            <div className="flex items-center justify-between gap-1 border-b border-slate-200/60 px-2 py-1.5">
              <span className="truncate text-[11px] font-medium uppercase tracking-wide text-slate-500">
                {projectLabel}
              </span>
              <div className="flex shrink-0 items-center gap-0.5">
                <button
                  type="button"
                  title="New file"
                  onClick={handleNewFile}
                  className="rounded p-1 text-slate-500 hover:bg-slate-200/70 hover:text-slate-800"
                >
                  <FilePlus className="h-3.5 w-3.5" strokeWidth={1.85} />
                </button>
                <button
                  type="button"
                  title="New folder"
                  onClick={handleNewFolder}
                  className="rounded p-1 text-slate-500 hover:bg-slate-200/70 hover:text-slate-800"
                >
                  <FolderPlus className="h-3.5 w-3.5" strokeWidth={1.85} />
                </button>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden py-1 scrollbar-none">
              <TreeRows
                nodes={tree.children}
                depth={0}
                expanded={expanded}
                toggle={toggleDir}
                activePath={activePath}
                onPick={(p) => setActivePath(p)}
              />
            </div>
          </aside>
        ) : null}

        <div
          className={cn(
            "grid h-full min-h-0 min-w-0 flex-1 bg-white",
            workspaceMode === "code"
              ? "grid-rows-[minmax(0,1fr)_minmax(0,1fr)]"
              : "grid-rows-[minmax(0,1fr)]",
          )}
        >
          {workspaceMode === "code" ? (
            <div className="flex min-h-0 flex-col border-b border-slate-200/60">
              <Suspense
                fallback={
                  <div className="flex min-h-[120px] flex-1 items-center justify-center bg-[#fafafa] text-[12px] text-slate-400">
                    Editor…
                  </div>
                }
              >
                <div className="min-h-0 flex-1">
                  <Editor
                    key={activePath}
                    height="100%"
                    path={activePath || "untitled.tsx"}
                    language={inferLanguage(activePath || ".tsx")}
                    value={editorValue}
                    theme="clyraSuggest"
                    beforeMount={(monaco) => {
                      monaco.editor.defineTheme("clyraSuggest", {
                        base: "vs",
                        inherit: true,
                        rules: [],
                        colors: {
                          "editorSuggestWidget.background": "#ffffff",
                          "editorSuggestWidget.border": "#e2e8f0",
                          "editorSuggestWidget.foreground": "#334155",
                          "editorSuggestWidget.highlightForeground": "#0f172a",
                          "editorSuggestWidget.selectedBackground": "#e8eeff",
                          "editorSuggestWidget.selectedForeground": "#0f172a",
                          "editorSuggestWidget.selectedIconForeground": "#6366f1",
                          "editorSuggestWidget.focusHighlightForeground": "#4338ca",
                          "editorHoverWidget.background": "#ffffff",
                          "editorHoverWidget.border": "#e2e8f0",
                        },
                      });
                    }}
                    onChange={(v) => {
                      const next = v ?? "";
                      setMergedFiles((m) => {
                        if (!activePath) return m;
                        return { ...m, [activePath]: next };
                      });
                    }}
                    options={{
                      readOnly: false,
                      minimap: { enabled: false },
                      fontSize: 12,
                      scrollBeyondLastLine: false,
                      wordWrap: "on",
                      folding: true,
                      lineNumbers: "on",
                      renderLineHighlight: "line",
                      padding: { top: 8, bottom: 8 },
                      smoothScrolling: true,
                      cursorSmoothCaretAnimation: "on",
                      automaticLayout: true,
                      tabSize: 2,
                      quickSuggestions: { other: true, comments: true, strings: true },
                      quickSuggestionsDelay: 4,
                      suggestOnTriggerCharacters: true,
                      suggestSelection: "first",
                      parameterHints: { enabled: true },
                      wordBasedSuggestions: "allDocuments",
                      acceptSuggestionOnEnter: "on",
                      tabCompletion: "on",
                      snippetSuggestions: "top",
                      inlineSuggest: { enabled: true },
                      suggest: {
                        showIcons: true,
                        showStatusBar: false,
                        insertMode: "replace",
                      },
                      unicodeHighlight: { ambiguousCharacters: false },
                    }}
                  />
                </div>
              </Suspense>
            </div>
          ) : null}

          <div className="relative flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden bg-white">
            {(!previewLoaded || lastError) && (
              <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden bg-white/80 backdrop-blur-[1px]">
                <div className="absolute inset-x-0 top-0 h-1/3 animate-[vibe-scan_2.6s_ease-in-out_infinite] bg-gradient-to-b from-transparent via-blue-400/45 to-transparent blur-xl" />
                <div className="absolute left-1/2 top-1/2 h-16 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-100/70 blur-2xl" />
              </div>
            )}
            <div className="absolute left-3 top-3 z-40 flex max-w-[calc(100%-1.5rem)] items-center gap-2 rounded-full border border-slate-200/75 bg-white/90 px-2 py-1 text-[11px] font-medium text-slate-600 shadow-[0_8px_24px_rgba(15,23,42,0.08)] backdrop-blur">
              <span
                className={cn(
                  "h-1.5 w-1.5 shrink-0 rounded-full",
                  healthTone === "ready" && "bg-emerald-500",
                  healthTone === "busy" && "animate-pulse bg-blue-500",
                  healthTone === "warn" && "bg-amber-500",
                  healthTone === "error" && "bg-red-500",
                  healthTone === "idle" && "bg-slate-300",
                )}
                aria-hidden
              />
              <span className="truncate">{healthText}</span>
              {previewNotice ? <span className="hidden max-w-[260px] truncate text-slate-400 sm:inline">{previewNotice}</span> : null}
              {(lastError || testResult?.success === false || testResult?.blank) && onAutoFix ? (
                <button
                  type="button"
                  onClick={requestAutoFix}
                  className="pointer-events-auto ml-1 inline-flex h-6 items-center gap-1 rounded-full bg-slate-900 px-2 text-[10.5px] font-semibold text-white transition-colors hover:bg-slate-800"
                >
                  <Sparkles className="h-3 w-3 text-amber-300" />
                  Auto Fix
                </button>
              ) : null}
            </div>
            <iframe
              key={`vibe-preview-${iframeReload}`}
              title="Vibe live preview"
              ref={iframeRef}
              src={sessionUrl || undefined}
              srcDoc={sessionUrl ? undefined : previewSrcDoc}
              onLoad={() => setPreviewLoaded(true)}
              className="relative z-20 block min-h-0 min-w-0 w-full flex-1 border-0 bg-white"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              referrerPolicy="no-referrer"
            />

            {lastError && workspaceMode === "preview" && (
              <div className="absolute bottom-4 left-4 right-4 z-50">
                <div className="flex flex-col gap-3 rounded-xl border border-red-200 bg-white p-4 shadow-xl shadow-red-900/5 ring-1 ring-red-500/10">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 text-red-600">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-50">
                        <AlertCircle className="h-4 w-4" />
                      </div>
                      <span className="text-[13px] font-semibold tracking-tight">Runtime Error Detected</span>
                    </div>
                    <button 
                      onClick={() => setLastError(null)}
                      className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="rounded-lg bg-red-50/50 px-3 py-2">
                    <p className="font-mono text-[11px] leading-relaxed text-red-700/90 line-clamp-2">
                      {lastError.message}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        if (onAutoFix && lastError) {
                          requestAutoFix();
                        }
                      }}
                      className="group relative flex h-9 flex-1 items-center justify-center gap-2 overflow-hidden rounded-lg bg-slate-900 px-4 text-[12.5px] font-semibold text-white transition-all hover:bg-slate-800 active:scale-[0.98]"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-amber-400 transition-transform group-hover:rotate-12" />
                      Auto Fix with AI
                    </button>
                    <button
                      onClick={reload}
                      className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-[12.5px] font-medium text-slate-600 transition-all hover:bg-slate-50 hover:text-slate-900"
                    >
                      <RotateCw className="h-3.5 w-3.5" />
                      Retry
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
