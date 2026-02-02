import RootCauseList from '@/components/RootCauseList';
import { prisma } from '@/lib/prisma';

export default async function RootCausesPage() {
  const insights = await prisma.insight.findMany({ orderBy: { impactScore: 'desc' } });

  const serialized = insights.map((insight) => ({
    ...insight,
    evidence: insight.evidence as string[],
    recommendedFixes: insight.recommendedFixes as string[],
    experimentPlan: insight.experimentPlan as Record<string, unknown>,
    filters: insight.filters as { targeting?: Record<string, string> }
  }));

  return <RootCauseList insights={serialized} />;
}
