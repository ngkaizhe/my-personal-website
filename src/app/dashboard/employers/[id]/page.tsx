import { getEmployerDetail, updateEmployer } from "../actions";
import EmployerForm from "@/components/Employer/EmployerForm";
import { notFound } from "next/navigation";

export const metadata = {
    title: "Edit Employer",
};

export default async function EditEmployerPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    const item = await getEmployerDetail(resolvedParams.id);

    if (!item) notFound();

    const updateAction = async (formData: FormData) => {
        'use server';
        await updateEmployer(resolvedParams.id, formData);
    };

    return (
        <div className="p-4 md:p-8 bg-page min-h-screen">
            <div className="max-w-3xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-text-primary">Edit Employer</h1>
                </div>

                <EmployerForm item={item} action={updateAction} />
            </div>
        </div>
    );
}
