import { prisma } from './prisma';
import { getCartBucket, getPincodeBucket } from './seed';

export async function getInsightDetail(id: string) {
  const insight = await prisma.insight.findUnique({ where: { id } });
  if (!insight) return null;

  const targeting = (insight.filters as { targeting?: Record<string, string> })?.targeting || {};
  const sessions = await prisma.session.findMany({ include: { events: true } });

  const matches = sessions.filter((session) =>
    Object.entries(targeting).every(([key, value]) => {
      if (key === 'cartValue') return getCartBucket(session.cartValue) === value;
      if (key === 'pincode') return getPincodeBucket(session.pincode) === value;
      return String(session[key as keyof typeof session]) === String(value);
    })
  );

  const baseline = sessions;

  const baselineConversion = baseline.filter((s) => s.outcome === 'converted').length / baseline.length;
  const segmentConversion = matches.filter((s) => s.outcome === 'converted').length / (matches.length || 1);
  const baselineAbandonment = baseline.filter((s) => s.outcome === 'abandoned').length / baseline.length;
  const segmentAbandonment = matches.filter((s) => s.outcome === 'abandoned').length / (matches.length || 1);

  const breakdownByDevice = ['android', 'ios', 'web'].map((device) => {
    const group = matches.filter((s) => s.device === device);
    const total = group.length || 1;
    return {
      label: device,
      conversion: (group.filter((s) => s.outcome === 'converted').length / total) * 100,
      abandonment: (group.filter((s) => s.outcome === 'abandoned').length / total) * 100
    };
  });

  const funnel = ['checkout_started', 'address_added', 'payment_method_selected', 'payment_attempt', 'converted'];
  const baselineCounts = funnel.map((step) => baseline.filter((s) => s.events.some((e) => e.type === step)).length);
  const segmentCounts = funnel.map((step) => matches.filter((s) => s.events.some((e) => e.type === step)).length);

  const funnelSummary = funnel.map((step, index) => ({
    step,
    baseline: baselineCounts[index],
    segment: segmentCounts[index]
  }));

  return {
    insight,
    targeting,
    comparison: {
      baselineConversion: baselineConversion * 100,
      segmentConversion: segmentConversion * 100,
      baselineAbandonment: baselineAbandonment * 100,
      segmentAbandonment: segmentAbandonment * 100,
      volume: matches.length
    },
    breakdownByDevice,
    funnelSummary
  };
}
