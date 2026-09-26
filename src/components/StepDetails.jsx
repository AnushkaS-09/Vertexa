export default function StepDetails({ step, status, onComplete }) {
  if (!step) {
    return <div className="empty">Click a step in the graph to see full details.</div>;
  }

  return (
    <div className="detail">
      <h3>{step.title}</h3>
      <div className="badgeRow">
        <span className={"badge " + step.type}>{step.type}</span>
        <span className={"badge status-" + status}>{status}</span>
      </div>
      <p>{step.description}</p>

      {step.documents.length > 0 && (
        <ul>
          {step.documents.map((doc) => (
            <li key={doc}>{doc}</li>
          ))}
        </ul>
      )}

      <dl className="kv">
        <dt>Authority</dt>
        <dd>{step.authority}</dd>
        <dt>Estimated time</dt>
        <dd>{step.estTime}</dd>
        <dt>Estimated fee</dt>
        <dd>{step.estFee}</dd>
      </dl>

      <div className="actions">
        {step.source ? (
          <a className="link-btn" href={step.source.url} target="_blank" rel="noopener noreferrer">
            Official Source ↗
          </a>
        ) : (
          <span className="link-btn secondary">Source needs verification</span>
        )}
        {step.type !== "informational" && (
          <button
            className="doneBtn"
            disabled={status === "locked" || status === "completed"}
            onClick={onComplete}
          >
            {status === "completed" ? "Completed ✓" : "Mark Completed"}
          </button>
        )}
      </div>

      {step.source?.note && <p className="sourceNote">{step.source.note}</p>}
    </div>
  );
}
