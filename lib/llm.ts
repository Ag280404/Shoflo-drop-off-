import type { InsightDraft } from './insights';

type LLMOutput = {
  title: string;
  evidence: string[];
  recommendedFixes: string[];
  experimentPlan: Record<string, unknown>;
};

export function mockLLM(draft: InsightDraft): LLMOutput {
  const impactPct = (draft.metrics.lift * 100).toFixed(1);
  const title = `${draft.segmentLabel} shows ${draft.metrics.metricLabel} lift of ${impactPct}%`;

  const evidence = [
    `${draft.segmentLabel} sessions: ${draft.metrics.segmentVolume} vs baseline ${draft.metrics.baselineRate.toFixed(1)}%`,
    `${draft.metrics.metricLabel} rate: ${draft.metrics.segmentRate.toFixed(1)}% (${impactPct}% lift)`,
    `Observed window: ${draft.window.start} → ${draft.window.end}`
  ];

  const recommendedFixes = [
    `Improve ${draft.metrics.metricLabel.toLowerCase()} reliability for ${draft.segmentLabel}.`,
    `Add inline reassurance or incentives for ${draft.segmentLabel}.`,
    'Run A/B test with targeted UX changes.'
  ];

  const experimentPlan = {
    hypothesis: `If we address ${draft.metrics.metricLabel.toLowerCase()} friction for ${draft.segmentLabel}, conversion will improve by ${impactPct}%`,
    targeting: draft.targeting,
    variants: [
      { name: 'control', changes: [] },
      {
        name: 'variant',
        changes: [
          { module: 'checkout', key: 'banner', value: `Resolve ${draft.metrics.metricLabel.toLowerCase()} issues` }
        ]
      }
    ],
    primaryMetric: 'conversion_rate',
    secondaryMetrics: ['payment_success_rate', 'abandonment_rate'],
    guardrails: ['latency_p95', 'support_tickets'],
    sampleSizeHeuristic: 'At least 1,500 sessions per variant',
    runtimeDays: 10
  };

  return { title, evidence, recommendedFixes, experimentPlan };
}

export async function generateLLMInsight(draft: InsightDraft): Promise<LLMOutput> {
  if (process.env.OPENAI_API_KEY) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'Generate concise RCA summary, evidence, fixes, and experiment plan JSON.'
            },
            {
              role: 'user',
              content: JSON.stringify(draft)
            }
          ],
          temperature: 0.3
        })
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content);
          return parsed;
        }
      }
    } catch (error) {
      console.warn('OpenAI call failed, falling back to mockLLM', error);
    }
  }

  return mockLLM(draft);
}
