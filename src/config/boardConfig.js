// Pure board configuration: multiplier layout for the 9x9 grid plus the
// presentation metadata (CSS class + label) for each multiplier type.
//
// This module is intentionally free of any React/component dependency so that
// game logic can consume `getBoardMultiplier` without importing UI code.

import { BOARD_SIZE } from "./constants";

const CENTER = Math.floor(BOARD_SIZE / 2);

// Triple Word (corners)
const TW_COORDS = [
  [0, 0],
  [0, 8],
  [8, 0],
  [8, 8],
];

// Triple Character (edge midpoints)
const TL_COORDS = [
  [0, 4],
  [4, 0],
  [4, 8],
  [8, 4],
];

// Double Word (adjacent to corners)
const DW_COORDS = [
  [1, 1],
  [1, 7],
  [7, 1],
  [7, 7],
];

// Double Character (inner diagonals)
const DL_COORDS = [
  [2, 2],
  [2, 6],
  [6, 2],
  [6, 6],
];

const matches = (coords, row, col) =>
  coords.some(([r, c]) => r === row && c === col);

export function getBoardMultiplier(row, col) {
  if (row === CENTER && col === CENTER) return "STAR";
  if (matches(TW_COORDS, row, col)) return "TW";
  if (matches(TL_COORDS, row, col)) return "TL";
  if (matches(DW_COORDS, row, col)) return "DW";
  if (matches(DL_COORDS, row, col)) return "DL";
  return null;
}

const MULTIPLIER_PRESENTATION = {
  STAR: { className: "center-star", label: "★" },
  TW: { className: "multiplier-tw", label: "TW 3xW" },
  DW: { className: "multiplier-dw", label: "DW 2xW" },
  TL: { className: "multiplier-tl", label: "TL 3xC" },
  DL: { className: "multiplier-dl", label: "DL 2xC" },
};

export const getMultiplierClass = (multiplier) =>
  MULTIPLIER_PRESENTATION[multiplier]?.className ?? "";

export const getMultiplierLabel = (multiplier) =>
  MULTIPLIER_PRESENTATION[multiplier]?.label ?? "";
