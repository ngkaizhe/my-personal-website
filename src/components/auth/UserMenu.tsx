'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { LogOut, ExternalLink, UserCircle2, Settings } from 'lucide-react';
import { signOut } from 'next-auth/react';

interface Props {
    user: {
        name?: string | null;
        email?: string | null;
        image?: string | null;
        username: string | null;
    };
}

function initialsFrom(name?: string | null, email?: string | null) {
    const source = name || email || '?';
    const parts = source.trim().split(/\s+/).slice(0, 2);
    return parts.map(p => p[0]?.toUpperCase()).join('') || '?';
}

export function UserMenu({ user }: Props) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

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
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && open) {
                setOpen(false);
                buttonRef.current?.focus();
            }
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [open]);

    const profileHref = user.username ? `/@${user.username}` : null;
    const displayName = user.name || user.email || 'You';

    return (
        <div ref={ref} className="relative">
            <button
                ref={buttonRef}
                onClick={() => setOpen(!open)}
                aria-haspopup="menu"
                aria-expanded={open}
                aria-label={`Account menu for ${displayName}`}
                className="w-9 h-9 rounded-full overflow-hidden bg-surface-elevated border border-border-light flex items-center justify-center text-sm font-medium text-text-primary cursor-pointer hover:ring-2 hover:ring-blue-500/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-all"
            >
                {user.image ? (
                    <Image
                        src={user.image}
                        alt=""
                        width={36}
                        height={36}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <span aria-hidden="true">{initialsFrom(user.name, user.email)}</span>
                )}
            </button>

            {open && (
                <div
                    role="menu"
                    aria-label="Account menu"
                    className="absolute right-0 top-full mt-2 bg-surface border border-border rounded-lg shadow-xl overflow-hidden z-50 min-w-[220px]"
                >
                    {/* User info header */}
                    <div className="px-4 py-3 border-b border-border-light">
                        <div className="text-sm font-medium text-text-primary truncate">{displayName}</div>
                        {user.email && user.email !== displayName && (
                            <div className="text-xs text-text-muted truncate">{user.email}</div>
                        )}
                        {user.username && (
                            <div className="text-xs text-text-faint truncate mt-0.5">@{user.username}</div>
                        )}
                    </div>

                    {profileHref ? (
                        <Link
                            href={profileHref}
                            role="menuitem"
                            onClick={() => setOpen(false)}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:bg-surface-elevated hover:text-text-primary transition-colors"
                        >
                            <ExternalLink className="w-4 h-4" />
                            <span className="flex-1 text-left">View public profile</span>
                        </Link>
                    ) : (
                        <Link
                            href="/setup"
                            role="menuitem"
                            onClick={() => setOpen(false)}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:bg-surface-elevated hover:text-text-primary transition-colors"
                        >
                            <Settings className="w-4 h-4" />
                            <span className="flex-1 text-left">Set up your profile</span>
                        </Link>
                    )}

                    <Link
                        href="/dashboard"
                        role="menuitem"
                        onClick={() => setOpen(false)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:bg-surface-elevated hover:text-text-primary transition-colors"
                    >
                        <UserCircle2 className="w-4 h-4" />
                        <span className="flex-1 text-left">Dashboard</span>
                    </Link>

                    <button
                        type="button"
                        role="menuitem"
                        onClick={() => signOut({ redirectTo: '/' })}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:bg-surface-elevated hover:text-text-primary transition-colors border-t border-border-light cursor-pointer"
                    >
                        <LogOut className="w-4 h-4" />
                        <span className="flex-1 text-left">Sign out</span>
                    </button>
                </div>
            )}
        </div>
    );
}
