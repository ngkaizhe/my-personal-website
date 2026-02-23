'use client';

import React from 'react';
import { GraduationCap, Briefcase, Code, Trophy, LucideIcon } from 'lucide-react';

interface TimelineIconProps {
    iconName?: string;
    className?: string;
}

const iconMap: Record<string, LucideIcon> = {
    'GraduationCap': GraduationCap,
    'Briefcase': Briefcase,
    'Code': Code,
    'Trophy': Trophy,
};

export const TimelineIcon: React.FC<TimelineIconProps> = ({ iconName, className }) => {
    const IconComponent = iconName ? iconMap[iconName] : null;

    if (!IconComponent) {
        return <Code className={className} />; // Default Icon
    }

    return <IconComponent className={className} />;
};
