export function MatchStatusStrip({ currentPlayer, scores }) {
  return (
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
  );
}
