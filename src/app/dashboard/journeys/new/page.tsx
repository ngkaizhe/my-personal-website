import { createJourney, JourneyDetail } from "../actions";
import JourneyForm from "@/components/JourneyForm";

const emptyItem: JourneyDetail = {
    year: '',
    title: '',
    tag: '',
    color: 'blue',
    description: '',
    details: '',
    techStack: [],
    linkUrl: '',
    linkText: '',
    iconName: 'help-circle',
};

export default function NewJourneyPage() {
    return (
        <div className="p-8 bg-zinc-950 min-h-screen">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-zinc-100">Add New Journey</h1>
                    <p className="text-zinc-500 mt-2">Create a new milestone for your timeline.</p>
                </div>

                <JourneyForm item={emptyItem} action={async (formData) => {
                    'use server';
                    await createJourney(formData);
                }} />
            </div>
        </div>
    );
}
