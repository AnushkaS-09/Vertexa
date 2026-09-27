/**
 * Vertexa Deterministic Rules & Eligibility Engine
 * Regulatory Framework: Maharashtra UDCPR 2020 & MRTP Act 1966
 * 
 * Supports Multi-Typology Municipal Permitting:
 * - RESIDENTIAL
 * - COMMERCIAL
 * - INSTITUTIONAL
 * - HOSPITALITY
 * - MIXED_USE
 * - INDUSTRIAL
 * - OTHER
 */

const CANONICAL_NODES = {
  // Baseline Process Nodes (Apply across building developments under UDCPR 2020 / MRTP Act 1966)
  title: {
    id: "node_title",
    stage: "Stage 1: Revenue & Land Title",
    title: "Certified 7/12 Extract or CTS Property Card",
    department: "Revenue Dept & Land Records (Mahabhulekh / Aaple Sarkar)",
    type: "prerequisite",
    estimatedDays: 3,
    cost: 150,
    statutoryRule: "UDCPR 2020, Reg 2.2.3(a) & MLRC 1966 Sec 148",
    forms: [
      "V.F. 7/12 Extract (issued within 6 months)",
      "Property Register Card (मालमत्ता पत्रक)",
      "Search Index-II from Sub-Registrar"
    ],
    officialUrl: "https://bhulekh.mahabhumi.gov.in",
    plainLanguageSummary: "Proof of unencumbered legal title with clear ownership, no unauthorized reservations, litigation, or government liens.",
    isBottleneck: false
  },
  mojani: {
    id: "node_mojani",
    stage: "Stage 1: Revenue & Land Title",
    title: "Cadastral Measurement & Demarcation (Kayam Mojani)",
    department: "Taluka Inspector of Land Records (TILR) / Bhumi Abhilekh",
    type: "prerequisite",
    estimatedDays: 21,
    cost: 3000,
    statutoryRule: "UDCPR 2020, Reg 2.2.3(b) & MLRC 1966 Sec 135",
    forms: [
      "Form No. 1 (Demarcation Application)",
      "Certified Mojani Sheet (मोजणी नकाशा)"
    ],
    officialUrl: "https://aaplesarkar.mahaonline.gov.in",
    plainLanguageSummary: "Official surveyor pins exact plot boundaries on the ground to certify street widening lines and road setbacks.",
    isBottleneck: true
  },
  tax_noc: {
    id: "node_tax_noc",
    stage: "Stage 1: Revenue & Land Title",
    title: "Municipal Property Tax No-Dues Clearance",
    department: "Municipal Assessment & Collection Department",
    type: "prerequisite",
    estimatedDays: 2,
    cost: 0,
    statutoryRule: "UDCPR 2020, Reg 2.2.3(f) & MMC Act Sec 129",
    forms: [
      "Current Assessment Year Paid Tax Receipt",
      "No-Dues Certificate (NOC)"
    ],
    officialUrl: "https://portal.mcgm.gov.in",
    plainLanguageSummary: "Validates that all open land tax dues up to the current fiscal quarter are fully cleared prior to plan scrutiny.",
    isBottleneck: false
  },
  autodcr: {
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
      "Appendix B (Supervision Certificate by COA-Registered Architect)",
      "PreDCR CAD Sheet (.dwg) with layered setbacks and FSI tables",
      "Structural Stability Certificate (Registered Structural Engineer)"
    ],
    officialUrl: "https://mahadma.maharashtra.gov.in",
    plainLanguageSummary: "Architect uploads floor plans into the state automated engine to test against setbacks, FSI, parking, and height limits.",
    isBottleneck: false
  },
  site_inspection: {
    id: "node_site_inspection",
    stage: "Stage 2: Architectural Scrutiny & PreDCR",
    title: "Site Inspection by Assistant Town Planner (ATP)",
    department: "Municipal Corporation / Council Town Planning Wing",
    type: "inspection",
    estimatedDays: 7,
    cost: 0,
    statutoryRule: "UDCPR 2020, Reg 2.4 & RTS Act",
    forms: [
      "ATP Geo-Tagged Site Verification Checklist",
      "Road Width & High Tension Wire Verification Report"
    ],
    officialUrl: "https://mahadma.maharashtra.gov.in",
    plainLanguageSummary: "Municipal junior engineer visits the ground to ensure actual road width and access match the blueprint.",
    isBottleneck: true
  },
  iod: {
    id: "node_iod",
    stage: "Stage 2: Architectural Scrutiny & PreDCR",
    title: "Development Sanction / Conditional Sanction (Intimation of Disapproval - IOD in Mumbai)",
    department: "Executive Engineer / Building Proposal Department",
    type: "conditional_approval",
    estimatedDays: 5,
    cost: 0,
    statutoryRule: "MRTP Act 1966 Section 45 & UDCPR Reg 2.5",
    forms: [
      "IOD / Sanction Letter with conditional compliance clauses"
    ],
    officialUrl: "https://mahadma.maharashtra.gov.in",
    plainLanguageSummary: "Conditional planning green signal. Certifies plan compliance, but forbids construction until all parallel departmental NOCs are produced.",
    isBottleneck: false
  },
  hydraulic_noc: {
    id: "node_hydraulic_noc",
    stage: "Stage 3: Parallel Departmental NOCs",
    title: "Hydraulic & Stormwater Drainage Sanction",
    department: "Hydraulic Engineer / Sewerage Operations",
    type: "clearance",
    estimatedDays: 10,
    cost: 5000,
    statutoryRule: "UDCPR 2020, Reg 2.2.11 & Reg 9.22 (Hydraulic & Drainage Clearance)",
    forms: [
      "Sanction of Water Supply Connection Form",
      "Stormwater Invert Level Layout Plan"
    ],
    officialUrl: "https://portal.mcgm.gov.in",
    plainLanguageSummary: "Certifies the plot can discharge rainwater into municipal drains without causing localized street waterlogging.",
    isBottleneck: false
  },
  cc: {
    id: "node_cc",
    stage: "Stage 4: Groundbreaking to Superstructure",
    title: "Commencement Certificate (CC) — Plinth Level",
    department: "Building Proposal Dept / Chief Officer",
    type: "permit",
    estimatedDays: 7,
    cost: 28000,
    statutoryRule: "UDCPR 2020, Reg 2.6",
    forms: [
      "Appendix C (Sanction of Development Permission / CC)",
      "Development Charges & Labor Cess Challan Receipt"
    ],
    officialUrl: "https://mahadma.maharashtra.gov.in",
    plainLanguageSummary: "The legal green flag allowing physical excavation and construction up to plinth level.",
    isBottleneck: false
  },
  plinth_check: {
    id: "node_plinth_check",
    stage: "Stage 4: Groundbreaking to Superstructure",
    title: "Mandatory Plinth Inspection & Superstructure CC",
    department: "Municipal Engineering Inspection Cell",
    type: "inspection",
    estimatedDays: 8,
    cost: 0,
    statutoryRule: "UDCPR 2020, Reg 2.8.4",
    forms: [
      "Appendix G (Notice of Plinth Completion)",
      "Plinth Verification Endorsement"
    ],
    officialUrl: "https://mahadma.maharashtra.gov.in",
    plainLanguageSummary: "Hard stop! Construction must pause when foundation reaches plinth height. Engineers verify setbacks before granting permission to cast upper slabs.",
    isBottleneck: true
  },
  oc: {
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
    plainLanguageSummary: "Certifies the building matches the sanctioned blueprint, unlocking permanent utility connections and property tax assessment.",
    isBottleneck: false
  },

  // Conditional Environmental & Special Clearances
  tree_noc: {
    id: "node_tree_noc",
    stage: "Stage 3: Parallel Departmental NOCs",
    title: "Tree Authority NOC (Preservation & Re-plantation)",
    department: "Garden & Tree Authority Department",
    type: "clearance",
    estimatedDays: 14,
    cost: 2500,
    statutoryRule: "Maharashtra (Urban Areas) Protection & Preservation of Trees Act 1975, Sec 8",
    forms: [
      "Form A (Tree Census on Plot)",
      "Affidavit for Compensatory Plantation (1:3 or 1:5 ratio)"
    ],
    officialUrl: "https://portal.mcgm.gov.in",
    plainLanguageSummary: "Mandatory survey ensuring no protected trees are felled without formal municipal permission and compensatory plantation deposits.",
    isBottleneck: true
  },
  fire_noc: {
    id: "node_fire_noc",
    stage: "Stage 3: Parallel Departmental NOCs",
    title: "Chief Fire Officer (CFO) Provisional Fire Safety NOC",
    department: "Maharashtra Fire Services / Municipal Fire Brigade",
    type: "clearance",
    estimatedDays: 14,
    cost: 12000,
    statutoryRule: "UDCPR 2020, Chapter 9 & Chapter 6 & Maharashtra Fire Prevention and Life Safety Measures Act 2006",
    forms: [
      "Fire Scrutiny Checklist",
      "Fire Hydrant & 6m All-Round Driveway Access Plan"
    ],
    officialUrl: "https://mahafireservice.gov.in",
    plainLanguageSummary: "Mandatory CFO appraisal for high-rise buildings (>=15m) and specialized commercial, institutional, hospitality, or industrial occupancies ensuring life safety systems, fire staircases, and wet risers.",
    isBottleneck: true
  },
  eco_noc: {
    id: "node_eco_noc",
    stage: "Stage 3: Parallel Departmental NOCs",
    title: "Eco-Sensitive Zone (ESZ) / High Level Monitoring Committee Clearance",
    department: "Expert Appraisal Committee / District Collector ESZ Cell",
    type: "clearance",
    estimatedDays: 30,
    cost: 5000,
    statutoryRule: "Environment (Protection) Act 1986 & MoEFCC ESZ Notifications (UDCPR Reg 1.1 Special Provisions)",
    forms: [
      "Form-1 ESZ Environmental Impact Statement",
      "NOC from Local Eco-Sensitive Monitoring Committee"
    ],
    officialUrl: "https://ecoclearance.nic.in",
    plainLanguageSummary: "Strict clearance for hill stations and eco-sensitive zones (e.g., Matheran, Mahabaleshwar) governing permissible ground coverage, roof slopes, and tree preservation.",
    isBottleneck: true
  },
  heritage_noc: {
    id: "node_heritage_noc",
    stage: "Stage 3: Parallel Departmental NOCs",
    title: "Heritage Conservation Committee (MHCC / Local Heritage Committee) NOC",
    department: "Heritage Conservation Cell & Urban Development Dept",
    type: "clearance",
    estimatedDays: 25,
    cost: 3500,
    statutoryRule: "UDCPR 2020, Regulation 14.5 & Reg 2.2.11 (Heritage Conservation)",
    forms: [
      "Heritage Precinct Architectural Elevation Study",
      "Proximity Certificate to Grade I/II/III Listed Structures"
    ],
    officialUrl: "https://portal.mcgm.gov.in",
    plainLanguageSummary: "Mandatory when developing a plot within designated heritage precincts or within buffer zones of protected monuments.",
    isBottleneck: true
  },
  airport_noc: {
    id: "node_airport_noc",
    stage: "Stage 3: Parallel Departmental NOCs",
    title: "Airports Authority of India (AAI NOCAS) Height Clearance",
    department: "Airports Authority of India / Directorate General of Civil Aviation",
    type: "clearance",
    estimatedDays: 20,
    cost: 2000,
    statutoryRule: "Ministry of Civil Aviation (GSR 751(E)) & UDCPR 2020 Reg 2.2.11 (Airport Clearance)",
    forms: [
      "NOCAS Online Application (WGS-84 Coordinates & Top-of-Structure AMSL Elevation)",
      "Site Elevation Certificate by Registered Surveyor"
    ],
    officialUrl: "https://nocas2.aai.aero",
    plainLanguageSummary: "Clearance verifying that proposed building height, water tanks, and lift machine rooms do not infringe into airport radar or obstacle limitation surfaces (OLS).",
    isBottleneck: false
  },

  // Non-Residential Specialized Statutory Nodes
  comm_traffic_parking: {
    id: "node_comm_traffic_parking",
    stage: "Stage 3: Parallel Departmental NOCs",
    title: "Commercial Traffic Scrutiny & Off-Street Parking Verification [Requires Site Verification]",
    department: "Traffic Police / Municipal Traffic Planning Branch",
    type: "clearance",
    estimatedDays: 15,
    cost: 5000,
    statutoryRule: "UDCPR 2020, Chapter 8 (Tables 8B & 8C - Off-Street Parking Standards)",
    forms: [
      "Traffic Ingress/Egress Circulation Plan",
      "Off-Street Commercial Parking & Loading/Unloading Bay Layout"
    ],
    officialUrl: "https://mahadma.maharashtra.gov.in",
    plainLanguageSummary: "Verification of dedicated customer parking, visitor bays, and delivery loading berths to prevent arterial road congestion. Subject to site scale verification.",
    isBottleneck: false
  },
  inst_accessibility: {
    id: "node_inst_accessibility",
    stage: "Stage 3: Parallel Departmental NOCs",
    title: "Barrier-Free Accessibility & Institutional Standards Scrutiny [Requires Verification]",
    department: "Municipal Town Planning Wing / Health Department",
    type: "clearance",
    estimatedDays: 12,
    cost: 2500,
    statutoryRule: "UDCPR 2020 Chapter 4 & Reg 9.17 (Barrier-Free Accessibility)",
    forms: [
      "Barrier-Free Ramp & Toilet Compliance Details",
      "Institutional Use Undertaking"
    ],
    officialUrl: "https://mahadma.maharashtra.gov.in",
    plainLanguageSummary: "Verification of ramps, accessible sanitation, and specialized institutional layout parameters.",
    isBottleneck: false
  },
  hosp_env_tourism: {
    id: "node_hosp_env_tourism",
    stage: "Stage 3: Parallel Departmental NOCs",
    title: "Tourism & Environmental Scrutiny [Requires Verification]",
    department: "Tourism Dept / Municipal Health / Environment Cell",
    type: "clearance",
    estimatedDays: 15,
    cost: 5000,
    statutoryRule: "Maharashtra Tourism Policy & Municipal Health / UDCPR 2020 Chapter 4",
    forms: [
      "Tourism Registration / Health Trade Intent Application",
      "Solid Waste Management Scheme"
    ],
    officialUrl: "https://mahadma.maharashtra.gov.in",
    plainLanguageSummary: "Statutory verification for hotels/resorts regarding kitchen waste management and tourism category compliance.",
    isBottleneck: false
  },
  mixed_segregation: {
    id: "node_mixed_segregation",
    stage: "Stage 3: Parallel Departmental NOCs",
    title: "Mixed-Use Segregation & Dual Entry/Exit Verification [Requires Verification]",
    department: "Town Planning & Traffic Scrutiny Wing",
    type: "clearance",
    estimatedDays: 12,
    cost: 3500,
    statutoryRule: "UDCPR 2020 Reg 4.2 (Segregation of Commercial & Residential Uses)",
    forms: [
      "Dual Egress & Lift Lobby Separation Plan",
      "Parking Allocation Schedule"
    ],
    officialUrl: "https://mahadma.maharashtra.gov.in",
    plainLanguageSummary: "Verifies physical separation between residential lobby entries and commercial shop fronts.",
    isBottleneck: false
  },
  ind_mpcb_dish: {
    id: "node_ind_mpcb_dish",
    stage: "Stage 3: Parallel Departmental NOCs",
    title: "MPCB Consent to Establish (CTE) & DISH Factory Plan Scrutiny [Requires Verification]",
    department: "Maharashtra Pollution Control Board (MPCB) & Directorate of Industrial Safety & Health (DISH)",
    type: "clearance",
    estimatedDays: 25,
    cost: 15000,
    statutoryRule: "Water/Air Pollution Control Acts & Maharashtra Factories Rules 1963",
    forms: [
      "Consent to Establish (CTE) Application via MPCB Portal",
      "Factory Plan Submission Form (DISH)"
    ],
    officialUrl: "https://mpcb.gov.in",
    plainLanguageSummary: "Statutory pollution control consent (Red/Orange/Green/White categorization) and factory inspectorate approval. Specific category and fee depend on industry classification and capital investment.",
    isBottleneck: true
  }
};

