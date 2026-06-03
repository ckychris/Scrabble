export function PlayLogPanel({ history, onWordHoverStart, onWordHoverEnd }) {
  return (
    <div className="score-card-panel log-history-panel">
      <h3>Play Log • 拼字記錄</h3>
      <div className="logs-scroller">
        {history.length === 0 ? (
          <div className="empty-logs">No words submitted yet.</div>
        ) : (
          history.map((h, i) => (
            <div key={i} className="log-row">
              <span className={`log-player p-${h.player}`}>P{h.player}</span>
              <span className="log-words">
                {Array.isArray(h.validatedWords) && h.validatedWords.length > 0
                  ? h.validatedWords.map((w, idx) => (
                      <span
                        key={`${w.word}-${idx}`}
                        className="log-word-item"
                        onMouseEnter={() => onWordHoverStart(w)}
                        onMouseLeave={onWordHoverEnd}
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
  );
}
