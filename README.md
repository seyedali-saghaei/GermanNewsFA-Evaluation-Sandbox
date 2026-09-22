# GermanNewsFA Evaluation Sandbox

Reproduzierbare Evaluation des kostengünstigen Pre-Rankings für den n8n-Workflow **GermanNewsFA**.

Das Pre-Ranking läuft vor dem LLM und filtert offensichtlich irrelevante Inhalte. Dadurch werden weniger Artikel an kostenpflichtige AI-Nodes weitergegeben. Dieses Repository bildet ausschließlich den isolierten Evaluationszweig ab und enthält keine aktiven Publishing-Schritte.

## Aktueller Stand

- Datensatz: `ranking-v2-40`
- 40 kontrollierte Fälle: Kernnachrichten, Randfälle, Warnlagen und adversariale Beispiele
- 25 relevante und 15 irrelevante Fälle
- Ranking-Version: `v2.1-word-boundary`
- Accuracy / Precision / Recall / F1: jeweils `1.00` auf diesem kontrollierten Datensatz
- Keine OpenAI-/Gemini-Aufrufe für diesen Test
- Keine Telegram-, X- oder Video-Ausgabe

> Die 100 % sind kein Produktionsnachweis. Der Datensatz wurde zur gezielten Regelprüfung erstellt. Der nächste belastbare Schritt ist ein separater Hold-out-Test mit echten, zuvor nicht zur Regelentwicklung verwendeten Nachrichten.

## Struktur

```text
data/ranking-v2-40.csv                 Kontrollierter Golden-Dataset
n8n/eval-a-controlled-dataset.js       Testdaten-Node
n8n/eval-b-deterministic-pre-ranking.js Regelbasierter Pre-Ranker
n8n/eval-c-ranking-metrics.js          Metrik-Node
python/evaluate_ranking.py              Lokaler, unabhängiger Evaluator
results/ranking-v2-40-summary.json      Verifiziertes Ergebnis
```

## n8n-Testzweig

```text
EVAL 00 - Ranking Test Trigger
  -> EVAL A - Controlled Dataset
  -> EVAL B - Deterministic Pre-Ranking
  -> EVAL C - Ranking Metrics
```

Der Sandbox-Workflow bleibt inaktiv. Alle externen Send-Nodes müssen deaktiviert bleiben.

## Lokal ausführen

```bash
python3 python/evaluate_ranking.py data/ranking-v2-40.csv
```

Optional kann ein anderer Ergebnis-Pfad angegeben werden:

```bash
python3 python/evaluate_ranking.py data/ranking-v2-40.csv --output results/local-run.json
```

## Bewertungslogik

- Hohe Relevanzsignale: z. B. Bundesregierung, Bundestag, Migration, Krieg, Wahl
- Akute Warnlagen: z. B. Warnstreik, Trinkwasser, Produktrückruf, Verletzungsgefahr
- Mittlere Signale: z. B. Wirtschaft, Gesundheit, Wohnen, Bildung, Verwaltung
- Negative Signale: z. B. Gewinnspiel, Newsletter, Promi, Lifestyle, Shopping
- Zusatzpunkte für vertrauenswürdige Quellen und Aktualität
- Abzug für sehr kurze Inhalte
- Veröffentlichungskandidat ab `pre_rank_score >= 1`

Die Wortgrenzen verwenden explizit deutsche Buchstaben. Dadurch wird beispielsweise `eu` nicht fälschlich innerhalb von `neue` erkannt.

## Nächste Evaluationsstufen

1. 50–100 echte Nachrichten als unangetasteten Hold-out-Datensatz sammeln.
2. Relevanz und Wichtigkeit vor dem Workflow manuell labeln.
3. Pre-Ranking gegen diesen Hold-out-Datensatz testen.
4. Danach LLM-Ausgaben getrennt bewerten: JSON-Gültigkeit, Importance, Übersetzung, Namen/Zahlen und Kosten.