/**
 * Deterministic Rules Evaluator
 * Evaluates user project parameters against statutory UDCPR 2020 criteria
 */
function evaluateEligibility(questionnaire = {}) {
  const constructionType = (questionnaire.constructionType || 'RESIDENTIAL').toUpperCase();
  const customConstructionType = questionnaire.customConstructionType || '';
  const mixedUseComponents = questionnaire.mixedUseComponents || [];

  const {
    jurisdiction = 'Maharashtra',
    plotArea = 150, // in sq.m
    buildingHeight = 8.5, // in meters
    roadWidth = 9.0, // in meters
    treesAffected = 0,
    heritageZone = false,
    airportZone = false,
    ecoSensitiveZone = false,
    hasHighTensionLine = false
  } = questionnaire;

  const applicable = [];
  const exempt = [];
  const uncertain = [];

  const typologyLabel = constructionType === 'OTHER' && customConstructionType
    ? customConstructionType
    : constructionType.charAt(0) + constructionType.slice(1).toLowerCase();

  // Rule 1: Baseline Clearances (Universal under MRTP Act 1966 & UDCPR 2020)
  applicable.push({
    id: 'base_title_record',
    name: 'Land Title & 7/12 / CTS Property Card',
    status: 'APPLIES',
    reason: `Mandatory under UDCPR 2020 Reg 2.2.3(a) & MLRC 1966 Sec 148 for ${typologyLabel} development to prove unencumbered ownership.`,
    statutoryRef: 'UDCPR 2020 Reg 2.2.3(a)',
    nodeKey: 'title'
  });

  applicable.push({
    id: 'base_cadastral_demarcation',
    name: 'Cadastral Demarcation (Kayam Mojani)',
    status: 'APPLIES',
    reason: `Mandatory under UDCPR 2020 Reg 2.2.3(b) & MLRC 1966 Sec 135 to verify physical plot boundaries, road widening line, and statutory setbacks for ${typologyLabel} construction.`,
    statutoryRef: 'UDCPR 2020 Reg 2.2.3(b)',
    nodeKey: 'mojani'
  });

  applicable.push({
    id: 'base_property_tax',
    name: 'Municipal Property Tax No-Dues NOC',
    status: 'APPLIES',
    reason: `Mandatory proof under MMCA Sec 129 / UDCPR Reg 2.2.3(f) that all municipal open land taxes are cleared prior to ${typologyLabel} architectural scrutiny.`,
    statutoryRef: 'UDCPR 2020 Reg 2.2.3(f)',
    nodeKey: 'tax_noc'
  });

  applicable.push({
    id: 'base_autodcr_scrutiny',
    name: 'Architect CAD Plan Submission & Automated Scrutiny (MahaBPAMS / MCGM AutoDCR)',
    status: 'APPLIES',
    reason: `Statutory automated verification of FSI, ground coverage, ventilation, parking norms, and open spaces under UDCPR 2020 for ${typologyLabel} development.`,
    statutoryRef: 'UDCPR 2020 Reg 2.2.1 & 2.2.4',
    nodeKey: 'autodcr'
  });

  applicable.push({
    id: 'base_site_inspection',
    name: 'Assistant Town Planner (ATP) Site Inspection',
    status: 'APPLIES',
    reason: 'Mandatory ground verification by planning authority before granting IOD / Development Sanction.',
    statutoryRef: 'UDCPR 2020 Reg 2.4 & RTS Act',
    nodeKey: 'site_inspection'
  });

  applicable.push({
    id: 'base_iod_sanction',
    name: 'Development Sanction / Conditional Sanction (Intimation of Disapproval - IOD in Mumbai)',
    status: 'APPLIES',
    reason: `Statutory conditional planning sanction under Section 45 of MRTP Act 1966 for ${typologyLabel} project.`,
    statutoryRef: 'MRTP Act 1966 Sec 45',
    nodeKey: 'iod'
  });

  applicable.push({
    id: 'base_hydraulic_sanction',
    name: 'Hydraulic & Stormwater Drainage Sanction',
    status: 'APPLIES',
    reason: `Required under UDCPR 2020 Reg 2.2.11 & Reg 9.22 for ${typologyLabel} development to connect internal sewage & stormwater to municipal mains.`,
    statutoryRef: 'UDCPR 2020 Reg 2.2.11 & Reg 9.22',
    nodeKey: 'hydraulic_noc'
  });

  applicable.push({
    id: 'base_commencement_cert',
    name: 'Commencement Certificate (CC)',
    status: 'APPLIES',
    reason: 'Statutory permission under UDCPR 2020 Reg 2.6 to commence physical excavation and construction up to plinth.',
    statutoryRef: 'UDCPR 2020 Reg 2.6',
    nodeKey: 'cc'
  });

  applicable.push({
    id: 'base_plinth_check',
    name: 'Plinth Level Inspection & Superstructure CC',
    status: 'APPLIES',
    reason: 'Mandatory on-site setback verification by municipal engineer before casting upper superstructure slabs.',
    statutoryRef: 'UDCPR 2020 Reg 2.8.4',
    nodeKey: 'plinth_check'
  });

  applicable.push({
    id: 'base_occupancy_cert',
    name: 'Building Completion & Final Occupancy Certificate (OC)',
    status: 'APPLIES',
    reason: `Final statutory certification under UDCPR 2020 Reg 2.10 confirming ${typologyLabel} building matches sanctioned blueprint.`,
    statutoryRef: 'UDCPR 2020 Reg 2.10',
    nodeKey: 'oc'
  });

  // Rule 2: Tree Authority Clearance
  const treeCount = parseInt(treesAffected, 10) || 0;
  if (treeCount > 0) {
    applicable.push({
      id: 'rule_tree_noc',
      name: 'Tree Authority Felling / Transplantation Clearance',
      status: 'APPLIES',
      reason: `Plot footprint has ${treeCount} tree(s) requiring felling/transplantation under Maharashtra (Urban Areas) Protection & Preservation of Trees Act 1975, Sec 8.`,
      statutoryRef: 'Maharashtra Trees Act 1975, Sec 8',
      nodeKey: 'tree_noc'
    });
  } else {
    exempt.push({
      id: 'rule_tree_noc',
      name: 'Tree Authority Felling Clearance',
      status: 'EXEMPT',
      reason: 'No Tree Authority clearance is triggered by reported questionnaire facts. Note: If site conditions differ or tree felling is required, prior permit under Maharashtra Trees Act 1975 remains mandatory.',
      statutoryRef: 'Maharashtra Trees Act 1975'
    });
  }

  // Rule 3: Fire Safety NOC (Height threshold & Typology classification)
  const parsedHeight = parseFloat(buildingHeight) || 8.5;
  const isHighRise = parsedHeight >= 15.0;

  if (constructionType === 'RESIDENTIAL') {
    if (isHighRise) {
      applicable.push({
        id: 'rule_fire_noc',
        name: 'Chief Fire Officer (CFO) High-Rise Fire Safety Clearance (NOC)',
        status: 'APPLIES',
        reason: `Proposed residential building height (${parsedHeight}m) meets or exceeds the 15.0m high-rise threshold under Maharashtra Fire Prevention Act 2006 & UDCPR Reg 2.2.11 / Chapter 9. Chief Fire Officer appraisal is mandatory.`,
        statutoryRef: 'Maharashtra Fire Prevention Act 2006 & UDCPR Reg 2.2.11 / Chapter 9',
        nodeKey: 'fire_noc'
      });
    } else {
      exempt.push({
        id: 'rule_fire_noc',
        name: 'Chief Fire Officer (CFO) High-Rise Fire Safety Clearance',
        status: 'EXEMPT',
        reason: `Proposed building height (${parsedHeight}m) is below the 15.0m high-rise threshold for residential houses under Maharashtra Fire Prevention Act 2006 & UDCPR Reg 2.2.11 / Chapter 9. Standard fire setbacks are self-certified by architect on submission drawings.`,
        statutoryRef: 'Maharashtra Fire Prevention Act 2006 & UDCPR Reg 2.2.11'
      });
    }
  } else {
    // Non-Residential (Commercial, Institutional, Hospitality, Industrial, Mixed-Use, Other)
    if (isHighRise) {
      applicable.push({
        id: 'rule_fire_noc',
        name: 'Chief Fire Officer (CFO) Fire Safety Clearance (NOC)',
        status: 'APPLIES',
        reason: `Proposed ${typologyLabel} building height (${parsedHeight}m) meets or exceeds 15.0m. Full Chief Fire Officer appraisal and life safety review is mandatory under UDCPR Chapter 9 & Maharashtra Fire Prevention Act 2006.`,
        statutoryRef: 'UDCPR 2020 Chapter 9 & Fire Act 2006',
        nodeKey: 'fire_noc'
      });
    } else {
      uncertain.push({
        id: 'rule_fire_noc',
        name: 'Chief Fire Officer (CFO) Fire Safety Clearance',
        status: 'VERIFICATION_REQUIRED',
        reason: `Low-rise ${typologyLabel} building (<15m): CFO fire clearance depends on occupant load, built-up area, and hazardous/mercantile classification under UDCPR 2020 Chapter 9 & NBC Part 4. Subject to municipal fire department appraisal.`,
        statutoryRef: 'UDCPR 2020 Chapter 9 & Fire Act 2006'
      });
    }
  }

  // Rule 4: Eco-Sensitive Zone (ESZ)
  const isMatheran = /matheran/i.test(jurisdiction);
  const isESZJurisdiction = isMatheran || /mahabaleshwar|panchgani/i.test(jurisdiction);
  const isESZReported = Boolean(ecoSensitiveZone);

  if (isESZJurisdiction || isESZReported) {
    applicable.push({
      id: 'rule_eco_noc',
      name: 'Eco-Sensitive Zone (ESZ) / Hill Station Authority Clearance',
      status: 'APPLIES',
      reason: `Plot falls within Eco-Sensitive Zone (${jurisdiction}) under Environment (Protection) Act 1986 & MoEFCC Notifications (UDCPR Reg 1.1 Special ESZ Provisions). High-Level Monitoring Committee approval required.`,
      statutoryRef: 'Environment (Protection) Act 1986 & MoEFCC Notifications',
      nodeKey: 'eco_noc'
    });
  } else {
    uncertain.push({
      id: 'rule_eco_noc',
      name: 'Eco-Sensitive Zone (ESZ) / Wildlife Buffer Status',
      status: 'VERIFICATION_REQUIRED',
      reason: 'No Eco-Sensitive Zone proximity was reported, but site-level verification is required to confirm plot does not fall within MoEFCC eco-sensitive buffer zones or forest boundaries.',
      statutoryRef: 'Environment (Protection) Act 1986'
    });
  }

  // Rule 5: Heritage Conservation
  if (heritageZone === true || heritageZone === 'true') {
    applicable.push({
      id: 'rule_heritage_noc',
      name: 'Heritage Conservation Committee Clearance (MHCC / Local Heritage Committee)',
      status: 'APPLIES',
      reason: 'Plot is in a designated Heritage Precinct or near protected archaeological monuments under UDCPR 2020 Reg 14.5 & Reg 2.2.11.',
      statutoryRef: 'UDCPR 2020 Reg 14.5 & Reg 2.2.11',
      nodeKey: 'heritage_noc'
    });
  } else {
    uncertain.push({
      id: 'rule_heritage_noc',
      name: 'Heritage Conservation / Monument Buffer Status',
      status: 'VERIFICATION_REQUIRED',
      reason: 'Heritage status requires site-level verification: verify that plot does not fall within 100m/200m buffer of ASI/State monuments (AMASR Act 1958) or local municipal Grade I/II/III lists.',
      statutoryRef: 'AMASR Act 1958 & UDCPR Reg 14.5'
    });
  }

  // Rule 6: Airport Authority (AAI NOCAS)
  if (airportZone === true || airportZone === 'true') {
    applicable.push({
      id: 'rule_airport_noc',
      name: 'Airport Authority of India (AAI NOCAS) Height Clearance',
      status: 'APPLIES',
      reason: 'Plot is reported within civil aviation funnel or radar obstacle limitation surface (OLS) under GSR 751(E) & UDCPR Reg 2.2.11.',
      statutoryRef: 'Ministry of Civil Aviation (GSR 751(E)) & UDCPR Reg 2.2.11',
      nodeKey: 'airport_noc'
    });
  } else {
    uncertain.push({
      id: 'rule_airport_noc',
      name: 'Airport Funnel & Radar Height Clearance (AAI NOCAS)',
      status: 'VERIFICATION_REQUIRED',
      reason: 'Airport clearance requires site-level elevation verification against Colour Coded Zoning Map (CCZM) using exact WGS-84 coordinates and AMSL structure elevation.',
      statutoryRef: 'Ministry of Civil Aviation (GSR 751(E)) & UDCPR Reg 2.2.11'
    });
  }

  // Rule 7: High-Tension Line Setback
  if (hasHighTensionLine === true || hasHighTensionLine === 'true') {
    uncertain.push({
      id: 'rule_ht_setback',
      name: 'High-Tension (HT) Power Line Clearance & MSEDCL/MSETCL NOC',
      status: 'VERIFICATION_REQUIRED',
      reason: 'High-Tension electrical line traverses or abuts plot. Statutory horizontal and vertical safety clearances must be certified on-site under UDCPR 2020 Reg 3.1.2 & Indian Electricity Rules 1956.',
      statutoryRef: 'UDCPR 2020 Reg 3.1.2 & Indian Electricity Rules 1956'
    });
  }

  // Rule 8: Road Width Adequacy Check
  const parsedRoad = parseFloat(roadWidth) || 9.0;
  if (parsedRoad < 6.0) {
    uncertain.push({
      id: 'rule_road_width_access',
      name: 'Sub-6 Meter Access Road Setback Surrender',
      status: 'VERIFICATION_REQUIRED',
      reason: `Existing road width (${parsedRoad}m) is narrower than standard UDCPR access. Road widening setback surrender may be demanded by Planning Authority before development sanction under UDCPR 2020 Reg 3.2 & Reg 3.3.1.`,
      statutoryRef: 'UDCPR 2020 Reg 3.2 & Reg 3.3.1'
    });
  }

  // Typology-Specific Clearances (Added to uncertain for site-scale verification)
  if (constructionType === 'COMMERCIAL') {
    uncertain.push({
      id: 'rule_comm_traffic_parking',
      name: 'Commercial Traffic Impact & Off-Street Parking Scrutiny',
      status: 'VERIFICATION_REQUIRED',
      reason: 'Commercial mercantile projects require dedicated customer parking bays and loading/unloading berths under UDCPR 2020 Chapter 8 (Tables 8B & 8C).',
      statutoryRef: 'UDCPR 2020 Chapter 8 (Tables 8B & 8C)'
    });
  } else if (constructionType === 'INSTITUTIONAL') {
    uncertain.push({
      id: 'rule_inst_accessibility',
      name: 'Barrier-Free Accessibility & Institutional Open Space Verification',
      status: 'VERIFICATION_REQUIRED',
      reason: 'Schools, colleges, and healthcare facilities require barrier-free ramps, emergency fire access driveways, and institutional open space reservations under UDCPR Chapter 4 & Reg 9.17.',
      statutoryRef: 'UDCPR 2020 Chapter 4 & Reg 9.17'
    });
  } else if (constructionType === 'HOSPITALITY') {
    uncertain.push({
      id: 'rule_hosp_env_tourism',
      name: 'Tourism Dept Registration & MPCB Environmental Consent',
      status: 'VERIFICATION_REQUIRED',
      reason: 'Hotels, resorts, and commercial kitchens require wastewater STP treatment and local health department trade clearances.',
      statutoryRef: 'Water Act 1974 & UDCPR Chapter 4'
    });
  } else if (constructionType === 'INDUSTRIAL') {
    uncertain.push({
      id: 'rule_ind_mpcb_dish',
      name: 'MPCB Consent to Establish & Factory Inspectorate (DISH) Approval',
      status: 'VERIFICATION_REQUIRED',
      reason: 'Manufacturing units and industrial sheds require pollution categorization (Red/Orange/Green) from MPCB and worker safety clearance under Factories Act 1948.',
      statutoryRef: 'Factories Act 1948 & Air/Water Acts'
    });
  } else if (constructionType === 'MIXED_USE') {
    uncertain.push({
      id: 'rule_mixed_segregation',
      name: 'Mixed-Use Dual Zoning & Segregated Circulation Scrutiny',
      status: 'VERIFICATION_REQUIRED',
      reason: 'Mixed-use developments require segregated residential and commercial parking, independent lobby entrances, and combined FSI verification under UDCPR Reg 4.2.',
      statutoryRef: 'UDCPR 2020 Reg 4.2'
    });
  }

  return {
    constructionType,
    customConstructionType,
    mixedUseComponents,
    jurisdiction,
    plotArea,
    buildingHeight: parsedHeight,
    roadWidth: parsedRoad,
    applicable,
    exempt,
    uncertain
  };
}

