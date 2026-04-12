'use client';

import { motion } from 'motion/react';

interface TagInputProps {
    id?: string;
    values: string[];
    onChange: (values: string[]) => void;
    placeholder?: string;
    className?: string;
}

export default function TagInput({ id, values, onChange, placeholder = 'Type and press Enter...', className = '' }: TagInputProps) {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const val = e.currentTarget.value.trim();
            if (val && !values.includes(val)) {
                onChange([...values, val]);
                e.currentTarget.value = '';
            }
        }
    };

    const remove = (t: string) => {
        onChange(values.filter(v => v !== t));
    };

    return (
        <div>
            {values.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                    {values.map(t => (
                        <motion.span
                            key={t}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="pl-3 pr-1.5 py-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg text-sm flex items-center gap-1"
                        >
                            {t}
                            <button
                                type="button"
                                onClick={() => remove(t)}
                                aria-label={`Remove ${t}`}
                                className="w-6 h-6 flex items-center justify-center rounded text-blue-400/60 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                            >
                                &times;
                            </button>
                        </motion.span>
                    ))}
                </div>
            )}
            <input id={id} type="text" onKeyDown={handleKeyDown} className={className} placeholder={placeholder} />
        </div>
    );
}
