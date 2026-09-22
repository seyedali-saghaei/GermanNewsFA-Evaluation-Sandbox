#!/usr/bin/env python3
"""Evaluate deterministic GermanNewsFA pre-ranking against a labelled CSV."""

from __future__ import annotations

import argparse
import csv
import json
import re
from datetime import datetime, timezone
from pathlib import Path


HIGH = {'iran', 'deutschland', 'migration', 'asyl', 'krieg', 'wahl', 'bundesregierung', 'bundestag', 'angriff', 'krise', 'sanktion'}
URGENT = {'warnstreik', 'flughafen', 'flughäfen', 'feuerwehr', 'gefahrstoff', 'gefahrstoffwolke', 'trinkwasser', 'verunreinigt', 'produktrückruf', 'verletzungsgefahr', 'evakuierung', 'katastrophe'}
MEDIUM = {'wirtschaft', 'inflation', 'arbeitsmarkt', 'sicherheit', 'europa', 'eu', 'nahost', 'energie', 'gesundheit', 'gesetz', 'gericht', 'bildung', 'schule', 'schulen', 'miete', 'mieten', 'wohnungsbau', 'krankenkasse', 'krankenkassen', 'digitalisierung', 'verwaltung', 'bahn', 'streckensanierung'}
LOW = {'gewinnspiel', 'newsletter', 'werbung', 'promi', 'lifestyle', 'horoskop', 'quiz', 'shopping', 'rabatt', 'angebot'}
TRUSTED = ('tagesschau.de', 'faz.net', 'sueddeutsche.de', 'spiegel.de', 'bbc.')


def parse_bool(value: str) -> bool:
    return value.strip().lower() in {'true', '1', 'yes', 'ja'}


def has_term(text: str, word: str) -> bool:
    return re.search(rf'(^|[^a-z0-9äöüß]){re.escape(word)}(?=$|[^a-z0-9äöüß])', text, re.IGNORECASE) is not None


def rank(row: dict[str, str]) -> tuple[int, list[str]]:
    text = f"{row['title']} {row['content']}".lower()
    score = 0
    reasons: list[str] = []
    for words, points, label in ((HIGH, 3, 'high'), (URGENT, 4, 'urgent'), (MEDIUM, 2, 'medium'), (LOW, -4, 'low')):
        for word in words:
            if has_term(text, word):
                score += points
                reasons.append(f'{label}:{word}')
    if any(source in row['source_host'] for source in TRUSTED):
        score += 1
        reasons.append('trusted-source')
    if len(row['title']) < 25 or len(row['content']) < 80:
        score -= 1
        reasons.append('short-content')
    return score, sorted(reasons)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('csv_file', type=Path)
    parser.add_argument('--output', type=Path, default=Path('results/ranking-v2-40-summary.json'))
    args = parser.parse_args()

    with args.csv_file.open(encoding='utf-8-sig', newline='') as handle:
        rows = list(csv.DictReader(handle))

    tp = tn = fp = fn = 0
    details = []
    for row in rows:
        score, reasons = rank(row)
        actual = score >= 1
        expected = parse_bool(row['expected_relevant'])
        if actual and expected:
            tp += 1
        elif not actual and not expected:
            tn += 1
        elif actual and not expected:
            fp += 1
        else:
            fn += 1
        details.append({'case_id': row['case_id'], 'expected': expected, 'actual': actual, 'score': score, 'reasons': reasons})

    total = len(rows)
    precision = tp / (tp + fp) if tp + fp else 0.0
    recall = tp / (tp + fn) if tp + fn else 0.0
    report = {
        'dataset': rows[0]['dataset'] if rows else 'unknown',
        'ranking_version': 'v2.1-word-boundary',
        'total': total,
        'tp': tp,
        'tn': tn,
        'fp': fp,
        'fn': fn,
        'accuracy': (tp + tn) / total if total else 0.0,
        'precision': precision,
        'recall': recall,
        'f1': 2 * precision * recall / (precision + recall) if precision + recall else 0.0,
        'generated_at': datetime.now(timezone.utc).isoformat(),
        'details': details,
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({key: value for key, value in report.items() if key != 'details'}, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()

