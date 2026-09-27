export default function TaskSummary({ task }) {
  return (
    <div className="summary">
      <h2>{task.label}</h2>
      <div className="loc">{task.location}</div>
      <div className="tags">
        {task.tags.map((t) => (
          <span key={t} className="tag">
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}