/**
 * Builds a deterministic Directed Acyclic Graph (DAG) for any supported construction typology
 */
function assembleDeterministicGraph(questionnaire = {}) {
  const eligibility = evaluateEligibility(questionnaire);
  const constructionType = eligibility.constructionType || 'RESIDENTIAL';
  const applicableNodeKeys = new Set(
    eligibility.applicable.map((a) => a.nodeKey).filter(Boolean)
  );

  const nodes = [];
  const edges = [];

  const typologyLabel = constructionType === 'OTHER' && questionnaire.customConstructionType
    ? questionnaire.customConstructionType
    : constructionType.charAt(0) + constructionType.slice(1).toLowerCase();

  // 1. Add applicable canonical nodes with typology-aware descriptions
  const baseNodeKeys = [
    'title',
    'mojani',
    'tax_noc',
    'autodcr',
    'site_inspection',
    'iod',
    'tree_noc',
    'hydraulic_noc',
    'fire_noc',
    'eco_noc',
    'heritage_noc',
    'airport_noc',
    'cc',
    'plinth_check',
    'oc'
  ];

  baseNodeKeys.forEach((key) => {
    if (applicableNodeKeys.has(key) && CANONICAL_NODES[key]) {
      const baseNode = CANONICAL_NODES[key];
      nodes.push({
        ...baseNode,
        plainLanguageSummary: baseNode.plainLanguageSummary.replace(/residential/gi, typologyLabel.toLowerCase())
      });
    }
  });

  // 1b. Add typology-specific specialized nodes
  if (constructionType === 'COMMERCIAL' && CANONICAL_NODES.comm_traffic_parking) {
    nodes.push(CANONICAL_NODES.comm_traffic_parking);
  } else if (constructionType === 'INSTITUTIONAL' && CANONICAL_NODES.inst_accessibility) {
    nodes.push(CANONICAL_NODES.inst_accessibility);
  } else if (constructionType === 'HOSPITALITY' && CANONICAL_NODES.hosp_env_tourism) {
    nodes.push(CANONICAL_NODES.hosp_env_tourism);
  } else if (constructionType === 'MIXED_USE' && CANONICAL_NODES.mixed_segregation) {
    nodes.push(CANONICAL_NODES.mixed_segregation);
  } else if (constructionType === 'INDUSTRIAL' && CANONICAL_NODES.ind_mpcb_dish) {
    nodes.push(CANONICAL_NODES.ind_mpcb_dish);
  }

  // 2. Assemble deterministic edges based on included nodes
  const includedIds = new Set(nodes.map((n) => n.id));

  // Prerequisite edges to AutoDCR
  if (includedIds.has('node_title') && includedIds.has('node_mojani')) {
    edges.push({ id: 'e_title_mojani', source: 'node_title', target: 'node_mojani', label: 'Title deed required for demarcation' });
  }
  if (includedIds.has('node_title') && includedIds.has('node_autodcr')) {
    edges.push({ id: 'e_title_autodcr', source: 'node_title', target: 'node_autodcr', label: 'Upload title proof to Appendix A-1' });
  }
  if (includedIds.has('node_mojani') && includedIds.has('node_tax_noc')) {
    edges.push({ id: 'e_mojani_tax', source: 'node_mojani', target: 'node_tax_noc', label: 'Demarcated plot assessment & tax clearance' });
  }
  if (includedIds.has('node_mojani') && includedIds.has('node_autodcr')) {
    edges.push({ id: 'e_mojani_autodcr', source: 'node_mojani', target: 'node_autodcr', label: 'Coordinates mapped into CAD drawing' });
  }
  if (includedIds.has('node_tax_noc') && includedIds.has('node_autodcr')) {
    edges.push({ id: 'e_tax_autodcr', source: 'node_tax_noc', target: 'node_autodcr', label: 'No-dues receipt required for scrutiny' });
  }

  // Scrutiny to Inspection to IOD
  if (includedIds.has('node_autodcr') && includedIds.has('node_site_inspection')) {
    edges.push({ id: 'e_autodcr_site', source: 'node_autodcr', target: 'node_site_inspection', label: 'CAD scrutiny clearance triggers site visit' });
  }
  if (includedIds.has('node_site_inspection') && includedIds.has('node_iod')) {
    edges.push({ id: 'e_site_iod', source: 'node_site_inspection', target: 'node_iod', label: 'ATP site clearance issues IOD' });
  }

  // Parallel NOCs after IOD
  const parallelNocIds = [
    'node_tree_noc',
    'node_hydraulic_noc',
    'node_fire_noc',
    'node_eco_noc',
    'node_heritage_noc',
    'node_airport_noc',
    'node_comm_traffic_parking',
    'node_inst_accessibility',
    'node_hosp_env_tourism',
    'node_mixed_segregation',
    'node_ind_mpcb_dish'
  ];
  parallelNocIds.forEach((nocId) => {
    if (includedIds.has(nocId) && includedIds.has('node_iod')) {
      edges.push({ id: `e_iod_${nocId}`, source: 'node_iod', target: nocId, label: 'Conditional IOD clause compliance' });
    }
    if (includedIds.has(nocId) && includedIds.has('node_cc')) {
      edges.push({ id: `e_${nocId}_cc`, source: nocId, target: 'node_cc', label: 'Clearance NOC submitted' });
    }
  });

  // Construction stages
  if (includedIds.has('node_cc') && includedIds.has('node_plinth_check')) {
    edges.push({ id: 'e_cc_plinth', source: 'node_cc', target: 'node_plinth_check', label: 'Excavation to Plinth height' });
  }
  if (includedIds.has('node_plinth_check') && includedIds.has('node_oc')) {
    edges.push({ id: 'e_plinth_oc', source: 'node_plinth_check', target: 'node_oc', label: 'Superstructure finishes to final OC' });
  }

  // Calculate totals
  const totalDays = nodes.reduce((sum, n) => sum + (n.estimatedDays || 0), 0);
  const totalCost = nodes.reduce((sum, n) => sum + (n.cost || 0), 0);
  const cityName = questionnaire.jurisdiction || 'Maharashtra';

  return {
    taskId: `${constructionType.toLowerCase()}-building-permission-${cityName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
    taskTitle: `Permitting Pipeline: ${typologyLabel} Development in ${cityName}`,
    jurisdiction: `${cityName} Municipal Local Authority (UDCPR 2020 / MahaBPAMS / RTS Act)`,
    constructionType,
    customConstructionType: questionnaire.customConstructionType || '',
    totalEstimatedDays: totalDays,
    totalEstimatedCostINR: totalCost,
    legalReference: "Maharashtra Regional & Town Planning (MRTP) Act 1966 & UDCPR 2020",
    provenance: "deterministic_curated",
    provenanceLabel: `Curated ${typologyLabel} blueprint (UDCPR 2020)`,
    eligibility,
    nodes,
    edges
  };
}

module.exports = {
  CANONICAL_NODES,
  evaluateEligibility,
  assembleDeterministicGraph
};
