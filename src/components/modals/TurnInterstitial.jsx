export function TurnInterstitial({ currentPlayer, onStart }) {
  const incoming = currentPlayer === 1 ? "2" : "1";
  return (
    <div className="turn-overlay-interstitial">
      <div className="interstitial-card">
        <h2>Player {currentPlayer === 1 ? "1" : "2"}'s Turn is Complete!</h2>
        <p>Please pass the device to **Player {incoming}`**.</p>

        <div className="security-notice-blur">
          <span>🔒 Opponent tiles are currently secured</span>
        </div>

        <button className="btn-primary-interstitial" onClick={onStart}>
          Start Player {incoming}'s Turn ⚡
        </button>
      </div>
    </div>
  );
}
