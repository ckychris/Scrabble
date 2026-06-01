// extractSource.mjs - curated common Cantonese words for tile bag generation
// Strategy: look up a curated list of common words in the full dictionary to get jyutping/eng

import { parseCsvFile } from "words-hk-parse";
import fs from "fs";
import path from "path";

console.log("Parsing local CSV...");
const entries = await parseCsvFile("./csvs/all-1780171501.csv");
console.log(`Parsed ${entries.length} entries`);

// Build a lookup map: variant text -> {jyutping, eng}
const lookup = new Map();
for (const entry of entries) {
  if (!entry.headwords) continue;
  let engDef = "";
  if (entry.senses?.[0]?.explanation?.eng?.[0]) {
    engDef = entry.senses[0].explanation.eng[0];
  }
  for (const hw of entry.headwords) {
    if (!hw.text?.trim()) continue;
    const v = hw.text.trim();
    const j = hw.readings?.[0] || "";
    if (!lookup.has(v)) lookup.set(v, { j, e: engDef });
  }
}
console.log(`Lookup map: ${lookup.size} entries`);

// Curated list of ~150 common everyday Cantonese words
// Chosen to give a rich, varied tile bag with characters that appear in many words
const CURATED_WORDS = [
  // People & relationships
  "朋友",
  "家人",
  "父母",
  "兄弟",
  "姐妹",
  "老師",
  "學生",
  "醫生",
  "警察",
  "工人",
  "男人",
  "女人",
  "小孩",
  "老人",
  "同事",
  "鄰居",
  "太太",
  "先生",
  "女朋友",
  "男朋友",
  // Daily life
  "食飯",
  "飲水",
  "睡覺",
  "工作",
  "讀書",
  "行路",
  "坐車",
  "返家",
  "出門",
  "買嘢",
  "煮飯",
  "洗碗",
  "打掃",
  "休息",
  "運動",
  "睇書",
  "聽歌",
  "睇戲",
  "打電話",
  "上網",
  // Food & drink
  "早餐",
  "午餐",
  "晚餐",
  "麵包",
  "白飯",
  "炒飯",
  "麵條",
  "湯水",
  "咖啡",
  "奶茶",
  "豬肉",
  "牛肉",
  "雞肉",
  "魚類",
  "蔬菜",
  "水果",
  "點心",
  "燒味",
  "火鍋",
  "煲仔",
  // Places
  "香港",
  "學校",
  "醫院",
  "超市",
  "餐廳",
  "公園",
  "銀行",
  "辦公",
  "地鐵",
  "巴士",
  "機場",
  "酒店",
  "商場",
  "街市",
  "圖書",
  "教堂",
  "政府",
  "大學",
  "中學",
  "小學",
  // Time
  "今日",
  "聽日",
  "昨日",
  "早上",
  "下午",
  "晚上",
  "星期",
  "月份",
  "年頭",
  "節日",
  "時間",
  "分鐘",
  "小時",
  "週末",
  "假期",
  "生日",
  "新年",
  "聖誕",
  "中秋",
  "清明",
  // Emotions & states
  "開心",
  "傷心",
  "快樂",
  "難過",
  "緊張",
  "放鬆",
  "疲倦",
  "精神",
  "健康",
  "生病",
  "擔心",
  "高興",
  "生氣",
  "失望",
  "滿意",
  "驚訝",
  "害怕",
  "興奮",
  "感動",
  "舒服",
  // Common verbs
  "知道",
  "明白",
  "覺得",
  "希望",
  "需要",
  "決定",
  "開始",
  "完成",
  "幫助",
  "準備",
  "記得",
  "忘記",
  "相信",
  "答應",
  "拒絕",
  "選擇",
  "改變",
  "解決",
  "發現",
  "使用",
  // Adjectives
  "好靚",
  "好大",
  "好細",
  "好多",
  "好少",
  "好快",
  "好慢",
  "好難",
  "好易",
  "好貴",
  "便宜",
  "重要",
  "普通",
  "特別",
  "正常",
  "奇怪",
  "有趣",
  "無聊",
  "清楚",
  "複雜",
  // HK culture
  "廣東",
  "粵語",
  "普通",
  "繁體",
  "文化",
  "傳統",
  "社會",
  "經濟",
  "政治",
  "環境",
];

// Filter to only words we can find in the dictionary, and deduplicate
const SOURCE_COUNT = 150;
const result = [];
const seen = new Set();

for (const word of CURATED_WORDS) {
  if (seen.has(word)) continue;
  seen.add(word);

  const info = lookup.get(word);
  if (info) {
    result.push({ v: word, j: info.j, e: info.e });
  } else {
    // Word not in dictionary — include it anyway with empty jyutping/eng
    // (it still contributes characters to the tile bag)
    result.push({ v: word, j: "", e: "" });
    console.log(`  [not in dict] ${word}`);
  }

  if (result.length >= SOURCE_COUNT) break;
}

console.log(`\nSelected ${result.length} source words`);

// Fill in missing jyutping by reconstructing from individual characters
// Build a character map from all available dictionary entries
const charMap = {};
for (const entry of entries) {
  if (!entry.headwords) continue;
  for (const hw of entry.headwords) {
    if (!hw.text?.trim() || !hw.readings?.[0]) continue;
    const v = hw.text.trim();
    const jyutpingList = hw.readings[0].split(/\s+/);
    for (let i = 0; i < v.length; i++) {
      const char = v[i];
      if (!charMap[char]) charMap[char] = jyutpingList[i];
    }
  }
}

// Fill missing jyutping and English descriptions
let filled = 0;
for (const entry of result) {
  if (!entry.j || entry.j.trim() === "") {
    // Reconstruct jyutping from characters
    const reconstructed = [];
    for (const char of entry.v) {
      reconstructed.push(charMap[char] || "");
    }
    entry.j = reconstructed.join(" ").trim();
    if (entry.j) filled++;
  }
  // If English is still missing, generate a simple description
  if (!entry.e || entry.e.trim() === "") {
    entry.e = `${entry.v}`;
  }
}
console.log(
  `Filled ${filled} entries with reconstructed jyutping from character map`,
);

const outDir = path.join("src", "data");
fs.mkdirSync(outDir, { recursive: true });

const outPath = path.join(outDir, "sourceDictionary.json");
fs.writeFileSync(outPath, JSON.stringify(result), "utf-8");
console.log(
  `Source dictionary saved → ${outPath} (${fs.statSync(outPath).size} bytes)`,
);
console.log(
  "Sample:",
  result
    .slice(0, 10)
    .map((w) => `${w.v}(${w.j})`)
    .join(", "),
);
console.log("Done!");
