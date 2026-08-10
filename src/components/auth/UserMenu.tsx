'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { LogOut, ExternalLink, UserCircle2, Settings } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useTranslations } from 'next-intl';

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
    const menuRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const t = useTranslations('Auth');

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

    // Arrow-key navigation over the menu items, matching the ThemeToggle
    // pattern the project treats as the reference implementation.
    const menuItems = () => Array.from(
        menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [],
    );

    const focusItem = (index: number) => {
        const items = menuItems();
        if (items.length === 0) return;
        const wrapped = (index + items.length) % items.length;
        items[wrapped]?.focus();
    };

    const onMenuKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        const items = menuItems();
        const current = items.indexOf(document.activeElement as HTMLElement);
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            focusItem(current + 1);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            focusItem(current - 1);
        } else if (e.key === 'Home') {
            e.preventDefault();
            focusItem(0);
        } else if (e.key === 'End') {
            e.preventDefault();
            focusItem(items.length - 1);
        }
    };

    // Move focus into the menu when it opens so keyboard users land inside it.
    useEffect(() => {
        if (!open) return;
        const first = menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]');
        first?.focus();
    }, [open]);

    const profileHref = user.username ? `/u/${user.username}` : null;
    const displayName = user.name || user.email || 'You';

    return (
        <div ref={ref} className="relative">
            <button
                ref={buttonRef}
                onClick={() => setOpen(!open)}
                aria-haspopup="menu"
                aria-expanded={open}
                aria-label={t('accountMenu', { name: displayName })}
                className="w-9 h-9 rounded-full overflow-hidden bg-surface-elevated border border-border-light flex items-center justify-center text-sm font-medium text-text-primary cursor-pointer hover:ring-2 hover:ring-blue-500/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-all"
            >
                {user.image ? (
                    // Using a plain <img> instead of next/image because the user
                    // can set this URL to any external host (Gravatar, GitHub, etc).
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={user.image}
                        alt=""
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <span aria-hidden="true">{initialsFrom(user.name, user.email)}</span>
                )}
            </button>

            {open && (
                <div
                    ref={menuRef}
                    role="menu"
                    aria-label={t('menuLabel')}
                    onKeyDown={onMenuKeyDown}
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
                            <span className="flex-1 text-left">{t('viewPublicProfile')}</span>
                        </Link>
                    ) : null}
                    {user.username ? (
                        <Link
                            href="/setup"
                            role="menuitem"
                            onClick={() => setOpen(false)}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:bg-surface-elevated hover:text-text-primary transition-colors"
                        >
                            <Settings className="w-4 h-4" />
                            <span className="flex-1 text-left">{t('editProfile')}</span>
                        </Link>
                    ) : (
                        <Link
                            href="/setup"
                            role="menuitem"
                            onClick={() => setOpen(false)}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:bg-surface-elevated hover:text-text-primary transition-colors"
                        >
                            <Settings className="w-4 h-4" />
                            <span className="flex-1 text-left">{t('setUpProfile')}</span>
                        </Link>
                    )}

                    <Link
                        href="/dashboard"
                        role="menuitem"
                        onClick={() => setOpen(false)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:bg-surface-elevated hover:text-text-primary transition-colors"
                    >
                        <UserCircle2 className="w-4 h-4" />
                        <span className="flex-1 text-left">{t('dashboard')}</span>
                    </Link>

                    <button
                        type="button"
                        role="menuitem"
                        onClick={() => signOut({ redirectTo: '/' })}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:bg-surface-elevated hover:text-text-primary transition-colors border-t border-border-light cursor-pointer"
                    >
                        <LogOut className="w-4 h-4" />
                        <span className="flex-1 text-left">{t('signOut')}</span>
                    </button>
                </div>
            )}
        </div>
    );
}
