export type ExperienceType = 'JOB' | 'EDUCATION' | 'PROJECT' | 'VOLUNTEER' | 'BREAK';

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
        text: string;
        colorClass: string;
    };
    actionVerb?: string;
    description: string;
    impact?: string;
    details?: string;
    techStack: string[];
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
}
