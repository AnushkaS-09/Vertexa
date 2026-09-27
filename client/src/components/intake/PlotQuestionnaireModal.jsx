import React, { useState } from 'react';
import {
  Sliders,
  X,
  Building2,
  Trees,
  LandPlot,
  Ruler,
  ShieldAlert,
  Plane,
  Sparkles,
  Mountain,
  Zap,
  HelpCircle,
  CheckCircle2,
  Flame
} from 'lucide-react';

const MAHARASHTRA_JURISDICTIONS = [
  { id: 'Maharashtra', label: 'Maharashtra State ULBs (MahaBPAMS / UDCPR 2020)' },
  { id: 'Pune', label: 'Pune Municipal Corporation (PMC)' },
  { id: 'Mumbai', label: 'Municipal Corporation of Greater Mumbai (MCGM / AutoDCR)' },
  { id: 'Pimpri-Chinchwad', label: 'Pimpri Chinchwad Municipal Corporation (PCMC)' },
  { id: 'Thane', label: 'Thane Municipal Corporation (TMC)' },
  { id: 'Navi Mumbai', label: 'Navi Mumbai / CIDCO Jurisdiction' },
  { id: 'Matheran', label: 'Matheran Hill Station Municipal Council (Eco-Sensitive Zone)' },
  { id: 'Nashik', label: 'Nashik Municipal Corporation (NMC)' },
  { id: 'Nagpur', label: 'Nagpur Municipal Corporation (NMC)' }
];

