import dictionaryData from "../data/cantoneseDictionary.json";
import wordSetData from "../data/wordSet.json";

export const BOARD_SIZE = 9;
export const RACK_SIZE = 30;

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

const getEntryWord = (entry) => {
  if (typeof entry === "string") return entry;
  return entry?.v ?? entry?.variant ?? entry?.word ?? "";
};

const getEntryJyutping = (entry) => {
  if (typeof entry === "string") return "";
  const jyutping = entry?.j ?? entry?.jyutping ?? "";
  if (Array.isArray(jyutping)) return jyutping[0] ?? "";
  return jyutping;
};

const getEntryEnglish = (entry) => {
  if (typeof entry === "string") return "";
  return entry?.e ?? entry?.eng ?? "";
};

const normalizeDictionaryEntries = (dictionary) => {
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

const findSoundLikeWord = ({ boardWord, formedJyutping, wordInfoMap }) => {
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

export const createEmptyBoard = (size = BOARD_SIZE) =>
  Array.from({ length: size }, () => Array(size).fill(null));

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

    let points = 1;
    if (freq === 1) points = 5;
    else if (freq === 2) points = 4;
    else if (freq <= 5) points = 3;
    else if (freq <= 10) points = 2;

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

  for (let i = bag.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }

  return bag;
}

export function buildWordSet(dictionary) {
  const entries = normalizeDictionaryEntries(dictionary);
  return new Set(entries.map((entry) => getEntryWord(entry)).filter(Boolean));
}

export function buildWordInfoMap(dictionary) {
  const entries = normalizeDictionaryEntries(dictionary);
  return new Map(
    entries
      .map((entry) => {
        const word = getEntryWord(entry);
        if (!word) return null;
        return [
          word,
          {
            jyutping: getEntryJyutping(entry),
            eng: getEntryEnglish(entry),
          },
        ];
      })
      .filter(Boolean),
  );
}

export function validateTurnSubmission({
  board,
  placements,
  boardSize = BOARD_SIZE,
  wordSet = DEFAULT_WORD_SET,
  wordInfoMap = DEFAULT_WORD_INFO_MAP,
  getBoardMultiplier,
}) {
  console.groupCollapsed(
    `[validateTurnSubmission] placements=${placements?.length ?? 0}`,
  );
  console.log("placements:", placements);

  if (!placements || placements.length === 0) {
    console.warn("Rejected: no placements this turn");
    console.groupEnd();
    return {
      ok: false,
      error: "You haven't placed any tiles yet! 您尚未放置字牌",
    };
  }

  const rows = placements.map((p) => p.row);
  const cols = placements.map((p) => p.col);
  const uniqueRows = [...new Set(rows)];
  const uniqueCols = [...new Set(cols)];
  const isHorizontal = uniqueRows.length === 1;
  const isVertical = uniqueCols.length === 1;
  console.log("orientation:", {
    rows,
    cols,
    uniqueRows,
    uniqueCols,
    isHorizontal,
    isVertical,
  });

  if (!isHorizontal && !isVertical) {
    console.warn("Rejected: tiles are not in a straight line");
    console.groupEnd();
    return {
      ok: false,
      error:
        "Placed tiles must be in a single straight line! 放置的字牌必須在一直線上",
    };
  }

  const commonRow = isHorizontal ? uniqueRows[0] : null;
  const commonCol = isVertical ? uniqueCols[0] : null;

  let isFirstTurn = true;
  for (let r = 0; r < boardSize; r += 1) {
    for (let c = 0; c < boardSize; c += 1) {
      if (board[r][c] !== null && !board[r][c].isNew) {
        isFirstTurn = false;
        break;
      }
    }
    if (!isFirstTurn) break;
  }
  console.log("isFirstTurn:", isFirstTurn);

  if (isFirstTurn) {
    const center = Math.floor(boardSize / 2);
    const coversCenter = placements.some(
      (p) => p.row === center && p.col === center,
    );
    console.log("coversCenter:", coversCenter);
    if (!coversCenter) {
      console.warn("Rejected: first move does not cover center");
      console.groupEnd();
      return {
        ok: false,
        error: `The first word must touch the Center Star (${center},${center})! 首詞必須觸及中心星位`,
      };
    }
  } else {
    let touchesExisting = false;
    placements.forEach((p) => {
      const adjacents = [
        [p.row - 1, p.col],
        [p.row + 1, p.col],
        [p.row, p.col - 1],
        [p.row, p.col + 1],
      ];

      adjacents.forEach(([r, c]) => {
        if (r >= 0 && r < boardSize && c >= 0 && c < boardSize) {
          const tile = board[r][c];
          if (tile !== null && !tile.isNew) {
            touchesExisting = true;
          }
        }
      });
    });
    console.log("touchesExisting:", touchesExisting);

    if (!touchesExisting) {
      console.warn("Rejected: no adjacency to existing word");
      console.groupEnd();
      return {
        ok: false,
        error:
          "Your tiles must connect to an existing word! 字牌必須連接到已提交的詞語",
      };
    }
  }

  if (isHorizontal) {
    const minCol = Math.min(...cols);
    const maxCol = Math.max(...cols);
    console.log("gap-check horizontal:", { commonRow, minCol, maxCol });
    for (let c = minCol; c <= maxCol; c += 1) {
      if (board[commonRow][c] === null) {
        console.warn("Rejected: horizontal gap detected", {
          row: commonRow,
          col: c,
        });
        console.groupEnd();
        return {
          ok: false,
          error: "Word cannot contain gaps! 詞語之間不能有空隙",
        };
      }
    }
  } else {
    const minRow = Math.min(...rows);
    const maxRow = Math.max(...rows);
    console.log("gap-check vertical:", { commonCol, minRow, maxRow });
    for (let r = minRow; r <= maxRow; r += 1) {
      if (board[r][commonCol] === null) {
        console.warn("Rejected: vertical gap detected", {
          row: r,
          col: commonCol,
        });
        console.groupEnd();
        return {
          ok: false,
          error: "Word cannot contain gaps! 詞語之間不能有空隙",
        };
      }
    }
  }

  const scanWordAt = (r, c, direction) => {
    const wordChars = [];
    const wordJyutping = [];
    const wordCoords = [];

    if (direction === "horizontal") {
      let startCol = c;
      while (startCol > 0 && board[r][startCol - 1] !== null) {
        startCol -= 1;
      }

      let endCol = c;
      while (endCol < boardSize - 1 && board[r][endCol + 1] !== null) {
        endCol += 1;
      }

      if (endCol - startCol >= 1) {
        for (let col = startCol; col <= endCol; col += 1) {
          const tile = board[r][col];
          wordChars.push(tile.char);
          wordJyutping.push(tile.jyutping || "");
          wordCoords.push({ row: r, col, tile });
        }
      }
    } else {
      let startRow = r;
      while (startRow > 0 && board[startRow - 1][c] !== null) {
        startRow -= 1;
      }

      let endRow = r;
      while (endRow < boardSize - 1 && board[endRow + 1][c] !== null) {
        endRow += 1;
      }

      if (endRow - startRow >= 1) {
        for (let row = startRow; row <= endRow; row += 1) {
          const tile = board[row][c];
          wordChars.push(tile.char);
          wordJyutping.push(tile.jyutping || "");
          wordCoords.push({ row, col: c, tile });
        }
      }
    }

    if (wordChars.length >= 2) {
      const wordString = wordChars.join("");
      const jyutpingString = wordJyutping.join(" ").trim();
      const coordKey =
        direction === "horizontal"
          ? `h-${r}-${wordCoords[0].col}`
          : `v-${wordCoords[0].row}-${c}`;

      return {
        word: wordString,
        jyutping: jyutpingString,
        coords: wordCoords,
        key: coordKey,
      };
    }

    return null;
  };

  const foundWordMap = {};
  placements.forEach((p) => {
    const hWord = scanWordAt(p.row, p.col, "horizontal");
    const vWord = scanWordAt(p.row, p.col, "vertical");

    if (hWord) foundWordMap[hWord.key] = hWord;
    if (vWord) foundWordMap[vWord.key] = vWord;
  });

  const formedWords = Object.values(foundWordMap);
  console.log("formedWords:", formedWords);

  if (formedWords.length === 0) {
    console.warn("Rejected: no formed words found");
    console.groupEnd();
    return {
      ok: false,
      error: "Placed tiles must form a word! 放置的字牌必須組合成詞",
    };
  }

  const validatedWords = [];
  const invalidWords = [];
  for (const formed of formedWords) {
    // Beginner mode: evaluate full word first, then suffixes (BCDE, CDE, DE), longest first.
    const suffixCandidates = [];
    for (let start = 0; start <= formed.coords.length - 2; start += 1) {
      const candidateCoords = formed.coords.slice(start);
      if (candidateCoords.length < 2) continue;

      const candidateWord = candidateCoords
        .map((coord) => coord.tile.char)
        .join("");
      const candidateJyutping = candidateCoords
        .map((coord) => coord.tile.jyutping || "")
        .join(" ")
        .trim();

      suffixCandidates.push({
        ...formed,
        word: candidateWord,
        jyutping: candidateJyutping,
        coords: candidateCoords,
        startOffset: start,
      });
    }

    let matched = null;
    for (const candidate of suffixCandidates) {
      const exactInfo = wordInfoMap.get(candidate.word) || null;
      const soundLikeMatch = wordSet.has(candidate.word)
        ? null
        : findSoundLikeWord({
            boardWord: candidate.word,
            formedJyutping: candidate.jyutping,
            wordInfoMap,
          });

      const isValidWord =
        wordSet.has(candidate.word) || Boolean(soundLikeMatch);

      console.log("dictionary lookup:", candidate.word, {
        sourceWord: formed.word,
        startOffset: candidate.startOffset,
        formedJyutping: candidate.jyutping,
        inWordSet: wordSet.has(candidate.word),
        exactInfo,
        soundLikeMatch,
      });

      if (!isValidWord) {
        continue;
      }

      const resolvedWord = soundLikeMatch || {
        word: candidate.word,
        jyutping: exactInfo?.jyutping || candidate.jyutping || "",
        eng: exactInfo?.eng || "",
        matchedBySound: false,
      };

      matched = {
        ...candidate,
        boardWord: formed.word,
        word: resolvedWord.word,
        jyutping: resolvedWord.jyutping || "",
        eng: resolvedWord.eng || "",
        matchedBySound: Boolean(resolvedWord.matchedBySound),
      };
      break;
    }

    if (!matched) {
      invalidWords.push({
        ...formed,
        boardWord: formed.word,
        word: formed.word,
        jyutping: formed.jyutping || "",
        eng: "",
        matchedBySound: false,
      });
      continue;
    }

    validatedWords.push(matched);
  }

  if (validatedWords.length === 0) {
    console.warn("Rejected: all formed words are invalid", invalidWords);
    console.groupEnd();
    return {
      ok: false,
      error:
        "At least one formed word must be valid Cantonese! 至少要有一個合法粵語詞彙",
    };
  }

  let turnScore = 0;
  validatedWords.forEach((wordObj) => {
    let wordMultiplier = 1;
    let wordPoints = 0;

    console.log("scoring word:", wordObj.word);
    wordObj.coords.forEach((coord) => {
      const tile = coord.tile;
      let charScore = tile.points;
      const multiplier = getBoardMultiplier(coord.row, coord.col);

      if (tile.isNew) {
        if (multiplier === "DL") charScore *= 2;
        else if (multiplier === "TL") charScore *= 3;
        else if (multiplier === "DW") wordMultiplier *= 2;
        else if (multiplier === "TW") wordMultiplier *= 3;
      }

      console.log("tile score:", {
        char: tile.char,
        points: tile.points,
        isNew: tile.isNew,
        multiplier,
        finalCharScore: charScore,
      });
      wordPoints += charScore;
    });

    console.log("word subtotal:", {
      word: wordObj.word,
      wordPoints,
      wordMultiplier,
      wordScore: wordPoints * wordMultiplier,
    });
    turnScore += wordPoints * wordMultiplier;
  });

  const isBingo = placements.length === 7;
  if (isBingo) {
    turnScore += 50;
    console.log("bingo bonus applied: +50");
  }

  console.log("validation success:", {
    score: turnScore,
    validatedWords,
    invalidWords,
    isBingo,
  });
  console.groupEnd();

  return {
    ok: true,
    score: turnScore,
    validatedWords,
    invalidWords,
    isBingo,
  };
}
