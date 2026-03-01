import { createTimelineItem } from "../actions";
import JourneyForm from "@/components/JourneyForm";

export default function NewJourneyPage() {
    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Add New Journey</h1>
                    <p className="text-gray-600 mt-2">Create a new milestone for your timeline.</p>
                </div>

                <JourneyForm action={async (id, formData) => {
                    'use server';
                    await createTimelineItem(formData);
                }} />
            </div>
        </div>
    );
}
