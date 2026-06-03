import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { BOARD_SIZE } from "../config/constants";
import {
  getBoardMultiplier,
  getMultiplierClass,
  getMultiplierLabel,
} from "../config/boardConfig";

export function BoardSquare({ row, col, multiplier, children, onSquareClick }) {
  const { isOver, setNodeRef } = useDroppable({
    id: `board-${row}-${col}`,
    data: {
      row,
      col,
    },
  });

  return (
    <div
      ref={setNodeRef}
      onClick={() => onSquareClick && onSquareClick(row, col)}
      className={`board-square ${getMultiplierClass(multiplier)} ${isOver ? "drag-over" : ""}`}
    >
      <span className="multiplier-label">{getMultiplierLabel(multiplier)}</span>
      {children}
    </div>
  );
}

export function Board({ boardState, onSquareClick, renderTile }) {
  const gridSquares = [];

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
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
