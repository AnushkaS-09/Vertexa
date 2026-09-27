const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { GoogleGenAI } = require('@google/genai');

dotenv.config({ path: path.join(__dirname, '..', '.env') });
dotenv.config();

const { evaluateEligibility, assembleDeterministicGraph } = require('./rules/eligibilityEngine');
const { validateGraph } = require('./utils/graphValidator');
const { validateGovernmentUrl } = require('./utils/urlValidator');

process.on('uncaughtException', (err) => console.error('[UncaughtException]', err));
process.on('unhandledRejection', (reason) => console.error('[UnhandledRejection]', reason));

const app = express();
const PORT = process.env.PORT || 5000;
const GEMINI_API_KEY = (process.env.GEMINI_API_KEY || '').trim();

app.use(cors());
app.use(express.json());

// Load canonical seed cases as fallback
const seedCasesPath = path.join(__dirname, 'data', 'seed_cases.json');
let seedCases = [];
try {
  const seedData = fs.readFileSync(seedCasesPath, 'utf8');
  seedCases = JSON.parse(seedData);
} catch (err) {
  console.error('[Error] Failed to load seed_cases.json:', err.message);
}

// 1. Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    geminiConfigured: !!(GEMINI_API_KEY && GEMINI_API_KEY !== 'your_gemini_api_key_here'),
    model: 'gemini-3.8-flash',
    domain: 'Residential House Building Permitting in Maharashtra (UDCPR 2020)'
  });
});

// 2. Available Pre-indexed Tasks
app.get('/api/tasks', (req, res) => {
  try {
    const tasksSummary = seedCases.map((c) => ({
      id: c.taskId,
      taskId: c.taskId,
      taskTitle: c.taskTitle,
      title: c.taskTitle,
      jurisdiction: c.jurisdiction,
      totalEstimatedDays: c.totalEstimatedDays,
      estimatedDays: c.totalEstimatedDays,
      totalEstimatedCostINR: c.totalEstimatedCostINR,
      cost: c.totalEstimatedCostINR,
      legalReference: c.legalReference,
      nodesCount: c.nodes ? c.nodes.length : 0
    }));
    res.json(tasksSummary);
  } catch (err) {
    console.error('[Error] GET /api/tasks:', err.message);
    res.status(500).json({ error: 'Failed to retrieve tasks list' });
  }
});

// 3. Deterministic Eligibility / Rules Evaluation Endpoint
app.post('/api/eligibility', (req, res) => {
  try {
    const questionnaire = req.body || {};
    const evaluation = evaluateEligibility(questionnaire);
    res.json(evaluation);
  } catch (err) {
    console.error('[Error] POST /api/eligibility:', err.message);
    res.status(500).json({ error: 'Failed to evaluate eligibility' });
  }
});

// 4. Navigation DAG Generator / Fallback
app.post('/api/navigate', async (req, res) => {
  const { query = '', city = '', questionnaire = null } = req.body;

  // Build input params either from explicit questionnaire or from query/city
  const parsedQuestionnaire = questionnaire || {
    jurisdiction: city || 'Maharashtra',
    plotArea: 150,
    buildingHeight: /high-rise|15m|tall/i.test(query) ? 18.0 : 8.5,
    roadWidth: /narrow|4m|6m/i.test(query) ? 6.0 : 9.0,
    treesAffected: /tree|cutting/i.test(query) ? 2 : 0,
    heritageZone: /heritage|historic|precinct/i.test(query),
    airportZone: /airport|flight|funnel|nocas/i.test(query),
    ecoSensitiveZone: /matheran|eco|hill|forest/i.test(city || query),
    hasHighTensionLine: /high tension|ht wire|power line/i.test(query)
  };

  // Evaluate deterministic eligibility first
  const eligibility = evaluateEligibility(parsedQuestionnaire);

  // Dynamic Residential Civic Generation using Gemini API (if key configured)
  const isKeyValid = GEMINI_API_KEY && GEMINI_API_KEY !== 'your_gemini_api_key_here';
  
  if (isKeyValid) {
    try {
      const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
      const prompt = `You are an expert Town Planner and Municipal Law Specialist for Indian Urban Local Bodies (UDCPR 2020 / MRTP Act 1966).
Deconstruct this Residential House / Building Permission request into a precise Directed Acyclic Graph (DAG) of municipal approvals, PreDCR CAD scrutiny, IOD, site inspections, plinth check, parallel NOCs, and Occupancy Certificate (OC).

Plot Parameters & Eligibility Constraints:
- Jurisdiction: ${parsedQuestionnaire.jurisdiction}
- Proposed Building Height: ${parsedQuestionnaire.buildingHeight}m
- Plot Area: ${parsedQuestionnaire.plotArea} sq.m
- Abutting Road Width: ${parsedQuestionnaire.roadWidth}m
- Mandatory Parallel NOCs according to statutory rules engine: ${eligibility.applicable.map(a => a.name).join(', ')}
- Exempt Clearances: ${eligibility.exempt.map(e => e.name).join(', ')}

Return valid JSON with exact schema:
{
  "taskId": "residential-building-permission-mh-custom",
  "taskTitle": "Full Municipal Permitting Pipeline: Residential Building in ${parsedQuestionnaire.jurisdiction}",
  "jurisdiction": "${parsedQuestionnaire.jurisdiction} Municipal Corporation / Council (UDCPR 2020 / MahaBPAMS)",
  "totalEstimatedDays": 90,
  "totalEstimatedCostINR": 58500,
  "legalReference": "Maharashtra Regional & Town Planning (MRTP) Act 1966 & UDCPR 2020",
  "nodes": [
    {
      "id": "node_id",
      "stage": "Stage 1: Revenue & Land Title | Stage 2: Architectural Scrutiny & PreDCR | Stage 3: Parallel Departmental NOCs | Stage 4: Groundbreaking to Superstructure | Stage 5: Habitation & Utilities",
      "title": "Official step title",
      "department": "Governing authority",
      "type": "prerequisite | submission | inspection | conditional_approval | clearance | permit | final_approval",
      "estimatedDays": 5,
      "cost": 500,
      "statutoryRule": "UDCPR 2020 Section / Rule",
      "forms": ["Form names"],
      "officialUrl": "https://mahadma.maharashtra.gov.in",
      "plainLanguageSummary": "Citizen-friendly description of why this step is mandatory.",
      "isBottleneck": true
    }
  ],
  "edges": [
    { "id": "e_source_target", "source": "source_id", "target": "target_id", "label": "Dependency label" }
  ]
}`;

      // Set explicit timeout on Gemini call
      const aiPromise = ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          systemInstruction: 'You are an authoritative town planning workflow generator specializing strictly in residential house construction and municipal building permits under Maharashtra UDCPR 2020.'
        }
      });
      aiPromise.catch(() => {}); // prevent unhandledRejection if timeout triggers first

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Gemini API call timed out after 10000ms')), 10000)
      );

      const response = await Promise.race([aiPromise, timeoutPromise]);
      const parsed = JSON.parse(response.text);

      // Strict schema validation before sending to frontend
      const validation = validateGraph(parsed);
      if (validation.isValid) {
        return res.status(200).json({
          ...validation.sanitizedGraph,
          provenance: 'live_ai_grounded',
          provenanceLabel: 'Live AI-tailored roadmap (UDCPR 2020)',
          eligibility
        });
      } else {
        console.warn('[Validation Warning] Gemini response failed strict schema validation:', validation.errors);
      }
    } catch (aiErr) {
      console.warn('[Warning] Dynamic Gemini DAG generation unavailable (Quota/Timeout/Error). Serving deterministic UDCPR 2020 blueprint:', aiErr.message);
    }
  }

  // Deterministic Blueprint (Customized according to plot questionnaire & UDCPR 2020 rules)
  const deterministicGraph = assembleDeterministicGraph(parsedQuestionnaire);
  return res.status(200).json({
    ...deterministicGraph,
    provenance: 'deterministic_curated',
    provenanceLabel: 'Curated statutory blueprint (UDCPR 2020)'
  });
});

