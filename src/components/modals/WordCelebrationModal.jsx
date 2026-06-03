export function WordCelebrationModal({ wordModal, onContinue }) {
  const hasValidatedWords =
    Array.isArray(wordModal.validatedWords) &&
    wordModal.validatedWords.length > 0;

  return (
    <div className="celebration-modal-overlay">
      <div className="celebration-card scored-modal animate-zoom">
        {wordModal.isBingo && <div className="bingo-badge">🔥 BINGO (+50)</div>}
        <span className="celebration-sparkles">✨ 合法詞語 ✨</span>
        {hasValidatedWords ? (
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

        <button className="btn-celebration-close" onClick={onContinue}>
          Continue Turn ⏭️
        </button>
      </div>
    </div>
  );
}
