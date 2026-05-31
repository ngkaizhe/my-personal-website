import { ImageResponse } from 'next/og';
import { prisma } from '@/lib/prisma';
import { aggregateSkills } from '@/lib/skills';

export const runtime = 'nodejs';
export const contentType = 'image/png';
export const alt = 'Personal portfolio';
export const size = { width: 1200, height: 630 };

// Generates the social-preview card for /@username. Shows display name +
// username + bio + the top 5 most-used skills aggregated across the user's
// entries. Anything beyond that gets noisy at 630px tall.
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
    });

    const displayName = user?.displayName || user?.name || `@${username}`;
    const bio = user?.bio?.trim() || '';
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
                    padding: '64px',
                    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                    color: '#f8fafc',
                    fontFamily: 'sans-serif',
                }}
            >
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div
                        style={{
                            fontSize: 28,
                            color: '#64748b',
                            fontFamily: 'monospace',
                            marginBottom: 16,
                        }}
                    >
                        @{username}
                    </div>
                    <div
                        style={{
                            fontSize: 88,
                            fontWeight: 700,
                            lineHeight: 1.05,
                            letterSpacing: '-0.02em',
                            marginBottom: 24,
                        }}
                    >
                        {displayName}
                    </div>
                    {bio && (
                        <div
                            style={{
                                fontSize: 28,
                                color: '#cbd5e1',
                                lineHeight: 1.4,
                                maxWidth: 1000,
                            }}
                        >
                            {bio.length > 180 ? bio.slice(0, 180) + '…' : bio}
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {topSkills.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                            {topSkills.map((s) => (
                                <div
                                    key={s}
                                    style={{
                                        padding: '8px 18px',
                                        borderRadius: 999,
                                        background: '#1e40af',
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
                            alignItems: 'flex-end',
                            color: '#94a3b8',
                            fontSize: 22,
                        }}
                    >
                        <span>Track. Reflect. Resume.</span>
                        <span style={{ fontFamily: 'monospace', fontSize: 18 }}>
                            My Journey
                        </span>
                    </div>
                </div>
            </div>
        ),
        size,
    );
}
