const fs = require('fs');

let content = fs.readFileSync('src/components/ui/document-card.tsx', 'utf8');

// 1. Remove dangerous fallback in runCommand
content = content.replace(
  /const restored = restoreSelection\(\);\s*if \(!restored && editorRef\.current\) \{[^]*?lastSelectedTextRef\.current = editorRef\.current\.innerText;\s*\}/,
  `restoreSelection();`
);

// 2. Remove dangerous fallback in runValueCommand
content = content.replace(
  /const restored = restoreSelection\(\);\s*if \(!restored && editorRef\.current\) \{[^]*?lastSelectedTextRef\.current = editorRef\.current\.innerText;\s*\}/,
  `restoreSelection();`
);

// 3. Remove conditional rendering of reading mode and instead toggle contentEditable
// First find the beginning of the block: {isEditing ? ( ... ) : ( <div className="clyra-doc-display"> ... )}
content = content.replace(
  /\{isEditing \? \(\s*<div\s*ref=\{setEditorElement\}/,
  `<div\n                ref={setEditorElement}`
);

content = content.replace(
  /className="clyra-doc-editor"/,
  `className={cn("clyra-doc-editor", !isEditing && "clyra-doc-editor--reading")}`
);

content = content.replace(
  /contentEditable/,
  `contentEditable={isEditing}`
);

content = content.replace(
  /\)\s*\}\s*onFocus=\{saveSelection\}/,
  `}}\n                onFocus={saveSelection}`
);

content = content.replace(
  /aria-label=\{isEmail \? "Editable email body" : "Editable notes"\}\s*\/>\s*\)\s*:\s*\(\s*<div className="clyra-doc-display">[^]*?<\/div>\s*\)/,
  `aria-label={isEmail ? "Editable email body" : "Editable notes"}\n              />`
);

// Also remove dynamic key to stop unmounting
content = content.replace(
  /key=\{isEditing \? "editing-body" : "reading-body"\}/,
  `key="document-body"`
);

fs.writeFileSync('src/components/ui/document-card.tsx', content);
console.log("Done");
