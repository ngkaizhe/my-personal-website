'use client';

import { useMemo } from 'react';
import { DynamicIcon } from 'lucide-react/dynamic';
import { LucideProps } from 'lucide-react';

interface TimelineIconProps extends LucideProps {
    iconName: string;
}

export const TimelineIcon = ({ iconName, ...props }: TimelineIconProps) => {
    // Convert PascalCase/CamelCase to kebab-case (e.g., GraduationCap -> graduation-cap)
    // as expected by the Lucide DynamicIcon component
    const formattedName = useMemo(() => {
        const name = iconName
            .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
            .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
            .toLowerCase();

        return name;
    }, [iconName]);

    return <DynamicIcon name={formattedName as any} {...props} />;
};
