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

  // TEST 7: buildingHeight = 14.99m -> Fire NOC EXEMPT (low-rise threshold)
  console.log('[Test 8] Fire Safety Boundary - buildingHeight = 14.99m -> High-Rise CFO EXEMPT...');
  const lowRiseBoundaryRes = await postJson('http://localhost:5000/api/eligibility', {
    jurisdiction: 'Pune',
    buildingHeight: 14.99
  });
  const fireExempt1499 = lowRiseBoundaryRes.data.exempt.find(n => n.id === 'rule_fire_noc');
  const fireApplies1499 = lowRiseBoundaryRes.data.applicable.find(n => n.id === 'rule_fire_noc');
  assert.strictEqual(fireApplies1499, undefined, 'Height 14.99m must NOT trigger High-Rise CFO NOC');
  assert.ok(fireExempt1499, 'Height 14.99m must be in exempt list for High-Rise CFO clearance');
  assert.strictEqual(fireExempt1499.status, 'EXEMPT');
  assert.ok(fireExempt1499.reason.includes('below the 15.0m high-rise threshold'), 'Reason must explain below 15.0m threshold');
  assert.ok(fireExempt1499.reason.includes('architect'), 'Reason must mention architect self-certification on blueprint');
  console.log('  ✓ buildingHeight = 14.99m correctly classified as EXEMPT from high-rise CFO NOC\n');

  // TEST 8: buildingHeight = 15.00m -> Fire NOC APPLIES (exact high-rise threshold)
  console.log('[Test 9] Fire Safety Boundary - buildingHeight = 15.00m -> CFO NOC APPLIES...');
  const exact15Res = await postJson('http://localhost:5000/api/eligibility', {
    jurisdiction: 'Pune',
    buildingHeight: 15.00
  });
  const fireApplies1500 = exact15Res.data.applicable.find(n => n.id === 'rule_fire_noc');
  const fireExempt1500 = exact15Res.data.exempt.find(n => n.id === 'rule_fire_noc');
  assert.strictEqual(fireExempt1500, undefined, 'Height 15.00m must NOT have low-rise exemption');
  assert.ok(fireApplies1500, 'Height 15.00m must trigger CFO Fire NOC under UDCPR Reg 1.3(93)');
  assert.strictEqual(fireApplies1500.status, 'APPLIES');
  assert.ok(fireApplies1500.reason.includes('meets or exceeds the 15.0m high-rise threshold'), 'Reason must state meets or exceeds 15.0m');
  console.log('  ✓ buildingHeight = 15.00m correctly triggers CFO Fire Safety NOC APPLIES\n');

  // TEST 9: buildingHeight = 15.01m -> Fire NOC APPLIES (> 15.0m)
  console.log('[Test 10] Fire Safety Boundary - buildingHeight = 15.01m -> CFO NOC APPLIES...');
  const above15Res = await postJson('http://localhost:5000/api/eligibility', {
    jurisdiction: 'Pune',
    buildingHeight: 15.01
  });
  const fireApplies1501 = above15Res.data.applicable.find(n => n.id === 'rule_fire_noc');
  const fireExempt1501 = above15Res.data.exempt.find(n => n.id === 'rule_fire_noc');
  assert.strictEqual(fireExempt1501, undefined, 'Height 15.01m must NOT have low-rise exemption');
  assert.ok(fireApplies1501, 'Height 15.01m must trigger CFO Fire NOC');
  assert.strictEqual(fireApplies1501.status, 'APPLIES');
  console.log('  ✓ buildingHeight = 15.01m correctly triggers CFO Fire Safety NOC APPLIES\n');

  // TEST 10: R04 & R06 Canonical Terminology Verification
  console.log('[Test 11] Terminology - R04 & R06 Neutralized Titles...');
  const terminologyRes = await postJson('http://localhost:5000/api/eligibility', {
    jurisdiction: 'Pune'
  });
  const r04 = terminologyRes.data.applicable.find(n => n.id === 'base_autodcr_scrutiny');
  const r06 = terminologyRes.data.applicable.find(n => n.id === 'base_iod_sanction');
  assert.ok(r04, 'R04 must be present in baseline applicable list');
  assert.strictEqual(r04.name, 'Architect CAD Plan Submission & Automated Scrutiny (MahaBPAMS / MCGM AutoDCR)');
  assert.ok(r06, 'R06 must be present in baseline applicable list');
  assert.strictEqual(r06.name, 'Development Sanction / Conditional Sanction (Intimation of Disapproval - IOD in Mumbai)');
  console.log('  ✓ R04 and R06 titles match exact Phase 7B specifications\n');

  // TEST 11: treesAffected > 0 -> Tree Authority APPLIES
  console.log('[Test 12] Tree Authority - treesAffected > 0 -> APPLIES...');
  const treeAppliesRes = await postJson('http://localhost:5000/api/eligibility', {
    jurisdiction: 'Mumbai',
    treesAffected: 3
  });
  const treeApplies = treeAppliesRes.data.applicable.find(n => n.id === 'rule_tree_noc');
  assert.ok(treeApplies, 'treesAffected > 0 must trigger Tree Authority NOC');
  assert.strictEqual(treeApplies.status, 'APPLIES');
  console.log('  ✓ treesAffected > 0 triggers Tree Authority Clearance\n');

  // TEST 12: treesAffected === 0 -> Not triggered by reported facts
  console.log('[Test 13] Tree Authority - treesAffected === 0 -> EXEMPT with non-inspection wording...');
  const treeZeroRes = await postJson('http://localhost:5000/api/eligibility', {
    jurisdiction: 'Pune',
    treesAffected: 0
  });
  const treeExempt = treeZeroRes.data.exempt.find(n => n.id === 'rule_tree_noc');
  assert.ok(treeExempt, 'treesAffected === 0 must be in exempt list');
  assert.ok(treeExempt.reason.includes('reported questionnaire facts'), 'Must not claim site was physically inspected');
  console.log('  ✓ treesAffected === 0 uses accurate non-inspection questionnaire wording\n');

  // TEST 13: hasHighTensionLine = true -> VERIFY
  console.log('[Test 14] HT Power Line - hasHighTensionLine === true -> VERIFICATION_REQUIRED...');
  const htRes = await postJson('http://localhost:5000/api/eligibility', {
    jurisdiction: 'Pune',
    hasHighTensionLine: true
  });
  const htVerify = htRes.data.uncertain.find(n => n.id === 'rule_ht_setback');
  assert.ok(htVerify, 'hasHighTensionLine must be in uncertain/verification_required list');
  assert.strictEqual(htVerify.status, 'VERIFICATION_REQUIRED');
  console.log('  ✓ hasHighTensionLine === true correctly classified as VERIFICATION_REQUIRED\n');

  // TEST 14: roadWidth < 6 -> VERIFY
  console.log('[Test 15] Road Width - roadWidth < 6.0m -> VERIFICATION_REQUIRED...');
  const roadRes = await postJson('http://localhost:5000/api/eligibility', {
    jurisdiction: 'Pune',
    roadWidth: 4.5
  });
  const roadVerify = roadRes.data.uncertain.find(n => n.id === 'rule_road_width_access');
  assert.ok(roadVerify, 'roadWidth < 6.0m must be in uncertain/verification_required list');
  assert.strictEqual(roadVerify.status, 'VERIFICATION_REQUIRED');
  console.log('  ✓ roadWidth < 6.0m correctly classified as VERIFICATION_REQUIRED\n');

  // Security SSRF Check
  console.log('[Test 16] Security - SSRF Protection...');
  const ssrfRes = await getJson('http://localhost:5000/api/link-status?url=http://localhost:5000/api/health');
  assert.strictEqual(ssrfRes.status, 403, 'SSRF must return 403 Forbidden');
  console.log('  ✓ SSRF rejection on localhost confirmed\n');

  // TEST 17: Custom Request Navigation Pipeline
  console.log('[Test 17] Custom Request - "I want to construct a residential G+2 house in Pune"...');
  const customNavRes = await postJson('http://localhost:5000/api/navigate', {
    query: 'I want to construct a residential G+2 house in Pune',
    city: 'Pune',
    questionnaire: {
      jurisdiction: 'Pune',
      plotArea: 200,
      buildingHeight: 8.5,
      roadWidth: 9.0,
      treesAffected: 0,
      heritageZone: false,
      airportZone: false,
      ecoSensitiveZone: false,
      hasHighTensionLine: false
    }
  });
  assert.strictEqual(customNavRes.status, 200, 'Custom request must return 200 status');
  assert.ok(customNavRes.data.nodes && customNavRes.data.nodes.length >= 10, 'Must return full permitting pipeline');
  assert.ok(customNavRes.data.edges && customNavRes.data.edges.length >= 10, 'Must return valid DAG edges');
  assert.strictEqual(customNavRes.data.nodes.some(n => n.id.includes('autodcr') || n.id.includes('scrutiny') || (n.title && /autodcr|cad|scrutiny/i.test(n.title))), true, 'Must include CAD Scrutiny step');
  assert.strictEqual(customNavRes.data.nodes.some(n => n.id.includes('iod') || n.id.includes('sanction') || (n.title && /iod|sanction/i.test(n.title))), true, 'Must include IOD / Sanction step');

  console.log('  ✓ Custom residential building request successfully generates valid roadmap DAG\n');

  // TEST 18: Water Connection Scope Evaluation
  console.log('[Test 18] Water Connection Scope - "I want to get a water connection"...');
  const waterNavRes = await postJson('http://localhost:5000/api/navigate', {
    query: 'I want to get a water connection',
    city: 'Maharashtra'
  });
  assert.strictEqual(waterNavRes.status, 200, 'Water connection query returns 200 without error');
  const hydraulicNode = waterNavRes.data.nodes?.find(n => n.id === 'node_hydraulic_noc');
  assert.ok(hydraulicNode, 'Must contain hydraulic and drainage clearance node within residential pipeline');
  assert.ok(hydraulicNode.statutoryRule.includes('Reg 2.2.11') || hydraulicNode.statutoryRule.includes('Reg 9.22'), 'Must cite verified hydraulic clearance regulations');
  console.log('  ✓ Water connection query safely served within statutory residential permitting scope\n');

  console.log('===========================================================');
  console.log('🎉 ALL 18 PHASE 8 END-TO-END ACCEPTANCE TESTS PASSED!');
  console.log('===========================================================\n');
}

runTests().catch(err => {
  console.error('\n❌ Test Failure:', err);
  process.exit(1);
});
