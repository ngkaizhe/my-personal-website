'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

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

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

interface Props {
    initialTheme: Theme;
    children: React.ReactNode;
}

export const ThemeProvider = ({ initialTheme, children }: Props) => {
    const [theme, setThemeState] = useState<Theme>(initialTheme);

    useEffect(() => {
        const root = document.documentElement;
        THEMES.forEach(t => root.classList.remove(t));
        root.classList.add(theme);
        // 1-year cookie so the server-rendered <html> class matches user preference
        // on the next request — no client-side init script needed.
        document.cookie = `theme=${theme}; path=/; max-age=31536000; SameSite=Lax`;
    }, [theme]);

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
    };

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};
