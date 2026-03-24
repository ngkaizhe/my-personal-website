import twColors from 'tailwindcss/colors';

// --- Configuration ---
// Add/remove color names here to change the palette.
// Change shade numbers to adjust depth.
const COLOR_NAMES = [
    'red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal',
    'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose',
    'slate', 'gray', 'zinc',
] as const;

const TEXT_SHADE = 600;
const BADGE_BG_SHADE = 100;
const BADGE_TEXT_SHADE = 800;
const PREVIEW_SHADE = 500;

// --- Exports ---
type ColorName = typeof COLOR_NAMES[number];

export const COLOR_KEYS: readonly string[] = COLOR_NAMES;

export function getTextClass(key: string): string {
    return `text-${key}-${TEXT_SHADE}`;
}

export function getBadgeClass(key: string): string {
    return `bg-${key}-${BADGE_BG_SHADE} text-${key}-${BADGE_TEXT_SHADE}`;
}

export function getPreviewHex(key: string): string {
    const palette = twColors[key as ColorName];
    if (palette && typeof palette === 'object') {
        return (palette as Record<string, string>)[PREVIEW_SHADE.toString()] ?? twColors.blue[500];
    }
    return twColors.blue[500];
}

// Tailwind v4 scanner only detects static class strings.
// This array ensures all dynamically-generated classes above are included in the build.
// prettier-ignore
const _safelist = [
    // text classes (TEXT_SHADE)
    'text-red-600', 'text-orange-600', 'text-amber-600', 'text-yellow-600',
    'text-lime-600', 'text-green-600', 'text-emerald-600', 'text-teal-600',
    'text-cyan-600', 'text-sky-600', 'text-blue-600', 'text-indigo-600',
    'text-violet-600', 'text-purple-600', 'text-fuchsia-600', 'text-pink-600',
    'text-rose-600', 'text-slate-600', 'text-gray-600', 'text-zinc-600',
    // bg classes (BADGE_BG_SHADE)
    'bg-red-100', 'bg-orange-100', 'bg-amber-100', 'bg-yellow-100',
    'bg-lime-100', 'bg-green-100', 'bg-emerald-100', 'bg-teal-100',
    'bg-cyan-100', 'bg-sky-100', 'bg-blue-100', 'bg-indigo-100',
    'bg-violet-100', 'bg-purple-100', 'bg-fuchsia-100', 'bg-pink-100',
    'bg-rose-100', 'bg-slate-100', 'bg-gray-100', 'bg-zinc-100',
    // text classes (BADGE_TEXT_SHADE)
    'text-red-800', 'text-orange-800', 'text-amber-800', 'text-yellow-800',
    'text-lime-800', 'text-green-800', 'text-emerald-800', 'text-teal-800',
    'text-cyan-800', 'text-sky-800', 'text-blue-800', 'text-indigo-800',
    'text-violet-800', 'text-purple-800', 'text-fuchsia-800', 'text-pink-800',
    'text-rose-800', 'text-slate-800', 'text-gray-800', 'text-zinc-800',
]; void _safelist;
