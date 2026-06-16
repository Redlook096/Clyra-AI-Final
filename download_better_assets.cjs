const https = require('https');
const fs = require('fs');

const download = (url, dest) => {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return download(res.headers.location, dest).then(resolve).catch(reject);
      }
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        fs.writeFileSync(dest, body);
        resolve();
      });
    }).on('error', reject);
  });
};

async function run() {
  console.log("Downloading Subtitles 50k frequent words...");
  await download('https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/en/en_50k.txt', 'public/subtitles-50k.txt');
  
  console.log("Downloading DWYL full english list...");
  await download('https://raw.githubusercontent.com/dwyl/english-words/master/words.txt', 'public/dwyl-words.txt');
  
  console.log("Processing and combining...");
  // Format is "word frequency" for subtitles list
  const subs = fs.readFileSync('public/subtitles-50k.txt', 'utf8')
    .split('\n')
    .map(line => line.trim().split(' ')[0])
    .filter(w => w && /^[a-zA-Z]+$/.test(w));
    
  const dwyl = fs.readFileSync('public/dwyl-words.txt', 'utf8')
    .split('\n')
    .map(w => w.trim())
    .filter(w => w && /^[a-zA-Z]+$/.test(w));
    
  const combined = new Set(subs);
  dwyl.forEach(w => combined.add(w));
  
  // Also make sure 'hi' is at the very top just in case
  combined.delete('hi');
  const finalArray = ['hi', ...Array.from(combined)];
  
  fs.writeFileSync('public/words.txt', finalArray.join('\n'));
  console.log("Dictionary updated! Total words: " + finalArray.length);
  
  // Let's create beautiful local SVG files for Gmail and Outlook instead of relying on Wikipedia
  const gmailSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#4285f4" d="M19.7 4.3a2.9 2.9 0 0 0-2.8-.2L12 7 5.1 4.1a2.9 2.9 0 0 0-3.5 1 2.9 2.9 0 0 0-.6 1.8v10.2A3.1 3.1 0 0 0 4.1 20h1.8v-8.5l6.1 4.6 6.1-4.6V20h1.8a3.1 3.1 0 0 0 3.1-2.9V6.9a2.9 2.9 0 0 0-.5-1.8 2.9 2.9 0 0 0-2.8-.8z"/><path fill="#34a853" d="M19.7 20H21v-8.5l-2.3 1.7v5a1.8 1.8 0 0 0 1 1.8z"/><path fill="#fbbc04" d="M22.5 6.9a2.9 2.9 0 0 0-.6-1.8 2.9 2.9 0 0 0-2.8-.8l-7.1 5.3v3l8.5-6.5z"/><path fill="#ea4335" d="M4.3 20H3v-8.5l2.3 1.7v5a1.8 1.8 0 0 1-1 1.8z"/><path fill="#c5221f" d="M1.5 6.9a2.9 2.9 0 0 1 .6-1.8 2.9 2.9 0 0 1 2.8-.8l7.1 5.3v3l-8.5-6.5z"/></svg>`;
  fs.writeFileSync('public/icons/gmail.svg', gmailSvg);
  
  const outlookSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#0078d4" d="M1.5 16.5l8-2.5V3l-8 2.5v11z"/><path fill="#28a8ea" d="M9.5 3v11l13-2V5l-13-2z"/><path fill="#fff" d="M4.5 12.5c-.8 0-1.5-.7-1.5-1.5s.7-1.5 1.5-1.5 1.5.7 1.5 1.5-.7 1.5-1.5 1.5zm0-4.5C3 8 2 9.1 2 10.5S3 13 4.5 13 7 11.9 7 10.5 6 8 4.5 8zm0 4c-.3 0-.5-.2-.5-.5s.2-.5.5-.5.5.2.5.5-.2.5-.5.5zm10-1.5h-4v-1h4v1zm0-3h-4v-1h4v1z"/></svg>`;
  fs.writeFileSync('public/icons/outlook.svg', outlookSvg);
  console.log("SVGs written!");
}

run().catch(console.error);
