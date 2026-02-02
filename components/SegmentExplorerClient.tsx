'use client';

import { useState } from 'react';
import { Card } from './ui';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export type SegmentStat = {
  label: string;
  sessions: number;
  conversion: number;
  abandonment: number;
  paymentFailures: number;
};

type SegmentData = Record<string, SegmentStat[]>;

export default function SegmentExplorerClient({ data }: { data: SegmentData }) {
  const [selected, setSelected] = useState<SegmentStat | null>(null);
  const [dimension, setDimension] = useState<string>('device');

  const stats = data[dimension] || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Segment explorer</h1>
          <p className="text-sm text-slate-500">Inspect conversion, abandonment and payment failures by segment.</p>
        </div>
        <select
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm"
          value={dimension}
          onChange={(event) => setDimension(event.target.value)}
        >
          {Object.keys(data).map((key) => (
            <option key={key} value={key}>
              {key}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-lg font-semibold">Segment performance</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats} margin={{ left: -10, right: 10 }}>
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="conversion" fill="#10b981" radius={[6, 6, 0, 0]} />
                <Bar dataKey="abandonment" fill="#f97316" radius={[6, 6, 0, 0]} />
                <Bar dataKey="paymentFailures" fill="#ef4444" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <h2 className="text-lg font-semibold">Segment table</h2>
          <table className="mt-4 w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-400">
              <tr>
                <th className="py-2">Segment</th>
                <th className="py-2">Sessions</th>
                <th className="py-2">Conversion</th>
                <th className="py-2">Abandonment</th>
                <th className="py-2">Payment fail</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((row) => (
                <tr
                  key={row.label}
                  className="cursor-pointer border-t border-slate-100 hover:bg-slate-50"
                  onClick={() => setSelected(row)}
                >
                  <td className="py-2 font-medium text-slate-700">{row.label}</td>
                  <td className="py-2">{row.sessions}</td>
                  <td className="py-2">{row.conversion.toFixed(1)}%</td>
                  <td className="py-2">{row.abandonment.toFixed(1)}%</td>
                  <td className="py-2">{row.paymentFailures.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      {selected && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-soft">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold">{dimension} · {selected.label}</h3>
                <p className="text-sm text-slate-500">Session volume: {selected.sessions}</p>
              </div>
              <button
                type="button"
                className="text-sm font-semibold text-slate-400"
                onClick={() => setSelected(null)}
              >
                Close
              </button>
            </div>
            <div className="mt-4 grid gap-3 text-sm">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                Conversion: <span className="font-semibold">{selected.conversion.toFixed(1)}%</span>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                Abandonment: <span className="font-semibold">{selected.abandonment.toFixed(1)}%</span>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                Payment failures: <span className="font-semibold">{selected.paymentFailures.toFixed(1)}%</span>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                Top drivers: Coupon friction, ETA missing, gateway latency
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
