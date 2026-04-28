'use server';

import { getCurrentUserId } from '@/lib/currentUser';
import { fetchResumeByUserId, type ResumeData } from '@/lib/resume';

export type { ResumeData, ResumeExperience, ResumeEntry } from '@/lib/resume';

export async function getResumeData(): Promise<ResumeData> {
    const userId = await getCurrentUserId();
    return fetchResumeByUserId(userId);
}
