'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavLinkProps {
    href: string;
    children: React.ReactNode;
    exact?: boolean;
}

export function NavLink({ href, children, exact = false }: NavLinkProps) {
    const pathname = usePathname();
    const isActive = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

    return (
        <Link
            href={href}
            aria-current={isActive ? 'page' : undefined}
            className={`text-sm font-medium px-4 py-2 rounded-lg transition-all duration-200
                focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
                ${isActive
                    ? 'text-header-text-hover bg-nav-hover'
                    : 'text-header-text hover:text-header-text-hover hover:bg-nav-hover'
                }`}
        >
            {children}
        </Link>
    );
}
