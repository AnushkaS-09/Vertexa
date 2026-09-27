const assert = require('assert');
const { assembleDeterministicGraph } = require('./src/rules/eligibilityEngine');

/**
 * Sequential Progress & Unlocking Logic Simulator
 * Mirrors the exact frontend DAG status computation and prerequisite validation in App.jsx & RoadmapCanvas.jsx
 */
function computeNodeStatuses(graph, completedNodesSet) {
  const incomingParents = new Map();
  graph.nodes.forEach((n) => incomingParents.set(n.id, []));
  graph.edges.forEach((e) => {
    if (incomingParents.has(e.target)) {
      incomingParents.get(e.target).push(e.source);
    }
  });

  const statuses = {};
  graph.nodes.forEach((n) => {
    const isDone = completedNodesSet.has(n.id);
    if (isDone) {
      statuses[n.id] = 'completed';
    } else {
      const parents = incomingParents.get(n.id) || [];
      const allParentsDone =
        parents.length === 0 || parents.every((pId) => completedNodesSet.has(pId));
      statuses[n.id] = allParentsDone ? 'available' : 'locked';
    }
  });

  return statuses;
}

/**
 * Simulates handleToggleComplete from App.jsx with strict prerequisite enforcement
 */
function toggleComplete(graph, completedNodesSet, nodeId, explicitStatus) {
  const next = new Set(completedNodesSet);
  const willComplete = explicitStatus ? explicitStatus === 'completed' : !completedNodesSet.has(nodeId);

  if (willComplete) {
    // Validate prerequisites
    const parentEdges = graph.edges.filter((e) => e.target === nodeId);
    const allParentsCompleted = parentEdges.every((e) => completedNodesSet.has(e.source));
    if (!allParentsCompleted) {
      // Blocked: cannot complete step because prerequisites are not met
      return { nextSet: completedNodesSet, success: false };
    }
    next.add(nodeId);
    return { nextSet: next, success: true };
  } else {
    next.delete(nodeId);
    return { nextSet: next, success: true };
  }
}

