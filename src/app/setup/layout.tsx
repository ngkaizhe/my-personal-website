import Link from 'next/link';
import { signOut } from '@/auth';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

export default function SetupLayout({ children }: { children: React.ReactNode }) {
    return (
        <div>
            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-surface focus:text-text-primary focus:rounded-lg focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                Skip to main content
            </a>
            <header className="sticky top-0 z-50 bg-header-bg backdrop-blur-md border-b border-header-border">
                <nav
                    className="max-w-7xl mx-auto flex justify-between items-center px-6 py-3"
                    aria-label="Setup navigation"
                >
                    <Link
                        href="/"
                        className="text-sm font-semibold text-header-text hover:text-header-text-hover transition-colors"
                    >
                        Track. Reflect. Resume.
                    </Link>
                    <div className="flex items-center gap-2">
                        <ThemeToggle />
                        <form
                            action={async () => {
                                'use server';
                                await signOut({ redirectTo: '/' });
                            }}
                        >
                            <button
                                type="submit"
                                className="px-3 py-1.5 text-sm text-header-text hover:text-header-text-hover hover:bg-nav-hover rounded-lg transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                            >
                                Sign out
                            </button>
                        </form>
                    </div>
                </nav>
            </header>
            <main id="main-content">{children}</main>
        </div>
    );
}
