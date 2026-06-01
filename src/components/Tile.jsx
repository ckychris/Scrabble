import React from "react";
import { useDraggable } from "@dnd-kit/core";

export function Tile({
  id,
  char,
  jyutping,
  points,
  isRackTile,
  isNew,
  isSelected,
  isExchangeSelected,
  disableDrag,
  onClick,
  onHoverStart,
  onHoverEnd,
  style: customStyle,
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: id,
      data: {
        id,
        char,
        jyutping,
        points,
        isRackTile,
        isNew,
      },
      disabled: disableDrag,
    });

  const dragStyle = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 1000,
        opacity: isDragging ? 0.4 : 1,
        cursor: "grabbing",
      }
    : undefined;

  const baseStyle = {
    ...dragStyle,
    ...customStyle,
  };

  return (
    <div
      ref={setNodeRef}
      style={baseStyle}
      {...(disableDrag ? {} : listeners)}
      {...(disableDrag ? {} : attributes)}
      onClick={(e) => {
        if (onClick) {
          onClick(e);
        }
      }}
      onMouseEnter={() => {
        if (!isDragging && onHoverStart) {
          onHoverStart();
        }
      }}
      onMouseLeave={() => {
        if (onHoverEnd) {
          onHoverEnd();
        }
      }}
      className={`game-tile ${isRackTile ? "rack-tile" : "board-tile"} ${!isRackTile && !isNew ? "locked-board-tile" : ""} ${isSelected ? "selected" : ""} ${isExchangeSelected ? "exchange-selected" : ""} ${isDragging ? "dragging" : ""}`}
    >
      <div className="tile-wood-texture"></div>
      <span className="tile-jyutping">{jyutping}</span>
      <span className="tile-char">{char}</span>
      <span className="tile-points">{points}</span>
    </div>
  );
}
