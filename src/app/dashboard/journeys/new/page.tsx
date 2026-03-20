import { createTimelineItem } from "../actions";
import JourneyForm, { JourneyFormItem } from "@/components/JourneyForm";

const emptyItem: JourneyFormItem = {
    yearContent: '',
    yearColor: 'text-blue-600',
    titleContent: '',
    titleColor: 'text-blue-600',
    categoryText: '',
    categoryColor: 'bg-blue-100 text-blue-800',
    description: '',
    details: '',
    techStack: [],
    linkUrl: '',
    linkText: '',
    iconName: 'help-circle',
};

export default function NewJourneyPage() {
    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Add New Journey</h1>
                    <p className="text-gray-600 mt-2">Create a new milestone for your timeline.</p>
                </div>

                <JourneyForm item={emptyItem} action={async (formData) => {
                    'use server';
                    await createTimelineItem(formData);
                }} />
            </div>
        </div>
    );
}
