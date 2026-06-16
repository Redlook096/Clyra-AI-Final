import * as React from "react";
import { marked } from "marked";
import { AnimatePresence, motion, useMotionValue, useTransform, useSpring, useVelocity } from "motion/react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Check,
  Copy,
  Edit2,
  Eraser,
  IndentDecrease,
  IndentIncrease,
  Italic,
  FileText,
  List,
  ListOrdered,
  Mail,
  Palette,
  Paperclip,
  Redo2,
  Send,
  Strikethrough,
  Type,
  Underline,
  Undo2,
  ArrowDown,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ShiningText } from "../ShiningText";



export type DocumentRewriteMode = "rephrase" | "fix";

export interface DocumentRewriteRequest {
  mode: DocumentRewriteMode;
  selectedText: string;
  applyReplacement: (replacement: string) => void;
}

type EditorCommand =
  | "bold"
  | "italic"
  | "underline"
  | "insertUnorderedList"
  | "insertOrderedList"
  | "justifyLeft"
  | "justifyCenter"
  | "justifyRight"
  | "strikeThrough"
  | "indent"
  | "outdent"
  | "undo"
  | "redo"
  | "removeFormat";

interface DocumentCardUIProps {
  content: string;
  isStreaming?: boolean;
  className?: string;
  isEmail?: boolean;
  onRewriteRequest?: (request: DocumentRewriteRequest) => void;
  onContentChange?: (newContent: string) => void;
}

type ToolTab = "write" | "style" | "layout";

