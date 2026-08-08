import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { getResumeData } from "./actions";
import ResumeBuilder from "@/components/Resume/ResumeBuilder";
import { isAiParseAvailable } from "@/lib/aiAvailable";

export const metadata = {
    title: "Resume Builder",
};

export default async function ResumePage() {
    const [data, session, t] = await Promise.all([
        getResumeData(),
        auth(),
        getTranslations('Resume'),
    ]);
    const username = session?.user?.username;

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
                    data={data}
                    canImproveBullets={isAiParseAvailable()}
                    {...(username ? { jsonResumeUrl: `/@${username}/resume.json` } : {})}
                />
            </div>
        </div>
    );
}
