const records = $input.all().map((item) => item.json);
let tp = 0; let tn = 0; let fp = 0; let fn = 0; let error = 0;
for (const row of records) {
  if (row.expected_relevant && row.pre_rank_passed) tp += 1;
  else if (!row.expected_relevant && !row.pre_rank_passed) tn += 1;
  else if (!row.expected_relevant && row.pre_rank_passed) fp += 1;
  else fn += 1;
  error += Math.abs(row.expected_importance - row.predicted_importance);
}
const div = (a, b) => b ? a / b : 0;
return [{ json: {
  evaluation_dataset: 'real-news-unseen-50-faz-dw-2026-09-23',
  pre_rank_version: 'v2.2-topic-penalties-frozen', unseen_test: true,
  rules_frozen_before_test: true, total: records.length,
  tp, tn, fp, fn, accuracy: div(tp + tn, records.length),
  precision: div(tp, tp + fp), recall: div(tp, tp + fn),
  f1: div(2 * tp, 2 * tp + fp + fn), importance_mae: div(error, records.length),
  false_positives: records.filter((r) => !r.expected_relevant && r.pre_rank_passed).map((r) => r.case_id),
  false_negatives: records.filter((r) => r.expected_relevant && !r.pre_rank_passed).map((r) => r.case_id),
  no_external_output: true,
} }];
