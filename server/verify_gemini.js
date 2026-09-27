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

  const modelsToTest = ['gemini-3.8-flash', 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];

  console.log('\n--- Testing Grounded Search with gemini-3.8-flash ---');
  try {
    const startTime = Date.now();
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: 'What is the official MahaBPAMS portal URL for building permission in Maharashtra? Include official gov.in sources.',
      config: {
        tools: [{ googleSearch: {} }]
      }
    });
    const duration = Date.now() - startTime;
    console.log(`[SUCCESS] Search grounding succeeded in ${duration}ms!`);
    console.log('Response excerpt:', response.text?.slice(0, 300));
    console.log('Grounding metadata:', JSON.stringify(response.candidates?.[0]?.groundingMetadata || response.groundingMetadata || {}, null, 2));
  } catch (err) {
    console.log('[FAILED] Search grounding error:', err.message || err);
  }
}

testGeminiModels().catch(console.error);
