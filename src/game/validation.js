// Turn validation: checks placement legality (straight line, connectivity,
// no gaps), scans the words formed on the board, validates them against the
// dictionary (including sound-alike matches), and scores the turn.

import { BOARD_SIZE } from "../config/constants";
import { scoreTurn } from "./scoring";
import {
  DEFAULT_WORD_INFO_MAP,
  DEFAULT_WORD_SET,
  findSoundLikeWord,
} from "./words";

const reject = (error) => ({ ok: false, error });

// Determines whether the board has any committed (non-new) tiles yet.
const isOpeningTurn = (board, boardSize) => {
  for (let r = 0; r < boardSize; r += 1) {
    for (let c = 0; c < boardSize; c += 1) {
      if (board[r][c] !== null && !board[r][c].isNew) return false;
    }
  }
  return true;
};

// Confirms a placement is orthogonally adjacent to an existing committed tile.
const touchesExistingTile = (board, placements, boardSize) =>
  placements.some((p) =>
    [
      [p.row - 1, p.col],
      [p.row + 1, p.col],
      [p.row, p.col - 1],
      [p.row, p.col + 1],
    ].some(([r, c]) => {
      if (r < 0 || r >= boardSize || c < 0 || c >= boardSize) return false;
      const tile = board[r][c];
      return tile !== null && !tile.isNew;
    }),
  );

// Walks outward from a cell to read the full contiguous word in one direction.
const scanWordAt = (board, boardSize, r, c, direction) => {
  const wordChars = [];
  const wordJyutping = [];
  const wordCoords = [];

  if (direction === "horizontal") {
    let startCol = c;
    while (startCol > 0 && board[r][startCol - 1] !== null) startCol -= 1;

    let endCol = c;
    while (endCol < boardSize - 1 && board[r][endCol + 1] !== null) endCol += 1;

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
    while (startRow > 0 && board[startRow - 1][c] !== null) startRow -= 1;

    let endRow = r;
    while (endRow < boardSize - 1 && board[endRow + 1][c] !== null) endRow += 1;

    if (endRow - startRow >= 1) {
      for (let row = startRow; row <= endRow; row += 1) {
        const tile = board[row][c];
        wordChars.push(tile.char);
        wordJyutping.push(tile.jyutping || "");
        wordCoords.push({ row, col: c, tile });
      }
    }
  }

  if (wordChars.length < 2) return null;

  return {
    word: wordChars.join(""),
    jyutping: wordJyutping.join(" ").trim(),
    coords: wordCoords,
    key:
      direction === "horizontal"
        ? `h-${r}-${wordCoords[0].col}`
        : `v-${wordCoords[0].row}-${c}`,
  };
};

// Builds a candidate sub-word spanning coords[start..end] of a formed chain.
const buildCandidate = (formed, start, end, trimSide, offset) => {
  const candidateCoords = formed.coords.slice(start, end + 1);
  return {
    ...formed,
    word: candidateCoords.map((coord) => coord.tile.char).join(""),
    jyutping: candidateCoords
      .map((coord) => coord.tile.jyutping || "")
      .join(" ")
      .trim(),
    coords: candidateCoords,
    trimSide,
    offset,
  };
};

// Generates candidate sub-words anchored so the newly placed tiles sit at one
// edge, allowing the longest valid word touching the placement to be matched.
const buildSuffixCandidates = ({ formed, isFirstTurn, placementCount }) => {
  const candidates = [];
  const chainLen = formed.coords.length;
  const newIndexes = formed.coords
    .map((coord, index) => (coord.tile?.isNew ? index : -1))
    .filter((index) => index >= 0);

  if (newIndexes.length === 0) return { candidates, hasNewTile: false };

  const minNewIndex = Math.min(...newIndexes);
  const maxNewIndex = Math.max(...newIndexes);
  const seenRanges = new Set();

  const tryAdd = (start, end, trimSide, offset) => {
    const candidateLen = end - start + 1;
    if (candidateLen < 2) return;
    if (!isFirstTurn && candidateLen <= placementCount) return;

    const rangeKey = `${start}-${end}`;
    if (seenRanges.has(rangeKey)) return;
    seenRanges.add(rangeKey);

    candidates.push(buildCandidate(formed, start, end, trimSide, offset));
  };

  for (let start = 0; start <= minNewIndex; start += 1) {
    tryAdd(start, maxNewIndex, "new-at-end", start);
  }
  for (let end = maxNewIndex; end < chainLen; end += 1) {
    tryAdd(minNewIndex, end, "new-at-start", chainLen - 1 - end);
  }

  return { candidates, hasNewTile: true };
};

