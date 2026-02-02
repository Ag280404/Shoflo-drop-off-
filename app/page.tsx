import DashboardClient from '@/components/DashboardClient';
import { getDashboardMetrics, getDailyTrends } from '@/lib/analytics';
import { computeAnomalies } from '@/lib/insights';
import { prisma } from '@/lib/prisma';

export default async function Page() {
  const [metrics, trends, sessions] = await Promise.all([
    getDashboardMetrics(),
    getDailyTrends(),
    prisma.session.findMany()
  ]);

  const anomalies = computeAnomalies(sessions);

  return <DashboardClient metrics={metrics} trends={trends} anomalies={anomalies} />;
}
