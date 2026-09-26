import { useMemo } from "react";
import { layoutSteps, statusOf } from "../utils/graph.js";
import StepCard from "./StepCard.jsx";

export default function TaskGraph({ steps, completed, selectedId, onSelect }) {
  const { positions, width, height } = useMemo(() => layoutSteps(steps), [steps]);

  const connectors = [];
  steps.forEach((step) => {
    step.prerequisites.forEach((prereqId) => {
      const from = positions[prereqId];
      const to = positions[step.id];
      if (!from || !to) return;
      const x1 = from.x + from.w;
      const y1 = from.y + from.h / 2;
      const x2 = to.x;
      const y2 = to.y + to.h / 2;
      const midX = (x1 + x2) / 2;
      connectors.push(
        <path
          key={prereqId + "-" + step.id}
          d={`M${x1},${y1} C${midX},${y1} ${midX},${y2} ${x2},${y2}`}
          stroke="var(--line)"
          strokeWidth="2"
          fill="none"
          markerEnd="url(#arrow)"
        />
      );
    });
  });

  return (
    <div className="graphScroll">
      <div className="graphInner" style={{ width, height }}>
        <svg width={width} height={height} style={{ position: "absolute", top: 0, left: 0 }}>
          <defs>
            <marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
              <path d="M0,0 L8,4 L0,8 Z" fill="var(--sub)" />
            </marker>
          </defs>
          {connectors}
        </svg>
        {steps.map((step) => (
          <StepCard
            key={step.id}
            step={step}
            status={statusOf(step, completed)}
            position={positions[step.id]}
            isSelected={selectedId === step.id}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}
