import { getJourneyDetail, updateJourney } from "../actions";
import JourneyForm from "@/components/JourneyForm";
import { notFound } from "next/navigation";

export default async function EditJourneyPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    const item = await getJourneyDetail(resolvedParams.id);

    if (!item) {
        notFound();
    }

    const updateAction = async (formData: FormData) => {
        'use server';
        await updateJourney(resolvedParams.id, formData);
    };

    return (
        <div className="p-8 bg-zinc-950 min-h-screen">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-zinc-100">Edit Journey</h1>
                    <p className="text-zinc-500 mt-2">Update an existing milestone on your timeline.</p>
                </div>

                <JourneyForm item={item} action={updateAction} />
            </div>
        </div>
    );
}
