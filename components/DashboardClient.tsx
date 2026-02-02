'use client';

import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Button, GhostButton, Card } from './ui';

type MetricProps = {
  checkoutStarts: number;
  conversionRate: number;
  abandonmentRate: number;
  paymentFailRate: number;
  prepaidShare: number;
  aov: number;
};

type TrendPoint = {
  date: string;
  conversion: number;
  abandonment: number;
  paymentFailures: number;
};

type Anomaly = {
  label: string;
  delta: number;
  current: number;
  previous: number;
};

export default function DashboardClient({
  metrics,
  trends,
  anomalies
}: {
  metrics: MetricProps;
  trends: TrendPoint[];
  anomalies: Anomaly[];
}) {
  const [status, setStatus] = useState<string | null>(null);

  async function handleSeed() {
    setStatus('Seeding demo data...');
    const response = await fetch('/api/seed', { method: 'POST' });
    const data = await response.json();
    setStatus(`Seeded ${data.seeded} sessions, ${data.insights} insights`);
    window.location.reload();
  }

  async function handleRecompute() {
    setStatus('Recomputing insights...');
    const response = await fetch('/api/insights/recompute', { method: 'POST' });
    const data = await response.json();
    setStatus(`Generated ${data.insights} insights`);
    window.location.reload();
  }

  const tiles = [
    { label: 'Checkout starts', value: metrics.checkoutStarts.toLocaleString() },
    { label: 'Conversion %', value: `${metrics.conversionRate.toFixed(1)}%` },
    { label: 'Abandonment %', value: `${metrics.abandonmentRate.toFixed(1)}%` },
    { label: 'Payment failure %', value: `${metrics.paymentFailRate.toFixed(1)}%` },
    { label: 'Prepaid share %', value: `${metrics.prepaidShare.toFixed(1)}%` },
    { label: 'AOV', value: `₹${metrics.aov.toFixed(0)}` }
  ];

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 rounded-3xl bg-gradient-to-br from-emerald-50 via-white to-slate-50 p-6 shadow-soft">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Checkout Command Center</h1>
            <p className="text-sm text-slate-500">
              Shopflo-style analytics with AI RCA copilot for drop-off recovery.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleSeed}>Seed Demo Data</Button>
            <GhostButton onClick={handleRecompute}>Recompute Insights</GhostButton>
          </div>
        </div>
        {status && <p className="text-sm font-medium text-emerald-700">{status}</p>}
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {tiles.map((tile) => (
          <Card key={tile.label} className="flex flex-col gap-2">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{tile.label}</p>
            <p className="text-2xl font-semibold text-slate-900">{tile.value}</p>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Daily trend lines</h2>
              <p className="text-sm text-slate-500">Conversion, abandonment and payment failures.</p>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="conversion" stroke="#10b981" strokeWidth={2} />
                <Line type="monotone" dataKey="abandonment" stroke="#f97316" strokeWidth={2} />
                <Line type="monotone" dataKey="paymentFailures" stroke="#ef4444" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <h2 className="text-lg font-semibold">Today’s anomalies</h2>
          <p className="text-sm text-slate-500">Last 2 days vs previous 5 days.</p>
          <div className="mt-4 space-y-4">
            {anomalies.map((anomaly) => (
              <div key={anomaly.label} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <p className="text-sm font-semibold text-slate-700">{anomaly.label}</p>
                <p className="text-lg font-semibold text-slate-900">
                  {anomaly.current.toFixed(1)}%{' '}
                  <span className={anomaly.delta > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                    ({anomaly.delta > 0 ? '+' : ''}
                    {anomaly.delta.toFixed(1)}%)
                  </span>
                </p>
                <p className="text-xs text-slate-500">Prev: {anomaly.previous.toFixed(1)}%</p>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
}
