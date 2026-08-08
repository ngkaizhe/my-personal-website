import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isMainHost } from '@/lib/customDomain';
import { fetchResumeByUserId } from '@/lib/resume';
import { mapToJsonResume } from '@/lib/jsonResume';

// /resume.json on a bound custom domain — the proxy skips its usual /d
// rewrite for this path so the request lands here with the original host,
// and we resolve which user's résumé to serve from that host. On the main
// app host there is no user context, so we point callers at the per-user URL.
const JSON_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
};

export async function GET(req: NextRequest) {
    const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? '';
    const bare = host.toLowerCase().split(':')[0];

    if (!bare || isMainHost(host)) {
        return NextResponse.json(
            { error: 'No profile bound to this host. Fetch /@<username>/resume.json instead.' },
            { status: 404, headers: JSON_HEADERS },
        );
    }

    const locale = req.nextUrl.searchParams.get('locale') === 'zh-TW' ? 'zh-TW' : 'en';
    const user = await prisma.user.findUnique({
        where: { customDomain: bare },
        select: {
            id: true,
            username: true,
            displayName: true,
            name: true,
            bio: true,
            resumeSummaryEn: true,
            resumeSummaryZh: true,
            image: true,
            contactEmail: true,
            linkedin: true,
            github: true,
            website: true,
        },
    });
    if (!user?.username) {
        return NextResponse.json({ error: 'Domain not bound' }, { status: 404, headers: JSON_HEADERS });
    }

    const resume = await fetchResumeByUserId(user.id, locale);
    return NextResponse.json(
        mapToJsonResume({ ...user, username: user.username }, resume, { profileUrl: `https://${bare}`, locale }),
        { headers: JSON_HEADERS },
    );
}
