// Board and tile-bag construction.

import { BOARD_SIZE } from "../config/constants";
import { shuffleInPlace } from "../utils/shuffle";
import {
  getEntryJyutping,
  getEntryWord,
  normalizeDictionaryEntries,
} from "./words";

export const createEmptyBoard = (size = BOARD_SIZE) =>
  Array.from({ length: size }, () => Array(size).fill(null));

// Points awarded per tile, based on how often the character appears in the
// dictionary: rarer characters are worth more.
const pointsForFrequency = (freq) => {
  if (freq === 1) return 5;
  if (freq === 2) return 4;
  if (freq <= 5) return 3;
  if (freq <= 10) return 2;
  return 1;
};

export function createTileBag(dictionary, idPrefix = "") {
  const entries = normalizeDictionaryEntries(dictionary);
  const charFrequency = {};
  const charJyutping = {};

  entries.forEach((entry) => {
    const word = getEntryWord(entry);
    if (!word) return;

    const jyutpingList = getEntryJyutping(entry).split(/\s+/);

    for (let i = 0; i < word.length; i += 1) {
      const char = word[i];
      charFrequency[char] = (charFrequency[char] || 0) + 1;
      charJyutping[char] = jyutpingList[i] || charJyutping[char] || "";
    }
  });

  const bag = [];
  let tileIdCounter = 0;

  Object.keys(charFrequency).forEach((char) => {
    const freq = charFrequency[char];
    const jyutping = charJyutping[char] || "";
    const points = pointsForFrequency(freq);
    const duplicates = Math.max(1, Math.min(6, freq));

    for (let i = 0; i < duplicates; i += 1) {
      bag.push({
        id: `${idPrefix}tile-${tileIdCounter++}`,
        char,
        jyutping,
        points,
      });
    }
  });

  return shuffleInPlace(bag);
}
