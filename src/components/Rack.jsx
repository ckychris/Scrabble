import React from 'react';
import { useDroppable } from '@dnd-kit/core';

export function Rack({ tiles, selectedTileId, onTileClick, renderTile, isHidden, onToggleHide }) {
    const { setNodeRef, isOver } = useDroppable({
        id: 'rack-droppable',
        data: {
            isRack: true
        }
    });

    return (
        <div className="rack-outer-container">
            <div className="rack-header">
                <span className="rack-title">Tile Rack • 備用字脾</span>
                <button 
                    className="btn-text btn-toggle-rack" 
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleHide();
                    }}
                >
                    {isHidden ? "👁️ Show Racks" : "🔒 Hide Racks"}
                </button>
            </div>
            
            <div 
                ref={setNodeRef}
                className={`rack-slots-wrapper ${isOver ? 'drag-over' : ''} ${isHidden ? 'hidden-state' : ''}`}
            >
                <div className="rack-wood-shelf"></div>
                <div className="rack-slots">
                    {tiles.map((tile) => (
                        <div key={tile.id} className="rack-slot-box">
                            {!isHidden ? (
                                renderTile(tile, true, selectedTileId === tile.id)
                            ) : (
                                <div className="rack-tile-face-down"></div>
                            )}
                        </div>
                    ))}
                    
                    {/* Render empty slots to ensure there are always at least 7 visible slots */}
                    {Array.from({ length: Math.max(0, 7 - tiles.length) }).map((_, idx) => (
                        <div key={`empty-slot-${idx}`} className="rack-slot-box empty-slot-box"></div>
                    ))}
                </div>
            </div>
        </div>
    );
}
