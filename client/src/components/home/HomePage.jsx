import React from 'react';
import {
  Compass,
  Sparkles,
  Sliders,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  FileText,
  MapPin,
  Layers,
  HelpCircle,
  Clock,
  CheckSquare,
  Building,
  FileCheck2,
  Search,
  AlertCircle,
  X
} from 'lucide-react';
import clsx from 'clsx';

export default function HomePage({
  searchQuery,
  setSearchQuery,
  onStartConstruct,
  onOpenQuestionnaire,
  onOpenJargonBuster,
  hasActiveRoadmap = false,
  onViewActiveRoadmap,
  loading = false,
  scopeFeedback = null,
  onClearScopeFeedback
}) {
  const handleFormSubmit = (e) => {
    e.preventDefault();
    onStartConstruct(searchQuery);
  };

  const samplePrompts = [
    {
      title: 'Residential Bungalow (Pune)',
      query: 'I want to construct a residential G+2 house in Pune'
    },
    {
      title: 'Commercial Complex (Mumbai)',
      query: 'I want to construct a commercial shopping and office complex in Mumbai'
    },
    {
      title: 'Institutional School (Thane)',
      query: 'I want to construct a school and educational building in Thane'
    },
    {
      title: 'Hospitality Hotel (Pune)',
      query: 'I want to build a hotel and resort in Pune'
    },
    {
      title: 'Mixed-Use Building (PCMC)',
      query: 'I want a mixed-use building with retail shops and residential apartments'
    },
    {
      title: 'Industrial Warehouse (Thane)',
      query: 'I want to build an industrial manufacturing plant and warehouse'
    }
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 text-slate-100 font-sans select-none">
      {/* Hero Container */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-12">

        {/* Top Header / Welcome Banner */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-800/60 text-indigo-300 text-xs font-semibold shadow-sm">
            <Compass className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
            <span>Maharashtra Construction Permitting Navigator • UDCPR 2020 & MRTP Act 1966</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            Welcome to CivicPath
          </h1>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-300 leading-relaxed">
            Your interactive statutory guide to navigating municipal building permissions, architectural scrutiny, and parallel departmental NOC clearances for residential, commercial, institutional, hospitality, mixed-use, and industrial construction projects across Maharashtra.
          </p>
        </div>

        {/* Primary Entry Point: Custom Request Input */}
        <div className="relative p-6 sm:p-8 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-900/90 border border-slate-800 shadow-2xl shadow-indigo-950/20">
          <div className="mb-4">
            <label htmlFor="custom-request-input" className="block text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">
              Start with Your Project Requirement
            </label>
            <p className="text-xs text-slate-400">
              Describe what you want to build or what approval you need (Residential, Commercial, Institutional, Hospitality, Mixed-Use, Industrial, or Other). Clicking <strong className="text-slate-200">Construct</strong> opens the Plot Questionnaire to tailor your statutory roadmap.
            </p>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="custom-request-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (scopeFeedback && onClearScopeFeedback) {
                      onClearScopeFeedback();
                    }
                  }}
                  placeholder="e.g., I want to construct a commercial complex in Pune / residential house / school..."
                  className="w-full bg-slate-850 border border-slate-700 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-inner"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50 cursor-pointer shrink-0"
              >
                <Sparkles className="w-4 h-4" />
                <span>{loading ? 'Constructing...' : 'Construct'}</span>
              </button>
            </div>

            {/* Scope / Intent Validation Feedback */}
            {scopeFeedback && (
              <div
                className={clsx(
                  'p-3.5 rounded-xl text-xs flex items-start gap-2.5 border shadow-md transition-all',
                  scopeFeedback.status === 'OUT_OF_SCOPE'
                    ? 'bg-rose-950/60 border-rose-800/80 text-rose-200'
                    : 'bg-amber-950/60 border-amber-800/80 text-amber-200'
                )}
              >
                {scopeFeedback.status === 'OUT_OF_SCOPE' ? (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                ) : (
                  <HelpCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                )}
                <div className="flex-1 space-y-1">
                  <div className="font-bold text-[12px]">
                    {scopeFeedback.status === 'OUT_OF_SCOPE'
                      ? 'Requirement Outside Vertexa Scope'
                      : 'Clarification Needed'}
                  </div>
                  <p className="leading-relaxed text-[11px] opacity-90">
                    {scopeFeedback.message}
                  </p>
                </div>
                {onClearScopeFeedback && (
                  <button
                    type="button"
                    onClick={onClearScopeFeedback}
                    className="text-slate-400 hover:text-white p-0.5 cursor-pointer"
                    title="Dismiss notice"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            {/* Quick Suggestions */}
            <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-400 text-[11px] font-medium">Try an example:</span>
              {samplePrompts.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setSearchQuery(p.query);
                    if (scopeFeedback && onClearScopeFeedback) {
                      onClearScopeFeedback();
                    }
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-750 border border-slate-700 text-slate-300 hover:text-white text-[11px] transition-colors cursor-pointer"
                >
                  {p.title}
                </button>
              ))}
            </div>
          </form>

          {/* Quick Active Roadmap Return Banner if available */}
          {hasActiveRoadmap && (
            <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">You have an active roadmap loaded.</span>
              <button
                type="button"
                onClick={onViewActiveRoadmap}
                className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
              >
                <span>View Current Roadmap</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* 1. What the App Does */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">What CivicPath Does</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-950 border border-indigo-800/60 flex items-center justify-center text-indigo-400">
                <Search className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-100">1. Analyzes Your Requirement</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Accepts your custom construction query and parses key project parameters for any urban local body across Maharashtra.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
                <Sliders className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-100">2. Evaluates Plot Rules</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Uses our deterministic UDCPR 2020 rules engine to calculate which statutory clearances apply, which are exempt, and which require site verification.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-blue-950 border border-blue-800/60 flex items-center justify-center text-blue-400">
                <FileCheck2 className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-100">3. Generates Interactive Roadmap</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Constructs a step-by-step sequential DAG mapping revenue title proofs, CAD scrutiny, ATP inspections, parallel NOCs, Plinth check, and Final OC.
              </p>
            </div>
          </div>
        </div>

        {/* 2. How to Use the App (Step-by-Step) */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-6">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-indigo-400" />
              How to Use the App
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Follow these simple steps to build and navigate your residential approval roadmap:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-850/80 border border-slate-750 space-y-1.5">
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/50">
                Step 1
              </span>
              <h4 className="text-xs font-bold text-slate-200">Describe What You Need</h4>
              <p className="text-[11px] text-slate-400">
                Enter your custom request in the search box above (e.g. Pune G+2 Bungalow or hill station house).
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-850/80 border border-slate-750 space-y-1.5">
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/50">
                Step 2
              </span>
              <h4 className="text-xs font-bold text-slate-200">Click Construct</h4>
              <p className="text-[11px] text-slate-400">
                Press the Construct button to open the Plot Questionnaire modal.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-850/80 border border-slate-750 space-y-1.5">
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/50">
                Step 3
              </span>
              <h4 className="text-xs font-bold text-slate-200">Answer Plot Questionnaire</h4>
              <p className="text-[11px] text-slate-400">
                Confirm your plot dimensions, building height, road width, and any site factors (trees, heritage, airport, HT lines).
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-850/80 border border-slate-750 space-y-1.5">
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/50">
                Step 4
              </span>
              <h4 className="text-xs font-bold text-slate-200">Review Your Roadmap</h4>
              <p className="text-[11px] text-slate-400">
                Explore the generated node workflow, estimated timelines, statutory rules, forms, and official government portal links.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-850/80 border border-slate-750 space-y-1.5">
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/50">
                Step 5
              </span>
              <h4 className="text-xs font-bold text-slate-200">Track Progress Step-by-Step</h4>
              <p className="text-[11px] text-slate-400">
                Click "Mark Step as Completed" to track progress. CivicPath automatically highlights the next consecutive statutory step.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-850/80 border border-slate-750 space-y-1.5">
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/50">
                Step 6
              </span>
              <h4 className="text-xs font-bold text-slate-200">Use Dossier & Jargon Tools</h4>
              <p className="text-[11px] text-slate-400">
                Download your Master Document Kit or open the Jargon Buster glossary for simple explanations of civic terms (7/12, IOD, CC, OC).
              </p>
            </div>
          </div>
        </div>

        {/* 3. Core Features Grid */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">Main Features</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                <Compass className="w-4 h-4 text-indigo-400" />
                Tailored Roadmap Generation
              </h3>
              <p className="text-[11px] text-slate-400">
                Directed Acyclic Graph (DAG) visualizing dependencies across 5 structured stages from Land Title to Occupancy.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-400" />
                Plot Questionnaire
              </h3>
              <p className="text-[11px] text-slate-400">
                Structured parameter intake capturing building height, road width, and environmental zones for precise rule evaluation.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                Authority Applicability Engine
              </h3>
              <p className="text-[11px] text-slate-400">
                Three-state classification clearly distinguishing APPLIES, EXEMPT, and REQUIRES VERIFICATION with statutory references.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                Sequential Progress Tracking
              </h3>
              <p className="text-[11px] text-slate-400">
                Automated progression that updates your active step upon completion and persists completed milestones in local storage.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" />
                Master Document Dossier
              </h3>
              <p className="text-[11px] text-slate-400">
                Consolidated document checklist detailing Appendix A-1, supervision certificates, and required forms for printing or download.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-purple-400" />
                Civic Jargon Buster
              </h3>
              <p className="text-[11px] text-slate-400">
                Searchable lexicon explaining complex Marathi and English municipal terms like Kayam Mojani, PreDCR, IOD, CC, and OC.
              </p>
            </div>
          </div>
        </div>

        {/* 4. How It Helps & Progress Tracking */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2.5">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Building className="w-4 h-4 text-indigo-400" />
              How CivicPath Helps You
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Municipal permitting in Maharashtra involves multiple departments (TILR, Town Planning, Tree Authority, CFO, Water Supply, Heritage). Instead of a confusing list of rules, CivicPath translates statutory regulations (UDCPR 2020 & MRTP Act 1966) into an orderly, transparent roadmap tailored to your specific plot.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2.5">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              How to Track Progress
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              As you obtain clearance documents from authorities, click <strong>"Mark as Completed"</strong> in the Document Drawer. CivicPath visually ticks the node on the interactive graph, computes your progress percentage, and advances your active focus to the next consecutive prerequisite step.
            </p>
          </div>
        </div>

        {/* 5. Statutory Guidance Notice */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-semibold text-slate-200">Informational Guidance Notice</h4>
            <p className="leading-relaxed text-[11px]">
              CivicPath provides informational statutory roadmap guidance based on Maharashtra UDCPR 2020 and the MRTP Act 1966. It does not constitute formal legal counsel or guaranteed municipal sanction. Always verify specific site conditions and submit formal proposals through a Council of Architecture (COA) registered architect or licensed engineer.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
