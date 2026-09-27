const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { GoogleGenAI } = require('@google/genai');

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
  const lowerQuery = (query + ' ' + city).toLowerCase();

  const keywords = ['house', 'building', 'residential', 'construction', 'bungalow', 'udcpr'];
  const matchesKeyword = keywords.some((kw) => lowerQuery.includes(kw));

  // If query explicitly matches residential construction / UDCPR keywords or if default is requested
  if (matchesKeyword || !query.trim()) {
    const defaultGraph = seedCases[0] || null;
    return res.status(200).json(defaultGraph);
  }

  // Dynamic Civic Generation using Gemini API
  if (GEMINI_API_KEY) {
    try {
      const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
      const prompt = `You are a Municipal Law & Civic Bureaucracy Expert in India. Deconstruct the following citizen civic request into a comprehensive directed acyclic graph (DAG) representing statutory administrative steps, clearances, inspections, legal references, forms, and bottlenecks.
City/Jurisdiction: ${city || 'Urban Local Body (India)'}
Citizen Query: "${query}"

Return a valid JSON object matching this exact schema:
{
  "taskId": "slug-id",
  "taskTitle": "Clear, official title of the municipal permitting/clearance process",
  "jurisdiction": "Applicable municipality/department and state acts",
  "totalEstimatedDays": 45,
  "totalEstimatedCostINR": 15000,
  "legalReference": "Relevant statutory Acts, municipal bylaws, or regulations",
  "nodes": [
    {
      "id": "node_unique_id",
      "stage": "Stage name (e.g., Stage 1: Document Verification)",
      "title": "Official step title",
      "department": "Governing department name",
      "type": "prerequisite | submission | inspection | conditional_approval | clearance | permit | final_approval",
      "estimatedDays": 5,
      "cost": 500,
      "statutoryRule": "Specific section/regulation",
      "forms": ["Form name/number"],
      "officialUrl": "https://official-portal-url.gov.in",
      "plainLanguageSummary": "Citizen-friendly explanation of why this step is required and what happens.",
      "isBottleneck": true/false
    }
  ],
  "edges": [
    {
      "id": "e_source_target",
      "source": "source_node_id",
      "target": "target_node_id",
      "label": "Prerequisite relation or conditional requirement"
    }
  ]
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          systemInstruction: 'You are an authoritative civic administrative workflow graph generator. Always return valid structured JSON describing official legal procedures in India with realistic statutory stages, realistic fees in INR, statutory rules, and bottleneck flags.'
        }
      });

      const rawText = response.text;
      const parsed = JSON.parse(rawText);
      return res.status(200).json(parsed);
    } catch (aiErr) {
      console.warn('[Warning] Dynamic Gemini DAG generation failed or timed out. Falling back to statutory seed case graph.', aiErr.message);
    }
  } else {
    console.warn('[Warning] GEMINI_API_KEY is not set. Falling back to default statutory seed case.');
  }

  // Graceful fallback: return statutory seed case graph
  const defaultGraph = seedCases[0] || {};
  return res.status(200).json(defaultGraph);
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