export function validateTurnSubmission({
  board,
  placements,
  boardSize = BOARD_SIZE,
  wordSet = DEFAULT_WORD_SET,
  wordInfoMap = DEFAULT_WORD_INFO_MAP,
}) {
  if (!placements || placements.length === 0) {
    return reject("You haven't placed any tiles yet! 您尚未放置字牌");
  }

  const rows = placements.map((p) => p.row);
  const cols = placements.map((p) => p.col);
  const uniqueRows = [...new Set(rows)];
  const uniqueCols = [...new Set(cols)];
  const isHorizontal = uniqueRows.length === 1;
  const isVertical = uniqueCols.length === 1;

  if (!isHorizontal && !isVertical) {
    return reject(
      "Placed tiles must be in a single straight line! 放置的字牌必須在一直線上",
    );
  }

  const commonRow = isHorizontal ? uniqueRows[0] : null;
  const commonCol = isVertical ? uniqueCols[0] : null;

  const isFirstTurn = isOpeningTurn(board, boardSize);

  if (isFirstTurn) {
    const center = Math.floor(boardSize / 2);
    const coversCenter = placements.some(
      (p) => p.row === center && p.col === center,
    );
    if (!coversCenter) {
      return reject(
        `The first word must touch the Center Star (${center},${center})! 首詞必須觸及中心星位`,
      );
    }
  } else if (!touchesExistingTile(board, placements, boardSize)) {
    return reject(
      "Your tiles must connect to an existing word! 字牌必須連接到已提交的詞語",
    );
  }

  // Reject gaps within the run of placed tiles.
  if (isHorizontal) {
    for (let c = Math.min(...cols); c <= Math.max(...cols); c += 1) {
      if (board[commonRow][c] === null) {
        return reject("Word cannot contain gaps! 詞語之間不能有空隙");
      }
    }
  } else {
    for (let r = Math.min(...rows); r <= Math.max(...rows); r += 1) {
      if (board[r][commonCol] === null) {
        return reject("Word cannot contain gaps! 詞語之間不能有空隙");
      }
    }
  }

  const foundWordMap = {};
  placements.forEach((p) => {
    const hWord = scanWordAt(board, boardSize, p.row, p.col, "horizontal");
    const vWord = scanWordAt(board, boardSize, p.row, p.col, "vertical");
    if (hWord) foundWordMap[hWord.key] = hWord;
    if (vWord) foundWordMap[vWord.key] = vWord;
  });

  const formedWords = Object.values(foundWordMap);
  if (formedWords.length === 0) {
    return reject("Placed tiles must form a word! 放置的字牌必須組合成詞");
  }

  const bestByDirection = { left: null, right: null, up: null, down: null };

  for (const formed of formedWords) {
    const { candidates } = buildSuffixCandidates({
      formed,
      isFirstTurn,
      placementCount: placements.length,
    });

    for (const candidate of candidates) {
      const exactInfo = wordInfoMap.get(candidate.word) || null;
      const soundLikeMatch = wordSet.has(candidate.word)
        ? null
        : findSoundLikeWord({
            boardWord: candidate.word,
            formedJyutping: candidate.jyutping,
            wordInfoMap,
          });

      if (!wordSet.has(candidate.word) && !soundLikeMatch) continue;

      const resolvedWord = soundLikeMatch || {
        word: candidate.word,
        jyutping: exactInfo?.jyutping || candidate.jyutping || "",
        eng: exactInfo?.eng || "",
        matchedBySound: false,
      };

      const resolvedCandidate = {
        ...candidate,
        boardWord: formed.word,
        word: resolvedWord.word,
        jyutping: resolvedWord.jyutping || "",
        eng: resolvedWord.eng || "",
        matchedBySound: Boolean(resolvedWord.matchedBySound),
      };

      const isHorizontalWord = candidate.key?.startsWith("h-");
      const directionBucket = isHorizontalWord
        ? candidate.trimSide === "new-at-end"
          ? "left"
          : "right"
        : candidate.trimSide === "new-at-end"
          ? "up"
          : "down";

      const currentBest = bestByDirection[directionBucket];
      if (
        !currentBest ||
        resolvedCandidate.coords.length > currentBest.coords.length
      ) {
        bestByDirection[directionBucket] = resolvedCandidate;
      }
    }
  }

  const validatedWords = ["left", "right", "up", "down"]
    .map((direction) => bestByDirection[direction])
    .filter(Boolean);

  if (validatedWords.length === 0) {
    return reject(
      "At least one formed word must be valid Cantonese! 至少要有一個合法粵語詞彙",
    );
  }

  const { score, isBingo } = scoreTurn({
    validatedWords,
    placementCount: placements.length,
  });

  return {
    ok: true,
    score,
    validatedWords,
    isBingo,
  };
}
