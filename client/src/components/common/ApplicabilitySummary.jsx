import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Building2,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  LandPlot
} from 'lucide-react';
import clsx from 'clsx';

export default function ApplicabilitySummary({ eligibility, onOpenQuestionnaire }) {
  const [activeTab, setActiveTab] = useState('applicable'); // 'applicable' | 'exempt' | 'uncertain'
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!eligibility) return null;

  const applicable = eligibility.applicable || [];
  const exempt = eligibility.exempt || [];
  const uncertain = eligibility.uncertain || [];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="p-3 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-indigo-400" />
          <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
            Plot Clearance Applicability
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {onOpenQuestionnaire && (
            <button
              type="button"
              onClick={onOpenQuestionnaire}
              className="text-[10px] font-semibold text-indigo-400 hover:text-indigo-300 hover:underline cursor-pointer"
            >
              Edit Plot Parameters
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 text-slate-400 hover:text-slate-200 rounded transition-colors cursor-pointer"
          >
            {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="p-3">
          {/* Quick Plot Metrics Banner */}
          <div className="flex flex-wrap items-center gap-3 p-2 mb-3 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px] text-slate-300">
            <div>
              <span className="text-slate-400">Authority: </span>
              <strong className="text-slate-100">{eligibility.jurisdiction || 'Maharashtra'}</strong>
            </div>
            <div>
              <span className="text-slate-400">Height: </span>
              <strong className="text-slate-100">{eligibility.buildingHeight || 8.5}m</strong>
            </div>
            <div>
              <span className="text-slate-400">Area: </span>
              <strong className="text-slate-100">{eligibility.plotArea || 200} sq.m</strong>
            </div>
            <div>
              <span className="text-slate-400">Road: </span>
              <strong className="text-slate-100">{eligibility.roadWidth || 9}m</strong>
            </div>
          </div>

          {/* Tab Selector */}
          <div className="flex border-b border-slate-800 mb-3 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('applicable')}
              className={clsx(
                'flex-1 py-1.5 px-2 font-semibold text-center border-b-2 transition-all flex items-center justify-center gap-1.5 cursor-pointer',
                activeTab === 'applicable'
                  ? 'border-emerald-500 text-emerald-400 bg-emerald-950/20'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              )}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Applies ({applicable.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('exempt')}
              className={clsx(
                'flex-1 py-1.5 px-2 font-semibold text-center border-b-2 transition-all flex items-center justify-center gap-1.5 cursor-pointer',
                activeTab === 'exempt'
                  ? 'border-slate-400 text-slate-300 bg-slate-800/40'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              )}
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Exempt ({exempt.length})</span>
            </button>

            {uncertain.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab('uncertain')}
                className={clsx(
                  'flex-1 py-1.5 px-2 font-semibold text-center border-b-2 transition-all flex items-center justify-center gap-1.5 cursor-pointer',
                  activeTab === 'uncertain'
                    ? 'border-amber-500 text-amber-400 bg-amber-950/20'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                )}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Verify ({uncertain.length})</span>
              </button>
            )}
          </div>

          {/* Tab Content */}
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1 text-xs">
            {activeTab === 'applicable' && (
              <>
                {applicable.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-lg bg-emerald-950/15 border border-emerald-900/40"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        {item.name}
                      </span>
                      {item.statutoryRef && (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/50 shrink-0">
                          {item.statutoryRef}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-300 pl-5">
                      {item.reason}
                    </p>
                  </div>
                ))}
              </>
            )}

            {activeTab === 'exempt' && (
              <>
                {exempt.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800 text-slate-400"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="font-bold text-slate-300 line-through flex items-center gap-1.5">
                        <XCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {item.name}
                      </span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 shrink-0">
                        EXEMPT
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 pl-5">
                      {item.reason}
                    </p>
                  </div>
                ))}
              </>
            )}

            {activeTab === 'uncertain' && (
              <>
                {uncertain.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-lg bg-amber-950/20 border border-amber-900/40 text-amber-200"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="font-bold text-amber-300 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        {item.name}
                      </span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-400 border border-amber-800/50 shrink-0">
                        VERIFY
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 pl-5">
                      {item.reason}
                    </p>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
