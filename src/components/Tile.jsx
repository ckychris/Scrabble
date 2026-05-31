import React from 'react';
import { useDraggable } from '@dnd-kit/core';

export function Tile({ id, char, jyutping, points, isRackTile, isSelected, onClick, style: customStyle }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: id,
        data: {
            id,
            char,
            jyutping,
            points,
            isRackTile
        }
    });

    const dragStyle = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 1000,
        opacity: isDragging ? 0.4 : 1,
        cursor: 'grabbing'
    } : undefined;

    const baseStyle = {
        ...dragStyle,
        ...customStyle
    };

    return (
        <div
            ref={setNodeRef}
            style={baseStyle}
            {...listeners}
            {...attributes}
            onClick={(e) => {
                if (onClick) {
                    onClick(e);
                }
            }}
            className={`game-tile ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''}`}
        >
            <div className="tile-wood-texture"></div>
            <span className="tile-jyutping">{jyutping}</span>
            <span className="tile-char">{char}</span>
            <span className="tile-points">{points}</span>
        </div>
    );
}
