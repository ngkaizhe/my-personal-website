'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type Theme = 'light' | 'dark' | 'sepia';

const THEMES: Theme[] = ['light', 'dark', 'sepia'];

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

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
    const [theme, setThemeState] = useState<Theme>('light');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem('theme') as Theme | null;
        if (stored && THEMES.includes(stored)) {
            setThemeState(stored);
        }
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;
        const root = document.documentElement;
        THEMES.forEach(t => root.classList.remove(t));
        root.classList.add(theme);
        localStorage.setItem('theme', theme);
    }, [theme, mounted]);

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
    };

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};
