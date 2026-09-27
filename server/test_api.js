const http = require('http');
const assert = require('assert');

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
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, data: body });
        }
      });
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
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, data: body });
        }
      });
    }).on('error', reject);
  });
}

async function runTests() {
  console.log('=== STARTING VERTEXA PHASE 4 TARGETED REGULATORY TESTS ===\n');

  // 1. Health Check
  console.log('[Test 1] Health Check...');
  const healthRes = await getJson('http://localhost:5000/api/health');
  assert.strictEqual(healthRes.status, 200, 'Health status must be 200');
  assert.strictEqual(healthRes.data.status, 'ok', 'Status must be ok');
  console.log('  ✓ /api/health is operational\n');

  // TEST 1: airportZone = true -> AAI APPLIES
  console.log('[Test 2] AAI NOCAS - airportZone === true -> APPLIES...');
  const aaiAppliesRes = await postJson('http://localhost:5000/api/eligibility', {
    jurisdiction: 'Mumbai',
    airportZone: true
  });
  const aaiApplies = aaiAppliesRes.data.applicable.find(n => n.id === 'rule_airport_noc');
  assert.ok(aaiApplies, 'AAI clearance must be in applicable list when airportZone is true');
  assert.strictEqual(aaiApplies.status, 'APPLIES');
  console.log('  ✓ airportZone === true correctly triggers AAI NOCAS APPLIES\n');

  // TEST 2: airportZone = false -> AAI REQUIRES VERIFICATION (Not EXEMPT)
  console.log('[Test 3] AAI NOCAS - airportZone === false -> REQUIRES VERIFICATION (Not EXEMPT)...');
  const aaiUncertainRes = await postJson('http://localhost:5000/api/eligibility', {
    jurisdiction: 'Pune',
    airportZone: false
  });
  const aaiExempt = aaiUncertainRes.data.exempt.find(n => n.id === 'rule_airport_noc');
  const aaiVerify = aaiUncertainRes.data.uncertain.find(n => n.id === 'rule_airport_noc');
  assert.strictEqual(aaiExempt, undefined, 'AAI must NOT be claimed as EXEMPT when coordinates/CCZM are absent');
  assert.ok(aaiVerify, 'AAI must be in uncertain/verification_required list');
  assert.strictEqual(aaiVerify.status, 'VERIFICATION_REQUIRED');
  console.log('  ✓ airportZone === false correctly marked as VERIFICATION_REQUIRED\n');

  // TEST 3: heritageZone = true -> Heritage pathway APPLIES / REVIEW
  console.log('[Test 4] Heritage - heritageZone === true -> APPLIES / REVIEW...');
  const heritageAppliesRes = await postJson('http://localhost:5000/api/eligibility', {
    jurisdiction: 'Pune',
    heritageZone: true
  });
  const heritageApplies = heritageAppliesRes.data.applicable.find(n => n.id === 'rule_heritage_noc');
  assert.ok(heritageApplies, 'Heritage pathway must apply when heritageZone is true');
  assert.strictEqual(heritageApplies.status, 'APPLIES');
  console.log('  ✓ heritageZone === true triggers Heritage Committee Review APPLIES\n');

  // TEST 4: heritageZone = false -> does not falsely claim conclusive exemption (REQUIRES VERIFICATION)
  console.log('[Test 5] Heritage - heritageZone === false -> VERIFICATION_REQUIRED...');
  const heritageUncertainRes = await postJson('http://localhost:5000/api/eligibility', {
    jurisdiction: 'Pune',
    heritageZone: false
  });
  const heritageExempt = heritageUncertainRes.data.exempt.find(n => n.id === 'rule_heritage_noc');
  const heritageVerify = heritageUncertainRes.data.uncertain.find(n => n.id === 'rule_heritage_noc');
  assert.strictEqual(heritageExempt, undefined, 'Heritage must NOT be claimed as conclusive EXEMPT');
  assert.ok(heritageVerify, 'Heritage must be in uncertain list for site monument check');
  assert.strictEqual(heritageVerify.status, 'VERIFICATION_REQUIRED');
  console.log('  ✓ heritageZone === false correctly classified as VERIFICATION_REQUIRED\n');

  // TEST 5: ecoSensitiveZone = true -> ESZ APPLIES
  console.log('[Test 6] ESZ - ecoSensitiveZone === true -> APPLIES...');
  const eszAppliesRes = await postJson('http://localhost:5000/api/eligibility', {
    jurisdiction: 'Maharashtra',
    ecoSensitiveZone: true
  });
  const eszApplies = eszAppliesRes.data.applicable.find(n => n.id === 'rule_eco_noc');
  assert.ok(eszApplies, 'ESZ clearance must apply when ecoSensitiveZone is true');
  assert.strictEqual(eszApplies.status, 'APPLIES');
  console.log('  ✓ ecoSensitiveZone === true triggers ESZ Committee Clearance\n');

  // TEST 6: Matheran jurisdiction -> ESZ pathway APPLIES
  console.log('[Test 7] ESZ - Matheran jurisdiction -> APPLIES...');
  const matheranRes = await postJson('http://localhost:5000/api/eligibility', {
    jurisdiction: 'Matheran',
    ecoSensitiveZone: false
  });
  const matheranEsz = matheranRes.data.applicable.find(n => n.id === 'rule_eco_noc');
  assert.ok(matheranEsz, 'Matheran jurisdiction must automatically trigger ESZ pathway');
  assert.strictEqual(matheranEsz.status, 'APPLIES');
  console.log('  ✓ Matheran jurisdiction correctly triggers ESZ Clearance\n');

  // TEST 7: buildingHeight > 15 -> Fire NOC APPLIES
  console.log('[Test 8] Fire Safety - buildingHeight > 15m -> CFO NOC APPLIES...');
  const highRiseRes = await postJson('http://localhost:5000/api/eligibility', {
    jurisdiction: 'Pune',
    buildingHeight: 18.0
  });
  const fireApplies = highRiseRes.data.applicable.find(n => n.id === 'rule_fire_noc');
  assert.ok(fireApplies, 'Height > 15m must trigger CFO Fire NOC');
  assert.strictEqual(fireApplies.status, 'APPLIES');
  console.log('  ✓ buildingHeight > 15m triggers CFO Fire Safety NOC\n');

  // TEST 8: buildingHeight <= 15 -> High-Rise CFO NOC EXEMPT while fire-compliance wording remains
  console.log('[Test 9] Fire Safety - buildingHeight <= 15m -> High-Rise CFO EXEMPT with wording...');
  const lowRiseRes = await postJson('http://localhost:5000/api/eligibility', {
    jurisdiction: 'Pune',
    buildingHeight: 8.5
  });
  const fireExempt = lowRiseRes.data.exempt.find(n => n.id === 'rule_fire_noc');
  assert.ok(fireExempt, 'Height <= 15m must be in exempt list for High-Rise CFO clearance');
  assert.strictEqual(fireExempt.status, 'EXEMPT');
  assert.ok(fireExempt.reason.includes('low-rise threshold'), 'Reason must explain low-rise threshold');
  assert.ok(fireExempt.reason.includes('architect'), 'Reason must mention architect self-certification on blueprint');
  console.log('  ✓ buildingHeight <= 15m correctly handles high-rise CFO exemption with fire wording\n');

  // TEST 9: treesAffected > 0 -> Tree Authority APPLIES
  console.log('[Test 10] Tree Authority - treesAffected > 0 -> APPLIES...');
  const treeAppliesRes = await postJson('http://localhost:5000/api/eligibility', {
    jurisdiction: 'Mumbai',
    treesAffected: 3
  });
  const treeApplies = treeAppliesRes.data.applicable.find(n => n.id === 'rule_tree_noc');
  assert.ok(treeApplies, 'treesAffected > 0 must trigger Tree Authority NOC');
  assert.strictEqual(treeApplies.status, 'APPLIES');
  console.log('  ✓ treesAffected > 0 triggers Tree Authority Clearance\n');

  // TEST 10: treesAffected === 0 -> Not triggered by reported facts
  console.log('[Test 11] Tree Authority - treesAffected === 0 -> EXEMPT with non-inspection wording...');
  const treeZeroRes = await postJson('http://localhost:5000/api/eligibility', {
    jurisdiction: 'Pune',
    treesAffected: 0
  });
  const treeExempt = treeZeroRes.data.exempt.find(n => n.id === 'rule_tree_noc');
  assert.ok(treeExempt, 'treesAffected === 0 must be in exempt list');
  assert.ok(treeExempt.reason.includes('reported questionnaire facts'), 'Must not claim site was physically inspected');
  console.log('  ✓ treesAffected === 0 uses accurate non-inspection questionnaire wording\n');

  // TEST 11: hasHighTensionLine = true -> VERIFY
  console.log('[Test 12] HT Power Line - hasHighTensionLine === true -> VERIFICATION_REQUIRED...');
  const htRes = await postJson('http://localhost:5000/api/eligibility', {
    jurisdiction: 'Pune',
    hasHighTensionLine: true
  });
  const htVerify = htRes.data.uncertain.find(n => n.id === 'rule_ht_setback');
  assert.ok(htVerify, 'hasHighTensionLine must be in uncertain/verification_required list');
  assert.strictEqual(htVerify.status, 'VERIFICATION_REQUIRED');
  console.log('  ✓ hasHighTensionLine === true correctly classified as VERIFICATION_REQUIRED\n');

  // TEST 12: roadWidth < 6 -> VERIFY
  console.log('[Test 13] Road Width - roadWidth < 6.0m -> VERIFICATION_REQUIRED...');
  const roadRes = await postJson('http://localhost:5000/api/eligibility', {
    jurisdiction: 'Pune',
    roadWidth: 4.5
  });
  const roadVerify = roadRes.data.uncertain.find(n => n.id === 'rule_road_width_access');
  assert.ok(roadVerify, 'roadWidth < 6.0m must be in uncertain/verification_required list');
  assert.strictEqual(roadVerify.status, 'VERIFICATION_REQUIRED');
  console.log('  ✓ roadWidth < 6.0m correctly classified as VERIFICATION_REQUIRED\n');

  // Security SSRF Check
  console.log('[Test 14] Security - SSRF Protection...');
  const ssrfRes = await getJson('http://localhost:5000/api/link-status?url=http://localhost:5000/api/health');
  assert.strictEqual(ssrfRes.status, 403, 'SSRF must return 403 Forbidden');
  console.log('  ✓ SSRF rejection on localhost confirmed\n');

  console.log('===========================================================');
  console.log('🎉 ALL 14 PHASE 4 REGULATORY SAFETY & SECURITY TESTS PASSED!');
  console.log('===========================================================\n');
}

runTests().catch(err => {
  console.error('\n❌ Test Failure:', err);
  process.exit(1);
});
