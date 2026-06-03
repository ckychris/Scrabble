import React, { useMemo } from "react";
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
import sound from "./components/SoundSynth";
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
        <div className="match-status-strip">
          <div
            className={`match-player-card match-player-left ${currentPlayer === 1 ? "active-turn" : ""}`}
          >
            <span className="match-player-label">Player 1</span>
            <strong className="match-player-score">{scores[1]}</strong>
          </div>

          <div className="match-center-card">
            <span className="match-center-label">Turn</span>
            <strong className="match-center-value">P{currentPlayer}</strong>
          </div>

          <div
            className={`match-player-card match-player-right ${currentPlayer === 2 ? "active-turn" : ""}`}
          >
            <span className="match-player-label">Player 2</span>
            <strong className="match-player-score">{scores[2]}</strong>
          </div>
        </div>

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

            {isExchangeMode ? (
              <div className="action-buttons-wrapper exchange-mode-bar">
                <p className="exchange-hint">
                  Tap tiles on your rack to select them for exchange •
                  點選字牌換牌
                </p>
                <div className="exchange-actions">
                  <button
                    className="btn-game btn-pass"
                    onClick={handleCancelExchange}
                  >
                    ✕ Cancel • 取消
                  </button>
                  <button
                    className="btn-game btn-exchange"
                    onClick={handleExchangeAll}
                  >
                    🔄 Exchange All • 全部換牌
                  </button>
                  <button
                    className="btn-game btn-submit-game"
                    onClick={handleConfirmExchange}
                  >
                    🔁 Confirm Exchange ({exchangeSelected.size}) • 確認換牌
                  </button>
                </div>
              </div>
            ) : (
              <div className="action-buttons-wrapper">
                <button className="btn-game btn-recall" onClick={handleRecall}>
                  🔄 Recall • 重收
                </button>
                <button
                  className="btn-game btn-exchange"
                  onClick={handleStartExchange}
                >
                  🔁 Exchange • 換牌
                </button>
                <button className="btn-game btn-pass" onClick={handlePass}>
                  ⏭️ Pass • 跳過
                </button>
                <button
                  className="btn-game btn-submit-game"
                  onClick={handleSubmit}
                >
                  ⚡ Submit • 提交
                </button>
              </div>
            )}
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

            <div className="score-card-panel match-status-panel">
              <h3>Match Status • 比賽狀態</h3>
              <div className="match-status-grid">
                <div className="match-status-row">
                  <span>Active player</span>
                  <strong>Player {currentPlayer}</strong>
                </div>
                <div className="match-status-row">
                  <span>Remaining bag</span>
                  <strong>{tileBag.length}</strong>
                </div>
                <div className="match-status-row">
                  <span>Mode</span>
                  <strong>{isExchangeMode ? "Exchange" : "Play"}</strong>
                </div>
              </div>
            </div>

            <div className="score-card-panel log-history-panel">
              <h3>Play Log • 拼字記錄</h3>
              <div className="logs-scroller">
                {history.length === 0 ? (
                  <div className="empty-logs">No words submitted yet.</div>
                ) : (
                  history.map((h, i) => (
                    <div key={i} className="log-row">
                      <span className={`log-player p-${h.player}`}>
                        P{h.player}
                      </span>
                      <span className="log-words">
                        {Array.isArray(h.validatedWords) &&
                        h.validatedWords.length > 0
                          ? h.validatedWords.map((w, idx) => (
                              <span
                                key={`${w.word}-${idx}`}
                                className="log-word-item"
                                onMouseEnter={() => handleWordHoverStart(w)}
                                onMouseLeave={handleWordHoverEnd}
                              >
                                {w.word}
                                {idx < h.validatedWords.length - 1 ? ", " : ""}
                              </span>
                            ))
                          : h.words}
                      </span>
                      <span className="log-score">
                        +{h.score} pts {h.bingo && "🔥 Bingo!"}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {showInterstitial && (
          <div className="turn-overlay-interstitial">
            <div className="interstitial-card">
              <h2>
                Player {currentPlayer === 1 ? "1" : "2"}'s Turn is Complete!
              </h2>
              <p>
                Please pass the device to **Player{" "}
                {currentPlayer === 1 ? "2" : "1"}`**.
              </p>

              <div className="security-notice-blur">
                <span>🔒 Opponent tiles are currently secured</span>
              </div>

              <button
                className="btn-primary-interstitial"
                onClick={startNextTurn}
              >
                Start Player {currentPlayer === 1 ? "2" : "1"}'s Turn ⚡
              </button>
            </div>
          </div>
        )}

        {wordModal.isOpen && (
          <div className="celebration-modal-overlay">
            <div className="celebration-card scored-modal animate-zoom">
              {wordModal.isBingo && (
                <div className="bingo-badge">🔥 BINGO (+50)</div>
              )}
              <span className="celebration-sparkles">✨ 合法詞語 ✨</span>
              {Array.isArray(wordModal.validatedWords) &&
              wordModal.validatedWords.length > 0 ? (
                wordModal.validatedWords.map((w, idx) => (
                  <div key={`${w.word}-${idx}`}>
                    <h2 className="celebration-word">{w.word}</h2>
                    <p className="celebration-jyutping">{w.jyutping}</p>
                    <p className="celebration-eng">{w.eng}</p>
                  </div>
                ))
              ) : (
                <>
                  <h2 className="celebration-word">{wordModal.word}</h2>
                  <p className="celebration-jyutping">{wordModal.jyutping}</p>
                  <p className="celebration-eng">{wordModal.eng}</p>
                </>
              )}

              <div className="celebration-score-box">
                <span className="score-label">Turn Score</span>
                <span className="score-num">+{wordModal.score} PTS</span>
              </div>

              <button
                className="btn-celebration-close"
                onClick={() => {
                  if (soundEnabled) sound.playTick();
                  setWordModal((prev) => ({ ...prev, isOpen: false }));
                  transitionTurn();
                }}
              >
                Continue Turn ⏭️
              </button>
            </div>
          </div>
        )}

        {tileDefinition.isOpen && (
          <div className="tile-definition-card">
            <span className="tile-definition-label">Definition Lookup</span>
            <h3 className="tile-definition-word">{tileDefinition.word}</h3>
            <p className="tile-definition-jyutping">
              {tileDefinition.jyutping}
            </p>
            <p className="tile-definition-eng">{tileDefinition.eng}</p>
          </div>
        )}

        {gameWinner && (
          <div className="celebration-modal-overlay game-over-overlay">
            <div className="celebration-card game-over-card">
              <span className="celebration-sparkles">🏁 遊戲結束 🏁</span>
              <h2>Game Over!</h2>

              {gameWinner === "TIE" ? (
                <h3 className="winner-declaration">It's a Tie! 平局 🤝</h3>
              ) : (
                <h3 className="winner-declaration">
                  Player {gameWinner} Wins! 獲勝 🏆
                </h3>
              )}

              <div className="final-scoreboard-summary">
                <div className="final-row">
                  <span>Player 1 Score:</span>
                  <strong>{endScores?.[1] ?? scores[1] ?? 0}</strong>
                </div>
                <div className="final-row">
                  <span>Player 2 Score:</span>
                  <strong>{endScores?.[2] ?? scores[2] ?? 0}</strong>
                </div>
              </div>

              <button
                className="btn-celebration-close btn-final-restart"
                onClick={reloadGame}
              >
                Play New Game ⚡
              </button>
            </div>
          </div>
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
