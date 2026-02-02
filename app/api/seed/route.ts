import { NextResponse } from 'next/server';
import { seedDemoData } from '@/lib/seed';
import { recomputeInsights } from '@/lib/insights';

export async function POST() {
  const result = await seedDemoData();
  const insights = await recomputeInsights();
  return NextResponse.json({ seeded: result.sessions, insights: insights.count });
}
