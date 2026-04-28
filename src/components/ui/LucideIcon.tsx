'use client';

import { useMemo } from 'react';
import { DynamicIcon, type IconName } from 'lucide-react/dynamic';
import type { LucideProps } from 'lucide-react';
import { iconNames } from '@/lib/iconNames';

interface LucideIconProps extends LucideProps {
    iconName: string;
}

const validNames = new Set<string>(iconNames);

export const LucideIcon = ({ iconName, ...props }: LucideIconProps) => {
    const resolvedName = useMemo(() => {
        const kebab = iconName
            .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
            .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
            .toLowerCase();
        // Silently fall back when the name isn't a real Lucide icon — happens
        // while the user is mid-typing in IconPicker, and otherwise lucide-react
        // logs `Name in Lucide DynamicIcon not found` per render.
        return validNames.has(kebab) ? kebab : 'help-circle';
    }, [iconName]);

    return <DynamicIcon name={resolvedName as IconName} {...props} />;
};
