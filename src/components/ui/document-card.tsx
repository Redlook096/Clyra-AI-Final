import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
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
  Redo2,
  Send,
  Strikethrough,
  Type,
  Underline,
  Undo2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ShiningText } from "../ShiningText";

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
}

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
  const lines = text.split("\n");
  return lines
    .map((line) => `<div>${line ? escapeHtml(line) : "<br>"}</div>`)
    .join("");
}

function normaliseEditorText(text: string): string {
  return cleanDocumentText(
    text
      .replace(/\u00a0/g, " ")
      .replace(/\n{4,}/g, "\n\n\n")
      .trim(),
  );
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
      initial={{ opacity: 0, y: 10, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.99 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      className="clyra-doc-preparing"
    >
      <span className="clyra-doc-preparing-icon">
        <Icon className="h-4 w-4" />
      </span>
      <ShiningText
        text={isEmail ? "Preparing email" : "Preparing notes"}
        preset="thinkingChat"
        className="text-[13.5px] font-medium"
      />
    </motion.div>
  );
}

export function DocumentCardUI({
  content,
  isStreaming,
  className,
  isEmail,
}: DocumentCardUIProps) {
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const editorRef = React.useRef<HTMLDivElement>(null);
  const parsed = React.useMemo(
    () => parseDocumentContent(content, isEmail),
    [content, isEmail],
  );
  const [copied, setCopied] = React.useState(false);
  const [showDropdown, setShowDropdown] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(!isEmail && !isStreaming);
  const [subject, setSubject] = React.useState(parsed.subject);
  const [documentText, setDocumentText] = React.useState(parsed.body);
  const [editorHtml, setEditorHtml] = React.useState(() =>
    textToEditorHtml(parsed.body),
  );
  const [fontFamily, setFontFamily] = React.useState("Inter");
  const [fontSize, setFontSize] = React.useState("3");
  const [fontSizePx, setFontSizePx] = React.useState(16);
  const [blockStyle, setBlockStyle] = React.useState("P");
  const [textColour, setTextColour] = React.useState("#1e293b");
  const [highlightColour, setHighlightColour] = React.useState("#ffffff");

  React.useEffect(() => {
    if (isEditing) return;
    setSubject(parsed.subject);
    setDocumentText(parsed.body);
    setEditorHtml(textToEditorHtml(parsed.body));
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
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const readPlainText = React.useCallback(() => {
    if (editorRef.current) {
      return normaliseEditorText(editorRef.current.innerText);
    }
    return documentText;
  }, [documentText]);

  const handleToggleEditing = React.useCallback(() => {
    if (isEditing) {
      const nextText = readPlainText();
      setDocumentText(nextText);
      setEditorHtml(editorRef.current?.innerHTML ?? textToEditorHtml(nextText));
      setIsEditing(false);
      return;
    }

    setEditorHtml(textToEditorHtml(documentText));
    setIsEditing(true);
  }, [documentText, isEditing, readPlainText]);

  const runCommand = React.useCallback(
    (command: EditorCommand, value?: string) => {
      setIsEditing(true);
      window.requestAnimationFrame(() => {
        editorRef.current?.focus();
        document.execCommand(command, false, value);
        setEditorHtml(editorRef.current?.innerHTML ?? editorHtml);
      });
    },
    [editorHtml],
  );

  const runValueCommand = React.useCallback(
    (
      command: "fontName" | "fontSize" | "foreColor" | "hiliteColor" | "formatBlock",
      value: string,
    ) => {
      setIsEditing(true);
      window.requestAnimationFrame(() => {
        editorRef.current?.focus();
        const didApply = document.execCommand(command, false, value);
        if (!didApply && command === "hiliteColor") {
          document.execCommand("backColor", false, value);
        }
        setEditorHtml(editorRef.current?.innerHTML ?? editorHtml);
      });
    },
    [editorHtml],
  );

  const applyPixelFontSize = React.useCallback(
    (value: number) => {
      const nextSize = Math.max(8, Math.min(72, Math.round(value || 16)));
      setFontSizePx(nextSize);
      setIsEditing(true);
      window.requestAnimationFrame(() => {
        editorRef.current?.focus();
        document.execCommand("fontSize", false, "7");
        editorRef.current?.querySelectorAll('font[size="7"]').forEach((font) => {
          const span = document.createElement("span");
          span.style.fontSize = `${nextSize}px`;
          while (font.firstChild) {
            span.appendChild(font.firstChild);
          }
          font.replaceWith(span);
        });
        setEditorHtml(editorRef.current?.innerHTML ?? editorHtml);
      });
    },
    [editorHtml],
  );

  const handleCopy = async () => {
    const plain = readPlainText();
    await navigator.clipboard.writeText(plain);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const openGmail = () => {
    const body = readPlainText();
    const url = `https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(body)}`;
    window.open(url, "_blank");
    setShowDropdown(false);
  };

  const openOutlook = () => {
    const body = readPlainText();
    const url = `https://outlook.live.com/mail/0/deeplink/compose?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(body)}`;
    window.open(url, "_blank");
    setShowDropdown(false);
  };

  const toolbarDisabled = isStreaming && !isEditing;
  const displayLines = documentText.split("\n");

  return (
    <div
      className={cn(
        "clyra-document-card w-full max-w-4xl mx-auto bg-white rounded-3xl border border-slate-200/80 shadow-[0_4px_24px_rgba(15,23,42,0.04)] overflow-hidden flex flex-col",
        className,
      )}
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

          {isEmail && (
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
                      <ProviderGlyph label="Gmail" />
                      <span>Gmail</span>
                    </button>
                    <button
                      type="button"
                      onClick={openOutlook}
                      className="clyra-doc-provider-button"
                    >
                      <ProviderGlyph label="Outlook" />
                      <span>Outlook</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence initial={false}>
        {isEditing && (
          <motion.div
            className="clyra-doc-toolbar"
            initial={{ opacity: 0, height: 0, y: -8 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -8 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="clyra-doc-tool-group clyra-doc-tool-group--typography">
              <label className="clyra-doc-select">
                <Type className="h-3.5 w-3.5" />
                <select
                  value={fontFamily}
                  disabled={toolbarDisabled}
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

              <label className="clyra-doc-select clyra-doc-select--small">
                <select
                  value={fontSize}
                  disabled={toolbarDisabled}
                  onChange={(event) => {
                    setFontSize(event.target.value);
                    runValueCommand("fontSize", event.target.value);
                  }}
                >
                  <option value="2">Small</option>
                  <option value="3">Normal</option>
                  <option value="4">Large</option>
                  <option value="5">Title</option>
                </select>
              </label>

              <label className="clyra-doc-number">
                <span>px</span>
                <input
                  type="number"
                  min={8}
                  max={72}
                  value={fontSizePx}
                  onChange={(event) => setFontSizePx(Number(event.target.value))}
                  onBlur={() => applyPixelFontSize(fontSizePx)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      applyPixelFontSize(fontSizePx);
                    }
                  }}
                  aria-label="Text size in pixels"
                />
              </label>
            </div>

            <div className="clyra-doc-tool-group">
              <button type="button" className="clyra-doc-tool-button" onClick={() => runCommand("undo")}>
                <Undo2 className="h-4 w-4" />
              </button>
              <button type="button" className="clyra-doc-tool-button" onClick={() => runCommand("redo")}>
                <Redo2 className="h-4 w-4" />
              </button>
            </div>

            <div className="clyra-doc-tool-group">
              <button type="button" className="clyra-doc-tool-button" onClick={() => runCommand("bold")}>
                <Bold className="h-4 w-4" />
              </button>
              <button type="button" className="clyra-doc-tool-button" onClick={() => runCommand("italic")}>
                <Italic className="h-4 w-4" />
              </button>
              <button type="button" className="clyra-doc-tool-button" onClick={() => runCommand("underline")}>
                <Underline className="h-4 w-4" />
              </button>
              <button type="button" className="clyra-doc-tool-button" onClick={() => runCommand("strikeThrough")}>
                <Strikethrough className="h-4 w-4" />
              </button>
            </div>

            <div className="clyra-doc-tool-group">
              <button type="button" className="clyra-doc-tool-button" onClick={() => runCommand("insertUnorderedList")}>
                <List className="h-4 w-4" />
              </button>
              <button type="button" className="clyra-doc-tool-button" onClick={() => runCommand("insertOrderedList")}>
                <ListOrdered className="h-4 w-4" />
              </button>
              <button type="button" className="clyra-doc-tool-button" onClick={() => runCommand("outdent")}>
                <IndentDecrease className="h-4 w-4" />
              </button>
              <button type="button" className="clyra-doc-tool-button" onClick={() => runCommand("indent")}>
                <IndentIncrease className="h-4 w-4" />
              </button>
            </div>

            <div className="clyra-doc-tool-group">
              <button type="button" className="clyra-doc-tool-button" onClick={() => runCommand("justifyLeft")}>
                <AlignLeft className="h-4 w-4" />
              </button>
              <button type="button" className="clyra-doc-tool-button" onClick={() => runCommand("justifyCenter")}>
                <AlignCenter className="h-4 w-4" />
              </button>
              <button type="button" className="clyra-doc-tool-button" onClick={() => runCommand("justifyRight")}>
                <AlignRight className="h-4 w-4" />
              </button>
            </div>

            <div className="clyra-doc-tool-group">
              <button type="button" className="clyra-doc-tool-button" onClick={() => runCommand("removeFormat")}>
                <Eraser className="h-4 w-4" />
              </button>
              <label className="clyra-doc-colour">
                <Palette className="h-3.5 w-3.5" />
                <input
                  type="color"
                  value={textColour}
                  onChange={(event) => {
                    setTextColour(event.target.value);
                    runValueCommand("foreColor", event.target.value);
                  }}
                  aria-label="Text colour"
                />
              </label>
              <label className="clyra-doc-colour">
                <span className="h-3.5 w-3.5 rounded-sm border border-slate-300 bg-white" />
                <input
                  type="color"
                  value={highlightColour}
                  onChange={(event) => {
                    setHighlightColour(event.target.value);
                    runValueCommand("hiliteColor", event.target.value);
                  }}
                  aria-label="Highlight colour"
                />
              </label>
            </div>
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
              <input
                value={subject}
                onChange={(event) => setSubject(cleanDocumentText(event.target.value))}
                className="w-full bg-transparent text-lg font-medium text-slate-800 outline-none placeholder:text-slate-300"
                placeholder="Subject"
              />
            ) : (
              <div className="text-slate-800 font-medium text-lg">
                {subject || "(Subject)"}
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
            key={isEditing ? "editing-body" : "reading-body"}
            className="clyra-doc-body px-6 sm:px-8 py-6 text-slate-800"
            initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -8, filter: "blur(5px)" }}
            transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
          >
            {isEditing ? (
              <div
                ref={editorRef}
                className="clyra-doc-editor"
                contentEditable
                suppressContentEditableWarning
                spellCheck
                dangerouslySetInnerHTML={{ __html: editorHtml }}
                onInput={(event) => {
                  const target = event.currentTarget as HTMLDivElement;
                  setEditorHtml(target.innerHTML);
                  setDocumentText(normaliseEditorText(target.innerText));
                }}
                aria-label={isEmail ? "Editable email body" : "Editable notes"}
              />
	            ) : (
	              <div className="clyra-doc-display">
                {displayLines.map((line, index) => (
	                  <React.Fragment key={`${index}-${line}`}>
	                    {line}
                    {index < displayLines.length - 1 && <br />}
	                  </React.Fragment>
	                ))}
	              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
