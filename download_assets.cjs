const https = require('https');
const fs = require('fs');

const download = (url, dest) => {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return download(res.headers.location, dest).then(resolve).catch(reject);
      }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', reject);
  });
};

async function run() {
  console.log("Downloading Wikipedia 100k frequent words...");
  await download('https://gist.githubusercontent.com/h3xx/1976236/raw/bbabb412261386673eff521dddbe1dc815373b1d/wiki-100k.txt', 'public/wiki-100k.txt');
  
  console.log("Merging frequency dictionary with full dictionary...");
  const wiki = fs.readFileSync('public/wiki-100k.txt', 'utf8').split('\n').map(w => w.trim().replace(/^#.*/, '')).filter(w => w.length > 0 && /^[a-zA-Z]+$/.test(w));
  const full = fs.readFileSync('public/words.txt', 'utf8').split('\n').map(w => w.trim()).filter(Boolean);
  
  const combined = new Set(wiki);
  full.forEach(w => combined.add(w));
  
  fs.writeFileSync('public/words.txt', Array.from(combined).join('\n'));
  console.log("Dictionary updated to prioritize frequency. Total words: " + combined.size);
  
  console.log("Downloading icons...");
  await download('https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg', 'public/icons/gmail.svg');
  await download('https://upload.wikimedia.org/wikipedia/commons/d/df/Microsoft_Office_Outlook_%282018%E2%80%93present%29.svg', 'public/icons/outlook.svg');
  console.log("Icons downloaded!");
}

run().catch(console.error);
