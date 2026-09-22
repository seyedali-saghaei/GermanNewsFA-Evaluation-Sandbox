const rows = $input.all().map((item) => item.json);
let tp = 0;
let tn = 0;
let fp = 0;
let fn = 0;

for (const row of rows) {
  const actual = Boolean(row.pre_rank_passed);
  const expected = Boolean(row.expected_relevant);
  if (actual && expected) tp += 1;
  else if (!actual && !expected) tn += 1;
  else if (actual && !expected) fp += 1;
  else fn += 1;
}

const accuracy = (tp + tn) / rows.length;
const precision = tp / (tp + fp || 1);
const recall = tp / (tp + fn || 1);
const f1 = (2 * precision * recall) / (precision + recall || 1);

const summary = {
  record_type: 'summary',
  dataset: rows[0]?.evaluation_dataset || 'unknown',
  total: rows.length,
  tp,
  tn,
  fp,
  fn,
  accuracy,
  precision,
  recall,
  f1,
  passed: rows.filter((row) => row.pre_rank_passed).length,
  generated_at: new Date().toISOString(),
};

return [
  { json: summary },
  ...rows.map((row) => ({
    json: {
      record_type: 'detail',
      case_id: row.case_id,
      title: row.title,
      expected_relevant: row.expected_relevant,
      actual_relevant: row.pre_rank_passed,
      correct: row.expected_relevant === row.pre_rank_passed,
      pre_rank_score: row.pre_rank_score,
      reasons: row.pre_rank_reasons.join('|'),
    },
  })),
];

