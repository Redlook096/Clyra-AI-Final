import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:3000');
  
  // Wait for the app to load
  await page.waitForSelector('.clyra-doc-card-container');
  
  // Focus the editor
  await page.focus('[contenteditable="true"]');
  
  // Type some text
  await page.keyboard.type('Hello world this is a test.');
  
  // Select "world"
  await page.evaluate(() => {
    const editor = document.querySelector('[contenteditable="true"]');
    const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT);
    let node;
    while(node = walker.nextNode()) {
      if (node.textContent.includes('world')) {
        const range = document.createRange();
        range.setStart(node, 6);
        range.setEnd(node, 11);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        
        // Trigger selectionchange
        document.dispatchEvent(new Event('selectionchange'));
      }
    }
  });

  // Switch to Style tab
  await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('.clyra-doc-tab'));
    const styleTab = tabs.find(t => t.textContent.includes('Style'));
    if (styleTab) styleTab.click();
  });
  
  await new Promise(r => setTimeout(r, 200));

  // Click bold
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('.clyra-doc-tool-button'));
    const boldBtn = buttons.find(b => b.innerHTML.includes('lucide-bold'));
    if (boldBtn) {
       // Simulate pointer down to trigger handleToolPointerDown
       boldBtn.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
       boldBtn.click();
    }
  });
  
  await new Promise(r => setTimeout(r, 200));

  // Get the resulting HTML
  const html = await page.evaluate(() => document.querySelector('[contenteditable="true"]').innerHTML);
  console.log("RESULT HTML:", html);
  
  await browser.close();
})();
