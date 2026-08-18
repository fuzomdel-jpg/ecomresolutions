export function tokenize(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 1);
}

export function levenshtein(a: string, b: string) {
  const matrix: number[][] = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      );
    }
  }
  return matrix[a.length][b.length];
}

export function fuzzyScore(query: string, target: string) {
  const q = query.toLowerCase().trim();
  const t = target.toLowerCase();
  if (!q) return 0;
  if (t.includes(q)) return 1;
  const queryTokens = tokenize(q);
  const targetTokens = tokenize(t);
  if (queryTokens.length === 0) return 0;
  let hits = 0;
  for (const token of queryTokens) {
    const exact = targetTokens.includes(token);
    const close = targetTokens.some((candidate) => {
      const distance = levenshtein(token, candidate);
      return distance <= Math.max(1, Math.floor(token.length / 4));
    });
    if (exact) hits += 1;
    else if (close) hits += 0.7;
  }
  return hits / queryTokens.length;
}

export type SearchableService = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  priceCents: number;
  priceFrom: boolean;
  slaLabel: string;
  platformName: string;
  platformSlug: string;
};

export function searchServices(query: string, services: SearchableService[]) {
  return services
    .map((service) => {
      const haystack = `${service.name} ${service.shortDescription} ${service.platformName} ${service.slug}`;
      return { service, score: fuzzyScore(query, haystack) };
    })
    .filter((result) => result.score >= 0.35)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map((result) => result.service);
}
