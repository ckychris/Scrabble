import { useMemo } from "react";
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { Board } from "./components/Board";
import { Rack } from "./components/Rack";
import { Tile } from "./components/Tile";
import { MatchStatusStrip } from "./components/panels/MatchStatusStrip";
import { MatchStatusPanel } from "./components/panels/MatchStatusPanel";
import { PlayLogPanel } from "./components/panels/PlayLogPanel";
import { ActionBar } from "./components/panels/ActionBar";
import { TurnInterstitial } from "./components/modals/TurnInterstitial";
import { WordCelebrationModal } from "./components/modals/WordCelebrationModal";
import { TileDefinitionCard } from "./components/modals/TileDefinitionCard";
import { GameOverModal } from "./components/modals/GameOverModal";
import sound from "./services/soundSynth";
import { useGameState } from "./hooks/useGameState";

function App() {
  const reloadGame = () => {
    window.location.reload();
  };

  const {
    tileBag,
    board,
    currentPlayer,
    scores,
    racks,
    selectedTileId,
    isRackHidden,
    showInterstitial,
    soundEnabled,
    activeDragId,
    isExchangeMode,
    exchangeSelected,
    alertMessage,
    wordModal,
    tileDefinition,
    history,
    gameWinner,
    endScores,
    setSoundEnabled,
    setIsRackHidden,
    setWordModal,
    handleDragStart,
    handleDragEnd,
    handleTileClick,
    handleSquareClick,
    handleRecall,
    handlePass,
    transitionTurn,
    startNextTurn,
    handleSubmit,
    handleStartExchange,
    handleConfirmExchange,
    handleExchangeAll,
    handleCancelExchange,
    handleTileHoverStart,
    handleTileHoverEnd,
    handleWordHoverStart,
    handleWordHoverEnd,
  } = useGameState();

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 180,
        tolerance: 6,
      },
    }),
  );

  const renderTile = (tile, isRackTile, isSelected) => {
    const isExchangeSelected = isExchangeMode && exchangeSelected.has(tile.id);
    const isNew = isRackTile ? false : Boolean(tile.isNew);
    const disableDrag =
      (isExchangeMode && isRackTile) || (!isRackTile && !isNew);
    return (
      <Tile
        key={tile.id}
        id={tile.id}
        char={tile.char}
        jyutping={tile.jyutping}
        points={tile.points}
        isRackTile={isRackTile}
        isNew={isNew}
        isSelected={isSelected}
        isExchangeSelected={isExchangeSelected}
        disableDrag={disableDrag}
        onClick={() => handleTileClick(tile, isRackTile)}
        onHoverStart={() => handleTileHoverStart(tile)}
        onHoverEnd={handleTileHoverEnd}
      />
    );
  };

  const activeTileData = useMemo(
    () =>
      activeDragId
        ? [...racks[1], ...racks[2], ...board.flat().filter(Boolean)].find(
            (t) => t.id === activeDragId,
          )
        : null,
    [activeDragId, racks, board],
  );

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="scrabble-app-container">
        <MatchStatusStrip currentPlayer={currentPlayer} scores={scores} />

        <div className="game-wrapper-grid">
          <div className="left-game-panel">
            <div className="board-position-wrapper">
              <Board
                boardState={board}
                onSquareClick={handleSquareClick}
                renderTile={renderTile}
              />
              {alertMessage && (
                <div className="board-alert-notification animate-alert-ease-up">
                  <span className="text-shake">⚠️ {alertMessage}</span>
                </div>
              )}
            </div>

            <Rack
              tiles={racks[currentPlayer]}
              selectedTileId={selectedTileId}
              renderTile={renderTile}
              isHidden={isRackHidden}
              onToggleHide={() => setIsRackHidden(!isRackHidden)}
            />

            <ActionBar
              isExchangeMode={isExchangeMode}
              exchangeSelectedCount={exchangeSelected.size}
              onRecall={handleRecall}
              onStartExchange={handleStartExchange}
              onPass={handlePass}
              onSubmit={handleSubmit}
              onCancelExchange={handleCancelExchange}
              onExchangeAll={handleExchangeAll}
              onConfirmExchange={handleConfirmExchange}
            />
          </div>

          <div className="right-game-panel">
            <header className="game-main-header">
              <div className="title-wrapper">
                <h1>粵拼拼字</h1>
                <span className="subtitle">Cantonese Scrabble</span>
              </div>

              <button
                className={`btn-text btn-sound ${soundEnabled ? "active" : ""}`}
                onClick={() => setSoundEnabled(!soundEnabled)}
              >
                {soundEnabled ? "🔊 Sound: On" : "🔇 Sound: Off"}
              </button>
            </header>

            <MatchStatusPanel
              currentPlayer={currentPlayer}
              bagCount={tileBag.length}
              isExchangeMode={isExchangeMode}
            />

            <PlayLogPanel
              history={history}
              onWordHoverStart={handleWordHoverStart}
              onWordHoverEnd={handleWordHoverEnd}
            />
          </div>
        </div>

        {showInterstitial && (
          <TurnInterstitial
            currentPlayer={currentPlayer}
            onStart={startNextTurn}
          />
        )}

        {wordModal.isOpen && (
          <WordCelebrationModal
            wordModal={wordModal}
            onContinue={() => {
              if (soundEnabled) sound.playTick();
              setWordModal((prev) => ({ ...prev, isOpen: false }));
              transitionTurn();
            }}
          />
        )}

        {tileDefinition.isOpen && (
          <TileDefinitionCard definition={tileDefinition} />
        )}

        {gameWinner && (
          <GameOverModal
            winner={gameWinner}
            endScores={endScores}
            scores={scores}
            onRestart={reloadGame}
          />
        )}

        <DragOverlay>
          {activeDragId && activeTileData ? (
            <div className="game-tile dragging-overlay">
              <div className="tile-wood-texture"></div>
              <span className="tile-jyutping">{activeTileData.jyutping}</span>
              <span className="tile-char">{activeTileData.char}</span>
              <span className="tile-points">{activeTileData.points}</span>
            </div>
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
}

export default App;
