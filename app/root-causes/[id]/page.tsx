import RootCauseDetailClient from '@/components/RootCauseDetailClient';
import { getInsightDetail } from '@/lib/detail';

export default async function RootCauseDetailPage({ params }: { params: { id: string } }) {
  const detail = await getInsightDetail(params.id);
  if (!detail) {
    return <p className="text-sm text-slate-500">Insight not found.</p>;
  }

  const insight = detail.insight;

  return (
    <RootCauseDetailClient
      insight={{
        id: insight.id,
        title: insight.title,
        evidence: insight.evidence as string[],
        recommendedFixes: insight.recommendedFixes as string[],
        experimentPlan: insight.experimentPlan as Record<string, unknown>,
        filters: insight.filters as { drivers?: string[] }
      }}
      targeting={detail.targeting}
      comparison={detail.comparison}
      breakdownByDevice={detail.breakdownByDevice}
      funnelSummary={detail.funnelSummary}
    />
  );
}
