import { getExperienceDetail, updateExperience } from "../actions";
import ExperienceForm from "@/components/Experience/ExperienceForm";
import { notFound } from "next/navigation";

export const metadata = {
    title: "Edit Experience",
};

export default async function EditExperiencePage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    const item = await getExperienceDetail(resolvedParams.id);

    if (!item) notFound();

    const updateAction = async (formData: FormData) => {
        'use server';
        await updateExperience(resolvedParams.id, formData);
    };

    return (
        <div className="p-4 md:p-8 bg-page min-h-screen">
            <div className="max-w-3xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-text-primary">Edit Experience</h1>
                </div>

                <ExperienceForm item={item} action={updateAction} />
            </div>
        </div>
    );
}
