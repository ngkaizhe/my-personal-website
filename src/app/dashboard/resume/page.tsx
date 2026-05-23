import { getTranslations } from "next-intl/server";
import { getResumeData } from "./actions";
import ResumeBuilder from "@/components/Resume/ResumeBuilder";

export const metadata = {
    title: "Resume Builder",
};

export default async function ResumePage() {
    const data = await getResumeData();
    const t = await getTranslations('Resume');

    return (
        <div className="p-4 md:p-8 bg-page min-h-screen">
            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-text-primary">{t('heading')}</h1>
                    <p className="text-text-muted mt-2">
                        {t('subtitle')}
                    </p>
                </div>

                <ResumeBuilder data={data} />
            </div>
        </div>
    );
}
