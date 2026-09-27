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

async function run() {
  console.log('Testing "abc":');
  const res1 = await postJson('http://localhost:5000/api/explain-term', {
    term: 'abc',
    context: 'Maharashtra UDCPR 2020'
  });
  console.log('Result for "abc":', JSON.stringify(res1.data, null, 2));

  console.log('\nTesting "TDR":');
  const res2 = await postJson('http://localhost:5000/api/explain-term', {
    term: 'TDR',
    context: 'Maharashtra UDCPR 2020'
  });
  console.log('Result for "TDR":', JSON.stringify(res2.data, null, 2));
}
run().catch(console.error);

