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

function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(body) }));
    }).on('error', reject);
  });
}

async function runTests() {
  console.log('--- Testing API Endpoints ---');

  // 1. Health
  const healthRes = await getJson('http://localhost:5000/api/health');
  console.log('[1] GET /api/health =>', healthRes.status, healthRes.data);

  // 2. Tasks
  const tasksRes = await getJson('http://localhost:5000/api/tasks');
  console.log('[2] GET /api/tasks => count:', tasksRes.data.length, 'title:', tasksRes.data[0]?.taskTitle);

  // 3. Navigate (Keyword Match)
  const navRes = await postJson('http://localhost:5000/api/navigate', {
    query: 'Building permission bungalow in Maharashtra',
    city: 'Pune'
  });
  console.log('[3] POST /api/navigate => taskId:', navRes.data?.taskId, 'nodes:', navRes.data?.nodes?.length);

  // 4. Link status
  const linkRes = await getJson('http://localhost:5000/api/link-status?url=https://portal.mcgm.gov.in');
  console.log('[4] GET /api/link-status =>', linkRes.data);

  console.log('--- All API Tests Completed Successfully ---');
}

runTests().catch(console.error);
