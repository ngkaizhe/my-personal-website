import { createExperience, ExperienceDetail } from "../actions";
import ExperienceForm from "@/components/Experience/ExperienceForm";

export const metadata = {
    title: "Add Experience",
};

const emptyItem: ExperienceDetail = {
    name: '',
    role: '',
    startDate: new Date().toISOString().substring(0, 10),
    endDate: '',
    description: '',
    color: 'blue',
};

export default function NewExperiencePage() {
    return (
        <div className="p-4 md:p-8 bg-page min-h-screen">
            <div className="max-w-3xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-text-primary">Add Experience</h1>
                    <p className="text-text-muted mt-2">Record a job, client, or project to group future entries under.</p>
                </div>

                <ExperienceForm
                    item={emptyItem}
                    action={async (formData) => {
                        'use server';
                        await createExperience(formData);
                    }}
                />
            </div>
        </div>
    );
}
