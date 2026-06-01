import fs from "fs";
import path from "path";

const args = process.argv.slice(2);

const getArgValue = (name, fallback) => {
  const index = args.indexOf(name);
  if (index === -1) return fallback;
  return args[index + 1] ?? fallback;
};

const fileArg = getArgValue("--file", "src/data/cantoneseDictionary.json");
const limitArg = getArgValue("--limit", "100");
const limit = Number.parseInt(limitArg, 10);
const countUniqueWords = !args.includes("--all-entries");

if (!Number.isFinite(limit) || limit <= 0) {
  console.error(`Invalid --limit value: ${limitArg}`);
  process.exit(1);
}

const resolvedPath = path.resolve(fileArg);

if (!fs.existsSync(resolvedPath)) {
  console.error(`Dictionary file not found: ${resolvedPath}`);
  process.exit(1);
}

let dictionary;
try {
  const raw = fs.readFileSync(resolvedPath, "utf-8");
  dictionary = JSON.parse(raw);
} catch (error) {
  console.error(`Failed to load dictionary JSON: ${error.message}`);
  process.exit(1);
}

if (!Array.isArray(dictionary)) {
  console.error("Dictionary must be a JSON array of entries.");
  process.exit(1);
}

const charCounts = new Map();

const words = [];
for (const entry of dictionary) {
  const word =
    typeof entry === "string"
      ? entry
      : (entry?.v ?? entry?.word ?? entry?.variant ?? "");

  if (!word || typeof word !== "string") continue;
  words.push(word);
}

const wordsToCount = countUniqueWords ? [...new Set(words)] : words;

for (const word of wordsToCount) {
  for (const char of word) {
    if (!char.trim()) continue;
    charCounts.set(char, (charCounts.get(char) ?? 0) + 1);
  }
}

const ranked = [...charCounts.entries()]
  .sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1];
    return a[0].localeCompare(b[0], "zh-Hant");
  })
  .slice(0, limit);

console.log(`Dictionary: ${resolvedPath}`);
console.log(
  `Mode: ${countUniqueWords ? "unique words (default)" : "all entries (--all-entries)"}`,
);
console.log(`Total unique chars: ${charCounts.size}`);
console.log(`Top ${Math.min(limit, ranked.length)} chars by frequency:`);
console.log("rank\tchar\tcount");

ranked.forEach(([char, count], index) => {
  console.log(`${index + 1}\t${char}\t${count}`);
});
