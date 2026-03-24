'use client';

import { COLOR_KEYS, getPreviewHex } from '@/lib/colors';

export default function ColorPicker({ name, label, value, onChange }: { name: string; label: string; value: string; onChange: (v: string) => void }) {
    return (
        <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">{label}</label>
            <div className="flex flex-wrap gap-2">
                {COLOR_KEYS.map(key => (
                    <button
                        key={key}
                        type="button"
                        onClick={() => onChange(key)}
                        style={{ backgroundColor: getPreviewHex(key) }}
                        className={`w-8 h-8 rounded-full cursor-pointer transition-all duration-200 ${value === key ? 'ring-2 ring-offset-2 ring-offset-zinc-800 ring-blue-500 scale-110' : 'hover:scale-110 opacity-60 hover:opacity-100'}`}
                        title={key}
                    />
                ))}
            </div>
            <input type="hidden" name={name} value={value} />
        </div>
    );
}
