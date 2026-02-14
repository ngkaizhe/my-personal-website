import { ReactNode } from 'react';

export class TimelineItem {
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

    constructor(data: {
        year: { content: string; colorClass: string };
        title: { content: string; colorClass: string };
        category: { text: string; colorClass: string };
        description: string;
        techStack?: string[];
        details?: string;
        icon?: ReactNode;
        link?: { url: string; text: string };
    }) {
        this.year = data.year;
        this.title = data.title;
        this.category = data.category;
        this.description = data.description;
        this.techStack = data.techStack || [];
        this.details = data.details;
        this.icon = data.icon;
        this.link = data.link;
    }
}
