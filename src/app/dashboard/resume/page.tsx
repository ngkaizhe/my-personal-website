import { getLocale, getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getResumeData } from "./actions";
import ResumeBuilder from "@/components/Resume/ResumeBuilder";
import { isAiParseAvailable } from "@/lib/aiAvailable";
import { getResumeLabels } from "@/lib/resumeLabels";

export const metadata = {
    title: "Resume Builder",
};

export default async function ResumePage() {
    const [dataZh, dataEn, labels, session, t, locale] = await Promise.all([
        getResumeData('zh-TW'),
        getResumeData('en'),
        getResumeLabels(),
        auth(),
        getTranslations('Resume'),
        getLocale(),
    ]);
    const username = session?.user?.username;
    const me = session?.user?.id
        ? await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { displayName: true, name: true, image: true, contactEmail: true, github: true, linkedin: true, website: true, resumeSummaryEn: true, resumeSummaryZh: true },
        })
        : null;

    return (
        <div className="p-4 md:p-8 bg-page min-h-screen">
            <div className="max-w-6xl mx-auto">
                <div className="mb-8 no-print">
                    <h1 className="text-3xl font-bold text-text-primary">{t('heading')}</h1>
                    <p className="text-text-muted mt-2">
                        {t('subtitle')}
                    </p>
                </div>

                <ResumeBuilder
                    resumes={{
                        'zh-TW': { data: dataZh, summary: me?.resumeSummaryZh ?? me?.resumeSummaryEn },
                        en: { data: dataEn, summary: me?.resumeSummaryEn ?? me?.resumeSummaryZh },
                    }}
                    labels={labels}
                    defaultResumeLocale={locale === 'zh-TW' ? 'zh-TW' : 'en'}
                    canImproveBullets={isAiParseAvailable()}
                    {...(username ? { jsonResumeUrl: `/@${username}/resume.json` } : {})}
                    {...(me ? {
                        header: {
                            name: me.displayName || me.name || (username ? `@${username}` : ''),
                            image: me.image,
                            contactEmail: me.contactEmail,
                            github: me.github,
                            linkedin: me.linkedin,
                            website: me.website,
                        },
                    } : {})}
                />
            </div>
        </div>
    );
}
