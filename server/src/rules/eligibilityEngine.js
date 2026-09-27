/**
 * Vertexa Deterministic Rules & Eligibility Engine
 * Regulatory Framework: Maharashtra UDCPR 2020 & MRTP Act 1966
 * 
 * Determines applicable, exempt, and conditional NOC clearances
 * based on structured plot and building parameters.
 */

const CANONICAL_NODES = {
  // 1. Universal Base Nodes (Always apply to any residential plot in Maharashtra)
  title: {
    id: "node_title",
    stage: "Stage 1: Revenue & Land Title",
    title: "Certified 7/12 Extract or CTS Property Card",
    department: "Revenue Dept & Land Records (Mahabhulekh / Aaple Sarkar)",
    type: "prerequisite",
    estimatedDays: 3,
    cost: 150,
    statutoryRule: "UDCPR 2020, Reg 2.2.3(a)",
    forms: [
      "V.F. 7/12 Extract (issued within 6 months)",
      "Property Register Card (मालमत्ता पत्रक)",
      "Search Index-II from Sub-Registrar"
    ],
    officialUrl: "https://bhulekh.mahabhumi.gov.in",
    plainLanguageSummary: "Proof that you hold unencumbered legal title with no government reservations, litigation, or liens.",
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
    statutoryRule: "UDCPR 2020, Reg 2.2.3(b)",
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
    statutoryRule: "UDCPR 2020, Reg 2.2.3(f)",
    forms: [
      "Current Assessment Year Paid Tax Receipt",
      "No-Dues Certificate (NOC)"
    ],
    officialUrl: "https://portal.mcgm.gov.in",
    plainLanguageSummary: "Validates that all open land tax dues up to the current fiscal quarter are fully cleared.",
    isBottleneck: false
  },
  autodcr: {
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
    title: "Intimation of Disapproval (IOD) / Conditional Sanction",
    department: "Executive Engineer / Building Proposal Department",
    type: "conditional_approval",
    estimatedDays: 5,
    cost: 0,
    statutoryRule: "MRTP Act 1966 Section 45 & UDCPR Reg 2.5",
    forms: [
      "IOD Letter with 15–20 conditional compliance clauses"
    ],
    officialUrl: "https://mahadma.maharashtra.gov.in",
    plainLanguageSummary: "Conditional green signal. Certifies plan compliance, but forbids construction until all parallel departmental NOCs are produced.",
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
    statutoryRule: "UDCPR 2020, Reg 2.2.5(d)",
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
    plainLanguageSummary: "Certifies the building matches the sanctioned blueprint, unlocking legal electricity meters, permanent drinking water, and property assessment.",
    isBottleneck: false
  },

  // 2. Conditional Clearances (Triggered by deterministic rules engine)
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
    statutoryRule: "UDCPR 2020, Chapter 6 & Maharashtra Fire Prevention and Life Safety Measures Act 2006",
    forms: [
      "Fire Scrutiny Checklist",
      "Fire Hydrant & 6m All-Round Driveway Access Plan"
    ],
    officialUrl: "https://mahafireservice.gov.in",
    plainLanguageSummary: "Mandatory for buildings above 15m height or special residential occupancy ensuring firefighter access, dedicated fire staircases, and wet riser hookups.",
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
    statutoryRule: "Environment (Protection) Act 1986 & UDCPR 2020 Reg 3.1.1 (Eco-Sensitive Zones)",
    forms: [
      "Form-1 ESZ Environmental Impact Statement",
      "NOC from Local Eco-Sensitive Monitoring Committee"
    ],
    officialUrl: "https://ecoclearance.nic.in",
    plainLanguageSummary: "Strict clearance for hill stations and eco-sensitive zones (e.g., Matheran, Mahabaleshwar) governing maximum permissible ground coverage, roof slopes, and tree preservation.",
    isBottleneck: true
  },
  heritage_noc: {
    id: "node_heritage_noc",
    stage: "Stage 3: Parallel Departmental NOCs",
    title: "Mumbai / Pune Heritage Conservation Committee (MHCC) NOC",
    department: "Heritage Conservation Cell & Urban Development Dept",
    type: "clearance",
    estimatedDays: 25,
    cost: 3500,
    statutoryRule: "UDCPR 2020, Chapter 11 (Heritage Conservation)",
    forms: [
      "Heritage Precinct Architectural Elevation Study",
      "Proximity Certificate to Grade I/II/III Listed Structures"
    ],
    officialUrl: "https://portal.mcgm.gov.in",
    plainLanguageSummary: "Mandatory when developing a plot within designated heritage precincts or within 100m of protected archaeological/state monuments.",
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
    statutoryRule: "Ministry of Civil Aviation (GSR 751(E)) & UDCPR 2020 Reg 2.2.5(a)",
    forms: [
      "NOCAS Online Application (WGS-84 Coordinates & Top-of-Structure AMSL Elevation)",
      "Site Elevation Certificate by Registered Surveyor"
    ],
    officialUrl: "https://nocas2.aai.aero",
    plainLanguageSummary: "Clearance verifying that proposed building height, water tanks, and lift machine rooms do not infringe into airport radar or obstacle limitation surfaces (OLS).",
    isBottleneck: false
  }
};

