const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { GoogleGenAI } = require('@google/genai');
dotenv.config({ path: path.join(__dirname, '..', '.env') });
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

app.use(cors());
app.use(express.json());

// Load seed cases
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
    timestamp: new Date().toISOString()
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

// 3. Navigation DAG Generator / Fallback
app.post('/api/navigate', async (req, res) => {
  const { query = '', city = '' } = req.body;

  // Dynamic Residential Civic Generation using Gemini API (if key configured)
  if (GEMINI_API_KEY && GEMINI_API_KEY.startsWith('AIzaSy')) {
    try {
      const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
      const prompt = `You are an expert Town Planner and Municipal Law Specialist for Indian Urban Local Bodies (UDCPR 2020 / MRTP Act).
Deconstruct this Residential House / Building Permission request into a precise Directed Acyclic Graph (DAG) of municipal approvals, PreDCR CAD scrutiny, IOD, site inspections, plinth check, and Occupancy Certificate (OC).
City/Jurisdiction: ${city || 'Maharashtra (UDCPR 2020)'}
Residential Query: "${query || 'Residential House Building Permission (G+2 / Bungalow)'}"

Return valid JSON with exact schema:
{
  "taskId": "residential-building-permission-mh-full",
  "taskTitle": "Full Municipal Permitting Pipeline: Residential Building",
  "jurisdiction": "Urban Local Bodies across Maharashtra (UDCPR 2020 / MahaBPAMS / RTS Act)",
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
      "isBottleneck": true/false
    }
  ],
  "edges": [
    { "id": "e_source_target", "source": "source_id", "target": "target_id", "label": "Dependency label" }
  ]
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          systemInstruction: 'You are an authoritative town planning workflow generator specializing strictly in residential house construction and municipal building permits under UDCPR 2020.'
        }
      });

      const parsed = JSON.parse(response.text);
      if (parsed && parsed.nodes && parsed.nodes.length > 0) {
        return res.status(200).json(parsed);
      }
    } catch (aiErr) {
      console.warn('[Warning] Dynamic Gemini DAG generation failed. Serving statutory Residential House blueprint.', aiErr.message);
    }
  }

  // Statutory Default: Return the comprehensive 11-node Residential House Building Permission graph
  const defaultResidentialGraph = seedCases[0] || {};
  
  // Contextually customize the title/jurisdiction if a city or query was specified
  if (city || query) {
    const cityName = city || 'Maharashtra';
    const cleanQ = query ? query.trim() : 'Residential House (G+2 / Bungalow)';
    return res.status(200).json({
      ...defaultResidentialGraph,
      taskTitle: `Full Municipal Permitting Pipeline: ${cleanQ}`,
      jurisdiction: `${cityName} Municipal Corporation & Urban Development Dept (UDCPR 2020 / MahaBPAMS)`
    });
  }

  return res.status(200).json(defaultResidentialGraph);
});

// 4. Government Link Status Checker
app.get('/api/link-status', async (req, res) => {
  const targetUrl = req.query.url;

  if (!targetUrl || typeof targetUrl !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid "url" query parameter' });
  }

  try {
    const parsed = new URL(targetUrl);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return res.status(400).json({ error: 'Invalid URL protocol' });
    }

    const response = await axios.get(targetUrl, {
      timeout: 3000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      validateStatus: () => true
    });

    return res.json({
      url: targetUrl,
      reachable: response.status >= 200 && response.status < 400,
      status: response.status
    });
  } catch (err) {
    return res.json({
      url: targetUrl,
      reachable: false,
      status: err.response ? err.response.status : null,
      error: err.code || err.message
    });
  }
});

// 5. Dynamic Civic Jargon / Acronym Explainer (Gemini AI + Heuristics)
app.post('/api/explain-term', async (req, res) => {
  const { term = '', context = '' } = req.body;
  if (!term || typeof term !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid "term" in request body' });
  }

  if (GEMINI_API_KEY) {
    try {
      const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
      const prompt = `Explain the following statutory/municipal administrative term or legal acronym used in Indian civic governance or municipal permitting:
Term: "${term}"
Context: "${context || 'Indian Municipal Corporation / Urban Local Body'}"

Return a valid JSON object matching:
{
  "term": "${term}",
  "category": "Category name (e.g., Land Title, Environmental Clearance, Food Licensing, Tax)",
  "shortDef": "Concise 3-6 word definition",
  "explanation": "Clear plain-language explanation of what this term means, why it is required by government authorities, and what citizens need to do.",
  "statutoryAct": "Relevant legal Act/Regulation if applicable (e.g., UDCPR 2020, FSSAI Act 2006, Shops & Establishment Act)"
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          systemInstruction: 'You are an expert in Indian municipal administrative law, revenue records, and civic clearances. Explain statutory terms in clear, plain citizen-friendly English.'
        }
      });

      const parsed = JSON.parse(response.text);
      return res.status(200).json(parsed);
    } catch (err) {
      console.warn('[Warning] Dynamic Jargon AI explanation failed:', err.message);
    }
  }

  // Graceful heuristic fallback
  return res.status(200).json({
    term: term,
    category: 'Civic Regulatory Term',
    shortDef: 'Statutory Administrative Requirement',
    explanation: `Official municipal procedure or clearance document required by local governing authorities under applicable state and municipal regulations.`,
    statutoryAct: 'Municipal Corporation & State Bylaws'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON payload' });
  }
  console.error('[Unhandled Error]:', err);
  return res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`[Municipal Bureaucracy API] Server running on http://localhost:${PORT}`);
});

