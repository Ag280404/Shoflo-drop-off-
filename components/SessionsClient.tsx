'use client';

import { useState } from 'react';
import { Card } from './ui';

type Event = {
  id: string;
  type: string;
  ts: string;
  meta: Record<string, unknown>;
};

type Session = {
  id: string;
  startedAt: string;
  userType: string;
  device: string;
  paymentMethod: string;
  gateway: string;
  cartValue: number;
  outcome: string;
  prepaid: boolean;
  events: Event[];
};

export default function SessionsClient({
  sessions,
  page,
  totalPages
}: {
  sessions: Session[];
  page: number;
  totalPages: number;
}) {
  const [selected, setSelected] = useState<Session | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Checkout sessions</h1>
        <p className="text-sm text-slate-500">Paginated list with event timelines.</p>
      </div>

      <Card>
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase text-slate-400">
            <tr>
              <th className="py-2">Session</th>
              <th className="py-2">Device</th>
              <th className="py-2">Payment</th>
              <th className="py-2">Cart</th>
              <th className="py-2">Outcome</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((session) => (
              <tr
                key={session.id}
                className="cursor-pointer border-t border-slate-100 hover:bg-slate-50"
                onClick={() => setSelected(session)}
              >
                <td className="py-2">
                  <p className="font-medium text-slate-700">{session.id.slice(0, 8)}</p>
                  <p className="text-xs text-slate-400">{new Date(session.startedAt).toLocaleString()}</p>
                </td>
                <td className="py-2">{session.device}</td>
                <td className="py-2">{session.paymentMethod} · {session.gateway}</td>
                <td className="py-2">₹{session.cartValue}</td>
                <td className="py-2 capitalize">{session.outcome.replace('_', ' ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div className="flex items-center justify-between text-sm text-slate-500">
        <p>
          Page {page} of {totalPages}
        </p>
        <div className="flex gap-3">
          {page > 1 && (
            <a
              className="rounded-full border border-slate-200 px-3 py-1"
              href={`/sessions?page=${page - 1}`}
            >
              Prev
            </a>
          )}
          {page < totalPages && (
            <a className="rounded-full border border-slate-200 px-3 py-1" href={`/sessions?page=${page + 1}`}>
              Next
            </a>
          )}
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-soft">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold">Session {selected.id.slice(0, 8)}</h3>
                <p className="text-sm text-slate-500">{new Date(selected.startedAt).toLocaleString()}</p>
              </div>
              <button className="text-sm font-semibold text-slate-400" onClick={() => setSelected(null)}>
                Close
              </button>
            </div>
            <div className="mt-4 grid gap-3 text-sm">
              <p>
                <span className="font-semibold">Metadata:</span> {selected.device}, {selected.userType}, {selected.paymentMethod}{' '}
                / {selected.gateway}, prepaid {selected.prepaid ? 'yes' : 'no'}
              </p>
              <div>
                <p className="text-sm font-semibold">Event timeline</p>
                <ul className="mt-2 space-y-2">
                  {selected.events.map((event) => (
                    <li key={event.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                      <p className="text-sm font-semibold text-slate-700">{event.type}</p>
                      <p className="text-xs text-slate-500">{new Date(event.ts).toLocaleTimeString()}</p>
                      <pre className="mt-2 text-xs text-slate-500">
                        {JSON.stringify(event.meta, null, 2)}
                      </pre>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
