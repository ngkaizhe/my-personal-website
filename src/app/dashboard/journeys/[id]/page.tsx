import { getJourneyDetail, updateJourney } from "../actions";
import JourneyForm from "@/components/Journey/JourneyForm";
import { notFound } from "next/navigation";

export const metadata = {
  title: "Edit Journey",
};

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
        <div className="p-4 md:p-8 bg-page min-h-screen">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-text-primary">Edit Journey</h1>
                    <p className="text-text-muted mt-2">Update an existing milestone on your timeline.</p>
                </div>

                <JourneyForm item={item} action={updateAction} />
            </div>
        </div>
    );
}
