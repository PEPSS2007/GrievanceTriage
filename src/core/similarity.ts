import { Complaint, RelatedComplaintCandidate } from "../contracts";

const STOP_WORDS = new Set([
  "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "aren't",
  "as", "at", "be", "because", "been", "before", "being", "below", "between", "both", "but", "by",
  "can't", "cannot", "could", "couldn't", "did", "didn't", "do", "does", "doesn't", "doing", "don't",
  "down", "during", "each", "few", "for", "from", "further", "had", "hadn't", "has", "hasn't", "have",
  "haven't", "having", "he", "he'd", "he'll", "he's", "her", "here", "here's", "hers", "herself",
  "him", "himself", "his", "how", "how's", "i", "i'd", "i'll", "i'm", "i've", "if", "in", "into",
  "is", "isn't", "it", "it's", "its", "itself", "let's", "me", "more", "most", "mustn't", "my",
  "myself", "no", "nor", "not", "of", "off", "on", "once", "only", "or", "other", "ought", "our",
  "ours", "ourselves", "out", "over", "own", "same", "shan't", "she", "she'd", "she'll", "she's",
  "should", "shouldn't", "so", "some", "such", "than", "that", "that's", "the", "their", "theirs",
  "them", "themselves", "then", "there", "there's", "these", "they", "they'd", "they'll", "they're",
  "they've", "this", "those", "through", "to", "too", "under", "until", "up", "very", "was", "wasn't",
  "we", "we'd", "we'll", "we're", "we've", "were", "weren't", "what", "what's", "when", "when's",
  "where", "where's", "which", "while", "who", "who's", "whom", "why", "why's", "with", "won't",
  "would", "wouldn't", "you", "you'd", "you'll", "you're", "you've", "your", "yours", "yourself", "yourselves"
]);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

export class TFIDFIndex {
  private docTokens: Map<string, string[]> = new Map();
  private docFrequencies: Map<string, number> = new Map();
  private totalDocs = 0;

  addDocument(id: string, text: string) {
    const tokens = tokenize(text);
    this.docTokens.set(id, tokens);
    const uniqueTokens = new Set(tokens);
    for (const token of uniqueTokens) {
      this.docFrequencies.set(token, (this.docFrequencies.get(token) || 0) + 1);
    }
    this.totalDocs++;
  }

  computeVector(tokens: string[]): Map<string, number> {
    const termCounts: Map<string, number> = new Map();
    for (const token of tokens) {
      termCounts.set(token, (termCounts.get(token) || 0) + 1);
    }

    const vector: Map<string, number> = new Map();
    let normSq = 0;

    for (const [term, count] of termCounts.entries()) {
      const tf = count / tokens.length;
      const df = this.docFrequencies.get(term) || 0;
      const idf = Math.log(1 + (this.totalDocs + 1) / (df + 1));
      const tfidf = tf * idf;
      vector.set(term, tfidf);
      normSq += tfidf * tfidf;
    }

    // Normalize vector
    const norm = Math.sqrt(normSq);
    if (norm > 0) {
      for (const [term, val] of vector.entries()) {
        vector.set(term, val / norm);
      }
    }

    return vector;
  }

  cosineSimilarity(v1: Map<string, number>, v2: Map<string, number>): number {
    let dot = 0;
    for (const [term, val1] of v1.entries()) {
      const val2 = v2.get(term);
      if (val2) {
        dot += val1 * val2;
      }
    }
    return Math.max(0, Math.min(1, dot));
  }

  findRelated(
    targetComplaint: Complaint,
    allComplaints: Complaint[],
    targetCategory?: string,
    complaintCategories?: Map<string, string>
  ): RelatedComplaintCandidate[] {
    const targetTokens = tokenize(targetComplaint.text);
    const targetVector = this.computeVector(targetTokens);

    const candidates: RelatedComplaintCandidate[] = [];

    for (const candidate of allComplaints) {
      if (candidate.id === targetComplaint.id) continue;

      const candTokens = this.docTokens.get(candidate.id) || tokenize(candidate.text);
      const candVector = this.computeVector(candTokens);
      const baseCosine = this.cosineSimilarity(targetVector, candVector);

      let adjustedScore = baseCosine;
      const reasons: string[] = [
        `Base TF-IDF text similarity: ${(baseCosine * 100).toFixed(0)}%`,
      ];

      // Geo / Location heuristic
      const targetWard = targetComplaint.location.toLowerCase();
      const candWard = candidate.location.toLowerCase();

      if (
        targetWard === candWard ||
        (targetWard.includes("ward") &&
          candWard.includes("ward") &&
          targetWard.split(",")[0].trim() === candWard.split(",")[0].trim())
      ) {
        adjustedScore += 0.25;
        reasons.push("Geographic alignment: Same municipal ward/street (+25%)");
      } else {
        adjustedScore -= 0.30;
        reasons.push("Geographic separation: Different ward/location (-30% penalty applied)");
      }

      // Category matching heuristic
      if (targetCategory) {
        const candCat = complaintCategories?.get(candidate.id);
        if (!complaintCategories || candCat === targetCategory) {
          adjustedScore += 0.15;
          reasons.push("Category alignment: Identical grievance classification (+15%)");
        }
      }

      const finalScore = Math.max(0, Math.min(1, Number(adjustedScore.toFixed(2))));

      let relationship: "likely_related" | "possibly_related" | "unrelated" = "unrelated";
      if (finalScore >= 0.70) {
        relationship = "likely_related";
      } else if (finalScore >= 0.50) {
        relationship = "possibly_related";
      }

      if (finalScore >= 0.40) {
        candidates.push({
          complaint_id: targetComplaint.id,
          candidate_id: candidate.id,
          similarity_score: finalScore,
          relationship,
          reasons,
        });
      }
    }

    // Sort by highest score first
    return candidates.sort((a, b) => b.similarity_score - a.similarity_score);
  }
}
