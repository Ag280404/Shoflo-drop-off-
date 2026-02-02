import SessionsClient from '@/components/SessionsClient';
import { getSessionsPage } from '@/lib/analytics';

export default async function SessionsPage({
  searchParams
}: {
  searchParams: { page?: string };
}) {
  const page = Number(searchParams.page || '1');
  const data = await getSessionsPage(page);

  const sessions = data.sessions.map((session) => ({
    ...session,
    startedAt: session.startedAt.toISOString(),
    events: session.events.map((event) => ({
      ...event,
      ts: event.ts.toISOString()
    }))
  }));

  return <SessionsClient sessions={sessions} page={data.page} totalPages={data.totalPages} />;
}
