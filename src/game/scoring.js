// Turn scoring: sums character points with board multipliers and applies the
// bingo bonus for playing a full rack of standard size.

import { getBoardMultiplier } from "../config/boardConfig";
import { BINGO_BONUS, BINGO_TILE_COUNT } from "../config/constants";

const scoreWord = (wordObj) => {
  let wordMultiplier = 1;
  let wordPoints = 0;

  wordObj.coords.forEach((coord) => {
    const tile = coord.tile;
    let charScore = tile.points;
    const multiplier = getBoardMultiplier(coord.row, coord.col);

    // Multipliers only apply to tiles placed this turn.
    if (tile.isNew) {
      if (multiplier === "DL") charScore *= 2;
      else if (multiplier === "TL") charScore *= 3;
      else if (multiplier === "DW") wordMultiplier *= 2;
      else if (multiplier === "TW") wordMultiplier *= 3;
    }

    wordPoints += charScore;
  });

  return wordPoints * wordMultiplier;
};

export function scoreTurn({ validatedWords, placementCount }) {
  let turnScore = validatedWords.reduce(
    (total, wordObj) => total + scoreWord(wordObj),
    0,
  );

  const isBingo = placementCount === BINGO_TILE_COUNT;
  if (isBingo) turnScore += BINGO_BONUS;

  return { score: turnScore, isBingo };
}
