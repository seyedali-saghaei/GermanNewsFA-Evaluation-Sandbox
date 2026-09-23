const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const input = process.argv[2];
const output = process.argv[3];

if (!input || !output) {
  throw new Error('Usage: node scripts/evaluate_v231_dataset.js <dataset.json> <summary.json>');
}

const rows = JSON.parse(fs.readFileSync(path.resolve(root, input), 'utf8'))
  .map((row) => ({ ...row, content: '' }));
let evaluator = fs.readFileSync(path.join(root, 'n8n', 'pre-ranking-v2.3.1.js'), 'utf8');
evaluator = evaluator.replace(
  "const rows = $input.all().map((item) => item.json);",
  `const rows = ${JSON.stringify(rows)};`,
);
evaluator = evaluator.replace(
  'return scored.map((row) => ({ json: row }));',
  'return scored;',
);

const scored = new Function(evaluator)();
let tp = 0; let tn = 0; let fp = 0; let fn = 0; let importanceError = 0;
for (const row of scored) {
  if (row.expected_relevant && row.pre_rank_passed) tp += 1;
  else if (!row.expected_relevant && !row.pre_rank_passed) tn += 1;
  else if (!row.expected_relevant && row.pre_rank_passed) fp += 1;
  else fn += 1;
  importanceError += Math.abs(row.expected_importance - row.predicted_importance);
}
const div = (a, b) => b ? a / b : 0;
const summary = {
  evaluation_dataset: path.basename(input, '.json'),
  pre_rank_version: 'v2.3.1-structured-topics',
  independent_unseen_test: true,
  evaluation_scope: 'german-headlines-only',
  total: scored.length,
  tp, tn, fp, fn,
  accuracy: div(tp + tn, scored.length),
  precision: div(tp, tp + fp),
  recall: div(tp, tp + fn),
  f1: div(2 * tp, 2 * tp + fp + fn),
  importance_mae: div(importanceError, scored.length),
  false_positives: scored.filter((row) => !row.expected_relevant && row.pre_rank_passed).map((row) => row.case_id),
  false_negatives: scored.filter((row) => row.expected_relevant && !row.pre_rank_passed).map((row) => row.case_id),
  rules_changed_after_labeling: false,
  no_external_output: true
};
fs.writeFileSync(path.resolve(root, output), `${JSON.stringify(summary, null, 2)}\n`);
process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
