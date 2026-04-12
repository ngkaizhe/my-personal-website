'use client';

import { COLOR_KEYS, getPreviewHex } from '@/lib/colors';

export default function ColorPicker({ name, label, value, onChange }: { name: string; label: string; value: string; onChange: (v: string) => void }) {
    return (
        <div>
            <span className="block text-sm font-medium text-form-label mb-2">{label}</span>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={label}>
                {COLOR_KEYS.map(key => (
                    <button
                        key={key}
                        type="button"
                        role="radio"
                        aria-checked={value === key}
                        aria-label={key}
                        onClick={() => onChange(key)}
                        style={{ backgroundColor: getPreviewHex(key) }}
                        className={`w-11 h-11 rounded-full cursor-pointer transition-all duration-200
                            focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-form-bg
                            ${value === key ? 'ring-2 ring-offset-2 ring-offset-form-bg ring-blue-500 scale-110' : 'hover:scale-110 opacity-60 hover:opacity-100'}`}
                        title={key}
                    />
                ))}
            </div>
            <input type="hidden" name={name} value={value} />
        </div>
    );
}
