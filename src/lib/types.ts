// Sourced from the Prisma enum so a schema change (new experience type) flows
// into the DTO layer automatically instead of silently drifting. Imported as
// well as re-exported because TimelineItem below references it locally.
import type { ExperienceType } from '@prisma/client';

export type { ExperienceType };

// Display-layer Timeline DTO. Already collapsed to a single locale by the
// query helper (via pickTranslation) — the consumer doesn't need to think
// about translations or fallback.
export interface TimelineItem {
    id: string;
    date: string;           // ISO date string for display formatting
    year: {
        content: string;    // YYYY derived from date for compact display
        colorClass: string;
    };
    title: {
        content: string;
        colorClass: string;
    };
    category: {
        text: string;       // tag display label in the active locale
        colorClass: string;
    };
    actionVerb?: string;
    description: string;
    impact?: string;
    details?: string;
    techStack: string[];
    attachmentUrls: string[];
    iconName: string;
    experience?: {
        id: string;
        type: ExperienceType;
        organization: string;
        role: string | null;
    };
    link?: {
        url: string;
        text: string;
    };
    // True when the current locale has no translation row for this entry —
    // we fell back to the primary locale. UI can flag this so viewers know
    // they're seeing a non-translated source.
    fellBackFromPrimary?: boolean;
}
