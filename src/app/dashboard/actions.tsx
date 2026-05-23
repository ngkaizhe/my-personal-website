'use server';

import { getLocale } from 'next-intl/server';
import { getCurrentUserId } from '@/lib/currentUser';
import { fetchTimelineByUserId } from '@/lib/timeline';
import type { TimelineItem } from '@/lib/types';

export async function getTimelineItems(): Promise<TimelineItem[]> {
    const userId = await getCurrentUserId();
    const locale = await getLocale();
    return fetchTimelineByUserId(userId, locale);
}
