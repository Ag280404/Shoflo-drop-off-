import SegmentExplorerClient from '@/components/SegmentExplorerClient';
import { getSegmentStats } from '@/lib/analytics';

export default async function SegmentsPage() {
  const data = await getSegmentStats();
  return <SegmentExplorerClient data={data} />;
}
