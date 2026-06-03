import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { RACK_SIZE } from "../config/constants";

export function Rack({ tiles, selectedTileId, onTileClick, renderTile }) {
  const { setNodeRef, isOver } = useDroppable({
    id: "rack-droppable",
    data: {
      isRack: true,
    },
  });

  const rackCapacity = RACK_SIZE;

  return (
    <div className="rack-outer-container">
      <div className="rack-header">
        <div className="rack-header-left">
          <span className="rack-title">Tile Rack • 備用字脾</span>
        </div>
      </div>

      <div className={`rack-frame ${isOver ? "drag-over" : ""}`}>
        <div ref={setNodeRef} className="rack-slots-wrapper">
          <div className="rack-slots">
            {tiles.map((tile) => (
              <div key={tile.id} className="rack-slot-box">
                {renderTile(tile, true, selectedTileId === tile.id)}
              </div>
            ))}

            {/* Render empty slots to keep the rack at a full 30-tile capacity */}
            {Array.from({
              length: Math.max(0, rackCapacity - tiles.length),
            }).map((_, idx) => (
              <div
                key={`empty-slot-${idx}`}
                className="rack-slot-box empty-slot-box"
              ></div>
            ))}
          </div>
        </div>
        <div className="rack-wood-shelf"></div>
      </div>
    </div>
  );
}