/**
 * Deterministic Rules Evaluator
 * Evaluates user plot questionnaire against statutory UDCPR 2020 criteria
 */
function evaluateEligibility(questionnaire = {}) {
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

  // Rule 1: Baseline Clearances (Universal)
  applicable.push({
    id: 'base_title_record',
    name: 'Land Title & 7/12 / CTS Property Card',
    status: 'APPLIES',
    reason: 'Mandatory under UDCPR 2020 Reg 2.2.3(a) for all residential construction to prove unencumbered ownership.',
    statutoryRef: 'UDCPR 2020 Reg 2.2.3(a)',
    nodeKey: 'title'
  });

  applicable.push({
    id: 'base_cadastral_demarcation',
    name: 'Cadastral Demarcation (Kayam Mojani)',
    status: 'APPLIES',
    reason: 'Mandatory under UDCPR 2020 Reg 2.2.3(b) to verify physical plot boundaries, road widening line, and setbacks.',
    statutoryRef: 'UDCPR 2020 Reg 2.2.3(b)',
    nodeKey: 'mojani'
  });

  applicable.push({
    id: 'base_property_tax',
    name: 'Municipal Property Tax No-Dues NOC',
    status: 'APPLIES',
    reason: 'Mandatory proof that all open land municipal taxes are paid up to date prior to plan scrutiny.',
    statutoryRef: 'UDCPR 2020 Reg 2.2.3(f)',
    nodeKey: 'tax_noc'
  });

  applicable.push({
    id: 'base_autodcr_scrutiny',
    name: 'Architect CAD & PreDCR Scrutiny (MahaBPAMS)',
    status: 'APPLIES',
    reason: 'Statutory automated verification of FSI, ground coverage, light/ventilation, and setbacks.',
    statutoryRef: 'UDCPR 2020 Reg 2.2.1 & 2.2.4',
    nodeKey: 'autodcr'
  });

  applicable.push({
    id: 'base_site_inspection',
    name: 'Assistant Town Planner (ATP) Site Inspection',
    status: 'APPLIES',
    reason: 'Mandatory ground verification by planning authority before granting IOD/sanction.',
    statutoryRef: 'UDCPR 2020 Reg 2.4 & RTS Act',
    nodeKey: 'site_inspection'
  });

  applicable.push({
    id: 'base_iod_sanction',
    name: 'Intimation of Disapproval (IOD) / Sanction',
    status: 'APPLIES',
    reason: 'Statutory conditional sanction under Section 45 of MRTP Act 1966.',
    statutoryRef: 'MRTP Act 1966 Sec 45',
    nodeKey: 'iod'
  });

  applicable.push({
    id: 'base_hydraulic_sanction',
    name: 'Hydraulic & Stormwater Drainage Sanction',
    status: 'APPLIES',
    reason: 'Required for all plots to connect internal sewage & stormwater to municipal mains.',
    statutoryRef: 'UDCPR 2020 Reg 2.2.5(d)',
    nodeKey: 'hydraulic_noc'
  });

  applicable.push({
    id: 'base_commencement_cert',
    name: 'Commencement Certificate (CC)',
    status: 'APPLIES',
    reason: 'Statutory permission to commence physical excavation and construction up to plinth.',
    statutoryRef: 'UDCPR 2020 Reg 2.6',
    nodeKey: 'cc'
  });

  applicable.push({
    id: 'base_plinth_check',
    name: 'Plinth Level Inspection & Superstructure CC',
    status: 'APPLIES',
    reason: 'Mandatory stage check ensuring foundation setbacks match sanctioned plan before upper floor casting.',
    statutoryRef: 'UDCPR 2020 Reg 2.8.4',
    nodeKey: 'plinth_check'
  });

  applicable.push({
    id: 'base_occupancy_cert',
    name: 'Final Occupancy Certificate (OC)',
    status: 'APPLIES',
    reason: 'Final legal clearance certifying building is habitable and compliant with sanctioned blueprint.',
    statutoryRef: 'UDCPR 2020 Reg 2.10',
    nodeKey: 'oc'
  });

  // Rule 2: Tree Authority Clearance (Trees affected > 0 or user checked yes)
  if (Number(treesAffected) > 0) {
    applicable.push({
      id: 'rule_tree_noc',
      name: 'Tree Authority Clearance & Re-plantation NOC',
      status: 'APPLIES',
      reason: `${treesAffected} tree(s) reported on or adjacent to proposed construction footprint requiring Tree Authority permission and compensatory plantation under Section 8 of the Maharashtra (Urban Areas) Protection and Preservation of Trees Act 1975.`,
      statutoryRef: 'Maharashtra Tree Act 1975, Sec 8',
      nodeKey: 'tree_noc'
    });
  } else {
    exempt.push({
      id: 'rule_tree_noc',
      name: 'Tree Authority Tree Felling Permission',
      status: 'EXEMPT',
      reason: 'No Tree Authority clearance triggered by the reported questionnaire facts (zero trees marked for felling/transplantation on the proposed footprint). An architect self-declaration is submitted with the application.',
      statutoryRef: 'Maharashtra Tree Act 1975',
      nodeKey: 'tree_noc'
    });
  }

  // Rule 3: Fire Safety NOC (Height > 15m or special residential building under UDCPR Chapter 6)
  const parsedHeight = parseFloat(buildingHeight) || 0;
  if (parsedHeight > 15) {
    applicable.push({
      id: 'rule_fire_noc',
      name: 'Chief Fire Officer (CFO) Provisional Fire NOC',
      status: 'APPLIES',
      reason: `Proposed building height (${parsedHeight}m) exceeds the 15.0m high-rise threshold under UDCPR 2020 Reg 1.3(93) & Chapter 6. Chief Fire Officer (CFO) Provisional Fire Safety NOC and dedicated fire driveways are mandatory.`,
      statutoryRef: 'UDCPR 2020 Chapter 6 & Fire Act 2006',
      nodeKey: 'fire_noc'
    });
  } else {
    exempt.push({
      id: 'rule_fire_noc',
      name: 'Chief Fire Officer (CFO) Special High-Rise Fire NOC',
      status: 'EXEMPT',
      reason: `Proposed building height (${parsedHeight}m) is within the low-rise threshold under UDCPR 2020 Reg 1.3(93). No separate High-Rise CFO NOC is triggered, while general fire safety setbacks remain self-certified by the registered architect on the building blueprint.`,
      statutoryRef: 'UDCPR 2020 Chapter 6',
      nodeKey: 'fire_noc'
    });
  }

  // Rule 4: Eco-Sensitive Zone / Hill Station Clearance
  const isEcoJurisdiction = /matheran|mahabaleshwar|panchgani|lonavala|khandala|eco|hill/i.test(jurisdiction);
  if (ecoSensitiveZone || isEcoJurisdiction) {
    applicable.push({
      id: 'rule_eco_noc',
      name: 'Eco-Sensitive Zone (ESZ) / High Level Monitoring Committee NOC',
      status: 'APPLIES',
      reason: `Plot is located in a notified Eco-Sensitive Zone (${jurisdiction}) under the Environment (Protection) Act 1986 & UDCPR 2020 Reg 3.1.1. High-Level Monitoring Committee approval is applicable. Note: Specific zonal schedules (e.g. permissible ground coverage and non-reflective sloping roof angles) must be verified against local notification norms.`,
      statutoryRef: 'Environment (Protection) Act 1986 & UDCPR 2020 Reg 3.1.1',
      nodeKey: 'eco_noc'
    });
  } else {
    exempt.push({
      id: 'rule_eco_noc',
      name: 'Eco-Sensitive Zone (ESZ) Special Clearance',
      status: 'EXEMPT',
      reason: `Plot falls within standard municipal urban/residential zone outside declared National Park / Wildlife / Hill Station Eco-Sensitive buffer zones.`,
      statutoryRef: 'UDCPR 2020 Reg 3.1',
      nodeKey: 'eco_noc'
    });
  }

  // Rule 5: Heritage Conservation Review
  if (heritageZone) {
    applicable.push({
      id: 'rule_heritage_noc',
      name: 'Heritage Conservation Committee (MHCC) Review',
      status: 'APPLIES',
      reason: 'Heritage pathway triggered: Plot reported within a declared heritage precinct or within the regulatory buffer of a protected heritage structure under UDCPR 2020 Chapter 11. Review by Heritage Conservation Committee (MHCC / State Heritage Cell) is applicable.',
      statutoryRef: 'UDCPR 2020 Chapter 11',
      nodeKey: 'heritage_noc'
    });
  } else {
    uncertain.push({
      id: 'rule_heritage_noc',
      name: 'Heritage Precinct & Monument Proximity Review',
      status: 'VERIFICATION_REQUIRED',
      reason: 'Heritage status requires site-level verification: While no heritage proximity was reported, conclusive statutory exemption requires verifying that the plot does not fall within the 100m/200m buffer of an ASI central monument (AMASR Act 2010) or local municipal Grade I/II/III heritage lists.',
      statutoryRef: 'UDCPR 2020 Chapter 11 & AMASR Act 2010'
    });
  }

  // Rule 6: Airport Authority of India (AAI NOCAS) Clearance
  if (airportZone) {
    applicable.push({
      id: 'rule_airport_noc',
      name: 'Airports Authority of India (AAI NOCAS) Height Clearance',
      status: 'APPLIES',
      reason: 'Aviation clearance triggered: Plot reported within an aerodrome flight funnel or Colour Coded Zoning Map (CCZM) restricted boundary under Ministry of Civil Aviation GSR 751(E) & UDCPR 2020 Reg 2.2.5(a). Online AAI NOCAS scrutiny is applicable.',
      statutoryRef: 'Ministry of Civil Aviation GSR 751(E) & UDCPR 2020 Reg 2.2.5(a)',
      nodeKey: 'airport_noc'
    });
  } else {
    uncertain.push({
      id: 'rule_airport_noc',
      name: 'Airports Authority of India (AAI NOCAS) Height Clearance',
      status: 'VERIFICATION_REQUIRED',
      reason: 'Aviation clearance requires site-specific verification: While no airport funnel was reported, conclusive AAI NOCAS exemption requires plotting exact WGS-84 geographic coordinates and structure elevation AMSL against the published AAI Colour Coded Zoning Map (CCZM).',
      statutoryRef: 'Ministry of Civil Aviation GSR 751(E) & AAI CCZM Maps'
    });
  }

  // Rule 7: High Tension Line Setback (Conditional / Verification Required)
  if (hasHighTensionLine) {
    uncertain.push({
      id: 'rule_ht_setback',
      name: 'High Tension (HT) Electricity Line Horizontal Clearance',
      status: 'VERIFICATION_REQUIRED',
      reason: 'Overhead power line reported near plot. UDCPR 2020 Reg 3.4 mandates statutory horizontal & vertical safety clearances (1.2m to 3.7m+ depending on line voltage). Physical verification with MSEDCL / power utility required during site inspection.',
      statutoryRef: 'UDCPR 2020 Reg 3.4'
    });
  }

  // Rule 8: Road width adequacy check
  const parsedRoad = parseFloat(roadWidth) || 9.0;
  if (parsedRoad < 6.0) {
    uncertain.push({
      id: 'rule_road_width_access',
      name: 'Sub-6 Meter Access Road Setback Surrender',
      status: 'VERIFICATION_REQUIRED',
      reason: `Existing road width (${parsedRoad}m) is narrower than standard 6.0m/9.0m UDCPR residential access. Road widening setback surrender may be demanded by Planning Authority before IOD grant under UDCPR 2020 Reg 3.3.1.`,
      statutoryRef: 'UDCPR 2020 Reg 3.3.1'
    });
  }

  return {
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
 * Builds a deterministic Directed Acyclic Graph (DAG) using canonical nodes and rules engine
 */
function assembleDeterministicGraph(questionnaire = {}) {
  const eligibility = evaluateEligibility(questionnaire);
  const applicableNodeKeys = new Set(
    eligibility.applicable.map((a) => a.nodeKey).filter(Boolean)
  );

  const nodes = [];
  const edges = [];

  // 1. Add applicable canonical nodes
  const nodeKeyList = [
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

  nodeKeyList.forEach((key) => {
    if (applicableNodeKeys.has(key) && CANONICAL_NODES[key]) {
      nodes.push({ ...CANONICAL_NODES[key] });
    }
  });

  // 2. Assemble deterministic edges based on included nodes
  const includedIds = new Set(nodes.map((n) => n.id));

  // Prerequisite edges to AutoDCR
  if (includedIds.has('node_title') && includedIds.has('node_mojani')) {
    edges.push({ id: 'e_title_mojani', source: 'node_title', target: 'node_mojani', label: 'Title deed required for demarcation' });
  }
  if (includedIds.has('node_title') && includedIds.has('node_autodcr')) {
    edges.push({ id: 'e_title_autodcr', source: 'node_title', target: 'node_autodcr', label: 'Upload title proof to Appendix A-1' });
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
  const parallelNocIds = ['node_tree_noc', 'node_hydraulic_noc', 'node_fire_noc', 'node_eco_noc', 'node_heritage_noc', 'node_airport_noc'];
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
    edges.push({ id: 'e_plinth_oc', source: 'node_plinth_check', target: 'node_oc', label: 'Superstructure slabs & final finishes' });
  }

  // Calculate totals
  const totalDays = nodes.reduce((sum, n) => sum + (n.estimatedDays || 0), 0);
  const totalCost = nodes.reduce((sum, n) => sum + (n.cost || 0), 0);
  const cityName = questionnaire.jurisdiction || 'Maharashtra';

  return {
    taskId: `residential-building-permission-${cityName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
    taskTitle: `Tailored Permitting Pipeline: Residential Building in ${cityName}`,
    jurisdiction: `${cityName} Municipal Authority (UDCPR 2020 / MahaBPAMS / RTS Act)`,
    totalEstimatedDays: totalDays,
    totalEstimatedCostINR: totalCost,
    legalReference: "Maharashtra Regional & Town Planning (MRTP) Act 1966 & UDCPR 2020",
    provenance: "deterministic_curated",
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
