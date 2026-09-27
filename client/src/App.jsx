import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import clsx from 'clsx';
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
  AlertCircle,
  PanelRightClose,
  PanelRightOpen,
  Sliders,
  ShieldCheck,
  Trees,
  CheckCircle2
} from 'lucide-react';

import RoadmapCanvas from './components/graph/RoadmapCanvas';
import DocumentDrawer from './components/sidebar/DocumentDrawer';
import JargonBusterModal from './components/common/JargonBusterModal';
import PlotQuestionnaireModal from './components/intake/PlotQuestionnaireModal';
import { API_ENDPOINTS } from './config/api';

// Helper to determine the next consecutive step in the workflow sequence
function getNextConsecutiveStep(currentNodeId, nodes = [], edges = [], completedSet = new Set()) {
  if (!nodes || nodes.length === 0) return null;

  const currentIndex = nodes.findIndex((n) => n.id === currentNodeId);
  if (currentIndex === -1) {
    return nodes.find((n) => !completedSet.has(n.id)) || nodes[0];
  }

  // 1. First priority: Check direct outgoing children in the DAG edges
  const directChildrenIds = (edges || [])
    .filter((e) => e.source === currentNodeId)
    .map((e) => e.target);

  const uncompletedChildId = directChildrenIds.find((cId) => !completedSet.has(cId));
  if (uncompletedChildId) {
    const childNode = nodes.find((n) => n.id === uncompletedChildId);
    if (childNode) return childNode;
  }

  // 2. Second priority: Next consecutive node in statutory/topological order
  for (let i = currentIndex + 1; i < nodes.length; i++) {
    if (!completedSet.has(nodes[i].id)) {
      return nodes[i];
    }
  }

  // 3. Third priority: Any remaining uncompleted node in the graph
  const anyRemaining = nodes.find((n) => !completedSet.has(n.id) && n.id !== currentNodeId);
  if (anyRemaining) return anyRemaining;

  // 4. Final step edge case: keep current step selected, do not advance beyond
  return nodes[currentIndex];
}

// Statutory Fallback Seed Data (Maharashtra UDCPR 2020)
const FALLBACK_SEED_GRAPH = {
  taskId: "residential-building-permission-mh-full",
  taskTitle: "Full Municipal Permitting Pipeline: Residential Building (G+2 / Independent Bungalow)",
  jurisdiction: "Urban Local Bodies across Maharashtra (UDCPR 2020 / MahaBPAMS / RTS Act)",
  totalEstimatedDays: 90,
  totalEstimatedCostINR: 58500,
  legalReference: "Maharashtra Regional & Town Planning (MRTP) Act 1966 & UDCPR 2020",
  provenance: "deterministic_curated",
  provenanceLabel: "Curated statutory blueprint (UDCPR 2020)",
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
    label: 'Standard Bungalow (G+2)',
    icon: Home,
    query: 'Residential House building permission G+2 Bungalow UDCPR 2020',
    city: 'Pune',
    questionnaire: {
      jurisdiction: 'Pune',
      plotArea: 200,
      buildingHeight: 8.5,
      roadWidth: 9.0,
      treesAffected: 0,
      heritageZone: false,
      airportZone: false,
      ecoSensitiveZone: false,
      hasHighTensionLine: false
    }
  },
  {
    id: 'res-hill-station',
    label: 'Hill Station Eco-House (Matheran)',
    icon: Mountain,
    query: 'Residential Bungalow construction in Matheran Eco-Sensitive Zone',
    city: 'Matheran',
    questionnaire: {
      jurisdiction: 'Matheran',
      plotArea: 350,
      buildingHeight: 6.5,
      roadWidth: 6.0,
      treesAffected: 1,
      heritageZone: false,
      airportZone: false,
      ecoSensitiveZone: true,
      hasHighTensionLine: false
    }
  },
  {
    id: 'res-highrise',
    label: 'High-Rise Residential (>15m)',
    icon: Building2,
    query: 'Residential Building with CFO Fire NOC and AAI height clearance',
    city: 'Mumbai',
    questionnaire: {
      jurisdiction: 'Mumbai',
      plotArea: 600,
      buildingHeight: 18.0,
      roadWidth: 12.0,
      treesAffected: 0,
      heritageZone: false,
      airportZone: true,
      ecoSensitiveZone: false,
      hasHighTensionLine: false
    }
  },
  {
    id: 'res-heritage-trees',
    label: 'Heritage Zone & Trees',
    icon: Trees,
    query: 'Residential house construction near heritage monument with tree felling permission',
    city: 'Pune',
    questionnaire: {
      jurisdiction: 'Pune',
      plotArea: 300,
      buildingHeight: 9.0,
      roadWidth: 9.0,
      treesAffected: 3,
      heritageZone: true,
      airportZone: false,
      ecoSensitiveZone: false,
      hasHighTensionLine: false
    }
  }
];

