import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isMainHost, mainAppHost } from '@/lib/customDomain';
import { resolveDomainPaths } from '@/lib/domainPaths';
import { buildSiteLlmsTxt, buildUserLlmsTxt } from '@/lib/llmsTxt';

// Host-aware llms.txt (https://llmstxt.org): bound custom domains get a
// per-user map, the main app host gets the product-level one. The proxy
// skips its /d rewrite for this path so the original host reaches us.
const TEXT_HEADERS = {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
};

export async function GET(req: NextRequest) {
    const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? '';
    const bare = host.toLowerCase().split(':')[0];

    if (bare && !isMainHost(host)) {
        const user = await prisma.user.findUnique({
            where: { customDomain: bare },
            select: {
                username: true,
                displayName: true,
                name: true,
                bio: true,
                domainRootView: true,
                domainAltPath: true,
            },
        });
        if (user?.username) {
            const paths = resolveDomainPaths(user);
            return new NextResponse(buildUserLlmsTxt({
                displayName: user.displayName || user.name || `@${user.username}`,
                username: user.username,
                bio: user.bio,
                domain: bare,
                timelinePath: paths.timelinePath,
                resumePath: paths.resumePath,
                mainHost: mainAppHost(),
            }), { headers: TEXT_HEADERS });
        }
    }

    return new NextResponse(buildSiteLlmsTxt(bare || 'localhost:3000'), { headers: TEXT_HEADERS });
}
