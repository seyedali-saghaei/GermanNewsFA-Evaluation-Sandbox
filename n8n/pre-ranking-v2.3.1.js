// GermanNewsFA deterministic pre-ranking v2.3.1.
// Paste this code into an n8n Code node configured as "Run Once for All Items".

const rows = $input.all().map((item) => item.json);

const normalize = (value) => String(value || '')
  .toLowerCase()
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '');

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Short abbreviations must match complete words. This prevents false matches
// such as "eu" in "Leute" and "ai" inside unrelated words.
const containsTerm = (text, term) => {
  const normalizedTerm = normalize(term);
  if (normalizedTerm.length <= 3) {
    return new RegExp(`(^|[^a-z0-9])${escapeRegex(normalizedTerm)}([^a-z0-9]|$)`, 'i').test(text);
  }
  return text.includes(normalizedTerm);
};

const topics = {
  german_politics: [
    'bundesregierung', 'bundestag', 'kanzler', 'minister', 'spd', 'cdu', 'csu',
    'grune', 'linke', 'afd', 'koalition', 'wahl', 'reform', 'gesetz', 'kabinett',
    'regierung', 'partei', 'fraktion', 'innenminister', 'aussenminister',
    'verteidigungsminister',
  ],
  international: [
    'eu', 'europaische union', 'uno', 'vereinte nationen', 'usa', 'china',
    'russland', 'ukraine', 'iran', 'nato', 'polen', 'gaza', 'sudan', 'ungarn',
    'sanktion', 'krieg', 'angriff', 'weltstrafgericht',
  ],
  economy: [
    'wirtschaft', 'konjunktur', 'arbeitsmarkt', 'tarif', 'ig metall', 'euro',
    'ezb', 'inflation', 'unternehmen', 'kommunen', 'finanz', 'steuer',
    'krankenkasse', 'rente', 'sozialleistung', 'handel', 'energie', 'banknoten',
  ],
  security: [
    'bundeswehr', 'militar', 'sicherheit', 'terror', 'waffen', 'razzia',
    'drohne', 'sprengstoff', 'kriminalitat', 'gewalt', 'strafe', 'strafrecht',
  ],
  policy: [
    'beschliesst', 'beschluss', 'gesetz', 'abkommen', 'reform', 'ratifiziert',
    'fordert', 'plant', 'kommission', 'parlament',
  ],
  ai_tech: ['ki', 'kunstliche intelligenz', 'ai', 'chatbot', 'technologie', 'digital'],
  public_health: [
    'gesundheit', 'krankheit', 'infektion', 'malaria', 'ubertragung', 'virus',
    'pandemie', 'badesaison', 'badetote', 'dlrg', 'quecksilber', 'vergiftung',
  ],
  consumer_public_interest: [
    'spritpreis', 'benzin', 'diesel', 'tankstelle', 'verbraucher', 'kassenbon',
    'miete', 'strompreis', 'gaspreis',
  ],
  climate_disaster: [
    'naturkatastrophe', 'weltrisikobericht', 'hochwasser', 'erdbeben', 'sturm',
    'extremwetter', 'klimawandel', 'waldbrand', 'durre',
  ],
};

const negativeTerms = [
  'konzert', 'fussball', 'oktoberfest', 'dating', 'urlaub', 'koffer', 'handy',
  'album', 'wetter', 'champions league', 'promi', 'stars',
];

const criticalTerms = [
  'krieg', 'angriff', 'nato', 'militar', 'bundeswehr', 'terror', 'sprengstoff',
  'sanktion', 'iran', 'ukraine', 'gaza', 'sudan', 'pandemie', 'naturkatastrophe',
];

const highImpactTerms = [
  'bundesregierung', 'bundestag', 'kabinett', 'gesetz', 'reform', 'eu', 'uno',
  'wahl', 'konjunktur', 'tarif', 'krankenkasse', 'sozialleistung',
  'weltstrafgericht', 'razzia', 'klimawandel', 'malaria', 'quecksilber',
];

const scored = rows.map((row) => {
  const title = normalize(row.title);
  const body = normalize(row.content);
  let relevanceScore = 0;
  const matchedTopics = [];
  const evidence = {};

  for (const [topic, terms] of Object.entries(topics)) {
    const titleHits = terms.filter((term) => containsTerm(title, term));
    const bodyHits = terms.filter(
      (term) => containsTerm(body, term) && !containsTerm(title, term),
    );

    if (titleHits.length || bodyHits.length) {
      matchedTopics.push(topic);
      evidence[topic] = { title: titleHits, body: bodyHits };
      relevanceScore += titleHits.length * 3 + bodyHits.length;
    }
  }

  const negativeTitle = negativeTerms.filter((term) => containsTerm(title, term));
  const negativeBody = negativeTerms.filter(
    (term) => containsTerm(body, term) && !containsTerm(title, term),
  );
  relevanceScore -= negativeTitle.length * 4 + negativeBody.length * 2;

  const preRankPassed = relevanceScore >= 2 && matchedTopics.length > 0;
  const allText = `${title} ${body}`;
  let predictedImportance;

  if (!preRankPassed) predictedImportance = relevanceScore > 0 ? 2 : 1;
  else if (criticalTerms.some((term) => containsTerm(allText, term))) predictedImportance = 5;
  else if (highImpactTerms.some((term) => containsTerm(allText, term))) predictedImportance = 4;
  else predictedImportance = 3;

  return {
    ...row,
    pre_rank_passed: preRankPassed,
    relevance_score: relevanceScore,
    matched_topics: matchedTopics,
    evidence,
    negative_evidence: { title: negativeTitle, body: negativeBody },
    predicted_importance: predictedImportance,
  };
});

return scored.map((row) => ({ json: row }));
