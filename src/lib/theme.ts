export type Theme = 'light' | 'dark' | 'sepia';

export interface ThemeMeta {
    value: Theme;
    label: string;
    iconName: 'Sun' | 'Moon' | 'BookOpen';
}

export const THEME_OPTIONS: ThemeMeta[] = [
    { value: 'light', label: 'Light', iconName: 'Sun' },
    { value: 'dark', label: 'Dark', iconName: 'Moon' },
    { value: 'sepia', label: 'Sepia', iconName: 'BookOpen' },
];

export const THEMES: Theme[] = THEME_OPTIONS.map(t => t.value);

export function isTheme(value: string | undefined | null): value is Theme {
    return value === 'light' || value === 'dark' || value === 'sepia';
}
