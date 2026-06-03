export function GameOverModal({ winner, endScores, scores, onRestart }) {
  return (
    <div className="celebration-modal-overlay game-over-overlay">
      <div className="celebration-card game-over-card">
        <span className="celebration-sparkles">🏁 遊戲結束 🏁</span>
        <h2>Game Over!</h2>

        {winner === "TIE" ? (
          <h3 className="winner-declaration">It's a Tie! 平局 🤝</h3>
        ) : (
          <h3 className="winner-declaration">Player {winner} Wins! 獲勝 🏆</h3>
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
          onClick={onRestart}
        >
          Play New Game ⚡
        </button>
      </div>
    </div>
  );
}
