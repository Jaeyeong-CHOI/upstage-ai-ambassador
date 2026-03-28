const fs = require('fs');

const files = [
  'workflow.daily-paper-digest.json',
  'workflow.daily-paper-summary.json',
  'workflow.research-briefing.json',
];

let failed = false;
for (const f of files) {
  const root = fs.readFileSync(f, 'utf8');
  const docs = fs.readFileSync(`docs/templates/${f}`, 'utf8');
  if (root !== docs) {
    console.error(`❌ template out of sync: ${f}`);
    failed = true;
  } else {
    console.log(`✅ template synced: ${f}`);
  }
}

if (failed) {
  console.error('\nTemplate sync check FAILED');
  process.exit(1);
}

console.log('\n🎉 All templates are synced');
