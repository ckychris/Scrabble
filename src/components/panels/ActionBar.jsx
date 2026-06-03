export function ActionBar({
  isExchangeMode,
  exchangeSelectedCount,
  onRecall,
  onStartExchange,
  onPass,
  onSubmit,
  onCancelExchange,
  onExchangeAll,
  onConfirmExchange,
}) {
  if (isExchangeMode) {
    return (
      <div className="action-buttons-wrapper exchange-mode-bar">
        <p className="exchange-hint">
          Tap tiles on your rack to select them for exchange • 點選字牌換牌
        </p>
        <div className="exchange-actions">
          <button className="btn-game btn-pass" onClick={onCancelExchange}>
            ✕ Cancel • 取消
          </button>
          <button className="btn-game btn-exchange" onClick={onExchangeAll}>
            🔄 Exchange All • 全部換牌
          </button>
          <button
            className="btn-game btn-submit-game"
            onClick={onConfirmExchange}
          >
            🔁 Confirm Exchange ({exchangeSelectedCount}) • 確認換牌
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="action-buttons-wrapper">
      <button className="btn-game btn-recall" onClick={onRecall}>
        <span className="btn-line-top">
          <span className="btn-icon">⟲</span> Recall
        </span>
        <span className="btn-line-cn">重收</span>
      </button>
      <button className="btn-game btn-exchange" onClick={onStartExchange}>
        <span className="btn-line-top">
          <span className="btn-icon">⇄</span> Exchange
        </span>
        <span className="btn-line-cn">換牌</span>
      </button>
      <button className="btn-game btn-pass" onClick={onPass}>
        <span className="btn-line-top">
          <span className="btn-icon">⏭</span> Pass
        </span>
        <span className="btn-line-cn">跳過</span>
      </button>
      <button className="btn-game btn-submit-game" onClick={onSubmit}>
        <span className="btn-line-top">
          <span className="btn-icon">⚡</span> Submit
        </span>
        <span className="btn-line-cn">提交</span>
      </button>
    </div>
  );
}
