import { prisma } from './prisma';
import { formatDate } from './time';
import { getCartBucket, getPincodeBucket } from './seed';
import { generateLLMInsight } from './llm';

export type InsightDraft = {
  segmentLabel: string;
  targeting: Record<string, string | number>;
  window: { start: string; end: string };
  metrics: {
    metricLabel: string;
    lift: number;
    baselineRate: number;
    segmentRate: number;
    segmentVolume: number;
  };
  drivers: string[];
};

type SessionLite = {
  id: string;
  startedAt: Date;
  userType: string;
  device: string;
  paymentMethod: string;
  gateway: string;
  cartValue: number;
  shippingEtaShown: boolean;
  couponStatus: string;
  prepaid: boolean;
  outcome: string;
  pincode: string;
};

function rateFor(sessions: SessionLite[], predicate: (s: SessionLite) => boolean) {
  if (!sessions.length) return 0;
  return (sessions.filter(predicate).length / sessions.length) * 100;
}

function calcDrivers(sessions: SessionLite[]) {
  const baseline = rateFor(sessions, (s) => s.outcome === 'abandoned');
  const features: Array<[string, (s: SessionLite) => string]> = [
    ['Device', (s) => s.device],
    ['User type', (s) => s.userType],
    ['Payment method', (s) => s.paymentMethod],
    ['Gateway', (s) => s.gateway],
    ['Shipping ETA shown', (s) => (s.shippingEtaShown ? 'Yes' : 'No')],
    ['Coupon status', (s) => s.couponStatus],
    ['Prepaid', (s) => (s.prepaid ? 'Yes' : 'No')],
    ['Cart bucket', (s) => getCartBucket(s.cartValue)]
  ];

  const drivers: string[] = [];

  for (const [label, fn] of features) {
    const grouped: Record<string, SessionLite[]> = {};
    for (const session of sessions) {
      const key = fn(session);
      grouped[key] = grouped[key] || [];
      grouped[key].push(session);
    }
    const sorted = Object.entries(grouped)
      .map(([key, group]) => ({
        key,
        lift: rateFor(group, (s) => s.outcome === 'abandoned') - baseline
      }))
      .sort((a, b) => b.lift - a.lift)[0];
    if (sorted && sorted.lift > 2) {
      drivers.push(`${label}: ${sorted.key} (+${sorted.lift.toFixed(1)}% abandonment lift)`);
    }
  }

  return drivers.slice(0, 4);
}

function segmentKey(session: SessionLite, key: string) {
  switch (key) {
    case 'device':
      return session.device;
    case 'userType':
      return session.userType;
    case 'paymentMethod':
      return session.paymentMethod;
    case 'gateway':
      return session.gateway;
    case 'cartValue':
      return getCartBucket(session.cartValue);
    case 'pincode':
      return getPincodeBucket(session.pincode);
    default:
      return 'unknown';
  }
}

export async function recomputeInsights() {
  const sessions = (await prisma.session.findMany()) as SessionLite[];

  if (!sessions.length) return { count: 0 };

  const windowStart = sessions.reduce((min, s) => (s.startedAt < min ? s.startedAt : min), sessions[0].startedAt);
  const windowEnd = sessions.reduce((max, s) => (s.startedAt > max ? s.startedAt : max), sessions[0].startedAt);

  const baselineConversion = rateFor(sessions, (s) => s.outcome === 'converted');
  const baselineAbandonment = rateFor(sessions, (s) => s.outcome === 'abandoned');
  const baselinePaymentFail = rateFor(sessions, (s) => s.outcome === 'payment_failed');

  const segments = ['device', 'userType', 'paymentMethod', 'gateway', 'cartValue', 'pincode'];
  const drafts: InsightDraft[] = [];

  const drivers = calcDrivers(sessions);

  for (const segment of segments) {
    const grouped: Record<string, SessionLite[]> = {};
    for (const session of sessions) {
      const key = segmentKey(session, segment);
      grouped[key] = grouped[key] || [];
      grouped[key].push(session);
    }

    for (const [value, group] of Object.entries(grouped)) {
      if (group.length < 120) continue;
      const conversionRate = rateFor(group, (s) => s.outcome === 'converted');
      const abandonmentRate = rateFor(group, (s) => s.outcome === 'abandoned');
      const paymentFailRate = rateFor(group, (s) => s.outcome === 'payment_failed');

      const metrics = [
        {
          label: 'Abandonment',
          segmentRate: abandonmentRate,
          baselineRate: baselineAbandonment
        },
        {
          label: 'Payment failures',
          segmentRate: paymentFailRate,
          baselineRate: baselinePaymentFail
        },
        {
          label: 'Conversion',
          segmentRate: conversionRate,
          baselineRate: baselineConversion
        }
      ];

      for (const metric of metrics) {
        const lift = metric.segmentRate - metric.baselineRate;
        if (Math.abs(lift) < 3) continue;
        const impactScore = (lift / 100) * group.length;
        drafts.push({
          segmentLabel: `${segment} = ${value}`,
          targeting: {
            [segment]: value
          },
          window: { start: formatDate(windowStart), end: formatDate(windowEnd) },
          metrics: {
            metricLabel: metric.label,
            lift,
            baselineRate: metric.baselineRate,
            segmentRate: metric.segmentRate,
            segmentVolume: group.length
          },
          drivers
        });
      }
    }
  }

  const sortedDrafts = drafts.sort((a, b) => Math.abs(b.metrics.lift) * b.metrics.segmentVolume - Math.abs(a.metrics.lift) * a.metrics.segmentVolume);

  const selectedDrafts = sortedDrafts.slice(0, 10);

  await prisma.insight.deleteMany();

  for (const draft of selectedDrafts) {
    const llm = await generateLLMInsight(draft);
    await prisma.insight.create({
      data: {
        windowStart,
        windowEnd,
        filters: {
          segment: draft.segmentLabel,
          targeting: draft.targeting,
          drivers: draft.drivers,
          metricLabel: draft.metrics.metricLabel,
          lift: draft.metrics.lift
        },
        title: llm.title,
        evidence: llm.evidence,
        impactScore: Math.abs(draft.metrics.lift) * draft.metrics.segmentVolume,
        recommendedFixes: llm.recommendedFixes,
        experimentPlan: llm.experimentPlan,
        status: 'new'
      }
    });
  }

  return { count: selectedDrafts.length };
}

export function computeAnomalies(sessions: SessionLite[]) {
  const now = new Date();
  const recent = sessions.filter((s) => now.getTime() - s.startedAt.getTime() <= 2 * 24 * 60 * 60 * 1000);
  const previous = sessions.filter(
    (s) => now.getTime() - s.startedAt.getTime() > 2 * 24 * 60 * 60 * 1000 && now.getTime() - s.startedAt.getTime() <= 7 * 24 * 60 * 60 * 1000
  );

  const metrics = [
    {
      label: 'Conversion',
      value: rateFor(recent, (s) => s.outcome === 'converted'),
      previous: rateFor(previous, (s) => s.outcome === 'converted')
    },
    {
      label: 'Abandonment',
      value: rateFor(recent, (s) => s.outcome === 'abandoned'),
      previous: rateFor(previous, (s) => s.outcome === 'abandoned')
    },
    {
      label: 'Payment failures',
      value: rateFor(recent, (s) => s.outcome === 'payment_failed'),
      previous: rateFor(previous, (s) => s.outcome === 'payment_failed')
    }
  ];

  return metrics.map((metric) => ({
    label: metric.label,
    delta: metric.value - metric.previous,
    current: metric.value,
    previous: metric.previous
  }));
}
