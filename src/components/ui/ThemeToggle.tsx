'use client';

import { useState, useRef, useEffect } from 'react';
import { Sun, Moon, BookOpen } from 'lucide-react';
import { useTheme, THEME_OPTIONS, ThemeMeta } from '@/components/ThemeProvider';

const iconMap = { Sun, Moon, BookOpen } as const;

function ThemeIcon({ name, className }: { name: ThemeMeta['iconName']; className?: string }) {
    const Icon = iconMap[name];
    return <Icon className={className} />;
}

export const ThemeToggle = () => {
    const { theme, setTheme } = useTheme();
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (open) {
            const activeIndex = THEME_OPTIONS.findIndex(o => o.value === theme);
            itemRefs.current[activeIndex]?.focus();
        }
    }, [open, theme]);

    const handleMenuKey = (e: React.KeyboardEvent, index: number) => {
        if (e.key === 'Escape') {
            e.preventDefault();
            setOpen(false);
            buttonRef.current?.focus();
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            const next = (index + 1) % THEME_OPTIONS.length;
            itemRefs.current[next]?.focus();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            const prev = (index - 1 + THEME_OPTIONS.length) % THEME_OPTIONS.length;
            itemRefs.current[prev]?.focus();
        } else if (e.key === 'Home') {
            e.preventDefault();
            itemRefs.current[0]?.focus();
        } else if (e.key === 'End') {
            e.preventDefault();
            itemRefs.current[THEME_OPTIONS.length - 1]?.focus();
        }
    };

    const handleButtonKey = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setOpen(true);
        }
    };

    const current = THEME_OPTIONS.find(o => o.value === theme)!;

    return (
        <div ref={ref} className="relative">
            <button
                ref={buttonRef}
                onClick={() => setOpen(!open)}
                onKeyDown={handleButtonKey}
                aria-haspopup="menu"
                aria-expanded={open}
                aria-label={`Change theme, current: ${current.label}`}
                className="w-11 h-11 flex items-center justify-center text-header-text hover:text-header-text-hover hover:bg-nav-hover rounded-lg transition-all duration-200 cursor-pointer
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
                <ThemeIcon name={current.iconName} className="w-4 h-4" />
            </button>

            {open && (
                <div
                    role="menu"
                    aria-label="Theme selection"
                    className="absolute right-0 top-full mt-2 bg-surface border border-border rounded-lg shadow-xl overflow-hidden z-50 min-w-[160px]"
                >
                    {THEME_OPTIONS.map((option, i) => (
                        <button
                            key={option.value}
                            ref={el => { itemRefs.current[i] = el; }}
                            role="menuitemradio"
                            aria-checked={theme === option.value}
                            onClick={() => { setTheme(option.value); setOpen(false); buttonRef.current?.focus(); }}
                            onKeyDown={(e) => handleMenuKey(e, i)}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors cursor-pointer
                                focus:outline-none focus-visible:bg-surface-elevated
                                ${theme === option.value
                                    ? 'bg-surface-elevated text-text-primary font-medium'
                                    : 'text-text-muted hover:bg-surface-elevated hover:text-text-primary'
                                }`}
                        >
                            <ThemeIcon name={option.iconName} className="w-4 h-4" />
                            <span className="flex-1 text-left">{option.label}</span>
                            {theme === option.value && (
                                <span className="text-blue-500" aria-hidden="true">✓</span>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};
