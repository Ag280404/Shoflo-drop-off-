'use client';

import { useMemo, useState } from 'react';
import { Card, GhostButton } from './ui';
import Link from 'next/link';

type Insight = {
  id: string;
  title: string;
  impactScore: number;
  evidence: string[];
  recommendedFixes: string[];
  createdAt: string;
  filters: {
    targeting?: Record<string, string>;
    metricLabel?: string;
    lift?: number;
  };
  experimentPlan: Record<string, unknown>;
};

const defaultFilters = {
  device: 'all',
  paymentMethod: 'all',
  gateway: 'all',
  userType: 'all',
  cartValue: 'all',
  dateRange: '14d'
};

export default function RootCauseList({ insights }: { insights: Insight[] }) {
  const [filters, setFilters] = useState(defaultFilters);
  const [sort, setSort] = useState<'impact' | 'newest'>('impact');

  const filteredInsights = useMemo(() => {
    return insights
      .filter((insight) => {
        const targeting = insight.filters?.targeting || {};
        const createdAt = new Date(insight.createdAt).getTime();
        const now = Date.now();
        const days = filters.dateRange === '7d' ? 7 : 14;
        return (
          (filters.device === 'all' || targeting.device === filters.device) &&
          (filters.paymentMethod === 'all' || targeting.paymentMethod === filters.paymentMethod) &&
          (filters.gateway === 'all' || targeting.gateway === filters.gateway) &&
          (filters.userType === 'all' || targeting.userType === filters.userType) &&
          (filters.cartValue === 'all' || targeting.cartValue === filters.cartValue) &&
          now - createdAt <= days * 24 * 60 * 60 * 1000
        );
      })
      .sort((a, b) => {
        if (sort === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        return b.impactScore - a.impactScore;
      });
  }, [filters, insights, sort]);

  function exportJson(insight: Insight) {
    const blob = new Blob([JSON.stringify(insight.experimentPlan, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `experiment_${insight.id}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Root Cause Cards</h1>
          <p className="text-sm text-slate-500">AI-suggested hypotheses with quantified impact.</p>
        </div>
        <div className="flex flex-wrap gap-3 text-sm">
          <select
            className="rounded-full border border-slate-200 bg-white px-3 py-2"
            value={filters.device}
            onChange={(event) => setFilters((prev) => ({ ...prev, device: event.target.value }))}
          >
            <option value="all">All devices</option>
            <option value="android">Android</option>
            <option value="ios">iOS</option>
            <option value="web">Web</option>
          </select>
          <select
            className="rounded-full border border-slate-200 bg-white px-3 py-2"
            value={filters.paymentMethod}
            onChange={(event) => setFilters((prev) => ({ ...prev, paymentMethod: event.target.value }))}
          >
            <option value="all">All payments</option>
            <option value="upi_intent">UPI Intent</option>
            <option value="upi_collect">UPI Collect</option>
            <option value="card">Card</option>
            <option value="netbanking">Netbanking</option>
            <option value="cod">COD</option>
          </select>
          <select
            className="rounded-full border border-slate-200 bg-white px-3 py-2"
            value={filters.gateway}
            onChange={(event) => setFilters((prev) => ({ ...prev, gateway: event.target.value }))}
          >
            <option value="all">All gateways</option>
            <option value="g1">Gateway G1</option>
            <option value="g2">Gateway G2</option>
            <option value="g3">Gateway G3</option>
          </select>
          <select
            className="rounded-full border border-slate-200 bg-white px-3 py-2"
            value={filters.userType}
            onChange={(event) => setFilters((prev) => ({ ...prev, userType: event.target.value }))}
          >
            <option value="all">All users</option>
            <option value="new">New users</option>
            <option value="returning">Returning</option>
          </select>
          <select
            className="rounded-full border border-slate-200 bg-white px-3 py-2"
            value={filters.cartValue}
            onChange={(event) => setFilters((prev) => ({ ...prev, cartValue: event.target.value }))}
          >
            <option value="all">All cart values</option>
            <option value="<1k">&lt;1k</option>
            <option value="1k-2k">1k-2k</option>
            <option value="2k-4k">2k-4k</option>
            <option value="4k-6k">4k-6k</option>
            <option value="6k+">6k+</option>
          </select>
          <select
            className="rounded-full border border-slate-200 bg-white px-3 py-2"
            value={filters.dateRange}
            onChange={(event) => setFilters((prev) => ({ ...prev, dateRange: event.target.value }))}
          >
            <option value="7d">Last 7 days</option>
            <option value="14d">Last 14 days</option>
          </select>
          <select
            className="rounded-full border border-slate-200 bg-white px-3 py-2"
            value={sort}
            onChange={(event) => setSort(event.target.value as 'impact' | 'newest')}
          >
            <option value="impact">Impact desc</option>
            <option value="newest">Newest</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredInsights.map((insight) => (
          <Card key={insight.id} className="space-y-3">
            <div className="flex items-start justify-between gap-6">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{insight.title}</h2>
                <p className="text-xs text-slate-400">Impact score: {insight.impactScore.toFixed(1)}</p>
                {typeof insight.filters.lift === 'number' && insight.filters.metricLabel && (
                  <p className="text-xs text-slate-500">
                    Estimated impact: {insight.filters.lift >= 0 ? '+' : ''}
                    {insight.filters.lift.toFixed(1)}% {insight.filters.metricLabel.toLowerCase()}
                  </p>
                )}
              </div>
              <div className="flex gap-3">
                <Link href={`/root-causes/${insight.id}`} className="text-sm font-semibold text-emerald-700">
                  View details
                </Link>
                <GhostButton onClick={() => exportJson(insight)}>Export experiment JSON</GhostButton>
              </div>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Evidence</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
                  {insight.evidence.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Suggested fixes</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
                  {insight.recommendedFixes.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
