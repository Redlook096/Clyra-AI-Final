const fs = require('fs');
const DICTIONARY = fs.readFileSync('public/words.txt', 'utf8').split('\n').map(w => w.trim()).filter(Boolean);

function findSuggestion(prefix) {
  const lowerPrefix = prefix.toLowerCase();
  return DICTIONARY.find(word => word.startsWith(lowerPrefix) && word.length > prefix.length);
}

console.log("h:", findSuggestion("h"));
console.log("hi:", findSuggestion("hi"));
console.log("te:", findSuggestion("te"));
console.log("tech:", findSuggestion("tech"));
