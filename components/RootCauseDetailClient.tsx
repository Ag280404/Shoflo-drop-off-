'use client';

import { useMemo } from 'react';
import { Card, GhostButton } from './ui';

type DetailProps = {
  insight: {
    id: string;
    title: string;
    evidence: string[];
    recommendedFixes: string[];
    experimentPlan: Record<string, unknown>;
    filters: { drivers?: string[] };
  };
  targeting: Record<string, string>;
  comparison: {
    baselineConversion: number;
    segmentConversion: number;
    baselineAbandonment: number;
    segmentAbandonment: number;
    volume: number;
  };
  breakdownByDevice: Array<{ label: string; conversion: number; abandonment: number }>;
  funnelSummary: Array<{ step: string; baseline: number; segment: number }>;
};

export default function RootCauseDetailClient({
  insight,
  targeting,
  comparison,
  breakdownByDevice,
  funnelSummary
}: DetailProps) {
  const targetingList = useMemo(() => Object.entries(targeting), [targeting]);

  function downloadJson() {
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
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-600">Root cause detail</p>
          <h1 className="text-2xl font-semibold text-slate-900">{insight.title}</h1>
          <p className="text-sm text-slate-500">Segment volume: {comparison.volume} sessions</p>
        </div>
        <GhostButton onClick={downloadJson}>Download experiment JSON</GhostButton>
      </div>

      <Card>
        <h2 className="text-lg font-semibold">What changed</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-700">Baseline conversion</p>
            <p className="text-2xl font-semibold">{comparison.baselineConversion.toFixed(1)}%</p>
            <p className="text-sm text-slate-500">Abandonment: {comparison.baselineAbandonment.toFixed(1)}%</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-emerald-50 p-4">
            <p className="text-sm font-semibold text-emerald-700">Segment conversion</p>
            <p className="text-2xl font-semibold">{comparison.segmentConversion.toFixed(1)}%</p>
            <p className="text-sm text-emerald-700">Abandonment: {comparison.segmentAbandonment.toFixed(1)}%</p>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-lg font-semibold">Breakdown by device</h2>
          <table className="mt-4 w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-400">
              <tr>
                <th className="py-2">Device</th>
                <th className="py-2">Conversion</th>
                <th className="py-2">Abandonment</th>
              </tr>
            </thead>
            <tbody>
              {breakdownByDevice.map((row) => (
                <tr key={row.label} className="border-t border-slate-100">
                  <td className="py-2 font-medium text-slate-700">{row.label}</td>
                  <td className="py-2">{row.conversion.toFixed(1)}%</td>
                  <td className="py-2">{row.abandonment.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <Card>
          <h2 className="text-lg font-semibold">Funnel drop-off highlights</h2>
          <div className="mt-4 space-y-3">
            {funnelSummary.map((row) => (
              <div key={row.step} className="rounded-xl border border-slate-100 p-3">
                <p className="text-sm font-semibold text-slate-700">{row.step.replace(/_/g, ' ')}</p>
                <p className="text-xs text-slate-500">
                  Segment: {row.segment} sessions · Baseline: {row.baseline} sessions
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-lg font-semibold">Evidence</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600">
            {insight.evidence.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Card>
        <Card>
          <h2 className="text-lg font-semibold">Top drivers</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600">
            {(insight.filters.drivers || []).map((driver) => (
              <li key={driver}>{driver}</li>
            ))}
          </ul>
        </Card>
      </div>

      <Card>
        <h2 className="text-lg font-semibold">Experiment plan JSON</h2>
        <pre className="mt-4 max-h-96 overflow-auto rounded-2xl bg-slate-900 p-4 text-xs text-slate-100">
          {JSON.stringify(insight.experimentPlan, null, 2)}
        </pre>
      </Card>

      <div className="flex flex-wrap gap-3">
        {targetingList.map(([key, value]) => (
          <span key={key} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            {key}: {value}
          </span>
        ))}
      </div>
    </div>
  );
}
