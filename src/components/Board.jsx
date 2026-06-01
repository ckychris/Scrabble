import React from "react";
import { useDroppable } from "@dnd-kit/core";

// Helper to determine board multipliers for our 9x9 grid
export function getBoardMultiplier(row, col) {
  if (row === 4 && col === 4) return "STAR";

  // Triple Word (TW) - Corners
  const twCoords = [
    [0, 0],
    [0, 8],
    [8, 0],
    [8, 8],
  ];
  if (twCoords.some(([r, c]) => r === row && c === col)) return "TW";

  // Triple Character (TL) - Edge midpoints
  const tlCoords = [
    [0, 4],
    [4, 0],
    [4, 8],
    [8, 4],
  ];
  if (tlCoords.some(([r, c]) => r === row && c === col)) return "TL";

  // Double Word (DW) - Adjacent to corners
  const dwCoords = [
    [1, 1],
    [1, 7],
    [7, 1],
    [7, 7],
  ];
  if (dwCoords.some(([r, c]) => r === row && c === col)) return "DW";

  // Double Character (DL) - Inner diagonals
  const dlCoords = [
    [2, 2],
    [2, 6],
    [6, 2],
    [6, 6],
  ];
  if (dlCoords.some(([r, c]) => r === row && c === col)) return "DL";

  return null;
}

export function BoardSquare({ row, col, multiplier, children, onSquareClick }) {
  const { isOver, setNodeRef } = useDroppable({
    id: `board-${row}-${col}`,
    data: {
      row,
      col,
    },
  });

  const getMultiplierClass = () => {
    if (multiplier === "STAR") return "center-star";
    if (multiplier === "TW") return "multiplier-tw";
    if (multiplier === "DW") return "multiplier-dw";
    if (multiplier === "TL") return "multiplier-tl";
    if (multiplier === "DL") return "multiplier-dl";
    return "";
  };

  const getMultiplierLabel = () => {
    if (multiplier === "STAR") return "★";
    if (multiplier === "TW") return "TW 3xW";
    if (multiplier === "DW") return "DW 2xW";
    if (multiplier === "TL") return "TL 3xC";
    if (multiplier === "DL") return "DL 2xC";
    return "";
  };

  return (
    <div
      ref={setNodeRef}
      onClick={() => onSquareClick && onSquareClick(row, col)}
      className={`board-square ${getMultiplierClass()} ${isOver ? "drag-over" : ""}`}
    >
      <span className="multiplier-label">{getMultiplierLabel()}</span>
      {children}
    </div>
  );
}

export function Board({ boardState, onSquareClick, renderTile }) {
  const size = 9;
  const gridSquares = [];

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const multiplier = getBoardMultiplier(r, c);
      const tileData = boardState[r][c];

      gridSquares.push(
        <BoardSquare
          key={`sq-${r}-${c}`}
          row={r}
          col={c}
          multiplier={multiplier}
          onSquareClick={onSquareClick}
        >
          {tileData ? renderTile(tileData, false) : null}
        </BoardSquare>,
      );
    }
  }

  return (
    <div className="board-outer-container">
      <div className="board-grid">{gridSquares}</div>
    </div>
  );
}
