import type { ComponentPropsWithoutRef } from "react";
import Markdown, { type Components } from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import oneLight from "react-syntax-highlighter/dist/esm/styles/prism/one-light.js";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { cn } from "../lib/utils";

type CodeProps = ComponentPropsWithoutRef<"code"> & {
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
};

export function MarkdownMessageContent({
  content,
  codeHighlighting = true,
  codePresentation = "default",
  /** When true, fenced blocks are omitted and inline code is plain text (e.g. Vibe mode — no code UI). */
  suppressCodeBlocks = false,
}: {
  content: string;
  codeHighlighting?: boolean;
  /** `soft` = light surface for Vibe coder (no dark code slab). */
  codePresentation?: "default" | "soft";
  suppressCodeBlocks?: boolean;
}) {
  const soft = codePresentation === "soft";

  const components: Partial<Components> = {
    code({ inline, className, children, ...props }: CodeProps) {
          const match = /language-(\w+)/.exec(className || "");
          const text = String(children).replace(/\n$/, "");

          if (suppressCodeBlocks) {
            if (!inline) return null;
            return (
              <span className="text-inherit" {...props}>
                {children}
              </span>
            );
          }

          if (!inline && match && codeHighlighting) {
            return (
              <SyntaxHighlighter
                {...props}
                style={soft ? oneLight : vscDarkPlus}
                language={match[1]}
                PreTag="div"
                className={cn(
                  soft
                    ? "my-3 rounded-xl border border-slate-200/90 shadow-[0_1px_3px_rgba(15,23,42,0.06)] !bg-[hsl(230,1%,98%)]"
                    : "my-2 rounded-lg border border-slate-700/50 !bg-[#1E1E1E]",
                )}
                customStyle={
                  soft
                    ? {
                        margin: 0,
                        padding: "1rem 1.05rem",
                        fontSize: "13px",
                        lineHeight: 1.55,
                      }
                    : undefined
                }
              >
                {text}
              </SyntaxHighlighter>
            );
          }
          return (
            <code
              {...props}
              className={cn(
                "rounded bg-slate-100/80 px-1 py-0.5 font-mono text-[0.9em]",
                className,
              )}
            >
              {children}
            </code>
          );
        },
  };

  if (suppressCodeBlocks) {
    components.pre = ({ children }) => <>{children}</>;
  }

  return (
    <Markdown components={components}>
      {content}
    </Markdown>
  );
}
