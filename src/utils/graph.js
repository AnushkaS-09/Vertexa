// Turns a flat list of steps (each with a `prerequisites` array of step ids)
// into x/y positions laid out in dependency levels (columns).

export function layoutSteps(steps) {
  const byId = Object.fromEntries(steps.map((s) => [s.id, s]));
  const level = {};

  function levelOf(id) {
    if (level[id] !== undefined) return level[id];
    const step = byId[id];
    if (!step.prerequisites.length) {
      level[id] = 0;
      return 0;
    }
    const l = 1 + Math.max(...step.prerequisites.map(levelOf));
    level[id] = l;
    return l;
  }
  steps.forEach((s) => levelOf(s.id));

  const maxLevel = Math.max(...Object.values(level));
  const columns = [];
  for (let i = 0; i <= maxLevel; i++) columns.push(steps.filter((s) => level[s.id] === i));

  const colWidth = 232;
  const rowHeight = 124;
  const nodeWidth = 196;
  const nodeHeight = 96;
  const maxRows = Math.max(...columns.map((c) => c.length));

  const positions = {};
  columns.forEach((col, colIndex) => {
    const verticalOffset = ((maxRows - col.length) * rowHeight) / 2;
    col.forEach((step, rowIndex) => {
      positions[step.id] = {
        x: colIndex * colWidth + 14,
        y: verticalOffset + rowIndex * rowHeight + 14,
        w: nodeWidth,
        h: nodeHeight
      };
    });
  });

  return {
    positions,
    width: columns.length * colWidth + 20,
    height: maxRows * rowHeight + 40
  };
}

// A step is COMPLETED if the user marked it done, READY if every
// prerequisite is completed, otherwise LOCKED.
export function statusOf(step, completedIds) {
  if (completedIds.has(step.id)) return "completed";
  return step.prerequisites.every((id) => completedIds.has(id)) ? "ready" : "locked";
}
