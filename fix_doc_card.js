const fs = require('fs');

let content = fs.readFileSync('src/components/ui/document-card.tsx', 'utf8');

// 1. Update AutocompleteState and Add dictionary state
content = content.replace(
  /const \[autocomplete, setAutocomplete\] = React\.useState<\{\s*suggestion: string;\s*prefix: string;\s*x: number;\s*y: number;\s*\} \| null>\(null\);/,
  `const [dictionary, setDictionary] = React.useState<string[]>(DICTIONARY);
  React.useEffect(() => {
    fetch('/words.txt')
      .then(res => res.text())
      .then(text => {
        const words = text.split('\\n').map(w => w.trim()).filter(Boolean);
        if (words.length > 0) setDictionary(words);
      })
      .catch(console.error);
  }, []);

  const [autocomplete, setAutocomplete] = React.useState<{
    suggestion: string;
    prefix: string;
    left: number;
    top: number;
    fontSize: string;
    fontFamily: string;
    lineHeight: string;
  } | null>(null);`
);

// 2. Update handleAutocompleteCheck
content = content.replace(
  /const suggestion = DICTIONARY\.find\(word => word\.toLowerCase\(\)\.startsWith\(prefix\.toLowerCase\(\)\) && word\.length > prefix\.length\);/,
  `// Use binary search or fast prefix matching if needed, but array.find is usually fast enough for 300k items in V8.
        const lowerPrefix = prefix.toLowerCase();
        const suggestion = dictionary.find(word => word.startsWith(lowerPrefix) && word.length > prefix.length);`
);

content = content.replace(
  /const cardRect = cardRef\.current\?\.getBoundingClientRect\(\);\s*if \(cardRect\) \{[^]*?y: Math\.max\(8, rect\.top - cardRect\.top - 42\), \/\/ float above cursor\s*\}\);\s*return;\s*\}/,
  `const cardRect = cardRef.current?.getBoundingClientRect();
          const parentElt = target.node.parentElement || editor;
          const parentStyle = window.getComputedStyle(parentElt);

          if (cardRect && rect.width !== undefined) {
            setAutocomplete({
              suggestion,
              prefix,
              left: rect.left - cardRect.left,
              top: rect.top - cardRect.top,
              fontSize: parentStyle.fontSize,
              fontFamily: parentStyle.fontFamily,
              lineHeight: parentStyle.lineHeight,
            });
            return;
          }`
);

// 3. Remove old autocomplete UI and inject new ghost text
content = content.replace(
  /\{autocomplete && \(\s*<div\s*className="absolute z-50 bg-white shadow-xl[^]*?<\/div>\s*\)\}/,
  `{autocomplete && (
        <span
          className="absolute pointer-events-none text-slate-400 opacity-50 z-50 whitespace-pre"
          style={{
            left: autocomplete.left,
            top: autocomplete.top,
            fontSize: autocomplete.fontSize,
            fontFamily: autocomplete.fontFamily,
            lineHeight: autocomplete.lineHeight,
          }}
        >
          {autocomplete.suggestion.slice(autocomplete.prefix.length)}
        </span>
      )}`
);

// 4. Implement Auto-Hyperlink logic in onKeyUp
// First, find the onKeyUp handler:
// onKeyUp={(e) => {
//   saveSelection();
//   if (contextMenu) setContextMenu(null);
//   if (e.key !== "Tab") {
//     handleAutocompleteCheck();
//   }
// }}
content = content.replace(
  /onKeyUp=\{\(e\) => \{\s*saveSelection\(\);\s*if \(contextMenu\) setContextMenu\(null\);\s*if \(e\.key !== "Tab"\) \{\s*handleAutocompleteCheck\(\);\s*\}\s*\}\}/,
  `onKeyUp={(e) => {
                  saveSelection();
                  if (contextMenu) setContextMenu(null);
                  if (e.key !== "Tab") {
                    handleAutocompleteCheck();
                  }

                  // Auto-hyperlinking
                  if (e.key === " " || e.key === "Enter") {
                    const selection = window.getSelection();
                    if (!selection || selection.rangeCount === 0) return;
                    const editor = editorRef.current;
                    if (!editor) return;
                    const target = getEditableTextTarget(editor, selection.focusNode, selection.focusOffset);
                    if (!target) return;
                    const text = target.node.textContent || "";
                    // The word might end right before the space (offset - 1)
                    const offset = e.key === " " ? target.offset - 1 : target.offset;
                    const textBefore = text.slice(0, offset);
                    // Match URLs
                    const urlMatch = textBefore.match(/(https?:\\/\\/[^\\s]+|www\\.[^\\s]+)$/i);
                    if (urlMatch) {
                      const url = urlMatch[1];
                      const actualUrl = url.toLowerCase().startsWith('www.') ? 'https://' + url : url;
                      
                      const newRange = document.createRange();
                      newRange.setStart(target.node, offset - url.length);
                      newRange.setEnd(target.node, offset);
                      
                      selection.removeAllRanges();
                      selection.addRange(newRange);
                      
                      document.execCommand("createLink", false, actualUrl);
                      
                      // Restore cursor position
                      newRange.collapse(false);
                      // If it was a space, move forward
                      if (e.key === " ") {
                        // The space was probably left outside the link
                        // Actually, just move to the end of the text node after the link
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
                }}`
);

fs.writeFileSync('src/components/ui/document-card.tsx', content);
console.log("Done");
