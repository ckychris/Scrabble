export function TileDefinitionCard({ definition }) {
  return (
    <div className="tile-definition-card">
      <span className="tile-definition-label">Definition Lookup</span>
      <h3 className="tile-definition-word">{definition.word}</h3>
      <p className="tile-definition-jyutping">{definition.jyutping}</p>
      <p className="tile-definition-eng">{definition.eng}</p>
    </div>
  );
}
