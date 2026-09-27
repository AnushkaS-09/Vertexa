/**
 * Vertexa Graph Schema & DAG Validator
 * Validates graph data from AI or external inputs before handing to frontend/React Flow.
 */

const VALID_NODE_TYPES = new Set([
  'prerequisite',
  'submission',
  'inspection',
  'conditional_approval',
  'clearance',
  'permit',
  'final_approval'
]);

const VALID_CONSTRUCTION_TYPES = new Set([
  'RESIDENTIAL',
  'COMMERCIAL',
  'INSTITUTIONAL',
  'HOSPITALITY',
  'MIXED_USE',
  'INDUSTRIAL',
  'OTHER'
]);

function validateGraph(graph) {
  const errors = [];

  if (!graph || typeof graph !== 'object') {
    return { isValid: false, errors: ['Graph payload must be a non-null object.'] };
  }

  if (graph.constructionType && !VALID_CONSTRUCTION_TYPES.has(graph.constructionType)) {
    // If not in canonical list, default to OTHER or warn
    graph.constructionType = 'OTHER';
  }

  if (!graph.taskTitle || typeof graph.taskTitle !== 'string') {
    errors.push('Missing or invalid "taskTitle" string.');
  }

  if (!Array.isArray(graph.nodes) || graph.nodes.length === 0) {
    errors.push('"nodes" must be a non-empty array.');
    return { isValid: false, errors };
  }

  const nodeIds = new Set();

  graph.nodes.forEach((node, idx) => {
    if (!node || typeof node !== 'object') {
      errors.push(`Node at index ${idx} is not an object.`);
      return;
    }

    if (!node.id || typeof node.id !== 'string') {
      errors.push(`Node at index ${idx} has invalid or missing "id".`);
    } else {
      if (nodeIds.has(node.id)) {
        errors.push(`Duplicate node id "${node.id}" detected at index ${idx}.`);
      }
      nodeIds.add(node.id);
    }

    if (!node.title || typeof node.title !== 'string') {
      errors.push(`Node "${node.id || idx}" has invalid or missing "title".`);
    }

    if (!node.stage || typeof node.stage !== 'string') {
      errors.push(`Node "${node.id || idx}" has invalid or missing "stage".`);
    }

    if (node.type && !VALID_NODE_TYPES.has(node.type)) {
      // Normalize or warn
      node.type = 'submission';
    }

    if (typeof node.estimatedDays !== 'number' || isNaN(node.estimatedDays) || node.estimatedDays < 0) {
      node.estimatedDays = 5;
    }

    if (typeof node.cost !== 'number' || isNaN(node.cost) || node.cost < 0) {
      node.cost = 0;
    }

    if (!Array.isArray(node.forms)) {
      node.forms = typeof node.forms === 'string' ? [node.forms] : [];
    }

    if (!node.plainLanguageSummary || typeof node.plainLanguageSummary !== 'string') {
      node.plainLanguageSummary = 'Official statutory clearance step required by local planning authority.';
    }
  });

  // Validate edges
  if (!Array.isArray(graph.edges)) {
    graph.edges = [];
  } else {
    const validEdges = [];
    graph.edges.forEach((edge, idx) => {
      if (!edge || typeof edge !== 'object') return;
      if (!edge.source || !nodeIds.has(edge.source)) {
        errors.push(`Edge at index ${idx} has invalid source node "${edge.source}".`);
        return;
      }
      if (!edge.target || !nodeIds.has(edge.target)) {
        errors.push(`Edge at index ${idx} has invalid target node "${edge.target}".`);
        return;
      }
      if (edge.source === edge.target) {
        errors.push(`Self-referential loop detected in edge "${edge.id || idx}".`);
        return;
      }
      validEdges.push({
        id: edge.id || `e_${edge.source}_${edge.target}`,
        source: edge.source,
        target: edge.target,
        label: edge.label || 'Prerequisite clearance'
      });
    });
    graph.edges = validEdges;
  }

  // Calculate totals if missing
  if (!graph.totalEstimatedDays || typeof graph.totalEstimatedDays !== 'number') {
    graph.totalEstimatedDays = graph.nodes.reduce((sum, n) => sum + (n.estimatedDays || 0), 0);
  }
  if (!graph.totalEstimatedCostINR || typeof graph.totalEstimatedCostINR !== 'number') {
    graph.totalEstimatedCostINR = graph.nodes.reduce((sum, n) => sum + (n.cost || 0), 0);
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedGraph: graph
  };
}

module.exports = {
  validateGraph,
  VALID_NODE_TYPES
};
