const fs = require('fs');

let content = fs.readFileSync('src/components/ui/document-card.tsx', 'utf8');

// Replace ProviderGlyph with img for Gmail
content = content.replace(
  /<ProviderGlyph label="Gmail" \/>/,
  `<img src="/icons/gmail.svg" alt="Gmail" className="w-5 h-5 rounded-sm object-contain" />`
);

// Replace ProviderGlyph with img for Outlook
content = content.replace(
  /<ProviderGlyph label="Outlook" \/>/,
  `<img src="/icons/outlook.svg" alt="Outlook" className="w-5 h-5 rounded-sm object-contain" />`
);

// Replace ghost text span and add floating UI
content = content.replace(
  /<span\s*className="absolute pointer-events-none text-slate-400 opacity-50 z-50 whitespace-pre"[^]*?<\/span>/,
  `<>
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="absolute pointer-events-none text-slate-400 z-50 whitespace-pre"
              style={{
                left: autocomplete.left,
                top: autocomplete.top,
                fontSize: autocomplete.fontSize,
                fontFamily: autocomplete.fontFamily,
                lineHeight: autocomplete.lineHeight,
                transform: 'translateY(-1.5px)', // Tweak to align perfectly
              }}
            >
              {autocomplete.suggestion.slice(autocomplete.prefix.length)}
            </motion.span>
            
            <motion.div
              initial={{ opacity: 0, y: 4, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.96 }}
              transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
              className="absolute z-50 flex items-center gap-2 bg-white/95 backdrop-blur-md border border-slate-200/80 shadow-[0_8px_32px_rgba(15,23,42,0.12)] rounded-full px-3 py-1.5 pointer-events-none"
              style={{
                left: autocomplete.left,
                top: autocomplete.top + parseInt(autocomplete.lineHeight) + 12 || autocomplete.top + 32,
              }}
            >
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                <span className="text-slate-400 font-medium">Suggesting:</span>
                <span className="text-blue-600">{autocomplete.suggestion}</span>
              </div>
              <div className="w-px h-3.5 bg-slate-200 mx-0.5" />
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Press</span>
                <kbd className="inline-flex items-center justify-center h-5 px-1.5 text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200/80 rounded shadow-sm">Tab</kbd>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">to fill</span>
              </div>
            </motion.div>
          </>`
);

fs.writeFileSync('src/components/ui/document-card.tsx', content);
console.log("Done");
