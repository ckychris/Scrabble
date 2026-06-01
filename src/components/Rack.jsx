import React from "react";
import { useDroppable } from "@dnd-kit/core";

export function Rack({
  tiles,
  selectedTileId,
  onTileClick,
  renderTile,
  isHidden,
  onToggleHide,
  alertMessage,
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: "rack-droppable",
    data: {
      isRack: true,
    },
  });

  const rackCapacity = 30;

  return (
    <div className="rack-outer-container">
      <div className="rack-header">
        <div className="rack-header-left">
          <span className="rack-title">Tile Rack • 備用字脾</span>
          <div
            className={`game-alert-banner rack-alert-banner ${alertMessage ? "rack-alert-active shake" : "rack-alert-placeholder"}`}
            aria-live="polite"
          >
            <span>
              {alertMessage ? `⚠️ ${alertMessage}` : "Pending actions"}
            </span>
          </div>
        </div>
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
        className={`rack-slots-wrapper ${isOver ? "drag-over" : ""} ${isHidden ? "hidden-state" : ""}`}
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

          {/* Render empty slots to keep the rack at a full 30-tile capacity */}
          {Array.from({ length: Math.max(0, rackCapacity - tiles.length) }).map(
            (_, idx) => (
              <div
                key={`empty-slot-${idx}`}
                className="rack-slot-box empty-slot-box"
              ></div>
            ),
          )}
        </div>
      </div>
    </div>
  );
}
