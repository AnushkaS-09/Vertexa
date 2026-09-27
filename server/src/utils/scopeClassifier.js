/**
 * Vertexa Custom Requirement Scope & Intent Classifier
 * Determines if a query falls into Maharashtra Building Permission / Statutory NOCs
 * 
 * Supported Project Typologies:
 * - RESIDENTIAL (Bungalows, villas, apartments, G+1/G+2/G+3, row houses, residential plots)
 * - COMMERCIAL (Offices, shopping complexes, malls, retail stores, showrooms, business centers)
 * - INSTITUTIONAL (Schools, colleges, universities, hospitals, clinics, community halls)
 * - HOSPITALITY (Hotels, resorts, lodges, guest houses, motels, serviced apartments)
 * - MIXED_USE (Combined residential + commercial/retail developments)
 * - INDUSTRIAL (Factories, warehouses, godowns, industrial sheds, workshops)
 * - OTHER (Custom facilities, data centers, sports complexes)
 *
 * Output States:
 * - 'IN_SCOPE': Valid construction query with detectedConstructionType
 * - 'OUT_OF_SCOPE': Explicitly unrelated (entertainment, recipes, personal, travel, standalone utility)
 * - 'NEEDS_CLARIFICATION': Ambiguous or incomplete query needing user clarification
 */

