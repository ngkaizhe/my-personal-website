'use client';

import { useState, useRef, useEffect } from 'react';
import { Sun, Moon, BookOpen } from 'lucide-react';
import { useTheme, Theme } from '@/components/ThemeProvider';

const themeOptions: { value: Theme; label: string; icon: React.ReactNode }[] = [
    { value: 'light', label: 'Light', icon: <Sun className="w-4 h-4" /> },
    { value: 'dark', label: 'Dark', icon: <Moon className="w-4 h-4" /> },
    { value: 'sepia', label: 'Sepia', icon: <BookOpen className="w-4 h-4" /> },
];

export const ThemeToggle = () => {
    const { theme, setTheme } = useTheme();
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const current = themeOptions.find(o => o.value === theme)!;

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setOpen(!open)}
                className="text-header-text hover:text-header-text-hover hover:bg-white/5 rounded-lg px-2 py-2 transition-all duration-200 cursor-pointer flex items-center gap-1.5"
                aria-label="Change theme"
            >
                {current.icon}
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-2 bg-surface border border-border rounded-lg shadow-xl overflow-hidden z-50 min-w-[140px]">
                    {themeOptions.map(option => (
                        <button
                            key={option.value}
                            onClick={() => { setTheme(option.value); setOpen(false); }}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors cursor-pointer
                                ${theme === option.value
                                    ? 'bg-surface-elevated text-text-primary font-medium'
                                    : 'text-text-muted hover:bg-surface-elevated hover:text-text-primary'
                                }`}
                        >
                            {option.icon}
                            {option.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};
