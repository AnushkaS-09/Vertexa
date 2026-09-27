/**
 * Vertexa Custom Requirement Scope & Intent Classifier
 * Determines if a query falls into Maharashtra Residential House Building Permission / Statutory NOCs
 *
 * Supported Scope:
 * - Building plan approval & construction permitting for residential houses in Maharashtra (UDCPR 2020 / MRTP Act 1966).
 *
 * States:
 * - 'IN_SCOPE': Proceeds to Plot Questionnaire
 * - 'OUT_OF_SCOPE': Rejects navigation, shows out-of-scope guidance
 * - 'NEEDS_CLARIFICATION': Rejects navigation, asks for specific building-permission clarification
 */

function classifyRequirementScope(query) {
  if (!query || typeof query !== 'string') {
    return {
      status: 'NEEDS_CLARIFICATION',
      message: 'Please describe the residential construction or building-permission requirement you need help with.'
    };
  }

  const q = query.trim().toLowerCase();

  // 1. Empty / Whitespace only
  if (q.length === 0) {
    return {
      status: 'NEEDS_CLARIFICATION',
      message: 'Please describe the residential construction or building-permission requirement you need help with.'
    };
  }

  // 2. Out-of-Scope Negative Filters (Unrelated personal, entertainment, travel, commerce, standalone non-construction utility)
  const isDanceOrEntertainment = /\b(dance|dancing|sing|singing|party|partying|movie|cinema|sports|game|gaming|gym|workout|dating|joke|story|song|poem)\b/i.test(q);
  const isTravelTourism = /\b(travel|trip|holiday|vacation|tourism|flight|train ticket|bus ticket|hotel booking|itinerary|visit pune|visit mumbai|sightseeing)\b/i.test(q);
  const isCommercialOrIndustrial = /\b(restaurant|cafe|bar|pub|dhaba|shop|showroom|mall|supermarket|factory|industry|industrial plant|warehouse|godown|hotel business|manufacturing|trade license|gumasta|fssai|food license)\b/i.test(q);
  const isStandaloneUtility = /\b(standalone water|standalone electricity|water meter only|water tap only|tap connection|electricity meter only|water bill|power bill|existing house water|existing flat water|standalone connection)\b/i.test(q) ||
    (/^((i want|i need|get|apply for)\s+)?(a\s+)?(water connection|electricity connection|meter connection)\s*$/i.test(q));
  const isGeneralChat = /^(hi|hello|hey|who are you|what is your name|how are you|test|testing|good morning|good evening|good night)\s*$/i.test(q);

  if (isDanceOrEntertainment || isTravelTourism || isCommercialOrIndustrial || isStandaloneUtility || isGeneralChat) {
    return {
      status: 'OUT_OF_SCOPE',
      message: 'Vertexa currently supports residential building permission and statutory NOC clearances in Maharashtra. Please describe the house or residential construction you want to undertake.'
    };
  }

  // 3. Positive In-Scope Semantic Patterns
  // A. Explicit residential building construction keywords
  const hasResidentialTarget = /\b(residential|house|home|bungalow|villa|cottage|row house|independent house|g\+1|g\+2|g\+3|g\+4|ground\s*\+\s*[0-9]|multi-storey residential|residential plot|residential building|residential layout)\b/i.test(q);
  
  // B. Construction / Permitting / Statutory Actions
  const hasPermittingOrConstructionAction = /\b(build|building|construct|construction|erect|erection|permission|permit|plan approval|sanction|clearance|clearances|noc|development permission|autodcr|bpams|mahabpams|iod|plinth|occupancy certificate|completion certificate|7\/12|mojani|demarcation|layout sanction|regulations|udcpr)\b/i.test(q);

  // C. Combined Semantic Intents
  // Case 1: Has both a residential target and a construction/permitting action
  if (hasResidentialTarget && hasPermittingOrConstructionAction) {
    return {
      status: 'IN_SCOPE',
      message: null
    };
  }

  // Case 2: Explicit residential building phrases (even if phrasing varies)
  const isExplicitResidentialPermitPhrase = /\b(building permission|construction permission|development permission|building plan approval|building sanction|building permit|residential plot permission|construction approval|statutory noc|statutory clearance)\b/i.test(q);
  if (isExplicitResidentialPermitPhrase && !isCommercialOrIndustrial) {
    return {
      status: 'IN_SCOPE',
      message: null
    };
  }

  // Case 3: Specific residential project phrases like "house in pune", "g+2 in thane", "bungalow in matheran"
  const isDirectResidentialProject = /\b(house in|bungalow in|villa in|home in|cottage in|flat in|plot in|residence in)\s+[a-z]+/i.test(q);
  if (isDirectResidentialProject && !isCommercialOrIndustrial) {
    return {
      status: 'IN_SCOPE',
      message: null
    };
  }

  // 4. Ambiguous / Short keywords requiring clarification
  // Single or vague keywords like "pune", "mumbai", "house", "plot", "building", "permission", "noc" without action
  const words = q.split(/\s+/).filter(Boolean);
  const isTooVague = words.length <= 1 || (words.length <= 2 && /^(pune|mumbai|thane|nagpur|nashik|matheran|pcmc|house|home|plot|building|permission|construction|noc|clearance|permit|help|rules|udcpr)$/i.test(words[0]));

  if (isTooVague) {
    return {
      status: 'NEEDS_CLARIFICATION',
      message: 'Could you clarify the residential construction or building-permission requirement you need help with? (e.g. "I want to construct a G+2 residential house in Pune")'
    };
  }

  // 5. Default Fallback: Unknown is NEVER IN_SCOPE
  return {
    status: 'OUT_OF_SCOPE',
    message: 'Vertexa currently supports residential building permission and statutory NOC clearances in Maharashtra. Please describe the house or residential construction you want to undertake.'
  };
}

module.exports = {
  classifyRequirementScope
};
