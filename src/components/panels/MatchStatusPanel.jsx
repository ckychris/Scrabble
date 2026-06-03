export function MatchStatusPanel({ currentPlayer, bagCount, isExchangeMode }) {
  return (
    <div className="score-card-panel match-status-panel">
      <h3>Match Status • 比賽狀態</h3>
      <div className="match-status-grid">
        <div className="match-status-row">
          <span>Active player</span>
          <strong>Player {currentPlayer}</strong>
        </div>
        <div className="match-status-row">
          <span>Remaining bag</span>
          <strong>{bagCount}</strong>
        </div>
        <div className="match-status-row">
          <span>Mode</span>
          <strong>{isExchangeMode ? "Exchange" : "Play"}</strong>
        </div>
      </div>
    </div>
  );
}
