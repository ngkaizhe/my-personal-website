import { ImageResponse } from 'next/og';
import { prisma } from '@/lib/prisma';
import { aggregateSkills } from '@/lib/skills';

export const runtime = 'nodejs';
export const contentType = 'image/png';
export const alt = 'Personal portfolio';
export const size = { width: 1200, height: 630 };

// Generates the social-preview card for /@username. Satori (the renderer
// behind next/og) is stricter than browser CSS:
//   - every parent of multiple children must have display: flex
//   - no em / rem units — only px
//   - linear-gradient backgrounds are fine but keep them simple
//   - no shorthand 'gap' on non-flex parents
// Earlier version used em letterSpacing + complex nesting and 500'd on prod.
export default async function OgImage({ params }: { params: Promise<{ username: string }> }) {
    const { username } = await params;

    const user = await prisma.user.findUnique({
        where: { username },
        select: {
            displayName: true,
            name: true,
            bio: true,
            entries: { select: { techStack: true } },
        },
    }).catch(() => null);

    const displayName = user?.displayName || user?.name || `@${username}`;
    const bioRaw = user?.bio?.trim() || '';
    const bio = bioRaw.length > 180 ? bioRaw.slice(0, 180) + '…' : bioRaw;
    const topSkills = user
        ? aggregateSkills(user.entries.map(e => e.techStack)).slice(0, 5).map(s => s.name)
        : [];

    return new ImageResponse(
        (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: 64,
                    backgroundColor: '#0f172a',
                    color: '#f8fafc',
                }}
            >
                {/* Top block */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div
                        style={{
                            display: 'flex',
                            fontSize: 28,
                            color: '#64748b',
                            marginBottom: 16,
                        }}
                    >
                        @{username}
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            fontSize: 88,
                            fontWeight: 700,
                            marginBottom: 24,
                        }}
                    >
                        {displayName}
                    </div>
                    {bio && (
                        <div
                            style={{
                                display: 'flex',
                                fontSize: 28,
                                color: '#cbd5e1',
                                maxWidth: 1000,
                            }}
                        >
                            {bio}
                        </div>
                    )}
                </div>

                {/* Bottom block */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {topSkills.length > 0 && (
                        <div
                            style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                marginBottom: 16,
                            }}
                        >
                            {topSkills.map((s) => (
                                <div
                                    key={s}
                                    style={{
                                        display: 'flex',
                                        padding: '8px 18px',
                                        marginRight: 12,
                                        marginBottom: 12,
                                        borderRadius: 999,
                                        backgroundColor: '#1e40af',
                                        color: '#dbeafe',
                                        fontSize: 22,
                                        fontWeight: 500,
                                    }}
                                >
                                    {s}
                                </div>
                            ))}
                        </div>
                    )}
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            color: '#94a3b8',
                            fontSize: 22,
                        }}
                    >
                        <div style={{ display: 'flex' }}>Track. Reflect. Resume.</div>
                        <div style={{ display: 'flex', fontSize: 18 }}>My Journey</div>
                    </div>
                </div>
            </div>
        ),
        size,
    );
}
