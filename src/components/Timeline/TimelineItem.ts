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
    iconName?: string; // Changed from icon: ReactNode to iconName: string
    link?: {
        url: string;
        text: string;
    };
}