function cleanDocumentText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/```[\s\S]*?```/g, (block) =>
      block.replace(/```[a-z]*\n?/gi, "").replace(/```/g, ""),
    )
    .replace(/\*\*/g, "")
    .replace(/__/g, "")
    .replace(/`/g, "")
    .replace(/^\s{0,3}#{1,6}\s*/gm, "")
    .replace(/^\s*[-*]\s+/gm, "")
    .replace(/\s*--+\s*/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();
}

function cleanEmailBody(body: string): string {
  let cleaned = cleanDocumentText(body);
  cleaned = cleaned.replace(
    /((?:Hi|Dear|Hello)[^\n,]+,)\s*([^\n])/i,
    "$1\n\n$2",
  );
  cleaned = cleaned.replace(
    /([^\n])\s*((?:Kind regards|Best regards|Best|Sincerely|Thanks),)/i,
    "$1\n\n$2",
  );
  return cleaned.trim();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function textToEditorHtml(text: string): string {
  try {
    return marked.parse(text, { async: false }) as string;
  } catch (e) {
    const lines = text.split("\n");
    return lines
      .map((line) => `<div>${line ? escapeHtml(line) : "<br>"}</div>`)
      .join("");
  }
}

function normaliseEditorText(text: string): string {
  return cleanDocumentText(
    text
      .replace(/\u00a0/g, " ")
      .replace(/\n{4,}/g, "\n\n\n")
      .trim(),
  );
}

function getEditableTextTarget(editor: HTMLElement, node: Node | null, offset: number) {
  if (node?.nodeType === Node.TEXT_NODE) {
    return { node: node as Text, offset };
  }

  const searchRoot =
    node && editor.contains(node) && node.nodeType === Node.ELEMENT_NODE
      ? ((node as Element).childNodes[Math.max(0, offset - 1)] as Node | undefined) ||
        node
      : editor;
  if (searchRoot.nodeType === Node.TEXT_NODE) {
    const textNode = searchRoot as Text;
    return {
      node: textNode,
      offset: textNode.textContent?.length ?? 0,
    };
  }
  const walker = document.createTreeWalker(searchRoot, NodeFilter.SHOW_TEXT);
  let current: Text | null = null;
  let lastText: Text | null = null;
  while ((current = walker.nextNode() as Text | null)) {
    if ((current.textContent ?? "").length > 0) lastText = current;
  }
  if (!lastText) return null;
  return {
    node: lastText,
    offset: lastText.textContent?.length ?? 0,
  };
}

function getCaretRect(range: Range) {
  const directRect = range.getBoundingClientRect();
  if (directRect.width || directRect.height) return directRect;

  const marker = document.createElement("span");
  marker.textContent = "\u200b";
  marker.style.display = "inline-block";
  marker.style.width = "1px";
  marker.style.height = "1em";

  const probeRange = range.cloneRange();
  probeRange.collapse(true);
  probeRange.insertNode(marker);
  const markerRect = marker.getBoundingClientRect();
  marker.remove();
  return markerRect;
}

function parseDocumentContent(content: string, isEmail?: boolean) {
  let subject = "";
  let bodyContent = content;

  if (isEmail) {
    const subjectMatch = content.match(/Subject:\s*(.+?)(?:\n|$)/i);
    if (subjectMatch) {
      subject = cleanDocumentText(subjectMatch[1]);
      bodyContent = content
        .substring(subjectMatch.index! + subjectMatch[0].length)
        .trim();
    } else {
      const greetingMatch = content.match(/(?:Hi|Dear|Hello)\s+[\w\s]+,/i);
      if (greetingMatch) {
        bodyContent = content.substring(greetingMatch.index!).trim();
      }
    }
  } else {
    const headingMatch = content.match(/#+\s*(?:Notes?|Meeting Notes?|Summary)/i);
    if (headingMatch) {
      bodyContent = content.substring(headingMatch.index!).trim();
    }
  }

  return {
    subject,
    body: isEmail ? cleanEmailBody(bodyContent) : cleanDocumentText(bodyContent),
  };
}

function ProviderGlyph({ label }: { label: string }) {
  return (
    <span
      aria-hidden="true"
      className="grid h-7 w-7 place-items-center rounded-full border border-slate-200 bg-white text-[11px] font-semibold text-slate-500"
    >
      {label.slice(0, 1)}
    </span>
  );
}

function DocumentPreparingState({ isEmail }: { isEmail?: boolean }) {
  const Icon = isEmail ? Mail : FileText;
  return (
    <motion.div
      key="preparing"
      initial={{ opacity: 0, y: 15, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: -10, filter: "blur(2px)" }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="clyra-doc-preparing flex items-center gap-3"
    >
      <span className="clyra-doc-preparing-icon flex items-center justify-center bg-slate-100 text-slate-500 rounded-lg w-8 h-8 shadow-sm border border-slate-200">
        <Icon className="h-4 w-4" />
      </span>
      <span className="text-[14px] font-[500] tracking-wide bg-gradient-to-r from-slate-500 via-slate-400 to-slate-500 bg-[length:200%_auto] animate-[shimmer_2s_linear_infinite] bg-clip-text text-transparent leading-none">
        {isEmail ? "Drafting email..." : "Preparing document..."}
      </span>
    </motion.div>
  );
}

export function DocumentCardUI({
  content,
  isStreaming,
  className,
  isEmail,
  onRewriteRequest,
  onContentChange,
}: DocumentCardUIProps) {
  const instanceId = React.useId();
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const editorRef = React.useRef<HTMLDivElement>(null);
  const cardRef = React.useRef<HTMLDivElement>(null);
  const savedRangeRef = React.useRef<Range | null>(null);
  const lastNonCollapsedRangeRef = React.useRef<Range | null>(null);
  const lastSelectedTextRef = React.useRef("");
  const rewriteMarkerIdRef = React.useRef<string | null>(null);
  const parsed = React.useMemo(
    () => parseDocumentContent(content, isEmail),
    [content, isEmail],
  );
  const [copied, setCopied] = React.useState(false);
  const [showDropdown, setShowDropdown] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(!isEmail && !isStreaming);
  const [subject, setSubject] = React.useState(parsed.subject);
  const [documentText, setDocumentText] = React.useState(parsed.body);
  const initialHtmlRef = React.useRef(textToEditorHtml(parsed.body));
  const [fontFamily, setFontFamily] = React.useState("Inter");
  const [fontSize, setFontSize] = React.useState("3");
  const [blockStyle, setBlockStyle] = React.useState("P");
  const [textColour, setTextColour] = React.useState("#1e293b");
  const [highlightColour, setHighlightColour] = React.useState("#ffffff");
  const attachmentInputRef = React.useRef<HTMLInputElement>(null);
  const [documentAttachments, setDocumentAttachments] = React.useState<string[]>([]);
  const [activeToolTab, setActiveToolTab] = React.useState<ToolTab>("write");
  const [contextMenu, setContextMenu] = React.useState<{
    x: number;
    y: number;
    text: string;
  } | null>(null);

  const [showScrollDown, setShowScrollDown] = React.useState(false);
  const [showDownloadModal, setShowDownloadModal] = React.useState(false);
  const [downloadFilename, setDownloadFilename] = React.useState("");
  const [isDownloading, setIsDownloading] = React.useState(false);
  const [hoveredToolTab, setHoveredToolTab] = React.useState<string | null>(null);
  const [hoveredSize, setHoveredSize] = React.useState<string | null>(null);
  const [tabDirection, setTabDirection] = React.useState(1);

  const toolTabsMouseX = useMotionValue(0);
  const toolTabsMagneticX = useTransform(toolTabsMouseX, (mouseX) => {
    const padding = 3;
    const offsetStep = 67;
    const rawIndex = (mouseX - padding) / offsetStep;
    const closestIndex = Math.max(0, Math.min(2, Math.round(rawIndex)));
    const closestCenter = padding + closestIndex * offsetStep + 32;

    const minDistance = Math.abs(mouseX - closestCenter);
    const snapZone = 16;
    const releaseZone = 28;

    if (minDistance < snapZone) {
      return closestCenter;
    } else if (minDistance < releaseZone) {
      const t = (minDistance - snapZone) / (releaseZone - snapZone);
      const smoothT = t * t * (3 - 2 * t);
      return closestCenter * (1 - smoothT) + mouseX * smoothT;
    }
    return mouseX;
  });
  const toolTabsSpringX = useSpring(toolTabsMagneticX, { stiffness: 400, damping: 30, mass: 0.3 });
  const toolTabsVelocityX = useVelocity(toolTabsSpringX);
  const toolTabsHoverScaleX = useTransform(toolTabsVelocityX, [-1500, 0, 1500], [1.06, 1, 1.06]);
  const toolTabsHoverOrigin = useTransform(toolTabsVelocityX, [-1500, 0, 1500], ["100% 50%", "50% 50%", "0% 50%"]);
  const toolTabsHoverPillX = useTransform(() => toolTabsSpringX.get() - 32);

  const sizesMouseX = useMotionValue(0);
  const sizesMagneticX = useTransform(sizesMouseX, (mouseX) => {
    const padding = 2;
    const offsetStep = 33;
    const rawIndex = (mouseX - padding) / offsetStep;
    const closestIndex = Math.max(0, Math.min(3, Math.round(rawIndex)));
    const closestCenter = padding + closestIndex * offsetStep + 16;

    const minDistance = Math.abs(mouseX - closestCenter);
    const snapZone = 8;
    const releaseZone = 14;

    if (minDistance < snapZone) {
      return closestCenter;
    } else if (minDistance < releaseZone) {
      const t = (minDistance - snapZone) / (releaseZone - snapZone);
      const smoothT = t * t * (3 - 2 * t);
      return closestCenter * (1 - smoothT) + mouseX * smoothT;
    }
    return mouseX;
  });
  const sizesSpringX = useSpring(sizesMagneticX, { stiffness: 400, damping: 30, mass: 0.3 });
  const sizesVelocityX = useVelocity(sizesSpringX);
  const sizesHoverScaleX = useTransform(sizesVelocityX, [-1500, 0, 1500], [1.06, 1, 1.06]);
  const sizesHoverOrigin = useTransform(sizesVelocityX, [-1500, 0, 1500], ["100% 50%", "50% 50%", "0% 50%"]);
  const sizesHoverPillX = useTransform(() => sizesSpringX.get() - 16);

  const fontSizes = [
    { label: "S", size: "2" },
    { label: "M", size: "3" },
    { label: "L", size: "4" },
    { label: "XL", size: "5" },
  ];

  const handleToolTabChange = React.useCallback((newTab: ToolTab, tabs: Array<{ id: ToolTab; label: string }>) => {
    const currentIndex = tabs.findIndex(t => t.id === activeToolTab);
    const nextIndex = tabs.findIndex(t => t.id === newTab);
    setTabDirection(nextIndex > currentIndex ? 1 : -1);
    setActiveToolTab(newTab);
  }, [activeToolTab]);

  const handleDownload = React.useCallback(async () => {
    if (!editorRef.current) return;
    setIsDownloading(true);
    await new Promise(r => setTimeout(r, 600)); // Fake loading delay for UX

    let plain = editorRef.current.innerText || "";
    if (!plain) {
      plain = documentText;
    }
    
    const format = isEmail ? "eml" : "md";
    const finalName = downloadFilename.trim() || (isEmail ? "Email Draft" : "Document");
    const contentToDownload = isEmail
      ? `Subject: ${subject}\n\n${plain}`
      : plain;

    const blob = new Blob([contentToDownload], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${finalName}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setIsDownloading(false);
    setShowDownloadModal(false);
    setDownloadFilename("");
  }, [downloadFilename, documentText, isEmail, subject]);

  const checkScroll = React.useCallback(() => {
    const el = editorRef.current?.parentElement;
    if (!el) return;
    const isScrollable = el.scrollHeight > el.clientHeight;
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 10;
    setShowScrollDown(isScrollable && !isAtBottom);
  }, []);

  React.useEffect(() => {
    checkScroll();
  }, [documentText, isEditing, checkScroll]);

  const setEditorElement = React.useCallback((node: HTMLDivElement | null) => {
    editorRef.current = node;
    if (node && node.innerHTML !== initialHtmlRef.current) {
      node.innerHTML = initialHtmlRef.current;
    }
  }, []);

  React.useEffect(() => {
    if (isEditing) return;
    setSubject(parsed.subject);
    setDocumentText(parsed.body);
    initialHtmlRef.current = textToEditorHtml(parsed.body);
  }, [isEditing, parsed.body, parsed.subject]);

  React.useEffect(() => {
    if (!isStreaming && !isEmail) {
      setIsEditing(true);
    }
  }, [isEmail, isStreaming]);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
      if (
        contextMenu &&
        cardRef.current &&
        !cardRef.current.contains(event.target as Node)
      ) {
        setContextMenu(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [contextMenu]);

  const saveSelection = React.useCallback(() => {
    const editor = editorRef.current;
    const selection = window.getSelection();
    if (!editor || !selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    if (editor.contains(range.commonAncestorContainer)) {
      savedRangeRef.current = range.cloneRange();
      if (!range.collapsed) {
        lastNonCollapsedRangeRef.current = range.cloneRange();
        lastSelectedTextRef.current = selection.toString();
      }
    }
  }, []);

  const handleContentEdit = React.useCallback(
    (e: React.FormEvent<HTMLDivElement>) => {
      const newText = e.currentTarget.innerText;
      setDocumentText(newText);
      if (onContentChange) {
        if (isEmail) {
          onContentChange(`Subject: ${subject}\n\n${newText}`);
        } else {
          // Ensure it keeps matching the heuristic
          if (newText.match(/(?:notes|summary)/i)) {
            onContentChange(newText);
          } else {
            onContentChange(`# Notes\n\n${newText}`);
          }
        }
      }
      saveSelection();
    },
    [onContentChange, isEmail, subject, saveSelection],
  );

  const handleSubjectEdit = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newSubject = e.target.value;
    setSubject(newSubject);
    if (onContentChange && isEmail) {
      onContentChange(`Subject: ${newSubject}\n\n${documentText}`);
    }
  }, [onContentChange, documentText, isEmail]);

  React.useEffect(() => {
    if (!isEditing) return;

    const handleSelectionChange = () => {
      saveSelection();
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    return () => document.removeEventListener("selectionchange", handleSelectionChange);
  }, [isEditing, saveSelection]);

  const restoreSelection = React.useCallback(() => {
    const editor = editorRef.current;
    const selection = window.getSelection();
    const savedRange = savedRangeRef.current;
    if (!editor || !selection || !savedRange) return false;

    selection.removeAllRanges();
    selection.addRange(savedRange);
    editor.focus({ preventScroll: true });
    return true;
  }, []);

  const syncEditorState = React.useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    initialHtmlRef.current = editor.innerHTML;
    saveSelection();
  }, [saveSelection]);

  const acceptAutocomplete = React.useCallback((e: React.KeyboardEvent) => {
    // Autocomplete removed
  }, []);

  const readPlainText = React.useCallback(() => {
    if (editorRef.current) {
      return normaliseEditorText(editorRef.current.innerText);
    }
    return documentText;
  }, [documentText]);

  const readHtml = React.useCallback(() => {
    return editorRef.current?.innerHTML ?? initialHtmlRef.current;
  }, []);

  const handleToggleEditing = React.useCallback(() => {
    if (isEditing) {
      const nextText = readPlainText();
      setDocumentText(nextText);
      initialHtmlRef.current = editorRef.current?.innerHTML ?? textToEditorHtml(nextText);
      setIsEditing(false);
      return;
    }

    initialHtmlRef.current = textToEditorHtml(documentText);
    setIsEditing(true);
  }, [documentText, isEditing, readPlainText]);

  const runCommand = React.useCallback(
    (command: EditorCommand, value?: string) => {
      setIsEditing(true);
      window.requestAnimationFrame(() => {
        restoreSelection();
        document.execCommand(command, false, value);
        syncEditorState();
      });
    },
    [restoreSelection, syncEditorState],
  );

  const wrapSavedRangeWithStyle = React.useCallback(
    (styles: Partial<CSSStyleDeclaration>) => {
      const editor = editorRef.current;
      if (!editor) return false;

      let range = lastNonCollapsedRangeRef.current ?? savedRangeRef.current;
      const selectedText = lastSelectedTextRef.current.trim();
      const applyToEditorContents = () => {
        Array.from(editor.childNodes).forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            Object.assign((node as HTMLElement).style, styles);
            return;
          }
          if ((node.textContent ?? "").trim()) {
            const wrapper = document.createElement("span");
            Object.assign(wrapper.style, styles);
            wrapper.textContent = node.textContent ?? "";
            node.replaceWith(wrapper);
          }
        });
        const fullRange = document.createRange();
        fullRange.selectNodeContents(editor);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(fullRange);
        savedRangeRef.current = fullRange.cloneRange();
        lastNonCollapsedRangeRef.current = fullRange.cloneRange();
        lastSelectedTextRef.current = editor.innerText;
        syncEditorState();
        return true;
      };

      if ((!range || range.collapsed || !editor.contains(range.commonAncestorContainer)) && selectedText) {
        const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT);
        let current: Text | null = null;
        while ((current = walker.nextNode() as Text | null)) {
          const index = (current.textContent ?? "").indexOf(selectedText);
          if (index >= 0) {
            const recoveredRange = document.createRange();
            recoveredRange.setStart(current, index);
            recoveredRange.setEnd(current, index + selectedText.length);
            range = recoveredRange;
            break;
          }
        }
      }

      if (!range || range.collapsed) return applyToEditorContents();

      const commonAncestor = range.commonAncestorContainer;
      if (!editor.contains(commonAncestor)) return applyToEditorContents();

      const selectedNormalised = normaliseEditorText(selectedText || range.cloneContents().textContent || "");
      const editorNormalised = normaliseEditorText(editor.innerText);
      if (selectedNormalised && selectedNormalised === editorNormalised) {
        return applyToEditorContents();
      }

      const wrapper = document.createElement("span");
      Object.assign(wrapper.style, styles);

      try {
        const contents = range.extractContents();
        wrapper.appendChild(contents);
        range.insertNode(wrapper);

        const selection = window.getSelection();
        const nextRange = document.createRange();
        nextRange.selectNodeContents(wrapper);
        selection?.removeAllRanges();
        selection?.addRange(nextRange);
        savedRangeRef.current = nextRange.cloneRange();
        lastNonCollapsedRangeRef.current = nextRange.cloneRange();
        lastSelectedTextRef.current = wrapper.textContent ?? "";
        syncEditorState();
        return true;
      } catch {
        return false;
      }
    },
    [syncEditorState],
  );

  const runValueCommand = React.useCallback(
    (
      command: "fontName" | "fontSize" | "foreColor" | "hiliteColor" | "formatBlock",
      value: string,
    ) => {
      setIsEditing(true);
      window.requestAnimationFrame(() => {
        if (command === "fontName" && wrapSavedRangeWithStyle({ fontFamily: value })) return;
        if (command === "foreColor" && wrapSavedRangeWithStyle({ color: value })) return;
        if (command === "hiliteColor" && wrapSavedRangeWithStyle({ backgroundColor: value })) return;
        if (command === "fontSize") {
          const pxByCommandSize: Record<string, string> = {
            "2": "13px",
            "3": "16px",
            "4": "20px",
            "5": "28px",
          };
          if (wrapSavedRangeWithStyle({ fontSize: pxByCommandSize[value] ?? "16px" })) return;
        }
        restoreSelection();
        const didApply = document.execCommand(command, false, value);
        if (!didApply && command === "hiliteColor") {
          document.execCommand("backColor", false, value);
        }
        syncEditorState();
      });
    },
    [restoreSelection, syncEditorState, wrapSavedRangeWithStyle],
  );

  const handleToolPointerDown = React.useCallback(
    (event: React.MouseEvent | React.PointerEvent) => {
      event.preventDefault();
      saveSelection();
    },
    [saveSelection],
  );

  const applyNamedFontSize = React.useCallback(
    (value: string) => {
      setFontSize(value);
      runValueCommand("fontSize", value);
    },
    [runValueCommand],
  );

  const replaceSavedSelection = React.useCallback(
    (replacement: string) => {
      setIsEditing(true);
      window.requestAnimationFrame(() => {
        const editor = editorRef.current;
        if (!editor) return;
        const markerId = rewriteMarkerIdRef.current;
        const marker = markerId
          ? editor.querySelector<HTMLElement>(`[data-clyra-rewrite-marker="${markerId}"]`)
          : null;
        const selection = window.getSelection();
        const didRestore = marker ? false : restoreSelection();
        const range = didRestore && selection?.rangeCount ? selection.getRangeAt(0) : null;
        if (!marker && !range) return;

        const lines = replacement.trim().split("\n");

        const wrapper = document.createElement("span");
        wrapper.className = "clyra-rephrase-result";

        lines.forEach((line, index) => {
          if (index > 0) wrapper.appendChild(document.createElement("br"));
          wrapper.appendChild(document.createTextNode(line));
        });

        if (marker) {
          marker.replaceWith(wrapper);
        } else if (range) {
          range.deleteContents();
          range.insertNode(wrapper);
        }

        rewriteMarkerIdRef.current = null;

        selection?.removeAllRanges();
        const nextRange = document.createRange();
        nextRange.setStartAfter(wrapper);
        nextRange.collapse(true);
        selection?.addRange(nextRange);
        savedRangeRef.current = nextRange.cloneRange();
        lastNonCollapsedRangeRef.current = null;
        lastSelectedTextRef.current = "";

        window.requestAnimationFrame(() => {
          wrapper.classList.add("clyra-rephrase-result--settled");
          window.setTimeout(() => {
            const parent = wrapper.parentNode;
            if (!parent) return;
            while (wrapper.firstChild) {
              parent.insertBefore(wrapper.firstChild, wrapper);
            }
            parent.removeChild(wrapper);
            syncEditorState();
          }, 1350);
        });
        syncEditorState();
      });
    },
    [restoreSelection, syncEditorState],
  );

  const handleContextMenu = React.useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      saveSelection();
      const liveSelectionText = window.getSelection()?.toString().trim() ?? "";
      const storedSelectionText =
        lastNonCollapsedRangeRef.current?.cloneContents().textContent?.trim() ?? "";
      const selectionText = liveSelectionText || storedSelectionText;
      if (!selectionText) return;
      event.preventDefault();

      const cardRect = cardRef.current?.getBoundingClientRect();
      setContextMenu({
        x: event.clientX - (cardRect?.left ?? 0),
        y: event.clientY - (cardRect?.top ?? 0),
        text: selectionText,
      });
    },
    [saveSelection],
  );

  const requestRewrite = React.useCallback(
    (mode: DocumentRewriteMode) => {
      if (!contextMenu) return;
      const selectedText = contextMenu.text;
      setContextMenu(null);

      const editor = editorRef.current;
      const selection = window.getSelection();
      const selectedRange = lastNonCollapsedRangeRef.current ?? savedRangeRef.current;

      const markEditorContents = () => {
        if (!editor) return false;
        const markerId = `rewrite-${Date.now()}-${Math.round(Math.random() * 100000)}`;
        const wrapper = document.createElement("div");
        wrapper.className = "clyra-rephrase-mark clyra-rephrase-mark--block";
        wrapper.dataset.clyraRewriteMarker = markerId;
        while (editor.firstChild) {
          wrapper.appendChild(editor.firstChild);
        }
        editor.appendChild(wrapper);
        const markerRange = document.createRange();
        markerRange.selectNode(wrapper);
        savedRangeRef.current = markerRange.cloneRange();
        lastNonCollapsedRangeRef.current = markerRange.cloneRange();
        lastSelectedTextRef.current = wrapper.innerText;
        rewriteMarkerIdRef.current = markerId;
        selection?.removeAllRanges();
        selection?.addRange(markerRange);
        initialHtmlRef.current = editor.innerHTML;
        setDocumentText(normaliseEditorText(editor.innerText));
        return true;
      };

      const markRange = (range: Range) => {
        const markerId = `rewrite-${Date.now()}-${Math.round(Math.random() * 100000)}`;
        const mark = document.createElement("mark");
        mark.className = "clyra-rephrase-mark";
        mark.dataset.clyraRewriteMarker = markerId;
        try {
          const contents = range.extractContents();
          mark.appendChild(contents);
          range.insertNode(mark);
          const markerRange = document.createRange();
          markerRange.selectNode(mark);
          savedRangeRef.current = markerRange.cloneRange();
          lastNonCollapsedRangeRef.current = markerRange.cloneRange();
          rewriteMarkerIdRef.current = markerId;
          selection.removeAllRanges();
          selection.addRange(markerRange);
          if (editorRef.current) {
            initialHtmlRef.current = editorRef.current.innerHTML;
            setDocumentText(normaliseEditorText(editorRef.current.innerText));
          }
          return true;
        } catch (e) {
          rewriteMarkerIdRef.current = null;
          return false;
        }
      };

      let didMark = false;
      if (editor && selectedRange && !selectedRange.collapsed && selection) {
        const range = selectedRange.cloneRange();
        selection.removeAllRanges();
        selection.addRange(range);
        didMark = markRange(range);
      }

      if (!didMark && editor) {
        const normalisedSelection = normaliseEditorText(selectedText);
        const normalisedEditor = normaliseEditorText(editor.innerText);
        if (normalisedSelection && normalisedSelection === normalisedEditor) {
          didMark = markEditorContents();
        } else {
          const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT);
          let current: Text | null = null;
          while ((current = walker.nextNode() as Text | null)) {
            const index = (current.textContent ?? "").indexOf(selectedText);
            if (index >= 0) {
              const textRange = document.createRange();
              textRange.setStart(current, index);
              textRange.setEnd(current, index + selectedText.length);
              didMark = markRange(textRange);
              break;
            }
          }
        }
      }

      if (!didMark && editor && normaliseEditorText(selectedText)) {
        didMark = markEditorContents();
      }

      onRewriteRequest?.({
        mode,
        selectedText,
        applyReplacement: replaceSavedSelection,
      });
    },
    [contextMenu, onRewriteRequest, replaceSavedSelection, restoreSelection],
  );

  const writeRichClipboard = React.useCallback(async () => {
    const html = readHtml();
    const plain = readPlainText();
    try {
      if ("ClipboardItem" in window) {
        await navigator.clipboard.write([
          new ClipboardItem({
            "text/html": new Blob([html], { type: "text/html" }),
            "text/plain": new Blob([plain], { type: "text/plain" }),
          }),
        ]);
        return;
      }
    } catch {
      // Fall back to plain text below if rich clipboard is unavailable.
    }
    await navigator.clipboard.writeText(plain);
  }, [readHtml, readPlainText]);

  const handleCopy = async () => {
    await writeRichClipboard();
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const openGmail = async () => {
    await writeRichClipboard();
    const body = readPlainText();
    const url = `https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(body)}`;
    window.open(url, "_blank");
    setShowDropdown(false);
  };

  const openOutlook = async () => {
    await writeRichClipboard();
    const body = readPlainText();
    const url = `https://outlook.live.com/mail/0/deeplink/compose?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(body)}`;
    window.open(url, "_blank");
    setShowDropdown(false);
  };

  const toolbarDisabled = isStreaming && !isEditing;
  const toolTabs: Array<{ id: ToolTab; label: string }> = [
    { id: "write", label: "Write" },
    { id: "style", label: "Style" },
    { id: "layout", label: "Layout" },
  ];

  return (
    <motion.div
      ref={cardRef}
      className={cn(
        "clyra-document-card w-full max-w-4xl mx-auto bg-white rounded-3xl border border-slate-200/80 shadow-[0_4px_24px_rgba(15,23,42,0.04)] overflow-hidden flex flex-col",
        className,
      )}
      initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-slate-100 relative">
        <button
          type="button"
          onClick={handleToggleEditing}
          disabled={!!isStreaming}
          className={cn(
            "clyra-doc-action",
            isEditing && "clyra-doc-action--active",
          )}
        >
          {isEditing ? <Check className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
          {isEditing ? "Done" : "Edit"}
        </button>

        <div className="flex items-center gap-1.5">
          <motion.button
            type="button"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.96 }}
            onClick={handleCopy}
            disabled={!!isStreaming}
            className="clyra-doc-icon-button"
            aria-label="Copy document"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </motion.button>

          {isEmail ? (
            <div className="relative" ref={dropdownRef}>
              <motion.button
                type="button"
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setShowDropdown(!showDropdown)}
                disabled={!!isStreaming}
                className="clyra-doc-icon-button"
                aria-label="Send email"
              >
                <Send className="w-4 h-4" />
              </motion.button>

              <AnimatePresence>
                {showDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.97 }}
                    transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute right-0 top-full mt-2 w-40 bg-white border border-slate-100 shadow-xl shadow-slate-200/70 rounded-2xl overflow-hidden z-50 flex flex-col p-1.5"
                  >
                    <button
                      type="button"
                      onClick={openGmail}
                      className="clyra-doc-provider-button"
                    >
                      <img src="/icons/gmail.svg" alt="Gmail" className="w-5 h-5 rounded-sm object-contain" />
                      <span>Gmail</span>
                    </button>
                    <button
                      type="button"
                      onClick={openOutlook}
                      className="clyra-doc-provider-button"
                    >
                      <img src="/icons/outlook.svg" alt="Outlook" className="w-5 h-5 rounded-sm object-contain" />
                      <span>Outlook</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <motion.button
              type="button"
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setShowDownloadModal(true)}
              disabled={!!isStreaming}
              className="clyra-doc-icon-button"
              aria-label="Download notes"
            >
              <Download className="w-4 h-4" />
            </motion.button>
          )}
        </div>
      </div>

      <AnimatePresence initial={false}>
        {isEditing && (
          <motion.div
            className="clyra-doc-toolbar"
            onPointerDownCapture={saveSelection}
            initial={{ opacity: 0, height: 0, y: -8 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -8 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          >
            <div
              className="clyra-workflow-tabs relative transition-opacity duration-700 opacity-100"
              role="tablist"
              style={{ padding: 4, zIndex: 0 }}
              onPointerMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                toolTabsMouseX.set(e.clientX - rect.left);
              }}
              onMouseLeave={() => setHoveredToolTab(null)}
              onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                  setHoveredToolTab(null);
                }
              }}
            >
              <AnimatePresence>
                {hoveredToolTab && (
                  <motion.div
                    className="clyra-workflow-tab__hover absolute pointer-events-none"
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
                    style={{
                      x: toolTabsHoverPillX,
                      width: 68,
                      top: 4,
                      bottom: 4,
                      height: "auto",
                      translate: "none",
                      scaleX: toolTabsHoverScaleX,
                      transformOrigin: toolTabsHoverOrigin as any
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 30,
                    }}
                  />
                )}
              </AnimatePresence>
              {toolTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={cn(
                    "clyra-workflow-tab w-[72px] justify-center",
                    activeToolTab === tab.id && "clyra-workflow-tab--active",
                  )}
                  onClick={() => handleToolTabChange(tab.id, toolTabs)}
                  onMouseEnter={() => setHoveredToolTab(tab.id)}
                  onFocus={() => setHoveredToolTab(tab.id)}
                  aria-selected={activeToolTab === tab.id}
                >
                  <span className="relative z-10">{tab.label}</span>
                </button>
              ))}
            </div>

            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={activeToolTab}
                className="clyra-doc-tool-panel w-full"
                initial={{ opacity: 0, x: tabDirection * 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -tabDirection * 12 }}
                transition={{ type: "spring", stiffness: 450, damping: 40 }}
              >
                {activeToolTab === "write" && (
                  <div className="flex items-center justify-center gap-4 w-full flex-wrap">
                    {!isEmail && (
                      <div className="clyra-doc-tool-group clyra-doc-tool-group--typography">
                        <label className="clyra-doc-select">
                          <Type className="h-3.5 w-3.5" />
                          <select
                            value={fontFamily}
                            disabled={toolbarDisabled}
                            onFocus={saveSelection}
                            onChange={(event) => {
                              setFontFamily(event.target.value);
                              runValueCommand("fontName", event.target.value);
                            }}
                          >
                            <option value="Inter">Inter</option>
                            <option value="Arial">Arial</option>
                            <option value="Georgia">Georgia</option>
                            <option value="Times New Roman">Times</option>
                            <option value="Courier New">Mono</option>
                          </select>
                        </label>

                        <label className="clyra-doc-select clyra-doc-select--block">
                          <select
                            value={blockStyle}
                            disabled={toolbarDisabled}
                            onFocus={saveSelection}
                            onChange={(event) => {
                              setBlockStyle(event.target.value);
                              runValueCommand("formatBlock", event.target.value);
                            }}
                          >
                            <option value="P">Paragraph</option>
                            <option value="H2">Heading</option>
                            <option value="H3">Subhead</option>
                            <option value="BLOCKQUOTE">Quote</option>
                          </select>
                        </label>
                      </div>
                    )}
                    <div className="clyra-doc-tool-group">
                      <button type="button" className="clyra-doc-tool-button" onPointerDown={handleToolPointerDown} onClick={() => runCommand("undo")}>
                        <Undo2 className="h-4 w-4" />
                      </button>
                      <button type="button" className="clyra-doc-tool-button" onPointerDown={handleToolPointerDown} onClick={() => runCommand("redo")}>
                        <Redo2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}

                {activeToolTab === "style" && (
                  <div className="flex items-center justify-center gap-1 sm:gap-1.5 py-1 flex-nowrap overflow-x-auto scrollbar-none w-full">
                    <div className="flex items-center gap-1 shrink-0">
                      <button type="button" className="clyra-doc-tool-button" onPointerDown={handleToolPointerDown} onClick={() => runCommand("bold")} aria-label="Bold">
                        <Bold className="h-4 w-4" />
                      </button>
                      <button type="button" className="clyra-doc-tool-button" onPointerDown={handleToolPointerDown} onClick={() => runCommand("italic")} aria-label="Italic">
                        <Italic className="h-4 w-4" />
                      </button>
                      <button type="button" className="clyra-doc-tool-button" onPointerDown={handleToolPointerDown} onClick={() => runCommand("underline")} aria-label="Underline">
                        <Underline className="h-4 w-4" />
                      </button>
                      <button type="button" className="clyra-doc-tool-button" onPointerDown={handleToolPointerDown} onClick={() => runCommand("strikeThrough")} aria-label="Strikethrough">
                        <Strikethrough className="h-4 w-4" />
                      </button>
                    </div>

                    {!isEmail && (
                      <>
                        <div className="w-[1px] h-4 bg-slate-200/80 mx-0.5 shrink-0" />
                        <div className="flex items-center gap-1 shrink-0">
                          <label className="clyra-doc-colour clyra-doc-colour--compact" title="Text Color">
                            <Palette className="h-[14px] w-[14px]" />
                            <input
                              type="color"
                              value={textColour}
                              onPointerDown={saveSelection}
                              onFocus={saveSelection}
                              onChange={(event) => {
                                setTextColour(event.target.value);
                                runValueCommand("foreColor", event.target.value);
                              }}
                            />
                          </label>
                          <label className="clyra-doc-colour clyra-doc-colour--compact" title="Highlight Color">
                            <span className="h-[14px] w-[14px] rounded-[3px] border border-slate-300 bg-white" />
                            <input
                              type="color"
                              value={highlightColour}
                              onPointerDown={saveSelection}
                              onFocus={saveSelection}
                              onChange={(event) => {
                                setHighlightColour(event.target.value);
                                runValueCommand("hiliteColor", event.target.value);
                              }}
                            />
                          </label>
                        </div>
                        
                        <div className="w-[1px] h-4 bg-slate-200/80 mx-0.5 shrink-0" />
                        
                        <div
                          className="clyra-doc-size-options relative"
                          aria-label="Text size"
                          onMouseEnter={() => setHoveredSize(true)}
                        >
                          <div
                            className="clyra-workflow-tabs relative transition-opacity duration-700 opacity-100 ml-auto"
                            role="tablist"
                            style={{ padding: 4, zIndex: 0 }}
                            onPointerMove={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              sizesMouseX.set(e.clientX - rect.left);
                            }}
                            onMouseLeave={() => setHoveredSize(null)}
                            onBlur={(e) => {
                              if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                                setHoveredSize(null);
                              }
                            }}
                          >
                            <AnimatePresence>
                              {hoveredSize && (
                                <motion.div
                                  className="clyra-workflow-tab__hover absolute pointer-events-none"
                                  initial={{ opacity: 0, scale: 0.85 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
                                  style={{
                                    x: sizesHoverPillX,
                                    width: 28,
                                    top: 4,
                                    bottom: 4,
                                    height: "auto",
                                    translate: "none",
                                    scaleX: sizesHoverScaleX,
                                    transformOrigin: sizesHoverOrigin as any
                                  }}
                                  transition={{
                                    type: "spring",
                                    stiffness: 400,
                                    damping: 30,
                                  }}
                                />
                              )}
                            </AnimatePresence>
                            {fontSizes.map(({ label, size: s }) => (
                              <button
                                key={label}
                                type="button"
                                className={cn(
                                  "clyra-workflow-tab w-[32px] justify-center",
                                  fontSize === s && "clyra-workflow-tab--active",
                                )}
                                onClick={() => applyNamedFontSize(s)}
                                onMouseEnter={() => setHoveredSize(s)}
                                onFocus={() => setHoveredSize(s)}
                              >
                                <span className="relative z-10">{label}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {activeToolTab === "layout" && (
                  <div className="flex items-center justify-center gap-4 w-full flex-wrap">
                    <div className="clyra-doc-tool-group">
                      <button type="button" className="clyra-doc-tool-button" onPointerDown={handleToolPointerDown} onClick={() => runCommand("insertUnorderedList")}>
                        <List className="h-4 w-4" />
                      </button>
                      <button type="button" className="clyra-doc-tool-button" onPointerDown={handleToolPointerDown} onClick={() => runCommand("insertOrderedList")}>
                        <ListOrdered className="h-4 w-4" />
                      </button>
                      <button type="button" className="clyra-doc-tool-button" onPointerDown={handleToolPointerDown} onClick={() => runCommand("outdent")}>
                        <IndentDecrease className="h-4 w-4" />
                      </button>
                      <button type="button" className="clyra-doc-tool-button" onPointerDown={handleToolPointerDown} onClick={() => runCommand("indent")}>
                        <IndentIncrease className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="clyra-doc-tool-group">
                      <button type="button" className="clyra-doc-tool-button" onPointerDown={handleToolPointerDown} onClick={() => runCommand("justifyLeft")}>
                        <AlignLeft className="h-4 w-4" />
                      </button>
                      <button type="button" className="clyra-doc-tool-button" onPointerDown={handleToolPointerDown} onClick={() => runCommand("justifyCenter")}>
                        <AlignCenter className="h-4 w-4" />
                      </button>
                      <button type="button" className="clyra-doc-tool-button" onPointerDown={handleToolPointerDown} onClick={() => runCommand("justifyRight")}>
                        <AlignRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence initial={false}>
        {!isStreaming && isEmail && (
          <motion.div
            className="px-6 sm:px-8 py-4 border-b border-slate-100"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
          >
            {isEditing ? (
              <label className="clyra-doc-field">
                <span>Subject</span>
                <input
                  value={subject}
                  onChange={handleSubjectEdit}
                  className="w-full bg-transparent text-lg font-medium text-slate-800 outline-none placeholder:text-slate-300"
                  placeholder="Add a subject"
                />
              </label>
            ) : (
              <div className="clyra-doc-field">
                <span>Subject</span>
                <div className="text-slate-800 font-medium text-lg">
                {subject || "(Subject)"}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait" initial={false}>
        {isStreaming ? (
          <motion.div
            className="clyra-doc-body clyra-doc-body--preparing px-6 sm:px-8 py-6"
            key="preparing-body"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <DocumentPreparingState isEmail={isEmail} />
          </motion.div>
        ) : (
          <motion.div
            key="document-body"
            className={cn(
              "clyra-doc-body px-6 sm:px-8 py-6 text-slate-800",
              isEmail ? "clyra-doc-card-container--email" : "",
            )}
            initial={{ opacity: 0, y: 24, filter: "blur(8px)", scale: 0.98 }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)", scale: 1 }}
            exit={{ opacity: 0, y: -8, filter: "blur(5px)" }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            onScroll={() => window.requestAnimationFrame(checkScroll)}
          >
            <div className="clyra-doc-body-label">{isEmail ? "Message" : "Notes"}</div>
            <div
                ref={setEditorElement}
                className={cn("clyra-doc-editor", !isEditing && "clyra-doc-editor--reading")}
                contentEditable={isEditing}
                suppressContentEditableWarning
                spellCheck
                onMouseUp={saveSelection}
                onInput={handleContentEdit}
                onKeyDown={acceptAutocomplete}
                onKeyUp={(e) => {
                  saveSelection();
                  if (contextMenu) setContextMenu(null);

                  if (e.key === " " || e.key === "Enter") {
                    const selection = window.getSelection();
                    if (!selection || selection.rangeCount === 0) return;
                    const editor = editorRef.current;
                    if (!editor) return;
                    const target = getEditableTextTarget(editor, selection.focusNode, selection.focusOffset);
                    if (!target) return;
                    const text = target.node.textContent || "";
                    const offset = e.key === " " ? target.offset - 1 : target.offset;
                    const textBefore = text.slice(0, offset);
                    const urlMatch = textBefore.match(/(https?:\/\/[^\s]+|www\.[^\s]+)$/i);
                    
                    if (urlMatch) {
                      const url = urlMatch[1];
                      const actualUrl = url.toLowerCase().startsWith('www.') ? 'https://' + url : url;
                      
                      const newRange = document.createRange();
                      newRange.setStart(target.node, offset - url.length);
                      newRange.setEnd(target.node, offset);
                      
                      selection.removeAllRanges();
                      selection.addRange(newRange);
                      
                      document.execCommand("createLink", false, actualUrl);
                      
                      newRange.collapse(false);
                      if (e.key === " ") {
                        selection.removeAllRanges();
                        const nextNode = getEditableTextTarget(editor, selection.focusNode, selection.focusOffset);
                        if (nextNode && nextNode.node) {
                          const endRange = document.createRange();
                          endRange.setStart(nextNode.node, nextNode.offset);
                          endRange.collapse(true);
                          selection.addRange(endRange);
                        }
                      }
                      syncEditorState();
                    }
                  }
                }}
                onFocus={saveSelection}
	                onContextMenu={handleContextMenu}
                aria-label={isEmail ? "Editable email body" : "Editable notes"}
              />

          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {contextMenu && (
          <motion.div
            className="clyra-doc-context-menu"
            style={{ left: contextMenu.x, top: contextMenu.y }}
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
          >
            <button
              type="button"
              onClick={() => requestRewrite("rephrase")}
            >
              Rephrase selection
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showScrollDown && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center justify-center w-8 h-8 rounded-full bg-white/90 backdrop-blur-xl border border-slate-200/80 shadow-[0_8px_24px_rgba(15,23,42,0.12)] text-slate-500 pointer-events-none z-10"
          >
            <ArrowDown className="w-4 h-4" />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDownloadModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[100]"
              onClick={() => setShowDownloadModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/95 backdrop-blur-xl border border-slate-200/60 shadow-[0_16px_40px_rgba(15,23,42,0.08)] rounded-[20px] p-2 w-[90%] max-w-[340px] z-[101] flex items-center gap-2"
            >
              <input
                autoFocus
                type="text"
                value={downloadFilename}
                onChange={(e) => setDownloadFilename(e.target.value)}
                placeholder="Name your file..."
                className="flex-1 bg-slate-100/80 px-4 py-2.5 rounded-[14px] text-[14px] font-medium text-slate-800 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isDownloading) handleDownload();
                  if (e.key === "Escape") setShowDownloadModal(false);
                }}
              />
              <button
                disabled={isDownloading}
                onClick={handleDownload}
                className="flex-shrink-0 flex items-center justify-center w-[42px] h-[42px] bg-slate-900 hover:bg-slate-800 disabled:bg-slate-800/80 text-white rounded-[14px] transition-colors shadow-sm"
                aria-label="Save file"
              >
                {isDownloading ? (
                  <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
