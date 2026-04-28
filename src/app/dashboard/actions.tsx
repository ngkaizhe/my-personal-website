'use server';

import { getCurrentUserId } from '@/lib/currentUser';
import { fetchTimelineByUserId } from '@/lib/timeline';
import type { TimelineItem } from '@/lib/types';

export async function getTimelineItems(): Promise<TimelineItem[]> {
    const userId = await getCurrentUserId();
    return fetchTimelineByUserId(userId);
}
