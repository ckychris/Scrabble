import React, { useMemo } from 'react';
import { DndContext, DragOverlay } from '@dnd-kit/core';
import { Board } from './components/Board';
import { Rack } from './components/Rack';
import { Tile } from './components/Tile';
import sound from './components/SoundSynth';
import { useGameState } from './hooks/useGameState';

function App() {
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
    handleRestart,
    handleStartExchange,
    handleConfirmExchange,
    handleCancelExchange,
    handleDictionaryUpload,
  } = useGameState();

  const renderTile = (tile, isRackTile, isSelected) => {
    const isExchangeSelected = isExchangeMode && exchangeSelected.has(tile.id);
    return (
      <Tile
        key={tile.id}
        id={tile.id}
        char={tile.char}
        jyutping={tile.jyutping}
        points={tile.points}
        isRackTile={isRackTile}
        isSelected={isSelected}
        isExchangeSelected={isExchangeSelected}
        onClick={() => handleTileClick(tile, isRackTile)}
      />
    );
  };

  const activeTileData = useMemo(
    () =>
      activeDragId
        ? [...racks[1], ...racks[2], ...board.flat().filter(Boolean)].find((t) => t.id === activeDragId)
        : null,
    [activeDragId, racks, board]
  );

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="scrabble-app-container">
        <div className="glow-blob glow-left"></div>
        <div className="glow-blob glow-right"></div>

        <div className="game-wrapper-grid">
          <div className="left-game-panel">
            <header className="game-main-header">
              <div className="title-wrapper">
                <h1>粵拼拼字</h1>
                <span className="subtitle">Cantonese Scrabble</span>
              </div>

              <button
                className={`btn-text btn-sound ${soundEnabled ? 'active' : ''}`}
                onClick={() => setSoundEnabled(!soundEnabled)}
              >
                {soundEnabled ? '🔊 Sound: On' : '🔇 Sound: Off'}
              </button>
            </header>

            {alertMessage && (
              <div className="game-alert-banner shake">
                <span>⚠️ {alertMessage}</span>
              </div>
            )}

            <Board boardState={board} onSquareClick={handleSquareClick} renderTile={renderTile} />

            <Rack
              tiles={racks[currentPlayer]}
              selectedTileId={selectedTileId}
              renderTile={renderTile}
              isHidden={isRackHidden}
              onToggleHide={() => setIsRackHidden(!isRackHidden)}
            />

            {isExchangeMode ? (
              <div className="action-buttons-wrapper exchange-mode-bar">
                <p className="exchange-hint">Tap tiles on your rack to select them for exchange • 點選字牌換牌</p>
                <div className="exchange-actions">
                  <button className="btn-game btn-pass" onClick={handleCancelExchange}>
                    ✕ Cancel • 取消
                  </button>
                  <button className="btn-game btn-submit-game" onClick={handleConfirmExchange}>
                    🔁 Confirm Exchange ({exchangeSelected.size}) • 確認換牌
                  </button>
                </div>
              </div>
            ) : (
              <div className="action-buttons-wrapper">
                <button className="btn-game btn-recall" onClick={handleRecall}>
                  🔄 Recall • 重收
                </button>
                <button className="btn-game btn-exchange" onClick={handleStartExchange}>
                  🔁 Exchange • 換牌
                </button>
                <button className="btn-game btn-pass" onClick={handlePass}>
                  ⏭️ Pass • 跳過
                </button>
                <button className="btn-game btn-submit-game" onClick={handleSubmit}>
                  ⚡ Submit • 提交
                </button>
              </div>
            )}
          </div>

          <div className="right-game-panel">
            <div className="score-card-panel">
              <h3>Scoreboard • 計分板</h3>
              <div className="player-scores-flex">
                <div className={`score-box player-1 ${currentPlayer === 1 ? 'active-turn' : ''}`}>
                  <span className="player-title">Player 1 {currentPlayer === 1 ? '⚡' : ''}</span>
                  <div className="player-points">{scores[1]}</div>
                  <span className="rack-count-sub">{racks[1].length} tiles left</span>
                </div>
                <div className={`score-box player-2 ${currentPlayer === 2 ? 'active-turn' : ''}`}>
                  <span className="player-title">Player 2 {currentPlayer === 2 ? '⚡' : ''}</span>
                  <div className="player-points">{scores[2]}</div>
                  <span className="rack-count-sub">{racks[2].length} tiles left</span>
                </div>
              </div>

              <div className="bag-tile-stats">
                <span>
                  🎒 Remaining Bag Tiles: <strong>{tileBag.length}</strong>
                </span>
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
                      <span className={`log-player p-${h.player}`}>P{h.player}</span>
                      <span className="log-words">{h.words}</span>
                      <span className="log-score">+{h.score} pts {h.bingo && '🔥 Bingo!'}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="score-card-panel settings-panel-box">
              <h3>Game Options • 設定</h3>

              <div className="custom-file-upload">
                <label className="file-label">
                  📁 Load Custom Dictionary JSON
                  <input type="file" accept=".json" onChange={handleDictionaryUpload} />
                </label>
                <p className="file-help">Upload a custom dictionary JSON in the words-hk inspired schema format.</p>
              </div>

              <button className="btn-game btn-restart" onClick={handleRestart}>
                ⚠️ Reset Game • 重開新局
              </button>
            </div>
          </div>
        </div>

        {showInterstitial && (
          <div className="turn-overlay-interstitial">
            <div className="interstitial-card">
              <h2>Player {currentPlayer === 1 ? '1' : '2'}'s Turn is Complete!</h2>
              <p>Please pass the device to **Player {currentPlayer === 1 ? '2' : '1'}`**.</p>

              <div className="security-notice-blur">
                <span>🔒 Opponent tiles are currently secured</span>
              </div>

              <button className="btn-primary-interstitial" onClick={startNextTurn}>
                Start Player {currentPlayer === 1 ? '2' : '1'}'s Turn ⚡
              </button>
            </div>
          </div>
        )}

        {wordModal.isOpen && (
          <div className="celebration-modal-overlay">
            <div className="celebration-card animate-zoom">
              {wordModal.isBingo && <div className="bingo-badge">🔥 BINGO (+50)</div>}
              <span className="celebration-sparkles">✨ 合法詞語 ✨</span>
              <h2 className="celebration-word">{wordModal.word}</h2>
              <p className="celebration-jyutping">{wordModal.jyutping}</p>
              <p className="celebration-eng">{wordModal.eng}</p>

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

        {gameWinner && (
          <div className="celebration-modal-overlay game-over-overlay">
            <div className="celebration-card game-over-card">
              <span className="celebration-sparkles">🏁 遊戲結束 🏁</span>
              <h2>Game Over!</h2>

              {gameWinner === 'TIE' ? (
                <h3 className="winner-declaration">It's a Tie! 平局 🤝</h3>
              ) : (
                <h3 className="winner-declaration">Player {gameWinner} Wins! 獲勝 🏆</h3>
              )}

              <div className="final-scoreboard-summary">
                <div className="final-row">
                  <span>Player 1 Score:</span>
                  <strong>{endScores ? endScores[1] : scores[1]}</strong>
                </div>
                <div className="final-row">
                  <span>Player 2 Score:</span>
                  <strong>{endScores ? endScores[2] : scores[2]}</strong>
                </div>
              </div>

              <button className="btn-celebration-close btn-final-restart" onClick={handleRestart}>
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
