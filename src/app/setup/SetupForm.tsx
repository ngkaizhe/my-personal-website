'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { saveSetup } from './actions';

interface Props {
    defaultDisplayName: string;
}

const inputClass = `
    w-full px-4 py-3 rounded-xl
    bg-input-bg border border-input-border
    text-input-text placeholder-input-placeholder
    focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50
    outline-none transition-all duration-200
    hover:border-input-border-hover
`;

const labelClass = 'block text-sm font-medium text-form-label mb-2';

export function SetupForm({ defaultDisplayName }: Props) {
    const router = useRouter();
    const { update } = useSession();
    const [pending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [username, setUsername] = useState('');
    const [displayName, setDisplayName] = useState(defaultDisplayName);
    const [bio, setBio] = useState('');

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        startTransition(async () => {
            const result = await saveSetup({ username, displayName, bio });
            if (!result.success) {
                setError(result.error ?? 'Something went wrong.');
                return;
            }
            // Refresh the JWT so middleware no longer redirects to /setup.
            await update({ user: { username: username.trim().toLowerCase() } });
            router.push('/dashboard');
            router.refresh();
        });
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="space-y-6 bg-form-bg backdrop-blur-sm p-4 md:p-8 rounded-2xl border border-form-border shadow-2xl"
        >
            <div>
                <label htmlFor="setup-username" className={labelClass}>
                    Username <span className="text-red-400">*</span>
                </label>
                <div className="flex items-center">
                    <span className="px-3 py-3 text-text-muted bg-input-bg border border-input-border border-r-0 rounded-l-xl font-mono">@</span>
                    <input
                        id="setup-username"
                        value={username}
                        onChange={e => setUsername(e.target.value.toLowerCase())}
                        required
                        autoFocus
                        pattern="[a-z0-9_-]{3,30}"
                        title="3–30 chars, lowercase letters, numbers, hyphen or underscore"
                        placeholder="kaizhe"
                        className={`${inputClass} rounded-l-none border-l-0 font-mono`}
                    />
                </div>
                <p className="text-xs text-text-faint mt-2">
                    Your public URL will be <span className="font-mono">/@{username || 'kaizhe'}</span>. 3–30 chars, lowercase letters, numbers, hyphen or underscore. You can&apos;t change this later from this form.
                </p>
            </div>

            <div>
                <label htmlFor="setup-display-name" className={labelClass}>
                    Display name <span className="text-text-faint">(optional)</span>
                </label>
                <input
                    id="setup-display-name"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    placeholder="How your name appears on your public profile"
                    className={inputClass}
                />
            </div>

            <div>
                <label htmlFor="setup-bio" className={labelClass}>
                    Bio <span className="text-text-faint">(optional)</span>
                </label>
                <textarea
                    id="setup-bio"
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    rows={3}
                    maxLength={280}
                    placeholder="A short line about you. Shows up on your public profile."
                    className={inputClass}
                />
                <p className="text-xs text-text-faint mt-1">{bio.length} / 280</p>
            </div>

            {error && (
                <div role="alert" className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                    {error}
                </div>
            )}

            <div className="flex justify-end pt-4 border-t border-form-action-border">
                <button
                    type="submit"
                    disabled={pending || !username}
                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-blue-600/20 hover:shadow-blue-500/30"
                >
                    {pending ? 'Saving...' : 'Save and continue'}
                </button>
            </div>
        </form>
    );
}
