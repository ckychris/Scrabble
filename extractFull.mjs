// extractFull.mjs - uses already-downloaded local CSV to avoid re-fetching
import { parseCsvFile } from 'words-hk-parse';
import fs from 'fs';
import path from 'path';

console.log('Parsing local CSV (already downloaded)...');

const entries = await parseCsvFile('./csvs/all-1780171501.csv');
console.log(`Parsed ${entries.length} entries`);

const wordSetArr = [];
const richDict = [];

for (const entry of entries) {
  if (!entry.headwords || entry.headwords.length === 0) continue;

  // Get first English definition
  let engDef = '';
  if (entry.senses && entry.senses.length > 0) {
    const s = entry.senses[0];
    if (s.explanation && s.explanation.eng && s.explanation.eng.length > 0) {
      engDef = s.explanation.eng[0];
    }
  }

  for (const hw of entry.headwords) {
    if (!hw.text || hw.text.trim().length === 0) continue;
    const variant = hw.text.trim();
    const jyutping = (hw.readings && hw.readings.length > 0) ? hw.readings[0] : '';

    wordSetArr.push(variant);
    richDict.push({ v: variant, j: jyutping, e: engDef });
  }
}

const uniqueWords = [...new Set(wordSetArr)];
console.log(`Unique word variants: ${uniqueWords.length}`);
console.log(`Rich dict entries: ${richDict.length}`);

const outDir = path.join('src', 'data');
fs.mkdirSync(outDir, { recursive: true });

// wordSet.json — just an array of unique strings for fast Set() lookup in-game
const setPath = path.join(outDir, 'wordSet.json');
fs.writeFileSync(setPath, JSON.stringify(uniqueWords), 'utf-8');
console.log(`wordSet.json → ${(fs.statSync(setPath).size / 1024 / 1024).toFixed(2)} MB`);

// cantoneseDictionary.json — compact {v,j,e} objects for tile bag + popups
const richPath = path.join(outDir, 'cantoneseDictionary.json');
fs.writeFileSync(richPath, JSON.stringify(richDict), 'utf-8');
console.log(`cantoneseDictionary.json → ${(fs.statSync(richPath).size / 1024 / 1024).toFixed(2)} MB`);

console.log('Done!');
