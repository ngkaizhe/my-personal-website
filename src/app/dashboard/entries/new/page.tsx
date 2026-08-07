import { getLocale, getTranslations } from "next-intl/server";
import { createEntry, getExperienceOptions, EntryDetail } from "../actions";
import EntryForm from "@/components/Entry/EntryForm";
import { isAiParseAvailable } from "@/lib/aiAvailable";
import { SUPPORTED_LOCALES } from '@/i18n/locales';

export const metadata = {
    title: "Add Entry",
};


function blankTranslation(locale: string) {
    return {
        locale,
        title: '',
        actionVerb: '',
        description: '',
        impact: '',
        details: '',
        tag: '',
        sourceHash: null,
        lastTranslatedAt: null,
        isStale: false,
    };
}

export default async function NewEntryPage() {
    const [experiences, locale, t] = await Promise.all([
        getExperienceOptions(),
        getLocale(),
        getTranslations('Entries'),
    ]);

    // primaryLocale defaults to whichever locale the user is currently viewing
    // the dashboard in — that's the language they're about to type in.
    const emptyItem: EntryDetail = {
        date: new Date().toISOString().substring(0, 10),
        primaryLocale: locale,
        color: 'blue',
        featured: false,
        techStack: [],
        attachmentUrls: [],
        linkUrl: '',
        linkText: '',
        iconName: 'help-circle',
        experienceId: '',
        translations: SUPPORTED_LOCALES.map(blankTranslation),
    };

    return (
        <div className="p-4 md:p-8 bg-page min-h-screen">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-text-primary">{t('addEntryHeading')}</h1>
                    <p className="text-text-muted mt-2">{t('addEntrySubtitle')}</p>
                </div>

                <EntryForm
                    item={emptyItem}
                    experiences={experiences}
                    aiAvailable={isAiParseAvailable()}
                    action={async (formData) => {
                        'use server';
                        await createEntry(formData);
                    }}
                />
            </div>
        </div>
    );
}
