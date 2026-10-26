# GrievanceTriage: Evaluation & Benchmark Results

**Evaluation Split**: 20 held-out test complaints (out of 60 total synthetic complaints)  
**Evaluation Mode**: Zero-API Offline Mode (Mock & Deterministic Baseline)  
**Date**: 2026-10-26T06:37:11.712Z  

| Metric | Deterministic Fallback (Baseline) | Mock LLM Provider (In-Memory Heuristic) | Target Threshold |
| :--- | :--- | :--- | :--- |
| **Category Accuracy** | 85.0% | 85.0% | $ge 85.0%$ |
| **Category Macro-F1** | 82.4% | 82.4% | $ge 80.0%$ |
| **Priority Agreement** | 65.0% | 65.0% | $ge 85.0%$ |
| **Department Accuracy** | 85.0% | 85.0% | $ge 90.0%$ |
| **Duplicate Grouping Precision** | 100.0% | 100.0% | $ge 80.0%$ |
| **Duplicate Grouping Recall** | 58.3% | 58.3% | $ge 75.0%$ |
| **Median Local CPU Execution Time** | 0.04 ms | 0.04 ms | $< 250$ ms |

> [!NOTE]
> **Measurement Notice regarding Sub-Millisecond Latency**:  
> The reported ~0.04 ms latency measures **local in-memory CPU string execution** of the heuristic/mock rules, not cloud network transmission. When connected to a live cloud LLM (e.g. Gemini 1.5 Flash / OpenAI GPT-4o-mini), actual network and inference round-trips typically range between **300 ms and 1,200 ms**.

### Key Findings & Methodology
1. **Honest Baseline Separation**: The deterministic keyword fallback achieves 85.0% category accuracy on held-out data. Priority agreement is 65.0% because subtle complaints without explicit hazard keywords safely default to "Medium" pending human review.
2. **Geo-Penalization Success**: Cross-location near duplicates (e.g., CMP-009 in Ward 12 vs CMP-001 in Ward 4) received a -30% geographic penalty, achieving 100% duplicate grouping precision and preventing false merges.
3. **Safety Override**: Deterministic rules consistently caught hazardous exposed wires and open manholes even when subtle adversarial text was present.
