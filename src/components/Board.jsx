import React from 'react';
import { useDroppable } from '@dnd-kit/core';

// Helper to determine board multipliers for our 11x11 grid
export function getBoardMultiplier(row, col) {
    if (row === 5 && col === 5) return 'STAR';
    
    // Triple Word (TW) - Corners
    const twCoords = [
        [0, 0], [0, 10], [10, 0], [10, 10]
    ];
    if (twCoords.some(([r, c]) => r === row && c === col)) return 'TW';

    // Triple Character (TL) - Midpoints
    const tlCoords = [
        [0, 5], [5, 0], [5, 10], [10, 5]
    ];
    if (tlCoords.some(([r, c]) => r === row && c === col)) return 'TL';

    // Double Word (DW) - Diagonal rings
    const dwCoords = [
        [2, 2], [2, 8], [8, 2], [8, 8]
    ];
    if (dwCoords.some(([r, c]) => r === row && c === col)) return 'DW';

    // Double Character (DL) - Outer diagonals
    const dlCoords = [
        [3, 3], [3, 7], [7, 3], [7, 7]
    ];
    if (dlCoords.some(([r, c]) => r === row && c === col)) return 'DL';

    return null;
}

export function BoardSquare({ row, col, multiplier, children, onSquareClick }) {
    const { isOver, setNodeRef } = useDroppable({
        id: `board-${row}-${col}`,
        data: {
            row,
            col
        }
    });

    const getMultiplierClass = () => {
        if (row === 5 && col === 5) return 'center-star';
        if (multiplier === 'TW') return 'multiplier-tw';
        if (multiplier === 'DW') return 'multiplier-dw';
        if (multiplier === 'TL') return 'multiplier-tl';
        if (multiplier === 'DL') return 'multiplier-dl';
        return '';
    };

    const getMultiplierLabel = () => {
        if (row === 5 && col === 5) return '★';
        if (multiplier === 'TW') return 'TW 3xW';
        if (multiplier === 'DW') return 'DW 2xW';
        if (multiplier === 'TL') return 'TL 3xC';
        if (multiplier === 'DL') return 'DL 2xC';
        return '';
    };

    return (
        <div
            ref={setNodeRef}
            onClick={() => onSquareClick && onSquareClick(row, col)}
            className={`board-square ${getMultiplierClass()} ${isOver ? 'drag-over' : ''}`}
        >
            <span className="multiplier-label">{getMultiplierLabel()}</span>
            {children}
        </div>
    );
}

export function Board({ boardState, onSquareClick, renderTile }) {
    const size = 11;
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
                </BoardSquare>
            );
        }
    }

    return (
        <div className="board-outer-container">
            <div className="board-grid">
                {gridSquares}
            </div>
        </div>
    );
}
