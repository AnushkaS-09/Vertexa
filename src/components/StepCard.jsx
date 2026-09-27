export default function StepCard({ step, status, position, isSelected, onSelect }) {
  return (
    <div
      className={"node " + status + (isSelected ? " selected" : "")}
      style={{ left: position.x, top: position.y, width: position.w, minHeight: position.h }}
      onClick={() => onSelect(step.id)}
    >
      <div className="badgeRow">
        <span className={"badge " + step.type}>{step.type}</span>
        <span className={"badge status-" + status}>{status}</span>
      </div>
      <div className="title">{step.title}</div>
      <div className="auth">{step.authority !== "—" ? step.authority : ""}</div>
    </div>
  );
}
