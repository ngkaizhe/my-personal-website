import Link from 'next/link';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { UserMenu } from '@/components/auth/UserMenu';
import { auth, signIn } from '@/auth';

export default async function PublicProfileLayout({ children }: { children: React.ReactNode }) {
    const session = await auth();
    const user = session?.user;

    return (
        <div>
            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-surface focus:text-text-primary focus:rounded-lg focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                Skip to main content
            </a>
            <header className="sticky top-0 z-50 bg-header-bg backdrop-blur-md border-b border-header-border">
                <nav className="max-w-7xl mx-auto flex justify-between items-center px-6 py-3" aria-label="Primary navigation">
                    <Link
                        href="/"
                        className="text-sm font-semibold text-header-text hover:text-header-text-hover transition-colors"
                    >
                        Track. Reflect. Resume.
                    </Link>
                    <div className="flex items-center gap-2">
                        <ThemeToggle />
                        {user ? (
                            <UserMenu
                                user={{
                                    name: user.name,
                                    email: user.email,
                                    image: user.image,
                                    username: user.username,
                                }}
                            />
                        ) : (
                            <form
                                action={async () => {
                                    'use server';
                                    await signIn('google', { redirectTo: '/dashboard' });
                                }}
                            >
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                                >
                                    Sign in
                                </button>
                            </form>
                        )}
                    </div>
                </nav>
            </header>
            <main id="main-content">{children}</main>
        </div>
    );
}
