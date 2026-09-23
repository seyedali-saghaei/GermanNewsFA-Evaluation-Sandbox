const high = ['iran', 'deutschland', 'migration', 'asyl', 'krieg', 'wahl', 'bundesregierung', 'bundestag', 'angriff', 'krise', 'sanktion'];
const urgent = ['warnstreik', 'flughafen', 'flughäfen', 'feuerwehr', 'gefahrstoff', 'gefahrstoffwolke', 'trinkwasser', 'verunreinigt', 'produktrückruf', 'verletzungsgefahr', 'evakuierung', 'katastrophe'];
const medium = ['wirtschaft', 'inflation', 'arbeitsmarkt', 'sicherheit', 'europa', 'eu', 'nahost', 'energie', 'gesundheit', 'gesetz', 'gericht', 'bildung', 'schule', 'schulen', 'miete', 'mieten', 'wohnungsbau', 'krankenkasse', 'krankenkassen', 'digitalisierung', 'verwaltung', 'bahn', 'streckensanierung'];
const low = ['gewinnspiel', 'newsletter', 'werbung', 'promi', 'lifestyle', 'horoskop', 'quiz', 'shopping', 'rabatt', 'angebot'];
const trusted = ['tagesschau.de', 'faz.net', 'sueddeutsche.de', 'spiegel.de', 'bbc.'];

const negativeGroups = {
  sports: { penalty: 3, terms: ['champions league', 'fc bayern', 'fußball', 'bundestrainer', 'länderspiel', 'spielerinnen', 'mbappé'] },
  entertainment: { penalty: 3, terms: ['star wars', 'museum', 'krimi', 'zdf', 'schauspieler', 'musik', 'promi', 'celebrity'] },
  travel: { penalty: 4, terms: ['camping', 'ferien-immobilie', 'urlaubsort', 'reise', 'qantas'] },
  human_interest: { penalty: 3, terms: ['oktoberfest', 'felssturz', 'herzdruckmassage', 'volksheld', 'kosakenführer', 'gefängnisse', 'klimaanlagen'] },
  format: { penalty: 3, terms: ['podcast'] },
};

const hasTerm = (text, word) => new RegExp(
  `(^|[^a-z0-9äöüß])${word}(?=$|[^a-z0-9äöüß])`,
  'i',
).test(text);

return $input.all().map((item) => {
  const data = item.json;
  const text = `${data.title || ''} ${data.content || ''}`.toLowerCase();
  let score = 0;
  const reasons = [];

  for (const word of high) if (hasTerm(text, word)) { score += 3; reasons.push(`high:${word}`); }
  for (const word of urgent) if (hasTerm(text, word)) { score += 4; reasons.push(`urgent:${word}`); }
  for (const word of medium) if (hasTerm(text, word)) { score += 2; reasons.push(`medium:${word}`); }
  for (const word of low) if (hasTerm(text, word)) { score -= 4; reasons.push(`low:${word}`); }

  if (trusted.some((source) => (data.sourceHost || '').includes(source))) {
    score += 1;
    reasons.push('trusted-source');
  }
  if (Date.now() - Date.parse(data.pubDate) < 30 * 60_000) {
    score += 1;
    reasons.push('fresh');
  }
  if ((data.title || '').length < 25 || (data.content || '').length < 80) {
    score -= 1;
    reasons.push('short-content');
  }
  for (const [group, rule] of Object.entries(negativeGroups)) {
    if (rule.terms.some((term) => hasTerm(text, term))) {
      score -= rule.penalty;
      reasons.push(`soft-low:${group}`);
    }
  }

  const predictedImportance = score >= 7 ? 5 : score >= 5 ? 4 : score >= 3 ? 3 : score >= 1 ? 2 : 1;
  return { json: { ...data, pre_rank_score: score, pre_rank_passed: score >= 1, predicted_importance: predictedImportance, pre_rank_reasons: reasons, pre_rank_version: 'v2.2-topic-penalties' } };
}).sort((a, b) => b.json.pre_rank_score - a.json.pre_rank_score);
