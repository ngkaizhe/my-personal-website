import { getEntryDetail, updateEntry, getEmployerOptions } from "../actions";
import EntryForm from "@/components/Entry/EntryForm";
import { notFound } from "next/navigation";

export const metadata = {
    title: "Edit Entry",
};

export default async function EditEntryPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    const [item, employers] = await Promise.all([
        getEntryDetail(resolvedParams.id),
        getEmployerOptions(),
    ]);

    if (!item) {
        notFound();
    }

    const updateAction = async (formData: FormData) => {
        'use server';
        await updateEntry(resolvedParams.id, formData);
    };

    return (
        <div className="p-4 md:p-8 bg-page min-h-screen">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-text-primary">Edit Entry</h1>
                    <p className="text-text-muted mt-2">Update an existing entry.</p>
                </div>

                <EntryForm item={item} employers={employers} action={updateAction} />
            </div>
        </div>
    );
}
