import { prisma } from './prisma';
import { formatDate } from './time';
import { getCartBucket, getPincodeBucket } from './seed';

export async function getDashboardMetrics() {
  const sessions = await prisma.session.findMany();
  const total = sessions.length || 1;
  const converted = sessions.filter((s) => s.outcome === 'converted');
  const abandoned = sessions.filter((s) => s.outcome === 'abandoned');
  const paymentFailed = sessions.filter((s) => s.outcome === 'payment_failed');

  const conversionRate = (converted.length / total) * 100;
  const abandonmentRate = (abandoned.length / total) * 100;
  const paymentFailRate = (paymentFailed.length / total) * 100;
  const prepaidShare = (sessions.filter((s) => s.prepaid).length / total) * 100;
  const aov = converted.length ? converted.reduce((sum, s) => sum + s.orderValue, 0) / converted.length : 0;

  return {
    checkoutStarts: total,
    conversionRate,
    abandonmentRate,
    paymentFailRate,
    prepaidShare,
    aov
  };
}

export async function getDailyTrends() {
  const sessions = await prisma.session.findMany();
  const grouped: Record<string, typeof sessions> = {};
  sessions.forEach((session) => {
    const key = formatDate(session.startedAt);
    grouped[key] = grouped[key] || [];
    grouped[key].push(session);
  });

  const dates = Object.keys(grouped).sort();

  return dates.map((date) => {
    const day = grouped[date];
    const total = day.length || 1;
    return {
      date,
      conversion: (day.filter((s) => s.outcome === 'converted').length / total) * 100,
      abandonment: (day.filter((s) => s.outcome === 'abandoned').length / total) * 100,
      paymentFailures: (day.filter((s) => s.outcome === 'payment_failed').length / total) * 100
    };
  });
}

export async function getSegmentStats() {
  const sessions = await prisma.session.findMany();
  const byDimension = {
    device: (s: typeof sessions[number]) => s.device,
    userType: (s: typeof sessions[number]) => s.userType,
    paymentMethod: (s: typeof sessions[number]) => s.paymentMethod,
    gateway: (s: typeof sessions[number]) => s.gateway,
    cartValue: (s: typeof sessions[number]) => getCartBucket(s.cartValue),
    pincode: (s: typeof sessions[number]) => getPincodeBucket(s.pincode),
    city: (s: typeof sessions[number]) => s.city
  };

  const result: Record<string, Array<{
    label: string;
    sessions: number;
    conversion: number;
    abandonment: number;
    paymentFailures: number;
  }>> = {};

  for (const [dimension, fn] of Object.entries(byDimension)) {
    const grouped: Record<string, typeof sessions> = {};
    sessions.forEach((session) => {
      const key = fn(session);
      grouped[key] = grouped[key] || [];
      grouped[key].push(session);
    });
    result[dimension] = Object.entries(grouped).map(([label, group]) => {
      const total = group.length || 1;
      return {
        label,
        sessions: group.length,
        conversion: (group.filter((s) => s.outcome === 'converted').length / total) * 100,
        abandonment: (group.filter((s) => s.outcome === 'abandoned').length / total) * 100,
        paymentFailures: (group.filter((s) => s.outcome === 'payment_failed').length / total) * 100
      };
    });
  }

  return result;
}

export async function getSessionsPage(page: number) {
  const take = 100;
  const skip = (page - 1) * take;
  const [sessions, total] = await Promise.all([
    prisma.session.findMany({
      orderBy: { startedAt: 'desc' },
      skip,
      take,
      include: { events: true }
    }),
    prisma.session.count()
  ]);

  return {
    sessions,
    total,
    page,
    totalPages: Math.ceil(total / take)
  };
}
