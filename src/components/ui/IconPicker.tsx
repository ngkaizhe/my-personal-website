'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { iconNames } from '@/lib/iconNames';
import { LucideIcon } from '@/components/ui/LucideIcon';

interface IconPickerProps {
    id?: string;
    name: string;
    value: string;
    onChange: (value: string) => void;
    className?: string;
}

const MAX_SUGGESTIONS = 30;

export default function IconPicker({ id, name, value, onChange, className = '' }: IconPickerProps) {
    const [open, setOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const listRef = useRef<HTMLDivElement>(null);
    const t = useTranslations('FormControls');

    const suggestions = value
        ? iconNames
            .filter(n => n.includes(value.toLowerCase()))
            .sort((a, b) => {
                const query = value.toLowerCase();
                const aPrefix = a.startsWith(query);
                const bPrefix = b.startsWith(query);
                if (aPrefix !== bPrefix) return aPrefix ? -1 : 1;
                return a.localeCompare(b);
            })
            .slice(0, MAX_SUGGESTIONS)
        : [];

    // Keep the highlighted option scrolled into view as the user arrows down.
    useEffect(() => {
        if (activeIndex < 0) return;
        listRef.current?.children[activeIndex]?.scrollIntoView({ block: 'nearest' });
    }, [activeIndex]);

    const select = (iconName: string) => {
        onChange(iconName);
        setOpen(false);
        setActiveIndex(-1);
    };

    const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!open || suggestions.length === 0) return;
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex(i => (i + 1) % suggestions.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex(i => (i - 1 + suggestions.length) % suggestions.length);
        } else if (e.key === 'Enter' && activeIndex >= 0) {
            e.preventDefault();
            select(suggestions[activeIndex]);
        } else if (e.key === 'Escape') {
            setOpen(false);
            setActiveIndex(-1);
        }
    };

    const listboxId = id ? `${id}-listbox` : 'icon-listbox';
    const activeOptionId = activeIndex >= 0 ? `${listboxId}-opt-${activeIndex}` : undefined;

    return (
        <div
            className="relative"
            onBlur={e => {
                if (!e.currentTarget.contains(e.relatedTarget)) {
                    setOpen(false);
                    setActiveIndex(-1);
                }
            }}
        >
            <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-input-bg border border-input-border shrink-0">
                    <LucideIcon iconName={value || 'help-circle'} className="w-5 h-5 text-text-muted" />
                </div>
                <input
                    id={id}
                    name={name}
                    value={value}
                    onChange={e => { onChange(e.target.value); setOpen(true); setActiveIndex(-1); }}
                    onFocus={() => setOpen(true)}
                    onKeyDown={onKeyDown}
                    className={className}
                    placeholder={t('searchIcons')}
                    autoComplete="off"
                    role="combobox"
                    aria-expanded={open && suggestions.length > 0}
                    aria-controls={listboxId}
                    aria-activedescendant={activeOptionId}
                    aria-autocomplete="list"
                />
            </div>

            {open && suggestions.length > 0 && (
                <div
                    ref={listRef}
                    id={listboxId}
                    role="listbox"
                    className="absolute z-50 mt-2 w-full bg-surface-elevated border border-border-light rounded-xl shadow-2xl max-h-60 overflow-y-auto"
                >
                    {suggestions.map((iconName, i) => (
                        <button
                            key={iconName}
                            id={`${listboxId}-opt-${i}`}
                            type="button"
                            role="option"
                            aria-selected={iconName === value}
                            onClick={() => select(iconName)}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-left cursor-pointer transition-colors hover:bg-surface-elevated/80 ${
                                i === activeIndex ? 'bg-surface' : ''
                            } ${
                                iconName === value ? 'bg-blue-500/10 text-blue-400' : 'text-text-secondary'
                            }`}
                        >
                            <LucideIcon iconName={iconName} className="w-5 h-5 shrink-0" />
                            <span className="text-sm truncate">{iconName}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
