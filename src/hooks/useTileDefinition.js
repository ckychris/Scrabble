import { useEffect, useRef, useState } from "react";

const HOVER_DELAY_MS = 700;

const CLOSED = { isOpen: false, word: "", jyutping: "", eng: "" };

// Manages the hover-triggered dictionary lookup card shown for single
// characters (on tiles) and for whole words (in the play log).
export function useTileDefinition(wordInfoMap) {
  const [tileDefinition, setTileDefinition] = useState(CLOSED);
  const hoverTimerRef = useRef(null);

  useEffect(
    () => () => {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
        hoverTimerRef.current = null;
      }
    },
    [],
  );

  const clearHoverTimer = () => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  };

  const hideTileDefinition = () => {
    clearHoverTimer();
    setTileDefinition((prev) => ({ ...prev, isOpen: false }));
  };

  const handleTileHoverStart = (tile) => {
    clearHoverTimer();

    const char = tile?.char || "";
    if (char.length !== 1) {
      hideTileDefinition();
      return;
    }

    const info = wordInfoMap.get(char);
    if (!info) {
      hideTileDefinition();
      return;
    }

    hoverTimerRef.current = setTimeout(() => {
      setTileDefinition({
        isOpen: true,
        word: char,
        jyutping: info.jyutping || tile?.jyutping || "",
        eng: info.eng || "",
      });
    }, HOVER_DELAY_MS);
  };

  const handleWordHoverStart = (wordEntry) => {
    clearHoverTimer();

    const word = wordEntry?.word || "";
    if (!word) {
      hideTileDefinition();
      return;
    }

    const info = wordInfoMap.get(word);
    hoverTimerRef.current = setTimeout(() => {
      setTileDefinition({
        isOpen: true,
        word,
        jyutping: wordEntry?.jyutping || info?.jyutping || "",
        eng: wordEntry?.eng || info?.eng || "",
      });
    }, HOVER_DELAY_MS);
  };

  return {
    tileDefinition,
    hideTileDefinition,
    handleTileHoverStart,
    handleTileHoverEnd: hideTileDefinition,
    handleWordHoverStart,
    handleWordHoverEnd: hideTileDefinition,
  };
}
