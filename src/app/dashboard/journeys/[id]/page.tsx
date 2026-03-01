import { getTimelineItem, updateTimelineItem } from "../actions";
import JourneyForm from "@/components/JourneyForm";
import { notFound } from "next/navigation";

export default async function EditJourneyPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    const item = await getTimelineItem(resolvedParams.id);

    if (!item) {
        notFound();
    }

    // Bind the ID to the server action so it can be passed safely from the client form
    const updateAction = async (id: string | null, formData: FormData) => {
        'use server';
        if (id) {
            await updateTimelineItem(id, formData);
        }
    };

    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Edit Journey</h1>
                    <p className="text-gray-600 mt-2">Update an existing milestone on your timeline.</p>
                </div>

                <JourneyForm item={item} action={updateAction} />
            </div>
        </div>
    );
}
