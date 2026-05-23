import { getTranslations } from "next-intl/server";
import { createExperience, ExperienceDetail } from "../actions";
import ExperienceForm from "@/components/Experience/ExperienceForm";

export const metadata = {
    title: "Add Experience",
};

const emptyItem: ExperienceDetail = {
    type: 'JOB',
    organization: '',
    role: '',
    startDate: new Date().toISOString().substring(0, 10),
    endDate: '',
    description: '',
    color: 'blue',
};

export default async function NewExperiencePage() {
    const t = await getTranslations('Experiences');

    return (
        <div className="p-4 md:p-8 bg-page min-h-screen">
            <div className="max-w-3xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-text-primary">{t('addExperienceHeading')}</h1>
                    <p className="text-text-muted mt-2">{t('addExperienceSubtitle')}</p>
                </div>

                <ExperienceForm
                    item={emptyItem}
                    action={async (formData) => {
                        'use server';
                        await createExperience(formData);
                    }}
                />
            </div>
        </div>
    );
}
