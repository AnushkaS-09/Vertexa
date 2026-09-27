const assert = require('assert');
const { evaluateEligibility, assembleDeterministicGraph, RULES } = require('./src/rules/eligibilityEngine');
const { validateGraph } = require('./src/utils/graphValidator');
const { classifyRequirementScope } = require('./src/utils/scopeClassifier');

console.log('================================================================');
console.log('VERTEXA PHASE 10: ALL CONSTRUCTION TYPOLOGIES COMPREHENSIVE TEST');
console.log('================================================================\n');

let passed = 0;
let total = 0;

function runTest(name, fn) {
  total++;
  try {
    fn();
    passed++;
    console.log(`[PASS] ${name}`);
  } catch (err) {
    console.error(`[FAIL] ${name}: ${err.message}`);
    console.error(err.stack);
  }
}

// 1. TEST A: Residential questionnaire (RESIDENTIAL)
runTest('A: Residential Questionnaire - Default baseline evaluation', () => {
  const q = {
    constructionType: 'RESIDENTIAL',
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
  const res = evaluateEligibility(q);
  assert.strictEqual(res.constructionType, 'RESIDENTIAL');
  assert.ok(res.applicable.some(a => a.id === 'base_title_record'), 'Title proof must apply');
  assert.ok(res.applicable.some(a => a.id === 'base_autodcr_scrutiny'), 'CAD scrutiny must apply');
  // Low-rise residential should have fire NOC exempt
  assert.ok(res.exempt.some(e => e.id === 'rule_fire_noc'), 'Low rise residential fire NOC is exempt');

  const graph = assembleDeterministicGraph(q);
  assert.strictEqual(graph.constructionType, 'RESIDENTIAL');
  assert.ok(graph.nodes.some(n => n.id === 'node_autodcr'));
  assert.ok(!graph.nodes.some(n => n.id === 'node_comm_traffic_parking'));
  assert.ok(!graph.nodes.some(n => n.id === 'node_ind_mpcb_dish'));
});

// 2. TEST B: Commercial questionnaire (COMMERCIAL)
runTest('B: Commercial Questionnaire - Specialized commercial DAG', () => {
  const q = {
    constructionType: 'COMMERCIAL',
    jurisdiction: 'Mumbai',
    plotArea: 1000,
    buildingHeight: 12.0,
    roadWidth: 15.0,
    treesAffected: 0,
    heritageZone: false,
    airportZone: false,
    ecoSensitiveZone: false,
    hasHighTensionLine: false
  };
  const res = evaluateEligibility(q);
  assert.strictEqual(res.constructionType, 'COMMERCIAL');
  // Commercial traffic & parking should be marked as VERIFICATION_REQUIRED
  assert.ok(res.uncertain.some(u => u.id === 'rule_comm_traffic_parking'), 'Commercial traffic rule should require verification');
  // Low-rise commercial fire NOC should require verification (occupancy load dependent under UDCPR Ch 6)
  assert.ok(res.uncertain.some(u => u.id === 'rule_fire_noc'), 'Commercial low-rise fire NOC requires verification');

  const graph = assembleDeterministicGraph(q);
  assert.strictEqual(graph.constructionType, 'COMMERCIAL');
  assert.ok(graph.nodes.some(n => n.id === 'node_comm_traffic_parking'), 'Commercial graph must include traffic & parking node');
  assert.ok(graph.nodes.some(n => n.id === 'node_autodcr'), 'Commercial graph must include commercial CAD scrutiny');
  assert.ok(graph.taskTitle.toLowerCase().includes('commercial'), 'Task title must be commercial');
});

// 3. TEST C: Institutional questionnaire (INSTITUTIONAL)
runTest('C: Institutional Questionnaire - Accessibility & Institutional Standards', () => {
  const q = {
    constructionType: 'INSTITUTIONAL',
    jurisdiction: 'Thane',
    plotArea: 2500,
    buildingHeight: 10.0,
    roadWidth: 12.0,
    treesAffected: 1,
    heritageZone: false,
    airportZone: false,
    ecoSensitiveZone: false,
    hasHighTensionLine: false
  };
  const res = evaluateEligibility(q);
  assert.strictEqual(res.constructionType, 'INSTITUTIONAL');
  assert.ok(res.uncertain.some(u => u.id === 'rule_inst_accessibility'), 'Institutional accessibility should require verification');

  const graph = assembleDeterministicGraph(q);
  assert.strictEqual(graph.constructionType, 'INSTITUTIONAL');
  assert.ok(graph.nodes.some(n => n.id === 'node_inst_accessibility'), 'Institutional graph must include accessibility node');
  assert.ok(graph.taskTitle.toLowerCase().includes('institutional'), 'Task title must be institutional');
});

// 4. TEST D: Hospitality questionnaire (HOSPITALITY)
runTest('D: Hospitality Questionnaire - Tourism & Environmental Health', () => {
  const q = {
    constructionType: 'HOSPITALITY',
    jurisdiction: 'Pune',
    plotArea: 1500,
    buildingHeight: 14.0,
    roadWidth: 12.0,
    treesAffected: 0,
    heritageZone: false,
    airportZone: false,
    ecoSensitiveZone: false,
    hasHighTensionLine: false
  };
  const res = evaluateEligibility(q);
  assert.strictEqual(res.constructionType, 'HOSPITALITY');
  assert.ok(res.uncertain.some(u => u.id === 'rule_hosp_env_tourism'), 'Hospitality tourism rule should require verification');

  const graph = assembleDeterministicGraph(q);
  assert.strictEqual(graph.constructionType, 'HOSPITALITY');
  assert.ok(graph.nodes.some(n => n.id === 'node_hosp_env_tourism'), 'Hospitality graph must include tourism/env node');
  assert.ok(graph.taskTitle.toLowerCase().includes('hospitality'), 'Task title must be hospitality');
});

// 5. TEST E: Mixed-use questionnaire (MIXED_USE)
runTest('E: Mixed-Use Questionnaire - Use Segregation & Dual Egress', () => {
  const q = {
    constructionType: 'MIXED_USE',
    mixedUseComponents: ['RESIDENTIAL', 'COMMERCIAL'],
    jurisdiction: 'Pimpri-Chinchwad',
    plotArea: 800,
    buildingHeight: 18.0, // High-rise
    roadWidth: 18.0,
    treesAffected: 0,
    heritageZone: false,
    airportZone: false,
    ecoSensitiveZone: false,
    hasHighTensionLine: false
  };
  const res = evaluateEligibility(q);
  assert.strictEqual(res.constructionType, 'MIXED_USE');
  assert.ok(res.uncertain.some(u => u.id === 'rule_mixed_segregation'), 'Mixed-use segregation rule should require verification');
  // High-rise >=15m fire NOC applies across all typologies
  assert.ok(res.applicable.some(a => a.id === 'rule_fire_noc'), 'High-rise mixed-use must require fire NOC');

  const graph = assembleDeterministicGraph(q);
  assert.strictEqual(graph.constructionType, 'MIXED_USE');
  assert.ok(graph.nodes.some(n => n.id === 'node_mixed_segregation'), 'Mixed-use graph must include segregation node');
  assert.ok(graph.nodes.some(n => n.id === 'node_fire_noc'), 'Mixed-use high-rise graph must include CFO fire NOC');
});

// 6. TEST F: Industrial questionnaire (INDUSTRIAL)
runTest('F: Industrial Questionnaire - MPCB & DISH Clearances', () => {
  const q = {
    constructionType: 'INDUSTRIAL',
    jurisdiction: 'Thane',
    plotArea: 5000,
    buildingHeight: 9.0,
    roadWidth: 18.0,
    treesAffected: 0,
    heritageZone: false,
    airportZone: false,
    ecoSensitiveZone: false,
    hasHighTensionLine: true
  };
  const res = evaluateEligibility(q);
  assert.strictEqual(res.constructionType, 'INDUSTRIAL');
  assert.ok(res.uncertain.some(u => u.id === 'rule_ind_mpcb_dish'), 'Industrial MPCB & DISH rule should require verification');
  assert.ok(res.uncertain.some(u => u.id === 'rule_ht_setback'), 'HT line rule requires verification');

  const graph = assembleDeterministicGraph(q);
  assert.strictEqual(graph.constructionType, 'INDUSTRIAL');
  assert.ok(graph.nodes.some(n => n.id === 'node_ind_mpcb_dish'), 'Industrial graph must include MPCB/DISH node');
  assert.ok(graph.taskTitle.toLowerCase().includes('industrial'), 'Task title must be industrial');
});

// 7. TEST G: Other questionnaire (OTHER with custom description)
runTest('G: Other Construction Type - Retains custom description safely', () => {
  const q = {
    constructionType: 'OTHER',
    customConstructionType: 'Data Center & Server Farm',
    jurisdiction: 'Navi Mumbai',
    plotArea: 4000,
    buildingHeight: 16.0,
    roadWidth: 24.0,
    treesAffected: 0,
    heritageZone: false,
    airportZone: false,
    ecoSensitiveZone: false,
    hasHighTensionLine: false
  };
  const res = evaluateEligibility(q);
  assert.strictEqual(res.constructionType, 'OTHER');
  assert.strictEqual(res.customConstructionType, 'Data Center & Server Farm');

  const graph = assembleDeterministicGraph(q);
  assert.strictEqual(graph.constructionType, 'OTHER');
  assert.ok(graph.taskTitle.includes('Data Center & Server Farm'), 'Task title must incorporate custom description');
  assert.ok(graph.nodes.some(n => n.id === 'node_fire_noc'), 'High rise fire NOC applies');
});

// 8. TEST K & L: Cross-typology isolation
runTest('K & L: Cross-Typology Isolation - Distinct graphs generated', () => {
  const resGraph = assembleDeterministicGraph({ constructionType: 'RESIDENTIAL', jurisdiction: 'Pune' });
  const commGraph = assembleDeterministicGraph({ constructionType: 'COMMERCIAL', jurisdiction: 'Pune' });
  const indGraph = assembleDeterministicGraph({ constructionType: 'INDUSTRIAL', jurisdiction: 'Pune' });

  assert.notStrictEqual(resGraph.taskId, commGraph.taskId);
  assert.notStrictEqual(commGraph.taskId, indGraph.taskId);
  assert.ok(!resGraph.nodes.some(n => n.id === 'node_comm_traffic_parking'));
  assert.ok(commGraph.nodes.some(n => n.id === 'node_comm_traffic_parking'));
  assert.ok(!commGraph.nodes.some(n => n.id === 'node_ind_mpcb_dish'));
  assert.ok(indGraph.nodes.some(n => n.id === 'node_ind_mpcb_dish'));
});

// 9. TEST N & O: Scope classifier routing for all typologies & out-of-scope
runTest('N & O: Scope classifier detects typologies, clarifies ambiguities, and rejects out-of-scope', () => {
  // Out of scope
  assert.strictEqual(classifyRequirementScope('I want to dance').status, 'OUT_OF_SCOPE');
  assert.strictEqual(classifyRequirementScope('Give me a recipe for butter chicken').status, 'OUT_OF_SCOPE');
  assert.strictEqual(classifyRequirementScope('Plan a vacation to Goa').status, 'OUT_OF_SCOPE');

  // Ambiguous
  assert.strictEqual(classifyRequirementScope('I want to build').status, 'NEEDS_CLARIFICATION');
  assert.strictEqual(classifyRequirementScope('Construction in Pune').status, 'NEEDS_CLARIFICATION');

  // Typology detections
  const r1 = classifyRequirementScope('I want to build a residential house in Pune');
  assert.strictEqual(r1.status, 'IN_SCOPE');
  assert.strictEqual(r1.constructionType, 'RESIDENTIAL');

  const r2 = classifyRequirementScope('I want to construct a shopping mall and office building in Mumbai');
  assert.strictEqual(r2.status, 'IN_SCOPE');
  assert.strictEqual(r2.constructionType, 'COMMERCIAL');

  const r3 = classifyRequirementScope('I want to construct a high school and college');
  assert.strictEqual(r3.status, 'IN_SCOPE');
  assert.strictEqual(r3.constructionType, 'INSTITUTIONAL');

  const r4 = classifyRequirementScope('I want to build a luxury resort and hotel in Pune');
  assert.strictEqual(r4.status, 'IN_SCOPE');
  assert.strictEqual(r4.constructionType, 'HOSPITALITY');

  const r5 = classifyRequirementScope('I want a mixed-use building with retail shops and apartments');
  assert.strictEqual(r5.status, 'IN_SCOPE');
  assert.strictEqual(r5.constructionType, 'MIXED_USE');

  const r6 = classifyRequirementScope('I want to build a factory and industrial warehouse in Thane');
  assert.strictEqual(r6.status, 'IN_SCOPE');
  assert.strictEqual(r6.constructionType, 'INDUSTRIAL');
});

// 10. TEST Q: Graph Validator canonical typologies & schema checks
runTest('Q: Graph Validator checks canonical constructionType', () => {
  const validGraph = {
    taskTitle: 'Commercial Project Pipeline',
    constructionType: 'COMMERCIAL',
    nodes: [
      { id: 'node_1', title: 'Step 1', stage: 'Stage 1', type: 'prerequisite', estimatedDays: 3, cost: 100, plainLanguageSummary: 'Summary' }
    ],
    edges: []
  };
  const v1 = validateGraph(validGraph);
  assert.strictEqual(v1.isValid, true);
  assert.strictEqual(v1.sanitizedGraph.constructionType, 'COMMERCIAL');

  const invalidTypeGraph = {
    taskTitle: 'Unknown Project Pipeline',
    constructionType: 'SPACESHIP_DOCK',
    nodes: [
      { id: 'node_1', title: 'Step 1', stage: 'Stage 1', type: 'prerequisite', estimatedDays: 3, cost: 100, plainLanguageSummary: 'Summary' }
    ],
    edges: []
  };
  const v2 = validateGraph(invalidTypeGraph);
  assert.strictEqual(v2.isValid, true);
  assert.strictEqual(v2.sanitizedGraph.constructionType, 'OTHER'); // Normalized to OTHER
});

console.log(`\n================================================================`);
console.log(`RESULTS: ${passed} / ${total} tests passed.`);
console.log(`================================================================`);

if (passed !== total) {
  process.exit(1);
}
