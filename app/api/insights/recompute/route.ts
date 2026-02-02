import { NextResponse } from 'next/server';
import { recomputeInsights } from '@/lib/insights';

export async function POST() {
  const result = await recomputeInsights();
  return NextResponse.json({ insights: result.count });
}