export default function PlotQuestionnaireModal({
  isOpen,
  onClose,
  initialValues = {},
  onSubmitQuestionnaire,
  loading = false
}) {
  const [formData, setFormData] = useState(() => ({
    jurisdiction: initialValues.jurisdiction || 'Maharashtra',
    plotArea: initialValues.plotArea || 200,
    buildingHeight: initialValues.buildingHeight || 8.5,
    roadWidth: initialValues.roadWidth || 9.0,
    treesAffected: initialValues.treesAffected || 0,
    heritageZone: initialValues.heritageZone || false,
    airportZone: initialValues.airportZone || false,
    ecoSensitiveZone: initialValues.ecoSensitiveZone || false,
    hasHighTensionLine: initialValues.hasHighTensionLine || false
  }));

  React.useEffect(() => {
    if (isOpen) {
      setFormData({
        jurisdiction: initialValues.jurisdiction || 'Maharashtra',
        plotArea: initialValues.plotArea || 200,
        buildingHeight: initialValues.buildingHeight || 8.5,
        roadWidth: initialValues.roadWidth || 9.0,
        treesAffected: initialValues.treesAffected || 0,
        heritageZone: initialValues.heritageZone || false,
        airportZone: initialValues.airportZone || false,
        ecoSensitiveZone: initialValues.ecoSensitiveZone || false,
        hasHighTensionLine: initialValues.hasHighTensionLine || false
      });
    }
  }, [isOpen, initialValues]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmitQuestionnaire(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                Plot & Construction Questionnaire
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                  UDCPR 2020 Rules Engine
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Answer simple questions about your plot to determine exactly which statutory NOCs apply vs are exempt.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
          
          {/* Section 1: Jurisdiction & Dimensions */}
          <div>
            <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <LandPlot className="w-4 h-4" />
              1. Location & Plot Geometry
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Jurisdiction */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Planning Authority / City
                </label>
                <select
                  value={formData.jurisdiction}
                  onChange={(e) => setFormData({ ...formData, jurisdiction: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {MAHARASHTRA_JURISDICTIONS.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.label}
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Determines applicable portal (MahaBPAMS vs MCGM AutoDCR).
                </span>
              </div>

              {/* Plot Area */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Plot Area (in sq. meters)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="30"
                    max="10000"
                    step="1"
                    value={formData.plotArea}
                    onChange={(e) => setFormData({ ...formData, plotArea: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-400 font-mono">
                    sq.m (~{(formData.plotArea * 10.764).toFixed(0)} sq.ft)
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Affects basic FSI and open space setback margins.
                </span>
              </div>

              {/* Building Height */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Proposed Building Height (meters)</span>
                  {formData.buildingHeight > 15 && (
                    <span className="text-[10px] text-amber-400 font-bold flex items-center gap-1">
                      <Flame className="w-3 h-3" /> &gt;15m High-Rise (CFO Fire NOC required)
                    </span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="3"
                    max="50"
                    step="0.5"
                    value={formData.buildingHeight}
                    onChange={(e) => setFormData({ ...formData, buildingHeight: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-400 font-mono">
                    m (~{Math.round(formData.buildingHeight / 3)} floors)
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Ground + 2 bungalow is typically ~8.5m to 9.5m.
                </span>
              </div>

              {/* Road Width */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Abutting Road Width (meters)
                </label>
                <select
                  value={formData.roadWidth}
                  onChange={(e) => setFormData({ ...formData, roadWidth: parseFloat(e.target.value) || 9.0 })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={6.0}>6.0 meters (Minimum residential lane)</option>
                  <option value={9.0}>9.0 meters (Standard residential street)</option>
                  <option value={12.0}>12.0 meters (Municipal collector road)</option>
                  <option value={18.0}>18.0+ meters (Major arterial road / High FSI)</option>
                </select>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  UDCPR Reg 3.3 dictates permissible FSI based on road width.
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Environmental & Site Specifics */}
          <div className="pt-2 border-t border-slate-800">
            <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Trees className="w-4 h-4" />
              2. Environmental & Statutory Clearances
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Trees on Plot */}
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-750">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-slate-200 flex items-center gap-1.5">
                    <Trees className="w-4 h-4 text-emerald-400" />
                    Trees on Plot Footprint
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={formData.treesAffected}
                    onChange={(e) => setFormData({ ...formData, treesAffected: parseInt(e.target.value) || 0 })}
                    className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-center text-slate-100"
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  {formData.treesAffected > 0
                    ? `⚠️ ${formData.treesAffected} tree(s) must be felled/transplanted → Tree Authority NOC required.`
                    : '✓ Zero trees on footprint → Tree felling NOC is exempt.'}
                </p>
              </div>

              {/* Eco-Sensitive Zone */}
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-750">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-slate-200 flex items-center gap-1.5">
                    <Mountain className="w-4 h-4 text-cyan-400" />
                    Eco-Sensitive / Hill Station Zone
                  </label>
                  <input
                    type="checkbox"
                    checked={formData.ecoSensitiveZone || /matheran/i.test(formData.jurisdiction)}
                    onChange={(e) => setFormData({ ...formData, ecoSensitiveZone: e.target.checked })}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-900 border-slate-700 cursor-pointer"
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  {formData.ecoSensitiveZone || /matheran/i.test(formData.jurisdiction)
                    ? '⚠️ Requires High-Level ESZ Monitoring Committee approval.'
                    : 'Standard urban zone (outside Eco-Sensitive buffer zones).'}
                </p>
              </div>

              {/* Heritage Zone */}
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-750">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-slate-200 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-amber-400" />
                    Heritage Precinct (Within 100m)
                  </label>
                  <input
                    type="checkbox"
                    checked={formData.heritageZone}
                    onChange={(e) => setFormData({ ...formData, heritageZone: e.target.checked })}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-900 border-slate-700 cursor-pointer"
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  {formData.heritageZone
                    ? '⚠️ Proximity to Grade I/II listed building → MHCC NOC required.'
                    : 'Outside heritage precincts.'}
                </p>
              </div>

              {/* Airport / Aviation Funnel Zone */}
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-750">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-slate-200 flex items-center gap-1.5">
                    <Plane className="w-4 h-4 text-blue-400" />
                    Airport Funnel (AAI CCZM Map)
                  </label>
                  <input
                    type="checkbox"
                    checked={formData.airportZone}
                    onChange={(e) => setFormData({ ...formData, airportZone: e.target.checked })}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-900 border-slate-700 cursor-pointer"
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  {formData.airportZone
                    ? '⚠️ Within civil aviation flight path → AAI NOCAS clearance required.'
                    : 'Outside radar and obstacle limitation surfaces.'}
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Site Hazards */}
          <div className="pt-2 border-t border-slate-800">
            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-750 flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-slate-200 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  Overhead High-Tension (HT) Power Line Across/Near Plot
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  Flags mandatory horizontal/vertical setback verification under UDCPR 2020 Reg 3.4.
                </span>
              </div>
              <input
                type="checkbox"
                checked={formData.hasHighTensionLine}
                onChange={(e) => setFormData({ ...formData, hasHighTensionLine: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-900 border-slate-700 cursor-pointer"
              />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <HelpCircle className="w-4 h-4 text-indigo-400" />
            <span>Deterministic engine calculates NOCs instantly</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-750 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>{loading ? 'Evaluating UDCPR Rules...' : 'Construct Tailored Roadmap'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
