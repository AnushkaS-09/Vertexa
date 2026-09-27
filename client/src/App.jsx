import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Compass,
  Search,
  BookOpen,
  Loader2,
  Sparkles,
  Building2,
  Home,
  Mountain,
  FileCheck,
  Menu,
  X,
  FileText,
  MapPin,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

import RoadmapCanvas from './components/graph/RoadmapCanvas';
import DocumentDrawer from './components/sidebar/DocumentDrawer';
import JargonBusterModal from './components/common/JargonBusterModal';

// Statutory Fallback Seed Data (Maharashtra UDCPR 2020)
const FALLBACK_SEED_GRAPH = {
  taskId: "residential-building-permission-mh-full",
  taskTitle: "Full Municipal Permitting Pipeline: Residential Building (G+2 / Independent Bungalow)",
  jurisdiction: "Urban Local Bodies across Maharashtra (UDCPR 2020 / MahaBPAMS / RTS Act)",
  totalEstimatedDays: 90,
  totalEstimatedCostINR: 58500,
  legalReference: "Maharashtra Regional & Town Planning (MRTP) Act 1966 & UDCPR 2020",
  nodes: [
    {
      id: "node_title",
      stage: "Stage 1: Revenue & Land Title",
      title: "Certified 7/12 Extract or CTS Property Card",
      department: "Revenue Dept & Land Records (Mahabhulekh / Aaple Sarkar)",
      type: "prerequisite",
      estimatedDays: 3,
      cost: 150,
      statutoryRule: "UDCPR 2020, Reg 2.2.3(a)",
      forms: ["V.F. 7/12 Extract (issued within 6 months)", "Property Register Card (मालमत्ता पत्रक)", "Search Index-II from Sub-Registrar"],
      officialUrl: "https://bhulekh.mahabhumi.gov.in",
      plainLanguageSummary: "Proof that you hold unencumbered legal title with no government reservations, litigation, or liens.",
      isBottleneck: false
    },
    {
      id: "node_mojani",
      stage: "Stage 1: Revenue & Land Title",
      title: "Cadastral Measurement & Demarcation (Kayam Mojani)",
      department: "Taluka Inspector of Land Records (TILR) / Bhumi Abhilekh",
      type: "prerequisite",
      estimatedDays: 21,
      cost: 3000,
      statutoryRule: "UDCPR 2020, Reg 2.2.3(b)",
      forms: ["Form No. 1 (Demarcation Application)", "Certified Mojani Sheet (मोजणी नकाशा)"],
      officialUrl: "https://aaplesarkar.mahaonline.gov.in",
      plainLanguageSummary: "Official surveyor pins exact plot boundaries on the ground to certify street widening lines and road setbacks.",
      isBottleneck: true
    },
    {
      id: "node_tax_noc",
      stage: "Stage 1: Revenue & Land Title",
      title: "Municipal Property Tax No-Dues Clearance",
      department: "Municipal Assessment & Collection Department",
      type: "prerequisite",
      estimatedDays: 2,
      cost: 0,
      statutoryRule: "UDCPR 2020, Reg 2.2.3(f)",
      forms: ["Current Assessment Year Paid Tax Receipt", "No-Dues Certificate (NOC)"],
      officialUrl: "https://portal.mcgm.gov.in",
      plainLanguageSummary: "Validates that all open land tax dues up to the current fiscal quarter are fully cleared.",
      isBottleneck: false
    },
    {
      id: "node_autodcr",
      stage: "Stage 2: Architectural Scrutiny & PreDCR",
      title: "Architect CAD Plan Submission (AutoDCR Scrutiny)",
      department: "Town Planning Scrutiny Cell (MahaBPAMS)",
      type: "submission",
      estimatedDays: 10,
      cost: 15000,
      statutoryRule: "UDCPR 2020, Reg 2.2.1 & Reg 2.2.4",
      forms: [
        "Appendix A-1 (Prescribed Application for Development)",
        "Appendix B (Supervision Certificate by Council of Architecture registered Architect)",
        "PreDCR CAD Sheet (.dwg) with layered setbacks and FSI tables",
        "Structural Stability Certificate (Registered Structural Engineer)"
      ],
      officialUrl: "https://mahadma.maharashtra.gov.in",
      plainLanguageSummary: "Architect uploads floor plans into the state automated engine to test against setbacks, FSI, parking, and height limits.",
      isBottleneck: false
    },
    {
      id: "node_site_inspection",
      stage: "Stage 2: Architectural Scrutiny & PreDCR",
      title: "Site Inspection by Assistant Town Planner (ATP)",
      department: "Municipal Corporation / Council Town Planning Wing",
      type: "inspection",
      estimatedDays: 7,
      cost: 0,
      statutoryRule: "UDCPR 2020, Reg 2.4 & RTS Act",
      forms: ["ATP Geo-Tagged Site Verification Checklist", "Road Width & High Tension Wire Verification Report"],
      officialUrl: "https://mahadma.maharashtra.gov.in",
      plainLanguageSummary: "Municipal junior engineer visits the ground to ensure actual road width and access match the blueprint.",
      isBottleneck: true
    },
    {
      id: "node_iod",
      stage: "Stage 2: Architectural Scrutiny & PreDCR",
      title: "Intimation of Disapproval (IOD) / Conditional Sanction",
      department: "Executive Engineer / Building Proposal Department",
      type: "conditional_approval",
      estimatedDays: 5,
      cost: 0,
      statutoryRule: "MRTP Act Section 45 & UDCPR Reg 2.5",
      forms: ["IOD Letter with 15–20 conditional compliance clauses"],
      officialUrl: "https://mahadma.maharashtra.gov.in",
      plainLanguageSummary: "Conditional green signal. Certifies plan compliance, but forbids construction until all parallel departmental NOCs are produced.",
      isBottleneck: false
    },
    {
      id: "node_tree_noc",
      stage: "Stage 3: Parallel Departmental NOCs",
      title: "Tree Authority NOC (Preservation & Re-plantation)",
      department: "Garden & Tree Authority Department",
      type: "clearance",
      estimatedDays: 14,
      cost: 2500,
      statutoryRule: "Maharashtra (Urban Areas) Protection & Preservation of Trees Act, 1975",
      forms: ["Form A (Tree Census on Plot)", "Affidavit for Compensatory Plantation"],
      officialUrl: "https://portal.mcgm.gov.in",
      plainLanguageSummary: "Mandatory survey ensuring no protected trees are felled without formal municipal permission and compensatory plantation deposits.",
      isBottleneck: true
    },
    {
      id: "node_hydraulic_noc",
      stage: "Stage 3: Parallel Departmental NOCs",
      title: "Hydraulic & Stormwater Drainage Sanction",
      department: "Hydraulic Engineer / Sewerage Operations",
      type: "clearance",
      estimatedDays: 10,
      cost: 5000,
      statutoryRule: "UDCPR 2020, Reg 2.2.5(d)",
      forms: ["Sanction of Water Supply Connection Form", "Stormwater Invert Level Layout Plan"],
      officialUrl: "https://portal.mcgm.gov.in",
      plainLanguageSummary: "Certifies the plot can discharge rainwater into municipal drains without causing localized street waterlogging.",
      isBottleneck: false
    },
    {
      id: "node_cc",
      stage: "Stage 4: Groundbreaking to Superstructure",
      title: "Commencement Certificate (CC) — Plinth Level",
      department: "Building Proposal Dept / Chief Officer",
      type: "permit",
      estimatedDays: 7,
      cost: 28000,
      statutoryRule: "UDCPR 2020, Reg 2.6",
      forms: ["Appendix C (Sanction of Development Permission / CC)", "Development Charges & Labor Cess Challan Receipt"],
      officialUrl: "https://mahadma.maharashtra.gov.in",
      plainLanguageSummary: "The legal green flag allowing physical excavation and construction up to plinth level.",
      isBottleneck: false
    },
    {
      id: "node_plinth_check",
      stage: "Stage 4: Groundbreaking to Superstructure",
      title: "Mandatory Plinth Inspection & Superstructure CC",
      department: "Municipal Engineering Inspection Cell",
      type: "inspection",
      estimatedDays: 8,
      cost: 0,
      statutoryRule: "UDCPR 2020, Reg 2.8.4",
      forms: ["Appendix G (Notice of Plinth Completion)", "Plinth Verification Endorsement"],
      officialUrl: "https://mahadma.maharashtra.gov.in",
      plainLanguageSummary: "Hard stop! Construction must pause when foundation reaches plinth height. Engineers verify setbacks before granting permission to cast upper slabs.",
      isBottleneck: true
    },
    {
      id: "node_oc",
      stage: "Stage 5: Habitation & Utilities",
      title: "Building Completion & Final Occupancy Certificate (OC)",
      department: "Town Planning Authority & Municipal Health Dept",
      type: "final_approval",
      estimatedDays: 15,
      cost: 1500,
      statutoryRule: "UDCPR 2020, Reg 2.10",
      forms: [
        "Appendix H (Architect Completion Certificate)",
        "Structural Engineer Final Stability Undertaking",
        "Drainage Completion & Water Connection Certificate",
        "Occupancy Certificate (Appendix I)"
      ],
      officialUrl: "https://mahadma.maharashtra.gov.in",
      plainLanguageSummary: "Certifies the building matches the sanctioned blueprint, unlocking legal electricity meters, permanent drinking water, and property assessment.",
      isBottleneck: false
    }
  ],
  edges: [
    { id: "e_title_mojani", source: "node_title", target: "node_mojani", label: "Title deed required for demarcation" },
    { id: "e_title_autodcr", source: "node_title", target: "node_autodcr", label: "Upload title proof to Appendix A-1" },
    { id: "e_mojani_autodcr", source: "node_mojani", target: "node_autodcr", label: "Coordinates mapped into CAD drawing" },
    { id: "e_tax_autodcr", source: "node_tax_noc", target: "node_autodcr", label: "No-dues receipt required for scrutiny" },
    { id: "e_autodcr_site", source: "node_autodcr", target: "node_site_inspection", label: "CAD scrutiny clearance triggers site visit" },
    { id: "e_site_iod", source: "node_site_inspection", target: "node_iod", label: "ATP site clearance issues IOD" },
    { id: "e_iod_tree", source: "node_iod", target: "node_tree_noc", label: "IOD Condition #4: Tree NOC" },
    { id: "e_iod_hydraulic", source: "node_iod", target: "node_hydraulic_noc", label: "IOD Condition #7: Drainage sanction" },
    { id: "e_tree_cc", source: "node_tree_noc", target: "node_cc", label: "Tree clearance submitted" },
    { id: "e_hydraulic_cc", source: "node_hydraulic_noc", target: "node_cc", label: "Drainage compliance submitted" },
    { id: "e_cc_plinth", source: "node_cc", target: "node_plinth_check", label: "Excavation to Plinth height" },
    { id: "e_plinth_oc", source: "node_plinth_check", target: "node_oc", label: "Superstructure slabs & final finishes" }
  ]
};

