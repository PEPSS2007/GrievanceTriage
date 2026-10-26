import { Complaint } from '../types';

const STOPWORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'as',
  'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by', 'could',
  'did', 'do', 'does', 'doing', 'down', 'during', 'each', 'few', 'for', 'from', 'further', 'had', 'has',
  'have', 'having', 'he', 'her', 'here', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'i', 'if',
  'in', 'into', 'is', 'it', 'its', 'itself', 'just', 'me', 'more', 'most', 'my', 'myself', 'no', 'nor',
  'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'our', 'ours', 'ourselves', 'out', 'over',
  'own', 'same', 'she', 'should', 'so', 'some', 'such', 'than', 'that', 'the', 'their', 'theirs', 'them',
  'themselves', 'then', 'there', 'these', 'they', 'this', 'those', 'through', 'to', 'too', 'under',
  'until', 'up', 'very', 'was', 'we', 'were', 'what', 'when', 'where', 'which', 'while', 'who', 'whom',
  'why', 'with', 'would', 'you', 'your', 'yours', 'yourself', 'yourselves'
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOPWORDS.has(w));
}

export interface SimilarityResult {
  complaint: Complaint;
  score: number;
  rawCosine: number;
  locationBonus: number;
  status: 'suggested' | 'confirmed' | 'rejected';
}

/**
 * Calculates runtime TF-IDF cosine similarity between a source complaint and a candidate corpus.
 * Applies location bonuses for matching wards and penalties for divergent locations.
 */
export function calculateRuntimeSimilarity(
  source: Complaint,
  corpus: Complaint[]
): SimilarityResult[] {
  const sourceTokens = tokenize(`${source.title || ''} ${source.text}`);
  if (sourceTokens.length === 0) return [];

  // Build document corpus for IDF
  const allDocsTokens = corpus.map(c => tokenize(`${c.title || ''} ${c.text}`));
  const docCount = corpus.length;

  // Calculate Document Frequency (DF)
  const df: Record<string, number> = {};
  allDocsTokens.forEach(tokens => {
    const unique = new Set(tokens);
    unique.forEach(t => {
      df[t] = (df[t] || 0) + 1;
    });
  });

  // Calculate TF for source
  const sourceTf: Record<string, number> = {};
  sourceTokens.forEach(t => {
    sourceTf[t] = (sourceTf[t] || 0) + 1;
  });

  // Calculate source vector
  const sourceVector: Record<string, number> = {};
  let sourceNorm = 0;
  for (const [term, freq] of Object.entries(sourceTf)) {
    const idfVal = Math.log((docCount + 1) / ((df[term] || 0) + 1)) + 1;
    const tfIdf = (freq / sourceTokens.length) * idfVal;
    sourceVector[term] = tfIdf;
    sourceNorm += tfIdf * tfIdf;
  }
  sourceNorm = Math.sqrt(sourceNorm);

  const results: SimilarityResult[] = [];

  for (let i = 0; i < corpus.length; i++) {
    const candidate = corpus[i];
    if (candidate.id === source.id) continue;

    const candTokens = allDocsTokens[i];
    if (candTokens.length === 0) continue;

    const candTf: Record<string, number> = {};
    candTokens.forEach(t => {
      candTf[t] = (candTf[t] || 0) + 1;
    });

    let dotProduct = 0;
    let candNorm = 0;

    for (const [term, freq] of Object.entries(candTf)) {
      const idfVal = Math.log((docCount + 1) / ((df[term] || 0) + 1)) + 1;
      const tfIdf = (freq / candTokens.length) * idfVal;
      candNorm += tfIdf * tfIdf;
      if (sourceVector[term]) {
        dotProduct += sourceVector[term] * tfIdf;
      }
    }
    candNorm = Math.sqrt(candNorm);

    const rawCosine = (sourceNorm > 0 && candNorm > 0) ? (dotProduct / (sourceNorm * candNorm)) : 0;

    // Location boost / penalty
    let locationBonus = 0;
    const sourceWard = source.location.match(/Ward\s+(\d+)/i)?.[1];
    const candWard = candidate.location.match(/Ward\s+(\d+)/i)?.[1];

    if (sourceWard && candWard && sourceWard === candWard) {
      locationBonus = 0.15;
    } else if (sourceWard && candWard && sourceWard !== candWard) {
      locationBonus = -0.20;
    }

    // Category match bonus
    const categoryBonus = (source.category && candidate.category && source.category === candidate.category) ? 0.08 : 0;

    const finalScore = Math.min(1.0, Math.max(0.0, rawCosine * 0.75 + locationBonus + categoryBonus));

    // Only include meaningful candidates (> 0.40)
    if (finalScore >= 0.40) {
      results.push({
        complaint: candidate,
        score: Math.round(finalScore * 100) / 100,
        rawCosine: Math.round(rawCosine * 100) / 100,
        locationBonus,
        status: 'suggested'
      });
    }
  }

  // Sort descending by similarity score
  return results.sort((a, b) => b.score - a.score);
}