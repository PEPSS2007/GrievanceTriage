import { LLMAnalysisOutput, LLMAnalysisOutputSchema } from "../contracts";
import taxonomyData from "../data/taxonomy.json";
import { evaluatePriorityRules } from "./rules";

export interface LLMProvider {
  name: string;
  generateTriage(sanitizedText: string, location: string): Promise<LLMAnalysisOutput>;
}

export class MockLLMProvider implements LLMProvider {
  name = "MockLLMProvider";

  async generateTriage(sanitizedText: string, location: string): Promise<LLMAnalysisOutput> {
    const normalized = sanitizedText.toLowerCase();
    const ruleEval = evaluatePriorityRules(normalized);

    let bestCategory = taxonomyData.categories[0].name;
    let bestScore = -1;
    let bestDeptId = taxonomyData.categories[0].department_id;

    for (const cat of taxonomyData.categories) {
      let score = 0;
      for (const kw of cat.keywords) {
        if (normalized.includes(kw.toLowerCase())) {
          score += 2;
        }
      }
      if (score > bestScore) {
        bestScore = score;
        bestCategory = cat.name;
        bestDeptId = cat.department_id;
      }
    }

    const priority = ruleEval.forcedPriority || (bestScore > 1 ? "Medium" : "Low");
    const uncertainties = bestScore <= 0 ? ["Low certainty on category from keyword match"] : [];

    return {
      summary: `Citizen reports ${bestCategory.toLowerCase()} issue at ${location}. Details: ${sanitizedText.slice(0, 90).trim()}...`,
      category: bestCategory,
      priority,
      recommended_department_id: bestDeptId,
      suggested_action: priority === "Urgent" ? "Dispatch emergency crew immediately." : "Assign to maintenance queue.",
      uncertainties,
      confidence: bestScore > 0 ? 0.88 : 0.60,
    };
  }
}

export class GeminiLLMProvider implements LLMProvider {
  name = "GeminiLLMProvider";
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateTriage(sanitizedText: string, location: string): Promise<LLMAnalysisOutput> {
    const systemPrompt = `You are the GrievanceTriage municipal grievance triage engine.
Classify the grievance against the following taxonomy:
Categories: ${taxonomyData.categories.map((c) => `"${c.name}" (Dept: ${c.department_id})`).join(", ")}
Valid Priorities: "Low", "Medium", "High", "Urgent"

Output ONLY valid JSON adhering to this schema:
{
  "summary": string (factual 1-2 sentences),
  "category": string (must match one of the categories above),
  "priority": string ("Low" | "Medium" | "High" | "Urgent"),
  "recommended_department_id": string (dept_roads, dept_water, dept_sanitation, dept_electricity, dept_health, dept_parks),
  "suggested_action": string,
  "uncertainties": string[],
  "confidence": number (between 0.0 and 1.0)
}`;

    const userPrompt = `Grievance Text: "${sanitizedText}"\nReported Location: "${location}"`;

    let attempt = 1;
    let promptToSend = `${systemPrompt}\n\n${userPrompt}`;

    while (attempt <= 2) {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptToSend }] }],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.1,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
      }

      const json = await response.json();
      const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) throw new Error("Empty response from Gemini");

      try {
        const parsed = JSON.parse(rawText);
        const validated = LLMAnalysisOutputSchema.safeParse(parsed);
        if (validated.success) {
          return validated.data;
        }

        // Retry once with error feedback
        if (attempt === 1) {
          promptToSend = `${systemPrompt}\n\n${userPrompt}\n\nERROR: Your previous response violated the JSON schema with error: ${validated.error.message}. Please fix and return ONLY valid JSON.`;
          attempt++;
          continue;
        }
        throw new Error(`Schema validation failed: ${validated.error.message}`);
      } catch (err: any) {
        if (attempt === 1) {
          attempt++;
          continue;
        }
        throw err;
      }
    }

    throw new Error("Exhausted LLM triage retries");
  }
}

export function getLLMProvider(): LLMProvider {
  const configured = process.env.DEFAULT_LLM_PROVIDER?.toLowerCase();
  const geminiKey = process.env.GEMINI_API_KEY;

  if (configured === "gemini" && geminiKey) {
    return new GeminiLLMProvider(geminiKey);
  }
  if (geminiKey && !configured) {
    return new GeminiLLMProvider(geminiKey);
  }

  return new MockLLMProvider();
}
