import { createEntry, getEmployerOptions, EntryDetail } from "../actions";
import EntryForm from "@/components/Entry/EntryForm";

export const metadata = {
    title: "Add Entry",
};

const emptyItem: EntryDetail = {
    date: new Date().toISOString().substring(0, 10),
    title: '',
    actionVerb: '',
    description: '',
    impact: '',
    details: '',
    tag: '',
    color: 'blue',
    techStack: [],
    linkUrl: '',
    linkText: '',
    iconName: 'help-circle',
    employerId: '',
};

export default async function NewEntryPage() {
    const employers = await getEmployerOptions();

    return (
        <div className="p-4 md:p-8 bg-page min-h-screen">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-text-primary">Add Entry</h1>
                    <p className="text-text-muted mt-2">Log a new achievement or milestone.</p>
                </div>

                <EntryForm
                    item={emptyItem}
                    employers={employers}
                    action={async (formData) => {
                        'use server';
                        await createEntry(formData);
                    }}
                />
            </div>
        </div>
    );
}
