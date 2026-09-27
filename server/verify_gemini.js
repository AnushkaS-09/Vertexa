const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '.env') });
const { GoogleGenAI } = require('@google/genai');

async function testGeminiModels() {
  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
  console.log('Testing Gemini API key presence:', !!apiKey, 'Length:', apiKey.length, 'Prefix:', apiKey.slice(0, 6));

  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    console.log('No valid GEMINI_API_KEY found (placeholder present).');
    return;
  }

  const ai = new GoogleGenAI({ apiKey });

  console.log('\n--- Querying Available Models from Google GenAI ---');
  try {
    const list = await ai.models.list();
    const available = [];
    for await (const m of list) {
      available.push({ name: m.name, displayName: m.displayName });
      console.log(`- ${m.name} (${m.displayName || 'No display name'})`);
    }
  } catch (err) {
    console.log('Failed to list models:', err.message || err);
  }

  const modelsToTest = [
    'gemini-3.8-flash',
    'gemini-3.7-flash',
    'gemini-3.6-flash',
    'gemini-3.5-flash',
    'gemini-3.5-flash-lite',
    'gemini-flash-latest',
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash'
  ];

  console.log('\n--- Benchmarking Gemini Models ---');
  const results = [];

  for (const model of modelsToTest) {
    console.log(`\nTesting model: ${model}...`);
    const startTime = Date.now();
    try {
      const response = await ai.models.generateContent({
        model: model,
        contents: 'Return a one-sentence confirmation that you are working.'
      });
      const duration = Date.now() - startTime;
      const text = response.text ? response.text.trim() : '';
      console.log(`[SUCCESS] ${model} responded in ${duration}ms: "${text.slice(0, 100)}"`);
      results.push({ model, success: true, duration, response: text });
    } catch (err) {
      const duration = Date.now() - startTime;
      console.log(`[FAILED] ${model} failed after ${duration}ms: ${err.message || err}`);
      results.push({ model, success: false, duration, error: err.message || String(err) });
    }
  }

  console.log('\n=== Summary of Model Verification ===');
  console.table(results.map(r => ({
    Model: r.model,
    Status: r.success ? 'SUCCESS' : 'FAILED',
    'Latency (ms)': r.duration,
    Note: r.success ? (r.response ? r.response.slice(0, 40) + '...' : 'OK') : (r.error ? r.error.slice(0, 40) + '...' : 'Error')
  })));

  // Test selected model with structured JSON generation
  console.log('\n--- Deep Verification of Selected Model: gemini-3.6-flash ---');
  try {
    const startTime = Date.now();
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: 'Explain what MahaBPAMS is in Maharashtra town planning in 1 sentence. Return valid JSON: {"topic": "MahaBPAMS", "summary": "..."}',
      config: {
        responseMimeType: 'application/json'
      }
    });
    const duration = Date.now() - startTime;
    console.log(`[SUCCESS] Structured JSON generation succeeded in ${duration}ms!`);
    console.log('Response JSON:', response.text.trim());
  } catch (err) {
    console.log('[FAILED] Deep verification error:', err.message || err);
  }
}

testGeminiModels().catch(console.error);



