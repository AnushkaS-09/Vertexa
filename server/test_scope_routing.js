const assert = require('assert');
const { classifyRequirementScope } = require('./src/utils/scopeClassifier');

/**
 * Simulator for UI navigation gate
 */
function simulateConstructWorkflow(query) {
  const classification = classifyRequirementScope(query);
  let isQuestionnaireOpen = false;
  let feedbackMessage = null;

  if (classification.status === 'IN_SCOPE') {
    isQuestionnaireOpen = true;
  } else {
    isQuestionnaireOpen = false;
    feedbackMessage = classification.message;
  }

  return {
    status: classification.status,
    isQuestionnaireOpen,
    feedbackMessage
  };
}

function runScopeRoutingTests() {
  console.log('===============================================================');
  console.log('VERTEXA — CUSTOM REQUIREMENT SCOPE & INTENT ROUTING TESTS');
  console.log('===============================================================\n');

  // TEST 1 — CLEARLY OUT OF SCOPE
  console.log('[Test 1] Clearly Out of Scope: "I want to dance"...');
  const res1 = simulateConstructWorkflow('I want to dance');
  assert.strictEqual(res1.status, 'OUT_OF_SCOPE', 'Must classify "I want to dance" as OUT_OF_SCOPE');
  assert.strictEqual(res1.isQuestionnaireOpen, false, 'Plot Questionnaire MUST NOT open for "I want to dance"');
  assert.ok(res1.feedbackMessage.includes('building plan approval') || res1.feedbackMessage.includes('construction'), 'Must show clear scope boundary message');
  console.log('  ✓ "I want to dance" -> OUT_OF_SCOPE, Questionnaire NOT opened\n');

  // TEST 2 — CLEARLY IN SCOPE (RESIDENTIAL)
  console.log('[Test 2] Clearly In Scope: "I want to build a house in Pune"...');
  const res2 = simulateConstructWorkflow('I want to build a house in Pune');
  assert.strictEqual(res2.status, 'IN_SCOPE', 'Must classify standard house request as IN_SCOPE');
  assert.strictEqual(res2.isQuestionnaireOpen, true, 'Plot Questionnaire MUST open for valid house build request');
  console.log('  ✓ "I want to build a house in Pune" -> IN_SCOPE, Questionnaire opened\n');

  // TEST 3 — BUILDING PERMISSION REQUEST
  console.log('[Test 3] Building Permission: "I need permission to construct a residential house"...');
  const res3 = simulateConstructWorkflow('I need permission to construct a residential house');
  assert.strictEqual(res3.status, 'IN_SCOPE');
  assert.strictEqual(res3.isQuestionnaireOpen, true);
  console.log('  ✓ "I need permission to construct a residential house" -> IN_SCOPE, Questionnaire opened\n');

  // TEST 4 — RESIDENTIAL CONSTRUCTION
  console.log('[Test 4] Multi-Storey Residential: "I want to construct a G+2 residential building on my plot"...');
  const res4 = simulateConstructWorkflow('I want to construct a G+2 residential building on my plot');
  assert.strictEqual(res4.status, 'IN_SCOPE');
  assert.strictEqual(res4.isQuestionnaireOpen, true);
  console.log('  ✓ "I want to construct a G+2 residential building on my plot" -> IN_SCOPE, Questionnaire opened\n');

  // TEST 5 — COMMERCIAL CONSTRUCTION (NOW SUPPORTED IN SCOPE)
  console.log('[Test 5] Commercial Request: "I want to construct a commercial shopping complex in Mumbai"...');
  const res5 = simulateConstructWorkflow('I want to construct a commercial shopping complex in Mumbai');
  assert.strictEqual(res5.status, 'IN_SCOPE', 'Commercial building construction is IN_SCOPE');
  assert.strictEqual(res5.isQuestionnaireOpen, true, 'Plot Questionnaire MUST open for commercial construction');
  console.log('  ✓ "I want to construct a commercial shopping complex in Mumbai" -> IN_SCOPE, Questionnaire opened\n');

  // TEST 6 — STANDALONE WATER CONNECTION (OUT OF SCOPE)
  console.log('[Test 6] Standalone Utility: "I need a standalone water connection"...');
  const res6 = simulateConstructWorkflow('I need a standalone water connection');
  assert.strictEqual(res6.status, 'OUT_OF_SCOPE', 'Standalone utility connection must be OUT_OF_SCOPE');
  assert.strictEqual(res6.isQuestionnaireOpen, false, 'Plot Questionnaire MUST NOT open for standalone utility');
  console.log('  ✓ "I need a standalone water connection" -> OUT_OF_SCOPE, Questionnaire NOT opened\n');

  // TEST 7 — AMBIGUOUS REQUEST
  console.log('[Test 7] Ambiguous Query: "permission"...');
  const res7 = simulateConstructWorkflow('permission');
  assert.strictEqual(res7.status, 'NEEDS_CLARIFICATION', 'Single vague word must trigger NEEDS_CLARIFICATION');
  assert.strictEqual(res7.isQuestionnaireOpen, false, 'Plot Questionnaire MUST NOT open for ambiguous query');
  assert.ok(res7.feedbackMessage.includes('clarify'), 'Must prompt for clarification');
  console.log('  ✓ "permission" -> NEEDS_CLARIFICATION, Questionnaire NOT opened\n');

  // TEST 8 — VALID REQUEST WITH DIFFERENT NATURAL WORDING
  console.log('[Test 8] Natural Wording: "I want to erect an independent bungalow in Nashik on my plot"...');
  const res8 = simulateConstructWorkflow('I want to erect an independent bungalow in Nashik on my plot');
  assert.strictEqual(res8.status, 'IN_SCOPE');
  assert.strictEqual(res8.isQuestionnaireOpen, true);
  console.log('  ✓ "I want to erect an independent bungalow in Nashik on my plot" -> IN_SCOPE, Questionnaire opened\n');

  // TEST 9 — WATER REQUIREMENT AS PART OF RESIDENTIAL CONSTRUCTION
  console.log('[Test 9] Water within Building Scope: "I want to build a house and need to understand the water connection requirements"...');
  const res9 = simulateConstructWorkflow('I want to build a house and need to understand the water connection requirements');
  assert.strictEqual(res9.status, 'IN_SCOPE', 'Water requirement as part of house construction is IN_SCOPE');
  assert.strictEqual(res9.isQuestionnaireOpen, true);
  console.log('  ✓ Water inquiry within residential construction -> IN_SCOPE, Questionnaire opened\n');

  // TEST 10 — UNRELATED TRAVEL REQUEST
  console.log('[Test 10] Travel Request: "I want to travel to Pune"...');
  const res10 = simulateConstructWorkflow('I want to travel to Pune');
  assert.strictEqual(res10.status, 'OUT_OF_SCOPE');
  assert.strictEqual(res10.isQuestionnaireOpen, false);
  console.log('  ✓ "I want to travel to Pune" -> OUT_OF_SCOPE, Questionnaire NOT opened\n');

  console.log('===============================================================');
  console.log('🎉 ALL 10 SCOPE & INTENT ROUTING REGRESSION TESTS PASSED!');
  console.log('===============================================================\n');
}

runScopeRoutingTests();
