// Flat config for ESLint 9+ (`next lint` was removed in Next.js 16; the
// `lint` npm script now invokes the ESLint CLI directly).
import coreWebVitals from 'eslint-config-next/core-web-vitals';

export default [
    ...coreWebVitals,
    {
        ignores: [
            '.next/**',
            'src/generated/**',
            'node_modules/**',
            'docs/**',
            '.playwright-mcp/**',
            'next-env.d.ts',
        ],
    },
];
