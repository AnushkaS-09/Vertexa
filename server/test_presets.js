const http = require('http');

function postJson(url, data) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const postData = JSON.stringify(data);
    const req = http.request({
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(body) }));
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function verifyAllPresets() {
  console.log('--- Verifying Preset Workflows ---');

  // Preset 1: Residential
  const res1 = await postJson('http://localhost:5000/api/navigate', { query: 'Residential building bungalow permit in Maharashtra UDCPR', city: 'Maharashtra' });
  console.log('[Preset 1 - Residential]:', res1.data?.taskId, 'Nodes:', res1.data?.nodes?.length);

  // Preset 2: Cloud Kitchen
  const res2 = await postJson('http://localhost:5000/api/navigate', { query: 'Commercial cloud kitchen FSSAI health license fire NOC trade permit', city: 'Mumbai' });
  console.log('[Preset 2 - Cloud Kitchen]:', res2.data?.taskId, 'Nodes:', res2.data?.nodes?.length, 'Title:', res2.data?.taskTitle);

  // Preset 3: Gumasta Shop
  const res3 = await postJson('http://localhost:5000/api/navigate', { query: 'Shop and Establishment Act registration Gumasta license labor clearance', city: 'Pune' });
  console.log('[Preset 3 - Gumasta Shop]:', res3.data?.taskId, 'Nodes:', res3.data?.nodes?.length, 'Title:', res3.data?.taskTitle);
}

verifyAllPresets().catch(console.error);
