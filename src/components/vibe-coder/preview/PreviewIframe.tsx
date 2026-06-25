import { forwardRef } from "react";
import { cn } from "../../../lib/utils";

export const PreviewIframe = forwardRef<
  HTMLIFrameElement,
  {
    src: string;
    title: string;
    className?: string;
    onLoad?: () => void;
  }
>(function PreviewIframe({ src, title, className, onLoad }, ref) {
  return (
    <iframe
      ref={ref}
      src={src}
      title={title}
      onLoad={onLoad}
      className={cn("h-full w-full border-0 bg-white", className)}
      sandbox="allow-forms allow-modals allow-popups allow-same-origin allow-scripts"
      allow="clipboard-read; clipboard-write"
    />
  );
});
