'use client';

// Page transition wrapper. Framer Motion's initial+animate sometimes gets
// stuck in a Next.js 16 + React 19 environment, so we use a CSS keyframe
// fallback that always runs on mount and respects prefers-reduced-motion.
export default function Template({ children }: { children: React.ReactNode }) {
    return <div className="page-fade-in">{children}</div>;
}
