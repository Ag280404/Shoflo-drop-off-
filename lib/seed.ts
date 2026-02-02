import { prisma } from './prisma';
import { addDays, addMinutes } from './time';

const cities = ['Mumbai', 'Delhi', 'Bengaluru', 'Hyderabad', 'Pune', 'Chennai'];
const pincodes = ['400001', '400078', '560034', '560102', '110001', '110045', '500081', '500032'];
const couponStatuses = ['none', 'applied', 'invalid'];
const modules = ['address_autofill', 'promo_banner', 'shipping_eta', 'trust_badges', 'upi_offer'];

function pick<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function weightedPick<T>(pairs: Array<[T, number]>) {
  const total = pairs.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = Math.random() * total;
  for (const [value, weight] of pairs) {
    if (roll < weight) return value;
    roll -= weight;
  }
  return pairs[pairs.length - 1][0];
}

function pincodeBucket(pincode: string) {
  const prefix = pincode.slice(0, 2);
  return `${prefix}xxx`;
}

export async function seedDemoData() {
  await prisma.event.deleteMany();
  await prisma.session.deleteMany();
  await prisma.insight.deleteMany();

  const totalSessions = 7500;
  const days = 14;
  const baseDate = addDays(new Date(), -13);

  const sessionsData = [] as Parameters<typeof prisma.session.createMany>[0]['data'];
  const eventsData: Parameters<typeof prisma.event.createMany>[0]['data'] = [];

  for (let i = 0; i < totalSessions; i += 1) {
    const dayOffset = Math.floor(Math.random() * days);
    const startedAt = addMinutes(addDays(baseDate, dayOffset), Math.floor(Math.random() * 1440));
    const isRecent = dayOffset >= 12; // last 2 days

    const userType = weightedPick([
      ['new', 0.55],
      ['returning', 0.45]
    ]) as 'new' | 'returning';

    const device = weightedPick([
      ['android', 0.55],
      ['ios', 0.2],
      ['web', 0.25]
    ]) as 'android' | 'ios' | 'web';

    const paymentMethod = weightedPick([
      ['upi_intent', 0.35],
      ['upi_collect', 0.15],
      ['card', 0.25],
      ['netbanking', 0.1],
      ['cod', 0.15]
    ]) as 'upi_intent' | 'upi_collect' | 'card' | 'netbanking' | 'cod';

    const gateway = weightedPick([
      ['g1', 0.45],
      ['g2', 0.35],
      ['g3', 0.2]
    ]) as 'g1' | 'g2' | 'g3';

    const shippingEtaShown = Math.random() > 0.35;
    const cartValue = Math.floor(weightedPick([
      [799, 0.25],
      [1299, 0.25],
      [1999, 0.2],
      [3499, 0.15],
      [5999, 0.1],
      [8999, 0.05]
    ]));

    const couponStatus = weightedPick([
      ['none', 0.5],
      ['applied', 0.35],
      ['invalid', 0.15]
    ]);

    const prepaid = paymentMethod !== 'cod';
    const city = pick(cities);
    const pincode = pick(pincodes);
    const modulesUsed = [
      'address_autofill',
      'trust_badges',
      ...(shippingEtaShown ? ['shipping_eta'] : []),
      ...(couponStatus === 'applied' ? ['promo_banner'] : [])
    ];

    let outcome: 'converted' | 'payment_failed' | 'abandoned' = 'converted';

    let abandonChance = 0.12;
    let paymentFailChance = 0.06;

    if (couponStatus === 'invalid') {
      abandonChance += 0.18;
    }

    if (userType === 'new' && paymentMethod === 'cod' && !shippingEtaShown) {
      abandonChance += 0.22;
    }

    if (cartValue >= 6000 && prepaid) {
      paymentFailChance += 0.05;
    }

    if (cartValue >= 6000 && !prepaid) {
      abandonChance += 0.2;
    }

    if (paymentMethod === 'upi_intent' && device === 'android' && gateway === 'g1' && isRecent) {
      paymentFailChance += 0.35;
    }

    if (paymentMethod === 'cod' && ['400078', '500081'].includes(pincode)) {
      abandonChance += 0.12;
    }

    const roll = Math.random();
    if (roll < paymentFailChance) {
      outcome = 'payment_failed';
    } else if (roll < paymentFailChance + abandonChance) {
      outcome = 'abandoned';
    }

    const orderValue = outcome === 'converted' ? cartValue : 0;

    sessionsData.push({
      startedAt,
      userType,
      city,
      pincode,
      device,
      cartValue,
      shippingEtaShown,
      paymentMethod,
      gateway,
      couponStatus,
      modulesUsed,
      outcome,
      prepaid,
      orderValue
    });
  }

  const created = await prisma.session.createMany({ data: sessionsData });

  const sessions = await prisma.session.findMany({ select: { id: true, startedAt: true, outcome: true, couponStatus: true } });

  for (const session of sessions) {
    const base = session.startedAt;
    const events = [
      { type: 'checkout_started', ts: base, meta: { step: 'checkout' } },
      { type: 'address_added', ts: addMinutes(base, 2), meta: { step: 'address' } },
      { type: 'payment_method_selected', ts: addMinutes(base, 4), meta: { step: 'payment_method', couponStatus: session.couponStatus } }
    ];

    if (session.outcome === 'abandoned') {
      events.push({ type: 'abandoned', ts: addMinutes(base, 6), meta: { reason: 'drop_off' } });
    } else {
      events.push({ type: 'payment_attempt', ts: addMinutes(base, 6), meta: { step: 'payment_attempt' } });
      if (session.outcome === 'payment_failed') {
        events.push({ type: 'payment_failed', ts: addMinutes(base, 7), meta: { code: 'PMT_FAIL' } });
      } else {
        events.push({ type: 'converted', ts: addMinutes(base, 8), meta: { orderStatus: 'success' } });
      }
    }

    for (const event of events) {
      eventsData.push({
        sessionId: session.id,
        type: event.type,
        ts: event.ts,
        meta: event.meta
      });
    }
  }

  await prisma.event.createMany({ data: eventsData });

  return { sessions: created.count };
}

export function getCartBucket(cartValue: number) {
  if (cartValue < 1000) return '<1k';
  if (cartValue < 2000) return '1k-2k';
  if (cartValue < 4000) return '2k-4k';
  if (cartValue < 6000) return '4k-6k';
  return '6k+';
}

export function getPincodeBucket(code: string) {
  return pincodeBucket(code);
}
