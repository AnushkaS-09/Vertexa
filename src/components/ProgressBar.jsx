export default function ProgressBar({ steps, completed }) {
  const trackable = steps.filter((s) => s.type !== "informational");
  const done = trackable.filter((s) => completed.has(s.id)).length;
  const pct = trackable.length ? Math.round((done / trackable.length) * 100) : 0;
  const mandatoryLeft = trackable.filter((s) => s.type === "mandatory" && !completed.has(s.id)).length;
  const conditionalCount = trackable.filter((s) => s.type === "conditional").length;

  return (
    <div className="progWrap">
      <div className="progTop">
        <strong>Your Progress</strong>
        <span>
          {done} of {trackable.length} steps completed
        </span>
      </div>
      <div className="bar">
        <div className="barFill" style={{ width: pct + "%" }} />
      </div>
      <div className="progStats">
        <span>{pct}% complete</span>
        <span>{mandatoryLeft} mandatory remaining</span>
        <span>{conditionalCount} conditional steps</span>
      </div>
    </div>
  );
}