export default function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('Maharashtra');
  const [graphData, setGraphData] = useState(FALLBACK_SEED_GRAPH);
  const [selectedNode, setSelectedNode] = useState(null);
  const [completedNodes, setCompletedNodes] = useState(() => {
    try {
      const saved = localStorage.getItem('vertexa_completed_nodes');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });
  const [questionnaireState, setQuestionnaireState] = useState(() => {
    try {
      const saved = localStorage.getItem('vertexa_plot_questionnaire');
      return saved ? JSON.parse(saved) : {
        jurisdiction: 'Pune',
        plotArea: 200,
        buildingHeight: 8.5,
        roadWidth: 9.0,
        treesAffected: 0,
        heritageZone: false,
        airportZone: false,
        ecoSensitiveZone: false,
        hasHighTensionLine: false
      };
    } catch {
      return {
        jurisdiction: 'Pune',
        plotArea: 200,
        buildingHeight: 8.5,
        roadWidth: 9.0,
        treesAffected: 0,
        heritageZone: false,
        airportZone: false,
        ecoSensitiveZone: false,
        hasHighTensionLine: false
      };
    }
  });

  const [loading, setLoading] = useState(false);
  const [isJargonModalOpen, setIsJargonModalOpen] = useState(false);
  const [isQuestionnaireOpen, setIsQuestionnaireOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Sync completedNodes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('vertexa_completed_nodes', JSON.stringify(Array.from(completedNodes)));
    } catch (e) {
      console.warn('Failed to persist completed nodes to localStorage:', e);
    }
  }, [completedNodes]);

  // Sync questionnaire state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('vertexa_plot_questionnaire', JSON.stringify(questionnaireState));
    } catch (e) {
      console.warn('Failed to persist questionnaire state to localStorage:', e);
    }
  }, [questionnaireState]);

  // Fetch roadmap from backend API
  const fetchRoadmap = useCallback(async (query, city, customQuestionnaire = null) => {
    setLoading(true);
    try {
      const payload = {
        query: query || '',
        city: city || 'Maharashtra',
        questionnaire: customQuestionnaire || questionnaireState
      };

      const response = await axios.post(
        API_ENDPOINTS.navigate,
        payload,
        { timeout: 12000 }
      );

      if (response.data && response.data.nodes && response.data.nodes.length > 0) {
        setGraphData(response.data);
        // Select first step if none selected
        if (response.data.nodes.length > 0) {
          setSelectedNode(response.data.nodes[0]);
        }
      } else {
        setGraphData(FALLBACK_SEED_GRAPH);
      }
    } catch (err) {
      console.warn('[Network/API Fallback] Using offline statutory seed graph:', err.message);
      setGraphData(FALLBACK_SEED_GRAPH);
    } finally {
      setLoading(false);
    }
  }, [questionnaireState]);

  // Initial load
  useEffect(() => {
    fetchRoadmap('Residential house building permission', questionnaireState.jurisdiction || 'Pune', questionnaireState);
  }, []); // Run once on mount

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    fetchRoadmap(searchQuery, selectedCity);
  };

  const handlePresetSelect = (preset) => {
    setSearchQuery(preset.query);
    setSelectedCity(preset.city);
    if (preset.questionnaire) {
      setQuestionnaireState(preset.questionnaire);
      fetchRoadmap(preset.query, preset.city, preset.questionnaire);
    } else {
      fetchRoadmap(preset.query, preset.city);
    }
  };

  const handleQuestionnaireSubmit = (formData) => {
    setQuestionnaireState(formData);
    setSelectedCity(formData.jurisdiction);
    setIsQuestionnaireOpen(false);
    fetchRoadmap(`Residential building in ${formData.jurisdiction}`, formData.jurisdiction, formData);
  };

  const handleSelectNode = useCallback((nodeData) => {
    setSelectedNode(nodeData);
    setMobileDrawerOpen(true);
    setIsSidebarOpen(true);
  }, []);

  // Central toggle completion logic: marks complete AND advances active step to next consecutive step
  const handleToggleComplete = useCallback((nodeId, explicitStatus) => {
    setCompletedNodes((prev) => {
      const next = new Set(prev);
      const willComplete = explicitStatus ? explicitStatus === 'completed' : !prev.has(nodeId);

      if (willComplete) {
        next.add(nodeId);

        // Automatically advance to the next consecutive step in the workflow sequence
        if (graphData?.nodes && graphData.nodes.length > 0) {
          const nextStep = getNextConsecutiveStep(nodeId, graphData.nodes, graphData.edges, next);
          if (nextStep) {
            setSelectedNode(nextStep);
          }
        }
      } else {
        next.delete(nodeId);
      }
      return next;
    });
  }, [graphData]);

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

        {/* Center: Search Form */}
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
              placeholder="Search custom requirement (e.g. Pune G+2 Bungalow, Matheran Eco-Zone, High-Rise)..."
              className="w-full bg-slate-800/90 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all disabled:opacity-50 cursor-pointer"
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

        {/* Right Actions: Plot Questionnaire, Jargon Buster & Mobile Drawer Toggle */}
        <div className="flex items-center gap-2">
          {/* Plot Questionnaire Intake Trigger */}
          <button
            type="button"
            onClick={() => setIsQuestionnaireOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-950/80 hover:bg-indigo-900 text-indigo-200 border border-indigo-800/80 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
            title="Configure plot parameters to calculate applicable NOCs"
          >
            <Sliders className="w-4 h-4 text-indigo-400" />
            <span className="hidden sm:inline">Plot Questionnaire</span>
          </button>

          {/* Jargon Buster */}
          <button
            type="button"
            onClick={() => setIsJargonModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-all shadow-sm cursor-pointer"
            title="Open Civic Jargon Buster glossary"
          >
            <BookOpen className="w-4 h-4 text-indigo-400" />
            <span className="hidden sm:inline">Jargon Buster</span>
          </button>

          {/* Mobile Drawer Toggle */}
          <button
            type="button"
            onClick={() => setMobileDrawerOpen((prev) => !prev)}
            className="lg:hidden p-2 rounded-xl bg-slate-800 text-slate-200 border border-slate-700 cursor-pointer"
            title="Toggle Document Drawer"
          >
            {mobileDrawerOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Preset Pills & Provenance Bar (Hidden during print) */}
      <div className="h-10 shrink-0 bg-slate-950/90 border-b border-slate-800 px-4 flex items-center justify-between gap-2 overflow-x-auto text-xs no-print">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider shrink-0">
            Presets:
          </span>
          {PRESETS.map((preset) => {
            const Icon = preset.icon;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handlePresetSelect(preset)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-[11px] font-medium transition-colors shrink-0 cursor-pointer"
              >
                <Icon className="w-3 h-3 text-indigo-400" />
                {preset.label}
              </button>
            );
          })}
        </div>

        {/* Provenance & Jurisdiction Status */}
        <div className="hidden sm:flex items-center gap-3 text-[11px] text-slate-400">
          {/* Provenance Badge */}
          <div className="flex items-center gap-1.5">
            <span className={clsx(
              "w-2 h-2 rounded-full",
              graphData?.provenance === 'live_ai_grounded' ? "bg-emerald-400 animate-pulse" : "bg-indigo-400"
            )} />
            <span className="text-slate-300 font-medium">
              {graphData?.provenanceLabel || (graphData?.provenance === 'live_ai_grounded' ? 'Live AI-tailored' : 'Statutory UDCPR blueprint')}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-indigo-400" />
            <span>Authority: <strong>{graphData?.jurisdiction?.split('(')[0]?.trim() || questionnaireState.jurisdiction || 'Maharashtra'}</strong></span>
          </div>
        </div>
      </div>

      {/* Main Workspace Layout (Canvas + Collapsible Right Drawer) */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* Left: ReactFlow Interactive DAG Canvas */}
        <div className="flex-1 min-w-0 h-full relative">
          <RoadmapCanvas
            graphData={graphData}
            onSelectNode={handleSelectNode}
            selectedNodeId={selectedNode?.id}
            completedNodes={completedNodes}
            onToggleComplete={handleToggleComplete}
          />

          {/* Legal / Statutory Guidance Disclaimer */}
          <div className="absolute bottom-3 left-4 z-10 hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/80 backdrop-blur-md border border-slate-800/80 text-[11px] text-slate-400 shadow-md">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>Statutory guidance only — verify with your Planning Authority or a licensed architect.</span>
          </div>

          {/* Floating Reopen Button when Sidebar is Minimized */}
          {!isSidebarOpen && (
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="absolute right-4 top-14 z-20 flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/95 hover:bg-slate-850 text-slate-100 border border-slate-700/80 shadow-2xl backdrop-blur-md transition-all hover:border-indigo-500/60 group cursor-pointer"
              title="Open Master Dossier & Step Inspector"
            >
              <PanelRightOpen className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-semibold">
                {selectedNode ? (
                  <span className="flex items-center gap-1.5">
                    <span className="text-slate-400 font-normal">Step:</span>
                    <span className="text-indigo-300 font-bold max-w-[150px] truncate">{selectedNode.title}</span>
                  </span>
                ) : (
                  <span>Open Dossier & Inspector</span>
                )}
              </span>
            </button>
          )}
        </div>

        {/* Right: Master Document Kit & Step Inspector Drawer (Collapsible) */}
        <div
          className={clsx(
            'transition-all duration-300 ease-in-out z-30 h-full shrink-0',
            isSidebarOpen
              ? 'w-full sm:w-[380px] lg:w-[400px] xl:w-[440px] opacity-100'
              : 'w-0 opacity-0 overflow-hidden pointer-events-none hidden lg:block',
            mobileDrawerOpen && 'fixed inset-y-0 right-0 z-40 !w-full sm:!w-[380px] !opacity-100 !block'
          )}
        >
          <DocumentDrawer
            graphData={graphData}
            selectedNode={selectedNode}
            onSelectNode={handleSelectNode}
            completedNodes={completedNodes}
            onToggleComplete={handleToggleComplete}
            onOpenQuestionnaire={() => setIsQuestionnaireOpen(true)}
            onClose={() => {
              setIsSidebarOpen(false);
              setMobileDrawerOpen(false);
            }}
          />
        </div>
      </main>

      {/* Plot Questionnaire Intake Modal */}
      <PlotQuestionnaireModal
        isOpen={isQuestionnaireOpen}
        onClose={() => setIsQuestionnaireOpen(false)}
        initialValues={questionnaireState}
        onSubmitQuestionnaire={handleQuestionnaireSubmit}
        loading={loading}
      />

      {/* Jargon Buster Glossary Modal */}
      <JargonBusterModal
        isOpen={isJargonModalOpen}
        onClose={() => setIsJargonModalOpen(false)}
        graphData={graphData}
      />
    </div>
  );
}
