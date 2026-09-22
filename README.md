# GermanNewsFA Evaluation Sandbox

A reproducible evaluation of the cost-efficient pre-ranking stage used by the **GermanNewsFA** n8n workflow.

The deterministic pre-ranker runs before the LLM and filters obviously irrelevant content. This reduces the number of articles sent to paid AI nodes. This repository represents only the isolated evaluation branch and contains no active publishing steps.

## Current status

- Dataset: `ranking-v2-40`
- 40 controlled cases covering core news, borderline cases, urgent alerts, and adversarial examples
- 25 relevant and 15 irrelevant cases
- Ranking version: `v2.1-word-boundary`
- Accuracy / Precision / Recall / F1: `1.00` each on this controlled dataset
- No OpenAI or Gemini calls were made for this test
- No Telegram, X, or video output was triggered

> A score of 100% is not evidence of production performance. This dataset was designed for targeted rule validation. The next reliable step is a separate hold-out test containing real articles that were not used while developing the rules.

## Repository structure

```text
data/ranking-v2-40.csv                  Controlled golden dataset
n8n/eval-a-controlled-dataset.js        Test-data node
n8n/eval-b-deterministic-pre-ranking.js Rule-based pre-ranker
n8n/eval-c-ranking-metrics.js           Metrics node
python/evaluate_ranking.py               Independent local evaluator
results/ranking-v2-40-summary.json       Verified result
```

## n8n evaluation branch

```text
EVAL 00 - Ranking Test Trigger
  -> EVAL A - Controlled Dataset
  -> EVAL B - Deterministic Pre-Ranking
  -> EVAL C - Ranking Metrics
```

The sandbox workflow remains inactive. All external send nodes must stay disabled.

## Run locally

```bash
python3 python/evaluate_ranking.py data/ranking-v2-40.csv
```

An alternative result path can be provided:

```bash
python3 python/evaluate_ranking.py data/ranking-v2-40.csv --output results/local-run.json
```

## Scoring logic

- High-relevance signals: for example Federal Government, Bundestag, migration, war, and elections
- Urgent alerts: for example warning strikes, drinking-water alerts, product recalls, and injury hazards
- Medium signals: for example the economy, health, housing, education, and public administration
- Negative signals: for example competitions, newsletters, celebrities, lifestyle, and shopping
- Additional points for trusted sources and freshness
- A penalty for very short content
- An article passes when `pre_rank_score >= 1`

German keywords remain in the implementation because the workflow evaluates German-language news. Explicit German word boundaries prevent false substring matches—for example, `eu` is not matched inside `neue`.

## Next evaluation stages

1. Collect 50–100 real articles as an untouched hold-out dataset.
2. Label relevance and importance manually before running the workflow.
3. Evaluate the pre-ranker against the hold-out dataset.
4. Evaluate LLM outputs separately: JSON validity, importance, translation quality, names and numbers, latency, and cost.

## Language note

Documentation, code comments, field names, and result descriptions are written in English. The sample news titles, article bodies, and ranking keywords intentionally remain in German because German-language input is the subject of the evaluation.
