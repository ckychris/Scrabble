// Dictionary data and word-matching helpers.
//
// Exposes the validated word set and an info map (Jyutping + English) derived
// from the bundled Cantonese dictionary, plus a "sound-alike" matcher used to
// accept words that share pronunciation but differ in written form.

import dictionaryData from "../data/cantoneseDictionary.json";
import wordSetData from "../data/wordSet.json";

export const DEFAULT_WORD_SET = new Set(wordSetData);

export const DEFAULT_WORD_INFO_MAP = new Map(
  dictionaryData.map((entry) => [
    entry.v,
    {
      jyutping: Array.isArray(entry.j) ? entry.j[0] : entry.j,
      eng: entry.e,
    },
  ]),
);

export const getEntryWord = (entry) => {
  if (typeof entry === "string") return entry;
  return entry?.v ?? entry?.variant ?? entry?.word ?? "";
};

export const getEntryJyutping = (entry) => {
  if (typeof entry === "string") return "";
  const jyutping = entry?.j ?? entry?.jyutping ?? "";
  if (Array.isArray(jyutping)) return jyutping[0] ?? "";
  return jyutping;
};

export const normalizeDictionaryEntries = (dictionary) => {
  if (Array.isArray(dictionary)) return dictionary;

  if (!dictionary || typeof dictionary !== "object") return [];

  const candidateArrays = [
    dictionary.entries,
    dictionary.data,
    dictionary.words,
    dictionary.dictionary,
    dictionary.items,
  ];

  for (const candidate of candidateArrays) {
    if (Array.isArray(candidate)) return candidate;
  }

  return [];
};

const normalizeJyutping = (jyutping) =>
  (jyutping || "").toLowerCase().trim().split(/\s+/).filter(Boolean);

const stripToneMarks = (syllable) => syllable.replace(/[1-6]/g, "");

// Finds a dictionary word that sounds like the formed word (same syllables
// ignoring tone) but is written differently, so homophones can be accepted.
export const findSoundLikeWord = ({
  boardWord,
  formedJyutping,
  wordInfoMap,
}) => {
  const formedSyllables = normalizeJyutping(formedJyutping);
  if (formedSyllables.length < 2) return null;

  const targetSoundKey = formedSyllables
    .map((syllable) => stripToneMarks(syllable))
    .join(" ");
  if (!targetSoundKey) return null;

  for (const [candidateWord, info] of wordInfoMap.entries()) {
    if (!candidateWord || candidateWord === boardWord) continue;
    if (!info?.jyutping) continue;

    const candidateSyllables = normalizeJyutping(info.jyutping);
    if (candidateWord.length !== boardWord.length) continue;
    if (candidateSyllables.length !== formedSyllables.length) continue;

    if (
      candidateSyllables
        .map((syllable) => stripToneMarks(syllable))
        .join(" ") === targetSoundKey
    ) {
      return {
        word: candidateWord,
        jyutping: info.jyutping,
        eng: info.eng || "",
        matchedBySound: true,
      };
    }
  }

  return null;
};
