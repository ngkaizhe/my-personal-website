import type { ResumeLabels, ResumeLocale } from '@/components/Resume/ResumeBuilder';
import enMessages from '../../messages/en.json';
import zhMessages from '../../messages/zh-TW.json';

// Résumé-content labels for BOTH locales so the builder can preview/print/
// download either language independently of the UI locale.
//
// Read straight from the message files: next-intl's getTranslations({locale})
// resolves messages through the request config, which loads only the current
// cookie locale — asking it for the *other* locale silently returns the
// active one (bit us: English résumés printed 中文 section titles).
const RESUME_LABEL_KEYS = [
    'sectionExperience', 'sectionEducation', 'sectionProjects', 'sectionVolunteer',
    'sectionOther', 'skills', 'contact',
    'skillCat_languages', 'skillCat_adtech', 'skillCat_data', 'skillCat_practices', 'skillCat_other',
] as const;

const MESSAGES: Record<ResumeLocale, { Resume: Record<string, string>; Common: Record<string, string> }> = {
    en: enMessages as never,
    'zh-TW': zhMessages as never,
};

export function getResumeLabels(): Record<ResumeLocale, ResumeLabels> {
    const out = {} as Record<ResumeLocale, ResumeLabels>;
    for (const locale of ['zh-TW', 'en'] as const) {
        const m = MESSAGES[locale];
        const labels: ResumeLabels = { present: m.Common.present };
        for (const key of RESUME_LABEL_KEYS) labels[key] = m.Resume[key];
        out[locale] = labels;
    }
    return out;
}
