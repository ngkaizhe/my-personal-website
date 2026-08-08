import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getEntrySummaries, deleteEntry, toggleEntryFeatured } from "./actions";
import EntryList from "@/components/Entry/EntryList";

export const metadata = {
    title: "Manage Entries",
};

export default async function EntriesPage() {
    const items = await getEntrySummaries();
    const t = await getTranslations('Entries');

    const deleteAction = async (id: string) => {
        'use server';
        await deleteEntry(id);
    };

    const featuredAction = async (id: string, featured: boolean) => {
        'use server';
        await toggleEntryFeatured(id, featured);
    };

    return (
        <div className="p-4 md:p-8 bg-page min-h-screen">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
                    <h1 className="text-3xl font-bold text-text-primary">{t('manageTitle')}</h1>
                    <Link
                        href="/dashboard/entries/new"
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors text-center whitespace-nowrap
                            focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2"
                    >
                        {t('addEntry')}
                    </Link>
                </div>

                <EntryList items={items} deleteAction={deleteAction} featuredAction={featuredAction} />
            </div>
        </div>
    );
}
