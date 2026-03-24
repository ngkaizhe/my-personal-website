'use client';

import { COLOR_KEYS, getPreviewHex } from '@/lib/colors';

export default function ColorPicker({ name, label, value, onChange }: { name: string; label: string; value: string; onChange: (v: string) => void }) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
            <div className="flex flex-wrap gap-2">
                {COLOR_KEYS.map(key => (
                    <button
                        key={key}
                        type="button"
                        onClick={() => onChange(key)}
                        style={{ backgroundColor: getPreviewHex(key) }}
                        className={`w-8 h-8 rounded-full transition-all ${value === key ? 'ring-2 ring-offset-2 ring-gray-900 scale-110' : 'hover:scale-110'}`}
                        title={key}
                    />
                ))}
            </div>
            <input type="hidden" name={name} value={value} />
        </div>
    );
}
