import React from 'react';
import { Handle, Position } from '@xyflow/react';
import {
  Clock,
  IndianRupee,
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  Lock,
  Check,
  Building,
  Scale
} from 'lucide-react';
import clsx from 'clsx';

export default function CivicNode({ data, selected }) {
  const {
    id,
    title = 'Permit Step',
    stage = 'Stage 1',
    department = 'Municipal Authority',
    estimatedDays = 0,
    cost = 0,
    isBottleneck = false,
    statutoryRule = '',
    status = 'available', // 'locked' | 'available' | 'completed'
    orientation = 'TB', // 'TB' (top-to-bottom) | 'LR' (left-to-right)
    onStatusChange
  } = data;

  const isCompleted = status === 'completed';
  const isAvailable = status === 'available';
  const isLocked = status === 'locked';

  const handleToggleStatus = (e) => {
    e.stopPropagation();
    if (!onStatusChange || isLocked) return;
    if (isCompleted) {
      onStatusChange(id, 'available');
    } else if (isAvailable) {
      onStatusChange(id, 'completed');
    }
  };

  const targetPosition = orientation === 'LR' ? Position.Left : Position.Top;
  const sourcePosition = orientation === 'LR' ? Position.Right : Position.Bottom;

  return (
    <div
      className={clsx(
        'group relative rounded-2xl border p-4 shadow-xl min-w-[300px] max-w-[320px] transition-all duration-300 text-left cursor-pointer font-sans select-none backdrop-blur-md',
        // Status border & background styling
        isCompleted &&
          'border-emerald-500/80 bg-slate-900/95 text-slate-100 ring-1 ring-emerald-500/40 shadow-emerald-950/40 hover:border-emerald-400',
        isAvailable &&
          'border-indigo-500/80 bg-slate-900/95 text-slate-100 ring-1 ring-indigo-500/40 shadow-indigo-950/40 hover:border-indigo-400',
        isLocked &&
          'border-slate-800 bg-slate-950/80 text-slate-400 opacity-65 hover:opacity-80 hover:border-slate-700',
        selected &&
          'ring-2 ring-indigo-400 border-indigo-400 shadow-[0_0_25px_rgba(99,102,241,0.35)] scale-[1.02]'
      )}
    >
      {/* React Flow Target Handle */}
      <Handle
        type="target"
        position={targetPosition}
        className={clsx(
          '!w-3.5 !h-3.5 !border-2 !border-slate-900 transition-all duration-200',
          isCompleted && '!bg-emerald-400 shadow-[0_0_8px_#34d399]',
          isAvailable && '!bg-indigo-400 shadow-[0_0_8px_#818cf8]',
          isLocked && '!bg-slate-600'
        )}
      />

      {/* Header: Stage Pill and Status Badge */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <span
          className={clsx(
            'text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full truncate border',
            isCompleted && 'bg-emerald-950/70 text-emerald-300 border-emerald-800/60',
            isAvailable && 'bg-indigo-950/70 text-indigo-300 border-indigo-800/60',
            isLocked && 'bg-slate-900 text-slate-400 border-slate-800'
          )}
        >
          {stage}
        </span>

        <div className="flex items-center gap-1 shrink-0">
          {isCompleted && (
            <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/50">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Done
            </span>
          )}
          {isAvailable && (
            <span className="flex items-center gap-1 text-[11px] font-semibold text-indigo-300 bg-indigo-950/60 px-2 py-0.5 rounded-full border border-indigo-800/50">
              <CircleDashed className="w-3.5 h-3.5 text-indigo-400 animate-spin-slow" />
              Actionable
            </span>
          )}
          {isLocked && (
            <span className="flex items-center gap-1 text-[11px] font-medium text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded-full border border-slate-800">
              <Lock className="w-3 h-3 text-slate-500" />
              Prereq Locked
            </span>
          )}
        </div>
      </div>

      {/* Node Title */}
      <h3
        className={clsx(
          'font-bold text-sm leading-snug my-1 line-clamp-2',
          isCompleted && 'text-slate-100',
          isAvailable && 'text-white',
          isLocked && 'text-slate-400'
        )}
      >
        {title}
      </h3>

      {/* Department Badge */}
      <div className="my-2">
        <span
          className={clsx(
            'inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-lg font-medium truncate max-w-full border',
            isCompleted && 'bg-slate-850 text-slate-300 border-slate-800',
            isAvailable && 'bg-slate-850 text-slate-200 border-slate-750',
            isLocked && 'bg-slate-900/60 text-slate-500 border-slate-850'
          )}
        >
          <Building className="w-3 h-3 shrink-0 text-slate-400" />
          <span className="truncate">{department}</span>
        </span>
      </div>

      {/* Statutory Rule Citation */}
      {statutoryRule && (
        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 italic truncate mb-2 font-mono">
          <Scale className="w-3 h-3 text-indigo-400 shrink-0" />
          <span className="truncate">{statutoryRule}</span>
        </div>
      )}

      {/* Bottleneck Alert */}
      {isBottleneck && (
        <div className="flex items-center gap-1.5 px-2.5 py-1 mb-2 rounded-lg bg-amber-950/50 border border-amber-800/60 text-amber-300 text-[11px] font-semibold">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="truncate">Known Municipal Bottleneck</span>
        </div>
      )}

      {/* Metric Bar & Status Toggle Button */}
      <div className="pt-2.5 mt-2 border-t border-slate-800 flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-3">
          <div
            className={clsx(
              'flex items-center gap-1 font-medium',
              isCompleted ? 'text-emerald-400' : isAvailable ? 'text-slate-300' : 'text-slate-400'
            )}
            title="Estimated turnaround time"
          >
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span>{estimatedDays}d</span>
          </div>

          <div
            className={clsx(
              'flex items-center gap-0.5 font-medium',
              isCompleted ? 'text-emerald-400' : isAvailable ? 'text-emerald-300' : 'text-slate-400'
            )}
            title="Estimated fee"
          >
            <IndianRupee className="w-3.5 h-3.5 text-emerald-400" />
            <span>{Number(cost).toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Interactive Status Toggle Button */}
        <button
          type="button"
          onClick={handleToggleStatus}
          disabled={isLocked}
          className={clsx(
            'inline-flex items-center gap-1 px-3 py-1 rounded-lg text-[11px] font-semibold transition-all shadow-md',
            isCompleted
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30 cursor-pointer active:scale-95'
              : isAvailable
              ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30 cursor-pointer active:scale-95'
              : 'bg-slate-900 text-slate-500 border border-slate-800 cursor-not-allowed opacity-60'
          )}
          title={
            isCompleted
              ? 'Undo step completion'
              : isAvailable
              ? 'Mark this step completed'
              : 'Prerequisites must be completed first'
          }
        >
          {isCompleted ? (
            <>
              <Check className="w-3 h-3" />
              <span>Done</span>
            </>
          ) : isAvailable ? (
            <>
              <Check className="w-3 h-3" />
              <span>Mark Done</span>
            </>
          ) : (
            <>
              <Lock className="w-3 h-3" />
              <span>Locked</span>
            </>
          )}
        </button>
      </div>

      {/* React Flow Source Handle */}
      <Handle
        type="source"
        position={sourcePosition}
        className={clsx(
          '!w-3.5 !h-3.5 !border-2 !border-slate-900 transition-all duration-200',
          isCompleted && '!bg-emerald-400 shadow-[0_0_8px_#34d399]',
          isAvailable && '!bg-indigo-400 shadow-[0_0_8px_#818cf8]',
          isLocked && '!bg-slate-600'
        )}
      />
    </div>
  );
}
