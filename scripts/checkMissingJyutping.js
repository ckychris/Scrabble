import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const d = JSON.parse(
  readFileSync(
    path.join(__dirname, "../src/data/sourceDictionary.json"),
    "utf-8",
  ),
);
const allEntries = d.filter((e) => e.v);
console.log("All entries in sourceDictionary with empty jyutping:");
const badEntries = allEntries.filter((e) => !e.j || e.j.trim() === "");
console.log("Found", badEntries.length, "entries");
badEntries.forEach((e) => console.log({ v: e.v, j: e.j, e: e.e }));
