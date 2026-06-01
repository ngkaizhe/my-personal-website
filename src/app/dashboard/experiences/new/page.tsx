import { getLocale, getTranslations } from "next-intl/server";
import { createExperience, ExperienceDetail } from "../actions";
import ExperienceForm from "@/components/Experience/ExperienceForm";
import { isAiParseAvailable } from "@/lib/aiAvailable";

export const metadata = {
    title: "Add Experience",
};

const SUPPORTED_LOCALES = ['en', 'zh-TW'] as const;

function blankExpTranslation(locale: string) {
    return {
        locale,
        organization: '',
        role: '',
        description: '',
        sourceHash: null,
        lastTranslatedAt: null,
        isStale: false,
    };
}

export default async function NewExperiencePage() {
    const [locale, t] = await Promise.all([getLocale(), getTranslations('Experiences')]);

    const emptyItem: ExperienceDetail = {
        type: 'JOB',
        primaryLocale: locale,
        startDate: new Date().toISOString().substring(0, 10),
        endDate: '',
        color: 'blue',
        translations: SUPPORTED_LOCALES.map(blankExpTranslation),
    };

    return (
        <div className="p-4 md:p-8 bg-page min-h-screen">
            <div className="max-w-3xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-text-primary">{t('addExperienceHeading')}</h1>
                    <p className="text-text-muted mt-2">{t('addExperienceSubtitle')}</p>
                </div>

                <ExperienceForm
                    item={emptyItem}
                    aiAvailable={isAiParseAvailable()}
                    action={async (formData) => {
                        'use server';
                        await createExperience(formData);
                    }}
                />
            </div>
        </div>
    );
}