// 5. Government Link Status Checker (With Strict SSRF Protection)
app.get('/api/link-status', async (req, res) => {
  const targetUrl = req.query.url;

  if (!targetUrl || typeof targetUrl !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid "url" query parameter' });
  }

  // SSRF Validation
  const validation = await validateGovernmentUrl(targetUrl);
  if (!validation.isAllowed) {
    return res.status(403).json({
      error: 'Security Restriction: URL not permitted.',
      reason: validation.reason,
      url: targetUrl
    });
  }

  try {
    const response = await axios.get(validation.normalizedUrl, {
      timeout: 4000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      validateStatus: () => true
    });

    return res.json({
      url: validation.normalizedUrl,
      reachable: response.status >= 200 && response.status < 400,
      status: response.status
    });
  } catch (err) {
    return res.json({
      url: validation.normalizedUrl,
      reachable: false,
      status: err.response ? err.response.status : null,
      error: err.code || err.message
    });
  }
});

// 6. Dynamic Civic Jargon / Acronym Explainer (Gemini AI + Heuristics)
app.post('/api/explain-term', async (req, res) => {
  const { term = '', context = '' } = req.body;
  if (!term || typeof term !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid "term" in request body' });
  }

  const isKeyValid = GEMINI_API_KEY && GEMINI_API_KEY !== 'your_gemini_api_key_here';

  if (isKeyValid) {
    try {
      const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
      const prompt = `Explain the following statutory/municipal administrative term or legal acronym used in Maharashtra residential building permission (UDCPR 2020 / MRTP Act 1966):
Term: "${term}"
Context: "${context || 'Maharashtra Urban Local Body / Town Planning Dept'}"

Return a valid JSON object matching:
{
  "term": "${term}",
  "category": "Land Title | PreDCR / Architectural | Departmental NOC | Construction Phase | Habitation",
  "shortDef": "Concise 3-6 word definition",
  "explanation": "Clear plain-language explanation of what this term means, why it is required by government authorities under UDCPR 2020, and what citizens need to do.",
  "statutoryAct": "Relevant legal Act/Regulation (e.g., UDCPR 2020 Reg 2.2, MRTP Act 1966 Sec 45, Maharashtra Tree Act 1975)"
}`;

      const aiPromise = ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          systemInstruction: 'You are an expert in Maharashtra municipal administrative law, revenue records, and UDCPR 2020 building permissions. Explain statutory terms in clear, plain citizen-friendly English.'
        }
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('AI explanation timed out')), 6000)
      );

      const response = await Promise.race([aiPromise, timeoutPromise]);
      const parsed = JSON.parse(response.text);
      return res.status(200).json(parsed);
    } catch (err) {
      console.warn('[Warning] Dynamic Jargon AI explanation failed:', err.message);
    }
  }

  // Graceful statutory heuristic fallback
  return res.status(200).json({
    term: term,
    category: 'Civic Regulatory Term',
    shortDef: 'Statutory Administrative Requirement',
    explanation: `Official municipal procedure or clearance document required under Maharashtra UDCPR 2020 / MRTP Act 1966.`,
    statutoryAct: 'Maharashtra UDCPR 2020 & MRTP Act 1966'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON payload' });
  }
  console.error('[Unhandled Error]:', err.message);
  return res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`[Municipal Bureaucracy API] Server running on http://localhost:${PORT}`);
});
