import React, { useState, useMemo, useEffect } from 'react';
import {
  FileText,
  Search,
  Printer,
  ExternalLink,
  Clock,
  IndianRupee,
  AlertTriangle,
  CheckSquare,
  Square,
  Activity,
  Building,
  Scale,
  Sparkles,
  Info,
  CheckCircle2,
  Filter
} from 'lucide-react';
import axios from 'axios';
import clsx from 'clsx';

export default function DocumentDrawer({
  graphData,
  selectedNode,
  onSelectNode,
  className
}) {
  const [activeTab, setActiveTab] = useState('kit'); // 'kit' | 'inspector'
  const [docSearch, setDocSearch] = useState('');
  const [checkedDocs, setCheckedDocs] = useState({});
  const [linkStatus, setLinkStatus] = useState(null);

  // Switch to inspector tab automatically when a node is clicked
  useEffect(() => {
    if (selectedNode) {
      setActiveTab('inspector');
      setLinkStatus(null);
    }
  }, [selectedNode]);

  // Aggregate all unique forms across the DAG
  const masterDocList = useMemo(() => {
    if (!graphData || !graphData.nodes) return [];

    const docMap = new Map();
    graphData.nodes.forEach((node) => {
      if (Array.isArray(node.forms)) {
        node.forms.forEach((formName) => {
          const trimmed = formName.trim();
          if (!docMap.has(trimmed)) {
            docMap.set(trimmed, {
              name: trimmed,
              steps: [
                {
                  id: node.id,
                  title: node.title,
                  stage: node.stage,
                  department: node.department
                }
              ]
            });
          } else {
            docMap.get(trimmed).steps.push({
              id: node.id,
              title: node.title,
              stage: node.stage,
              department: node.department
            });
          }
        });
      }
    });

    return Array.from(docMap.values());
  }, [graphData]);

  // Filtered documents
  const filteredDocs = useMemo(() => {
    if (!docSearch.trim()) return masterDocList;
    return masterDocList.filter((d) =>
      d.name.toLowerCase().includes(docSearch.toLowerCase())
    );
  }, [masterDocList, docSearch]);

  const toggleDoc = (docName) => {
    setCheckedDocs((prev) => ({
      ...prev,
      [docName]: !prev[docName]
    }));
  };

  const checkedCount = useMemo(() => {
    return Object.values(checkedDocs).filter(Boolean).length;
  }, [checkedDocs]);

  const metrics = useMemo(() => {
    const totalDays =
      graphData?.totalEstimatedDays ||
      graphData?.nodes?.reduce((acc, n) => acc + (n.estimatedDays || 0), 0) ||
      0;
    const totalCost =
      graphData?.totalEstimatedCostINR ||
      graphData?.nodes?.reduce((acc, n) => acc + (n.cost || 0), 0) ||
      0;
    const totalDocs = masterDocList.length;
    const bottlenecks =
      graphData?.nodes?.filter((n) => n.isBottleneck)?.length || 0;

    return { totalDays, totalCost, totalDocs, bottlenecks };
  }, [graphData, masterDocList]);

  // Government portal reachability checker
  const handleCheckLink = async (url) => {
    if (!url) return;
    setLinkStatus({ loading: true });
    try {
      const response = await axios.get(
        `http://localhost:5000/api/link-status?url=${encodeURIComponent(url)}`,
        { timeout: 4000 }
      );
      setLinkStatus({
        loading: false,
        reachable: response.data?.reachable,
        status: response.data?.status
      });
    } catch (err) {
      setLinkStatus({
        loading: false,
        reachable: false,
        status: null,
        error: err.message
      });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <aside
      className={clsx(
        'w-full h-full bg-slate-900 border-l border-slate-800 flex flex-col z-20 text-slate-100 shadow-2xl printable-drawer overflow-hidden',
        className
      )}
    >
      {/* Header Tabs */}
      <div className="flex border-b border-slate-800 bg-slate-950/70 p-2.5 gap-2 no-print shrink-0">
        <button
          type="button"
          onClick={() => setActiveTab('kit')}
          className={clsx(
            'flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all',
            activeTab === 'kit'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
          )}
        >
          <FileText className="w-4 h-4" />
          <span>Master Dossier</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-950/80 text-indigo-300 font-mono border border-indigo-900/50">
            {checkedCount}/{masterDocList.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('inspector')}
          className={clsx(
            'flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all',
            activeTab === 'inspector'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
          )}
        >
          <Search className="w-4 h-4" />
          <span>Step Inspector</span>
          {selectedNode && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          )}
        </button>
      </div>

      {/* Tab 1: Master Document Kit */}
      {activeTab === 'kit' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Quick Metrics Summary Banner */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-400">
                <Sparkles className="w-4 h-4" />
                Statutory Metrics
              </div>
              <button
                type="button"
                onClick={handlePrint}
                className="no-print inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors shadow-sm border border-slate-700"
                title="Print official document kit"
              >
                <Printer className="w-3.5 h-3.5 text-indigo-400" />
                Print Kit
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800/80">
                <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1">
                  <Clock className="w-3.5 h-3.5 text-blue-400" />
                  Total Duration
                </div>
                <div className="text-base font-bold text-white">
                  ~{metrics.totalDays} Days
                </div>
              </div>

              <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800/80">
                <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1">
                  <IndianRupee className="w-3.5 h-3.5 text-emerald-400" />
                  Statutory Fees
                </div>
                <div className="text-base font-bold text-emerald-400">
                  ₹{Number(metrics.totalCost).toLocaleString('en-IN')}
                </div>
              </div>

              <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800/80">
                <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1">
                  <FileText className="w-3.5 h-3.5 text-amber-400" />
                  Total Forms
                </div>
                <div className="text-base font-bold text-white">
                  {metrics.totalDocs} Clearances
                </div>
              </div>

              <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800/80">
                <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  Bottlenecks
                </div>
                <div className="text-base font-bold text-rose-400">
                  {metrics.bottlenecks} Critical
                </div>
              </div>
            </div>

            {/* Print Header (Only in print) */}
            <div className="hidden print:block text-slate-800 text-xs mt-2 border-t pt-2">
              <div className="font-bold text-sm">{graphData?.taskTitle}</div>
              <div>Jurisdiction: {graphData?.jurisdiction}</div>
              <div>Legal Authority: {graphData?.legalReference}</div>
            </div>
          </div>

          {/* Search Documents in Dossier */}
          <div className="relative no-print">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={docSearch}
              onChange={(e) => setDocSearch(e.target.value)}
              placeholder="Search required forms, NOCs, certificates..."
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Interactive Dossier Checklist */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
                Required Clearances ({filteredDocs.length})
              </h4>
              <span className="text-[11px] text-slate-400 no-print">
                {checkedCount} gathered
              </span>
            </div>

            <div className="space-y-2">
              {filteredDocs.map((doc, idx) => {
                const isChecked = Boolean(checkedDocs[doc.name]);
                return (
                  <div
                    key={idx}
                    onClick={() => toggleDoc(doc.name)}
                    className={clsx(
                      'group flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer select-none',
                      isChecked
                        ? 'bg-emerald-950/30 border-emerald-800/60 text-slate-200'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-850/80 text-slate-300'
                    )}
                  >
                    <div className="mt-0.5 shrink-0">
                      {isChecked ? (
                        <CheckSquare className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-600 group-hover:text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={clsx(
                          'text-xs font-semibold leading-snug',
                          isChecked && 'line-through text-slate-500'
                        )}
                      >
                        {doc.name}
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {doc.steps.map((st, sIdx) => (
                          <span
                            key={sIdx}
                            className="inline-flex items-center text-[10px] px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-400"
                          >
                            {st.stage.split(':')[0] || st.stage}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Step Inspector */}
      {activeTab === 'inspector' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!selectedNode ? (
            /* Empty State */
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-center text-indigo-400 shadow-xl">
                <Search className="w-7 h-7" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-200">
                  Select a Step on the Map
                </h4>
                <p className="text-xs text-slate-400 mt-1.5 max-w-[260px] leading-relaxed">
                  Click any roadmap node to inspect official statutory forms, section rules, and portal links.
                </p>
              </div>
            </div>
          ) : (
            /* Detailed Step Inspector */
            <div className="space-y-4">
              {/* Header Card */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5 shadow-xl">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-800/60">
                    {selectedNode.stage}
                  </span>
                  {selectedNode.isBottleneck && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-800/60">
                      <AlertTriangle className="w-3 h-3" />
                      Bottleneck
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-base text-white leading-snug">
                  {selectedNode.title}
                </h3>

                <div className="flex items-center gap-1.5 text-xs text-slate-300">
                  <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{selectedNode.department}</span>
                </div>

                {/* Time & Cost Badges */}
                <div className="flex items-center gap-3 pt-2 mt-2 border-t border-slate-850 text-xs">
                  <div className="flex items-center gap-1 text-slate-300">
                    <Clock className="w-3.5 h-3.5 text-blue-400" />
                    <span>Est. {selectedNode.estimatedDays} Days</span>
                  </div>
                  <div className="flex items-center gap-1 text-emerald-400 font-semibold">
                    <IndianRupee className="w-3.5 h-3.5" />
                    <span>₹{Number(selectedNode.cost || 0).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Plain Language Summary */}
              {selectedNode.plainLanguageSummary && (
                <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-900/50 space-y-1.5 shadow-lg">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-300 uppercase tracking-wider">
                    <Info className="w-3.5 h-3.5 text-indigo-400" />
                    Plain Language Explanation
                  </div>
                  <p className="text-xs text-indigo-100 leading-relaxed">
                    {selectedNode.plainLanguageSummary}
                  </p>
                </div>
              )}

              {/* Statutory Legal Rule */}
              {selectedNode.statutoryRule && (
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1.5 shadow-lg">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300 uppercase tracking-wider">
                    <Scale className="w-3.5 h-3.5 text-amber-400" />
                    Statutory Rule & Section
                  </div>
                  <p className="text-xs text-slate-200 font-mono italic bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
                    {selectedNode.statutoryRule}
                  </p>
                </div>
              )}

              {/* Step Forms */}
              {Array.isArray(selectedNode.forms) && selectedNode.forms.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-indigo-400" />
                    Forms & Submissions Required
                  </h4>
                  <div className="space-y-1.5">
                    {selectedNode.forms.map((form, fIdx) => (
                      <div
                        key={fIdx}
                        className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 mt-0.5 shrink-0" />
                        <span className="leading-snug">{form}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Official Portal & Link Status */}
              {selectedNode.officialUrl && (
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3 shadow-xl">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                    Official Government Portal
                  </span>

                  <a
                    href={selectedNode.officialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-lg shadow-indigo-600/30 active:scale-95"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open Official Portal
                  </a>

                  {/* Portal Status Checker */}
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={() => handleCheckLink(selectedNode.officialUrl)}
                      disabled={linkStatus?.loading}
                      className="inline-flex items-center gap-1 text-slate-400 hover:text-slate-200 text-[11px] font-medium transition-colors"
                    >
                      <Activity
                        className={clsx('w-3.5 h-3.5', linkStatus?.loading && 'animate-spin text-indigo-400')}
                      />
                      {linkStatus?.loading ? 'Probing portal...' : 'Test Server Connectivity'}
                    </button>

                    {linkStatus && !linkStatus.loading && (
                      <div>
                        {linkStatus.reachable ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800/80 px-2.5 py-0.5 rounded-full">
                            🟢 Online ({linkStatus.status || '200 OK'})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-950/80 border border-amber-800/80 px-2.5 py-0.5 rounded-full">
                            ⚠️ Unreachable
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
