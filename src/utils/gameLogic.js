import dictionaryData from '../data/cantoneseDictionary.json';
import wordSetData from '../data/wordSet.json';

export const BOARD_SIZE = 11;
export const RACK_SIZE = 14;

export const DEFAULT_WORD_SET = new Set(wordSetData);
export const DEFAULT_WORD_INFO_MAP = new Map(
  dictionaryData.map((entry) => [entry.v, { jyutping: entry.j, eng: entry.e }])
);

const getEntryWord = (entry) => {
  if (typeof entry === 'string') return entry;
  return entry?.v ?? entry?.variant ?? entry?.word ?? '';
};

const getEntryJyutping = (entry) => {
  if (typeof entry === 'string') return '';
  return entry?.j ?? entry?.jyutping ?? '';
};

const getEntryEnglish = (entry) => {
  if (typeof entry === 'string') return '';
  return entry?.e ?? entry?.eng ?? '';
};

export const createEmptyBoard = (size = BOARD_SIZE) =>
  Array.from({ length: size }, () => Array(size).fill(null));

export function createTileBag(dictionary) {
  const charFrequency = {};
  const charJyutping = {};

  dictionary.forEach((entry) => {
    const word = getEntryWord(entry);
    if (!word) return;

    const jyutpingList = getEntryJyutping(entry).split(/\s+/);

    for (let i = 0; i < word.length; i += 1) {
      const char = word[i];
      charFrequency[char] = (charFrequency[char] || 0) + 1;
      charJyutping[char] = jyutpingList[i] || charJyutping[char] || '';
    }
  });

  const bag = [];
  let tileIdCounter = 0;

  Object.keys(charFrequency).forEach((char) => {
    const freq = charFrequency[char];
    const jyutping = charJyutping[char] || '';

    let points = 1;
    if (freq === 1) points = 5;
    else if (freq === 2) points = 4;
    else if (freq <= 5) points = 3;
    else if (freq <= 10) points = 2;

    const duplicates = Math.max(1, Math.min(6, freq));

    for (let i = 0; i < duplicates; i += 1) {
      bag.push({
        id: `tile-${tileIdCounter++}`,
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
  return new Set(
    dictionary
      .map((entry) => getEntryWord(entry))
      .filter(Boolean)
  );
}

export function buildWordInfoMap(dictionary) {
  return new Map(
    dictionary
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
      .filter(Boolean)
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
  if (!placements || placements.length === 0) {
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

  if (!isHorizontal && !isVertical) {
    return {
      ok: false,
      error: 'Placed tiles must be in a single straight line! 放置的字牌必須在一直線上',
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

  if (isFirstTurn) {
    const coversCenter = placements.some((p) => p.row === 5 && p.col === 5);
    if (!coversCenter) {
      return {
        ok: false,
        error: 'The first word must touch the Center Star (5,5)! 首詞必須觸及中心星位',
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

    if (!touchesExisting) {
      return {
        ok: false,
        error: 'Your tiles must connect to an existing word! 字牌必須連接到已提交的詞語',
      };
    }
  }

  if (isHorizontal) {
    const minCol = Math.min(...cols);
    const maxCol = Math.max(...cols);
    for (let c = minCol; c <= maxCol; c += 1) {
      if (board[commonRow][c] === null) {
        return {
          ok: false,
          error: 'Word cannot contain gaps! 詞語之間不能有空隙',
        };
      }
    }
  } else {
    const minRow = Math.min(...rows);
    const maxRow = Math.max(...rows);
    for (let r = minRow; r <= maxRow; r += 1) {
      if (board[r][commonCol] === null) {
        return {
          ok: false,
          error: 'Word cannot contain gaps! 詞語之間不能有空隙',
        };
      }
    }
  }

  const scanWordAt = (r, c, direction) => {
    const wordChars = [];
    const wordCoords = [];

    if (direction === 'horizontal') {
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
          wordCoords.push({ row, col: c, tile });
        }
      }
    }

    if (wordChars.length >= 2) {
      const wordString = wordChars.join('');
      const coordKey =
        direction === 'horizontal'
          ? `h-${r}-${wordCoords[0].col}`
          : `v-${wordCoords[0].row}-${c}`;

      return {
        word: wordString,
        coords: wordCoords,
        key: coordKey,
      };
    }

    return null;
  };

  const foundWordMap = {};
  placements.forEach((p) => {
    const hWord = scanWordAt(p.row, p.col, 'horizontal');
    const vWord = scanWordAt(p.row, p.col, 'vertical');

    if (hWord) foundWordMap[hWord.key] = hWord;
    if (vWord) foundWordMap[vWord.key] = vWord;
  });

  const formedWords = Object.values(foundWordMap);

  if (formedWords.length === 0) {
    return {
      ok: false,
      error: 'Placed tiles must form a word! 放置的字牌必須組合成詞',
    };
  }

  const validatedWords = [];
  for (const formed of formedWords) {
    if (!wordSet.has(formed.word)) {
      return {
        ok: false,
        error: `"${formed.word}" is not a valid Cantonese word! "${formed.word}" 不是合法的粵語詞彙`,
      };
    }

    const info = wordInfoMap.get(formed.word) || { jyutping: '', eng: '' };
    validatedWords.push({
      ...formed,
      jyutping: info.jyutping || '',
      eng: info.eng || '',
    });
  }

  let turnScore = 0;
  validatedWords.forEach((wordObj) => {
    let wordMultiplier = 1;
    let wordPoints = 0;

    wordObj.coords.forEach((coord) => {
      const tile = coord.tile;
      let charScore = tile.points;

      if (tile.isNew) {
        const mult = getBoardMultiplier(coord.row, coord.col);
        if (mult === 'DL') charScore *= 2;
        else if (mult === 'TL') charScore *= 3;
        else if (mult === 'DW') wordMultiplier *= 2;
        else if (mult === 'TW') wordMultiplier *= 3;
      }

      wordPoints += charScore;
    });

    turnScore += wordPoints * wordMultiplier;
  });

  const isBingo = placements.length === 7;
  if (isBingo) {
    turnScore += 50;
  }

  return {
    ok: true,
    score: turnScore,
    validatedWords,
    isBingo,
  };
}
