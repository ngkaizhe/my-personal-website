'use client';

import { useState } from 'react';
import { iconNames } from '@/lib/iconNames';
import { TimelineIcon } from '@/components/Timeline/TimelineIcon';

interface IconPickerProps {
    name: string;
    value: string;
    onChange: (value: string) => void;
    className?: string;
}

const MAX_SUGGESTIONS = 30;

export default function IconPicker({ name, value, onChange, className = '' }: IconPickerProps) {
    const [open, setOpen] = useState(false);

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

    const select = (iconName: string) => {
        onChange(iconName);
        setOpen(false);
    };

    return (
        <div
            className="relative"
            onBlur={e => {
                if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false);
            }}
        >
            <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-zinc-700/50 border border-zinc-600 shrink-0">
                    <TimelineIcon iconName={value || 'help-circle'} className="w-5 h-5 text-zinc-300" />
                </div>
                <input
                    name={name}
                    value={value}
                    onChange={e => { onChange(e.target.value); setOpen(true); }}
                    onFocus={() => setOpen(true)}
                    className={className}
                    placeholder="Search icons..."
                    autoComplete="off"
                />
            </div>

            {open && suggestions.length > 0 && (
                <div className="absolute z-50 mt-2 w-full bg-zinc-800 border border-zinc-700 rounded-xl shadow-2xl shadow-black/40 max-h-60 overflow-y-auto">
                    {suggestions.map(iconName => (
                        <button
                            key={iconName}
                            type="button"
                            onClick={() => select(iconName)}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-left cursor-pointer transition-colors hover:bg-zinc-700/50 ${
                                iconName === value ? 'bg-blue-500/10 text-blue-400' : 'text-zinc-300'
                            }`}
                        >
                            <TimelineIcon iconName={iconName} className="w-5 h-5 shrink-0" />
                            <span className="text-sm truncate">{iconName}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
