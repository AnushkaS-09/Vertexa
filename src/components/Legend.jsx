const ITEMS = [
  { color: "var(--blue)", label: "Mandatory" },
  { color: "var(--amber)", label: "Conditional" },
  { color: "var(--gray)", label: "Informational" },
  { color: "var(--green)", label: "Completed" }
];

export default function Legend() {
  return (
    <div className="legend">
      {ITEMS.map((item) => (
        <span key={item.label}>
          <span className="dot" style={{ background: item.color }} />
          {item.label}
        </span>
      ))}
    </div>
  );
}
