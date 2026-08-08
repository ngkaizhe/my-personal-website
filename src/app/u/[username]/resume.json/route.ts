import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fetchResumeByUserId } from '@/lib/resume';
import { mapToJsonResume } from '@/lib/jsonResume';
import { resolveDomainPaths } from '@/lib/domainPaths';

// Machine-readable résumé (JSON Resume schema) at /@username/resume.json.
// CORS is wide open on purpose — the whole point is letting external tools
// and AI agents fetch it; the data is already public on the profile page.
const JSON_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
};

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ username: string }> },
) {
    const { username } = await params;
    const locale = req.nextUrl.searchParams.get('locale') === 'zh-TW' ? 'zh-TW' : 'en';

    const user = await prisma.user.findUnique({
        where: { username },
        select: {
            id: true,
            username: true,
            displayName: true,
            name: true,
            bio: true,
            image: true,
            contactEmail: true,
            linkedin: true,
            github: true,
            website: true,
            customDomain: true,
            domainRootView: true,
            domainAltPath: true,
        },
    });
    if (!user?.username) {
        return NextResponse.json({ error: 'Profile not found' }, { status: 404, headers: JSON_HEADERS });
    }

    // Canonical home: the bound custom domain when there is one, else the
    // pretty URL on whichever host served this request.
    const profileUrl = user.customDomain
        ? `https://${user.customDomain}${resolveDomainPaths(user).timelinePath === '/' ? '' : resolveDomainPaths(user).timelinePath}`
        : `${req.nextUrl.protocol}//${req.headers.get('x-forwarded-host') ?? req.nextUrl.host}/@${user.username}`;

    const resume = await fetchResumeByUserId(user.id, locale);
    return NextResponse.json(
        mapToJsonResume({ ...user, username: user.username }, resume, { profileUrl, locale }),
        { headers: JSON_HEADERS },
    );
}