const PRESETS = [
  {
    id: 'res-full-pipeline',
    label: 'Standard Residential Bungalow (G+2)',
    icon: Home,
    query: 'Residential House building permission G+2 Bungalow UDCPR 2020',
    city: 'Maharashtra'
  },
  {
    id: 'res-hill-station',
    label: 'Hill Station House (Matheran / Eco-Zone)',
    icon: Mountain,
    query: 'Residential Bungalow construction in Matheran Eco-Sensitive Zone',
    city: 'Matheran'
  },
  {
    id: 'res-predcr-iod',
    label: 'PreDCR CAD & Architectural Scrutiny',
    icon: Building2,
    query: 'PreDCR CAD scrutiny AutoDCR plan approval and IOD for residential building',
    city: 'Pune'
  },
  {
    id: 'res-plinth-oc',
    label: 'Plinth to Occupancy Certificate (OC)',
    icon: FileCheck,
    query: 'Plinth level inspection superstructure CC and final Occupancy Certificate OC',
    city: 'Mumbai'
  }
];

export default function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('Maharashtra');
  const [graphData, setGraphData] = useState(FALLBACK_SEED_GRAPH);
  const [selectedNode, setSelectedNode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isJargonModalOpen, setIsJargonModalOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Fetch roadmap from backend API
  const fetchRoadmap = useCallback(async (query, city) => {
    setLoading(true);
    try {
      const response = await axios.post(
        'http://localhost:5000/api/navigate',
        { query, city },
        { timeout: 15000 }
      );
      if (response.data && response.data.nodes && response.data.nodes.length > 0) {
        setGraphData(response.data);
        setSelectedNode(null);
      } else {
        setGraphData(FALLBACK_SEED_GRAPH);
      }
    } catch (err) {
      console.warn('[Network/API Fallback] Using offline statutory seed graph:', err.message);
      setGraphData(FALLBACK_SEED_GRAPH);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchRoadmap('Residential house building permission', 'Maharashtra');
  }, [fetchRoadmap]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    fetchRoadmap(searchQuery, selectedCity);
  };

  const handlePresetSelect = (preset) => {
    setSearchQuery(preset.query);
    setSelectedCity(preset.city);
    fetchRoadmap(preset.query, preset.city);
  };

  const handleSelectNode = useCallback((nodeData) => {
    setSelectedNode(nodeData);
    setMobileDrawerOpen(true);
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans select-none">
      {/* Top Navigation Bar (Hidden during print) */}
      <header className="h-16 shrink-0 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between gap-4 z-30 shadow-md no-print">
        {/* Brand & Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
            <Compass className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent flex items-center gap-2">
              CivicPath Visualizer
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-indigo-950/80 text-indigo-400 border border-indigo-800/60 hidden sm:inline-block">
                UDCPR 2020 & Acts
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 hidden sm:block truncate max-w-[340px]">
              {graphData?.taskTitle || 'Statutory Municipal Clearances Roadmap'}
            </p>
          </div>
        </div>

        {/* Center: Search & City Input Form */}
        <form
          onSubmit={handleSearchSubmit}
          className="hidden md:flex items-center gap-2 flex-1 max-w-xl mx-4"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search residential project (e.g., G+2 Bungalow in Pune, Matheran Eco-House, Plinth to OC)..."
              className="w-full bg-slate-800/90 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Deconstructing...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Deconstruct</span>
              </>
            )}
          </button>
        </form>

        {/* Right Actions: Jargon Buster & Mobile Drawer Toggle */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsJargonModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-all shadow-sm"
            title="Open Civic Jargon Buster glossary"
          >
            <BookOpen className="w-4 h-4 text-indigo-400" />
            <span className="hidden sm:inline">Jargon Buster</span>
          </button>

          {/* Mobile Drawer Toggle */}
          <button
            type="button"
            onClick={() => setMobileDrawerOpen((prev) => !prev)}
            className="lg:hidden p-2 rounded-xl bg-slate-800 text-slate-200 border border-slate-700"
            title="Toggle Document Drawer"
          >
            {mobileDrawerOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Preset Pills Bar (Hidden during print) */}
      <div className="h-10 shrink-0 bg-slate-950/90 border-b border-slate-800 px-4 flex items-center justify-between gap-2 overflow-x-auto text-xs no-print">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider shrink-0">
            Residential Scenarios:
          </span>
          {PRESETS.map((preset) => {
            const Icon = preset.icon;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handlePresetSelect(preset)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-[11px] font-medium transition-colors shrink-0"
              >
                <Icon className="w-3 h-3 text-indigo-400" />
                {preset.label}
              </button>
            );
          })}
        </div>

        <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-400">
          <MapPin className="w-3.5 h-3.5 text-emerald-400" />
          <span>Jurisdiction: <strong>{graphData?.jurisdiction?.split('(')[0] || 'Maharashtra ULBs'}</strong></span>
        </div>
      </div>

      {/* Main Workspace Layout (Canvas + Full-Width Responsive Drawer) */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* Left: ReactFlow Interactive DAG Canvas */}
        <div className="flex-1 min-w-0 h-full relative">
          <RoadmapCanvas
            graphData={graphData}
            onSelectNode={handleSelectNode}
            selectedNodeId={selectedNode?.id}
          />
        </div>

        {/* Right: Master Document Kit & Step Inspector Drawer */}
        <div
          className={`
            lg:static absolute inset-y-0 right-0 z-30 transition-transform duration-300 ease-in-out
            ${mobileDrawerOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
            w-full sm:w-[380px] lg:w-[380px] xl:w-[420px] shrink-0 h-full
          `}
        >
          <DocumentDrawer
            graphData={graphData}
            selectedNode={selectedNode}
            onSelectNode={handleSelectNode}
          />
        </div>
      </main>

      {/* Jargon Buster Glossary Modal */}
      <JargonBusterModal
        isOpen={isJargonModalOpen}
        onClose={() => setIsJargonModalOpen(false)}
        graphData={graphData}
      />
    </div>
  );
}
