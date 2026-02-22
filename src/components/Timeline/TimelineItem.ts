import { ReactNode } from 'react';

export interface TimelineItem {
    year: {
        content: string;
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
    techStack: string[];
    description: string;
    details?: string;
    icon?: ReactNode;
    link?: {
        url: string;
        text: string;
    };
}
