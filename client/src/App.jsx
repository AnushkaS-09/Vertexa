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
import HomePage from './components/home/HomePage';
import { API_ENDPOINTS } from './config/api';
import { classifyRequirementScope } from './utils/scopeClassifier';

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
      title: "Architect CAD Plan Submission & Automated Scrutiny (MahaBPAMS / MCGM AutoDCR)",
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
      title: "Development Sanction / Conditional Sanction (Intimation of Disapproval - IOD in Mumbai)",
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
    { id: "e_mojani_tax", source: "node_mojani", target: "node_tax_noc", label: "Demarcated plot assessment & tax clearance" },
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

export default function App() {
  const [currentView, setCurrentView] = useState('home'); // 'home' | 'roadmap'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('Maharashtra');
  const [graphData, setGraphData] = useState(FALLBACK_SEED_GRAPH);
  const [selectedNode, setSelectedNode] = useState(null);
  const [hasConstructedRoadmap, setHasConstructedRoadmap] = useState(false);
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
  const [scopeFeedback, setScopeFeedback] = useState(null);

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
      const effectiveQuestionnaire = customQuestionnaire || questionnaireState;
      const payload = {
        query: query || '',
        city: city || effectiveQuestionnaire.jurisdiction || 'Maharashtra',
        questionnaire: effectiveQuestionnaire
      };

      const response = await axios.post(
        API_ENDPOINTS.navigate,
        payload,
        { timeout: 12000 }
      );

      if (response.data && response.data.nodes && response.data.nodes.length > 0) {
        setGraphData(response.data);
        if (response.data.nodes.length > 0) {
          setSelectedNode(response.data.nodes[0]);
        }
      } else {
        setGraphData(FALLBACK_SEED_GRAPH);
      }
      setHasConstructedRoadmap(true);
      setCurrentView('roadmap');
    } catch (err) {
      console.warn('[Network/API Fallback] Using offline statutory seed graph:', err.message);
      setGraphData(FALLBACK_SEED_GRAPH);
      setHasConstructedRoadmap(true);
      setCurrentView('roadmap');
    } finally {
      setLoading(false);
    }
  }, [questionnaireState]);

  // Start Construct workflow with Scope / Intent Gate
  const handleStartConstruct = (query) => {
    const q = (query || searchQuery || '').trim();

    // 1. Evaluate Custom Requirement Scope & Intent Gate
    const classification = classifyRequirementScope(q);

    if (classification.status !== 'IN_SCOPE') {
      setScopeFeedback({
        status: classification.status,
        message: classification.message,
        query: q
      });
      // Do NOT open the plot questionnaire!
      setIsQuestionnaireOpen(false);
      // Ensure user is on the Home page to view the clear guidance message
      if (currentView !== 'home') {
        setCurrentView('home');
      }
      return;
    }

    // 2. Clear any previous error/feedback
    setScopeFeedback(null);

    // 3. Auto-detect city or plot keywords to preload questionnaire
    const updatedDraft = { ...questionnaireState };
    if (/mumbai/i.test(q)) updatedDraft.jurisdiction = 'Mumbai';
    else if (/pune/i.test(q)) updatedDraft.jurisdiction = 'Pune';
    else if (/matheran/i.test(q)) {
      updatedDraft.jurisdiction = 'Matheran';
      updatedDraft.ecoSensitiveZone = true;
    } else if (/thane/i.test(q)) updatedDraft.jurisdiction = 'Thane';
    else if (/pcmc|pimpri/i.test(q)) updatedDraft.jurisdiction = 'Pimpri-Chinchwad';

    if (/high-rise|15m|tall/i.test(q)) updatedDraft.buildingHeight = 18.0;
    if (/heritage/i.test(q)) updatedDraft.heritageZone = true;
    if (/airport|funnel/i.test(q)) updatedDraft.airportZone = true;
    if (/tree/i.test(q)) updatedDraft.treesAffected = 2;

    setQuestionnaireState(updatedDraft);

    // 4. Launch Plot Questionnaire for user confirmation
    setIsQuestionnaireOpen(true);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    handleStartConstruct(searchQuery);
  };

  const handleQuestionnaireSubmit = (formData) => {
    // Reset completed progress for a newly constructed roadmap
    setCompletedNodes(new Set());
    try {
      localStorage.removeItem('vertexa_completed_nodes');
    } catch (e) {
      console.warn('Failed to clear completed nodes storage:', e);
    }

    setQuestionnaireState(formData);
    setSelectedCity(formData.jurisdiction);
    setIsQuestionnaireOpen(false);
    fetchRoadmap(
      searchQuery || `Residential building in ${formData.jurisdiction}`,
      formData.jurisdiction,
      formData
    );
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
        // Enforce strict prerequisite validation: verify that all incoming parent prerequisites are in completedNodes!
        if (graphData?.edges && graphData.edges.length > 0) {
          const parentEdges = graphData.edges.filter((e) => e.target === nodeId);
          const allParentsCompleted = parentEdges.every((e) => prev.has(e.source));
          if (!allParentsCompleted) {
            console.warn(`[Prerequisite Blocked] Cannot complete ${nodeId}: all preceding steps must be completed first.`);
            return prev;
          }
        }

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
        <div
          onClick={() => setCurrentView('home')}
          className="flex items-center gap-3 cursor-pointer group"
          title="Return to Home page"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 group-hover:scale-105 transition-transform">
            <Compass className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent flex items-center gap-2">
              Vertexa
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-indigo-950/80 text-indigo-400 border border-indigo-800/60 hidden sm:inline-block">
                UDCPR 2020 & Acts
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 hidden sm:block truncate max-w-[340px]">
              {currentView === 'home'
                ? 'Maharashtra Residential Permitting Navigator'
                : (graphData?.taskTitle || 'Statutory Municipal Clearances Roadmap')}
            </p>
          </div>
        </div>

        {/* Center: Search Form (Visible for rapid construction) */}
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
              placeholder="Enter custom requirement (e.g. Pune G+2 Bungalow, Matheran Eco-Zone, High-Rise)..."
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
                <span>Constructing...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Construct</span>
              </>
            )}
          </button>
        </form>

        {/* Right Actions: Navigation, Plot Questionnaire, Jargon Buster & Mobile Drawer Toggle */}
        <div className="flex items-center gap-2">
          {/* Home / Roadmap View Switcher */}
          {currentView === 'roadmap' ? (
            <button
              type="button"
              onClick={() => setCurrentView('home')}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-all shadow-sm cursor-pointer"
              title="Return to Home screen"
            >
              <Home className="w-4 h-4 text-indigo-400" />
              <span className="hidden sm:inline">Home</span>
            </button>
          ) : hasConstructedRoadmap && (
            <button
              type="button"
              onClick={() => setCurrentView('roadmap')}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-950/90 hover:bg-indigo-900 text-indigo-300 border border-indigo-800 rounded-xl text-xs font-semibold transition-all shadow-sm cursor-pointer"
              title="View your active generated roadmap"
            >
              <Compass className="w-4 h-4 text-indigo-400" />
              <span className="hidden sm:inline">Active Roadmap</span>
            </button>
          )}

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
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-all shadow-sm cursor-pointer"
            title="Open Civic Jargon Buster glossary"
          >
            <BookOpen className="w-4 h-4 text-indigo-400" />
            <span className="hidden sm:inline">Jargon Buster</span>
          </button>

          {/* Mobile Drawer Toggle (Only active in roadmap view) */}
          {currentView === 'roadmap' && (
            <button
              type="button"
              onClick={() => setMobileDrawerOpen((prev) => !prev)}
              className="lg:hidden p-2 rounded-xl bg-slate-800 text-slate-200 border border-slate-700 cursor-pointer"
              title="Toggle Document Drawer"
            >
              {mobileDrawerOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          )}
        </div>
      </header>

      {/* VIEW 1: HOME PAGE */}
      {currentView === 'home' ? (
        <HomePage
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onStartConstruct={handleStartConstruct}
          onOpenQuestionnaire={() => setIsQuestionnaireOpen(true)}
          onOpenJargonBuster={() => setIsJargonModalOpen(true)}
          hasActiveRoadmap={hasConstructedRoadmap}
          onViewActiveRoadmap={() => setCurrentView('roadmap')}
          loading={loading}
          scopeFeedback={scopeFeedback}
          onClearScopeFeedback={() => setScopeFeedback(null)}
        />
      ) : (
        /* VIEW 2: ROADMAP WORKSPACE */
        <>
          {/* Sub-Header Bar: Jurisdiction & Provenance (Hidden during print) */}
          <div className="h-10 shrink-0 bg-slate-950/95 border-b border-slate-800 px-4 flex items-center justify-between gap-2 overflow-x-auto text-xs no-print">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentView('home')}
                className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-indigo-300 font-medium cursor-pointer mr-2"
              >
                <span>← Home</span>
              </button>
              <div className="flex items-center gap-1 text-slate-300 text-[11px]">
                <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                <span>Authority: <strong>{graphData?.jurisdiction?.split('(')[0]?.trim() || questionnaireState.jurisdiction || 'Maharashtra'}</strong></span>
              </div>
            </div>

            {/* Provenance & Timeline Status */}
            <div className="flex items-center gap-3 text-[11px] text-slate-400">
              <span className="hidden sm:inline-block px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                Est. ~{graphData?.totalEstimatedDays || 90} Days • ₹{(graphData?.totalEstimatedCostINR || 58500).toLocaleString('en-IN')}
              </span>

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
        </>
      )}

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