function classifyRequirementScope(query) {
  if (!query || typeof query !== 'string') {
    return {
      status: 'NEEDS_CLARIFICATION',
      detectedConstructionType: null,
      message: 'Please describe the building or construction project you need help with (e.g., residential house, commercial office, school, hotel, or warehouse).'
    };
  }

  const q = query.trim().toLowerCase();

  // 1. Empty / Whitespace only
  if (q.length === 0) {
    return {
      status: 'NEEDS_CLARIFICATION',
      detectedConstructionType: null,
      message: 'Please describe the building or construction project you need help with (e.g., residential house, commercial office, school, hotel, or warehouse).'
    };
  }

  // 2. Out-of-Scope Negative Filters (Unrelated personal, entertainment, travel, standalone non-construction utility)
  const isDanceOrEntertainment = /\b(dance|dancing|sing|singing|party|partying|movie|cinema|sports|game|gaming|gym|workout|dating|joke|story|song|poem|recipe|cook|cooking)\b/i.test(q);
  const isTravelTourism = /\b(travel|trip|holiday|vacation|tourism|flight|train ticket|bus ticket|hotel booking|itinerary|visit pune|visit mumbai|sightseeing)\b/i.test(q) && !/\b(build|construct|permission|sanction|noc|hotel|resort)\b/i.test(q);
  const isStandaloneUtility = /\b(standalone water|standalone electricity|water meter only|water tap only|tap connection|electricity meter only|water bill|power bill|existing house water|existing flat water|standalone connection)\b/i.test(q) ||
    (/^((i want|i need|get|apply for)\s+)?(a\s+)?(water connection|electricity connection|meter connection)\s*$/i.test(q));
  const isGeneralChat = /^(hi|hello|hey|who are you|what is your name|how are you|test|testing|good morning|good evening|good night)\s*$/i.test(q);

  if (isDanceOrEntertainment || isTravelTourism || isStandaloneUtility || isGeneralChat) {
    return {
      status: 'OUT_OF_SCOPE',
      detectedConstructionType: null,
      message: 'Vertexa supports building plan approval, municipal sanctions, and statutory NOC clearances in Maharashtra across Residential, Commercial, Institutional, Hospitality, Mixed-Use, and Industrial projects. Please describe the building or construction project you want to undertake.'
    };
  }

  // 3. Typology Detection Patterns
  const isMixedUse = /\b(mixed\s*-?\s*use|shops\s+and\s+(apartments|flats|residential)|commercial\s+and\s+residential|residential\s+and\s+commercial)\b/i.test(q);
  const isIndustrial = /\b(industrial|factory|factories|warehouse|godown|manufacturing|workshop|industrial shed|industrial plant|industrial building)\b/i.test(q);
  const isHospitality = /\b(hotel|resort|guest house|lodge|motel|serviced apartment|homestay|resort project)\b/i.test(q);
  const isInstitutional = /\b(institutional|school|college|university|hospital|clinic|nursing home|library|community hall|educational|medical college|research institute)\b/i.test(q);
  const isCommercial = /\b(commercial|office|offices|shopping complex|mall|retail store|showroom|business park|it park|business center|commercial complex|commercial building|commercial shop|commercial plot|bank branch|multiplex)\b/i.test(q);
  const isResidential = /\b(residential|house|home|bungalow|villa|cottage|row house|independent house|apartment|apartments|flat|flats|housing|g\+1|g\+2|g\+3|g\+4|ground\s*\+\s*[0-9]|residential building|residential plot|residential layout)\b/i.test(q);

  // Construction / Permitting / Development action verbs
  const hasPermittingOrConstructionAction = /\b(build|building|construct|construction|erect|erection|permission|permit|plan approval|sanction|clearance|clearances|noc|development permission|autodcr|bpams|mahabpams|iod|plinth|occupancy certificate|completion certificate|7\/12|mojani|demarcation|layout sanction|regulations|udcpr|project|proposal)\b/i.test(q);

  // Direct construction query checks
  if (isMixedUse && (hasPermittingOrConstructionAction || q.includes('mixed'))) {
    return { status: 'IN_SCOPE', constructionType: 'MIXED_USE', detectedConstructionType: 'MIXED_USE', message: null };
  }
  if (isIndustrial && hasPermittingOrConstructionAction) {
    return { status: 'IN_SCOPE', constructionType: 'INDUSTRIAL', detectedConstructionType: 'INDUSTRIAL', message: null };
  }
  if (isHospitality && hasPermittingOrConstructionAction) {
    return { status: 'IN_SCOPE', constructionType: 'HOSPITALITY', detectedConstructionType: 'HOSPITALITY', message: null };
  }
  if (isInstitutional && hasPermittingOrConstructionAction) {
    return { status: 'IN_SCOPE', constructionType: 'INSTITUTIONAL', detectedConstructionType: 'INSTITUTIONAL', message: null };
  }
  if (isCommercial && hasPermittingOrConstructionAction) {
    return { status: 'IN_SCOPE', constructionType: 'COMMERCIAL', detectedConstructionType: 'COMMERCIAL', message: null };
  }
  if (isResidential && hasPermittingOrConstructionAction) {
    return { status: 'IN_SCOPE', constructionType: 'RESIDENTIAL', detectedConstructionType: 'RESIDENTIAL', message: null };
  }

  // Generic building construction without specific typology (e.g. "I want to construct a building in Maharashtra")
  const isGenericBuildingConstruction = /\b(construct|build|erect|develop)\s+(a\s+)?(building|structure|project|property)\b/i.test(q) ||
    /\b(building|construction|development)\s+(permission|approval|sanction|permit|clearance)\b/i.test(q) ||
    /\b(plan approval|building permission)\s+in\s+[a-z]+/i.test(q);

  if (isGenericBuildingConstruction) {
    // Valid construction inquiry -> default to RESIDENTIAL with ability to adjust in questionnaire
    return {
      status: 'IN_SCOPE',
      constructionType: 'RESIDENTIAL',
      detectedConstructionType: 'RESIDENTIAL',
      message: null
    };
  }

  // 4. Ambiguous queries with construction intent but lacking details -> NEEDS_CLARIFICATION
  if (hasPermittingOrConstructionAction || isResidential || isCommercial || isIndustrial || isHospitality || isInstitutional || isMixedUse) {
    return {
      status: 'NEEDS_CLARIFICATION',
      constructionType: null,
      detectedConstructionType: null,
      message: 'Could you clarify the building or construction project you need help with? (e.g. "I want to construct a commercial office in Pune" or "I want to build a residential house in Nashik")'
    };
  }

  const words = q.split(/\s+/).filter(Boolean);
  const isTooVague = words.length <= 2;
  if (isTooVague) {
    return {
      status: 'NEEDS_CLARIFICATION',
      constructionType: null,
      detectedConstructionType: null,
      message: 'Could you clarify the building or construction project you need help with? (e.g. "I want to construct a commercial office in Pune" or "I want to build a residential house in Nashik")'
    };
  }

  // 5. Default Fallback: Unknown is NEVER IN_SCOPE
  return {
    status: 'OUT_OF_SCOPE',
    constructionType: null,
    detectedConstructionType: null,
    message: 'Vertexa supports building plan approval and statutory NOC clearances across Residential, Commercial, Institutional, Hospitality, Mixed-Use, and Industrial projects in Maharashtra. Please describe the construction project you want to undertake.'
  };
}

module.exports = {
  classifyRequirementScope
};