function runSequentialProgressTests() {
  console.log('===============================================================');
  console.log('VERTEXA — SEQUENTIAL PROGRESS & UNLOCKING REGRESSION TESTS');
  console.log('===============================================================\n');

  const graph = assembleDeterministicGraph({
    jurisdiction: 'Pune',
    plotArea: 200,
    buildingHeight: 8.5,
    roadWidth: 9.0,
    treesAffected: 0,
    heritageZone: false,
    airportZone: false,
    ecoSensitiveZone: false,
    hasHighTensionLine: false
  });

  const step1Id = graph.nodes[0].id; // node_title
  const step2Id = graph.nodes[1].id; // node_mojani
  const step3Id = graph.nodes[2].id; // node_tax_noc

  console.log(`Pipeline Steps under test:
  Step 1: ${step1Id} (${graph.nodes[0].title})
  Step 2: ${step2Id} (${graph.nodes[1].title})
  Step 3: ${step3Id} (${graph.nodes[2].title})\n`);

  // TEST 1 — INITIAL STATE
  console.log('[Test 1] Initial State for New Roadmap...');
  let completedNodes = new Set();
  let statuses = computeNodeStatuses(graph, completedNodes);

  assert.strictEqual(completedNodes.size, 0, 'New roadmap must begin with 0 completed nodes');
  assert.strictEqual(statuses[step1Id], 'available', 'Step 1 must be unlocked / ready');
  assert.strictEqual(statuses[step2Id], 'locked', 'Step 2 must be locked initially');
  assert.strictEqual(statuses[step3Id], 'locked', 'Step 3 must be locked initially');
  console.log('  ✓ Step 1 = READY, Step 2 = LOCKED, Step 3 = LOCKED\n');

  // TEST 2 — COMPLETE STEP 1
  console.log('[Test 2] Complete Step 1...');
  const res1 = toggleComplete(graph, completedNodes, step1Id, 'completed');
  assert.strictEqual(res1.success, true, 'Step 1 completion must succeed');
  completedNodes = res1.nextSet;
  statuses = computeNodeStatuses(graph, completedNodes);

  assert.strictEqual(statuses[step1Id], 'completed', 'Step 1 must be completed (DONE)');
  assert.strictEqual(statuses[step2Id], 'available', 'Step 2 must be unlocked (READY)');
  assert.strictEqual(statuses[step3Id], 'locked', 'Step 3 must remain LOCKED');
  console.log('  ✓ Step 1 = DONE, Step 2 = READY, Step 3 = LOCKED\n');

  // TEST 3 — SELECT STEP 2 WITHOUT COMPLETING IT (CRITICAL REGRESSION TEST)
  console.log('[Test 3] Select / Open Step 2 without completing it...');
  // Selecting a node changes selectedNode in UI, but DOES NOT modify completedNodes
  let selectedNode = graph.nodes[1]; // Step 2 selected
  assert.strictEqual(selectedNode.id, step2Id);
  // Re-verify statuses
  statuses = computeNodeStatuses(graph, completedNodes);
  assert.strictEqual(completedNodes.has(step2Id), false, 'Step 2 must NOT be in completedNodes merely by selecting it');
  assert.strictEqual(statuses[step1Id], 'completed', 'Step 1 remains completed (DONE)');
  assert.strictEqual(statuses[step2Id], 'available', 'Step 2 is selected but NOT completed (READY)');
  assert.strictEqual(statuses[step3Id], 'locked', 'Step 3 MUST STILL BE LOCKED');
  console.log('  ✓ Critical Check Passed: Selecting Step 2 leaves Step 2 READY and Step 3 STILL LOCKED\n');

  // TEST 4 — COMPLETE STEP 2
  console.log('[Test 4] Explicitly Complete Step 2...');
  const res2 = toggleComplete(graph, completedNodes, step2Id, 'completed');
  assert.strictEqual(res2.success, true, 'Step 2 completion must succeed');
  completedNodes = res2.nextSet;
  statuses = computeNodeStatuses(graph, completedNodes);

  assert.strictEqual(statuses[step1Id], 'completed', 'Step 1 is completed (DONE)');
  assert.strictEqual(statuses[step2Id], 'completed', 'Step 2 is completed (DONE)');
  assert.strictEqual(statuses[step3Id], 'available', 'Step 3 is now unlocked (READY)');
  console.log('  ✓ Step 1 = DONE, Step 2 = DONE, Step 3 = READY\n');

  // TEST 5 — CANNOT COMPLETE LOCKED STEP
  console.log('[Test 5] Attempt to complete a locked step ahead of time...');
  // Reset back to only Step 1 completed, attempt to complete Step 3 directly
  const testCompletedNodes = new Set([step1Id]);
  const invalidAttempt = toggleComplete(graph, testCompletedNodes, step3Id, 'completed');
  assert.strictEqual(invalidAttempt.success, false, 'Completing locked Step 3 must fail prerequisite validation');
  assert.strictEqual(testCompletedNodes.has(step3Id), false, 'Step 3 must NOT be added to completedNodes');
  const testStatuses = computeNodeStatuses(graph, testCompletedNodes);
  assert.strictEqual(testStatuses[step3Id], 'locked', 'Step 3 remains locked');
  console.log('  ✓ Strict prerequisite enforcement blocked completion of locked Step 3\n');

  // TEST 6 — INITIAL GREEN STATE & PERSISTENCE ISOLATION
  console.log('[Test 6] New Roadmap Isolation & Persistence...');
  // Simulate new roadmap creation
  const freshCompletedSet = new Set();
  const freshStatuses = computeNodeStatuses(graph, freshCompletedSet);
  const completedCount = Object.values(freshStatuses).filter((s) => s === 'completed').length;
  assert.strictEqual(completedCount, 0, 'Genuinely new roadmap must have 0 completed nodes');

  // Legitimate restored set
  const savedSet = new Set([step1Id, step2Id]);
  const restoredStatuses = computeNodeStatuses(graph, savedSet);
  assert.strictEqual(restoredStatuses[step1Id], 'completed');
  assert.strictEqual(restoredStatuses[step2Id], 'completed');
  assert.strictEqual(restoredStatuses[step3Id], 'available');
  console.log('  ✓ Genuinely new roadmap starts with 0 completed nodes and legitimate persistence restores accurately\n');

  console.log('===============================================================');
  console.log('🎉 ALL 6 SEQUENTIAL PROGRESS REGRESSION TESTS PASSED!');
  console.log('===============================================================\n');
}

runSequentialProgressTests();
