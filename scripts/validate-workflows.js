const fs = require('fs');

const files = [
  'workflow.daily-paper-digest.json',
  'workflow.daily-paper-summary.json',
  'workflow.research-briefing.json',
];

const requiredTopKeys = ['name', 'nodes', 'connections', 'active', 'settings'];
let failed = false;

function assert(cond, msg) {
  if (!cond) {
    console.error('❌', msg);
    failed = true;
  } else {
    console.log('✅', msg);
  }
}

for (const file of files) {
  console.log(`\n--- Validating ${file} ---`);
  let wf;
  try {
    wf = JSON.parse(fs.readFileSync(file, 'utf8'));
    console.log('✅ valid JSON parse');
  } catch (e) {
    console.error('❌ invalid JSON:', e.message);
    failed = true;
    continue;
  }

  for (const k of requiredTopKeys) {
    assert(Object.prototype.hasOwnProperty.call(wf, k), `${file}: has top-level key '${k}'`);
  }

  assert(Array.isArray(wf.nodes) && wf.nodes.length > 0, `${file}: has nodes`);

  const nodeNames = new Set(wf.nodes.map(n => n.name));
  assert(nodeNames.size === wf.nodes.length, `${file}: node names are unique`);

  const manualTriggerNodes = wf.nodes.filter(n => n.type === 'n8n-nodes-base.manualTrigger');
  assert(manualTriggerNodes.length >= 1, `${file}: contains at least one manual trigger`);

  const webhookNodes = wf.nodes.filter(n => n.type === 'n8n-nodes-base.webhook');
  assert(webhookNodes.length === 0, `${file}: does not include webhook trigger`);

  // Check Bearer auth (on HTTP nodes or via env reference in code)
  const hasAuthHeader = wf.nodes.some(n => {
    if (n.type !== 'n8n-nodes-base.httpRequest') return false;
    const ps = n.parameters?.headerParameters?.parameters || [];
    return ps.some(p => p.name === 'Authorization' && String(p.value || '').includes('Bearer'));
  });
  // Digest (step 1) has no Upstage API call, so skip auth check for it
  const hasUpstageCall = wf.nodes.some(n => {
    if (n.type !== 'n8n-nodes-base.httpRequest') return false;
    return (n.parameters?.url || '').includes('upstage.ai');
  });
  if (hasUpstageCall) {
    assert(hasAuthHeader, `${file}: has Bearer auth on at least one HTTP node`);
    const hasFallback = wf.nodes.some(n => {
      if (n.type !== 'n8n-nodes-base.httpRequest') return false;
      const ps = n.parameters?.headerParameters?.parameters || [];
      return ps.some(p => p.name === 'Authorization' && String(p.value || '').includes('REPLACE_WITH_YOUR_REAL_KEY'));
    });
    assert(hasFallback, `${file}: has hardcode fallback placeholder`);
  }

  // Check email node exists
  const hasEmail = wf.nodes.some(n => n.type === 'n8n-nodes-base.emailSend');
  assert(hasEmail, `${file}: has email send node`);

  const connKeys = Object.keys(wf.connections || {});
  for (const n of connKeys) {
    assert(nodeNames.has(n), `${file}: connection key node '${n}' exists in nodes`);
  }
}

if (failed) {
  console.error('\nValidation FAILED');
  process.exit(1);
} else {
  console.log('\n🎉 All workflow validations passed');
}
