import Link from "next/link";
import { Sparkles } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { createEntry, getExperienceOptions } from "../entries/actions";
import QuickAdd from "@/components/Entry/QuickAdd";
import { isAiParseAvailable } from "@/lib/aiAvailable";

export const metadata = {
    title: "Quick Add",
};

export default async function QuickAddPage() {
    const t = await getTranslations('QuickAdd');

    if (!isAiParseAvailable()) {
        return (
            <div className="p-4 md:p-8 bg-page min-h-screen">
                <div className="max-w-2xl mx-auto">
                    <div className="bg-form-bg backdrop-blur-sm p-8 rounded-2xl border border-form-border shadow-2xl text-center">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-500/10 text-blue-500 mb-4">
                            <Sparkles className="w-6 h-6" />
                        </div>
                        <h1 className="text-2xl font-bold text-text-primary mb-2">{t('unavailableTitle')}</h1>
                        <p className="text-text-muted mb-6">
                            {t.rich('unavailableBody', {
                                keyName: (chunks) => <code className="px-1.5 py-0.5 rounded bg-input-bg text-text-secondary">{chunks}</code>,
                            })}
                        </p>
                        <Link
                            href="/dashboard/entries/new"
                            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-all duration-200 cursor-pointer shadow-lg shadow-blue-600/20"
                        >
                            {t('unavailableCta')}
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const experiences = await getExperienceOptions();

    const action = async (formData: FormData) => {
        'use server';
        await createEntry(formData);
    };

    return (
        <div className="p-4 md:p-8 bg-page min-h-screen">
            <div className="max-w-3xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-text-primary">{t('heading')}</h1>
                    <p className="text-text-muted mt-2">
                        {t('subtitle')}
                    </p>
                </div>

                <QuickAdd experiences={experiences} action={action} />
            </div>
        </div>
    );
}
