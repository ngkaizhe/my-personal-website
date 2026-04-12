import { createEntry, getEmployerOptions } from "../entries/actions";
import QuickAdd from "@/components/Entry/QuickAdd";

export const metadata = {
    title: "Quick Add",
};

export default async function QuickAddPage() {
    const employers = await getEmployerOptions();

    const action = async (formData: FormData) => {
        'use server';
        await createEntry(formData);
    };

    return (
        <div className="p-4 md:p-8 bg-page min-h-screen">
            <div className="max-w-3xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-text-primary">Quick Add</h1>
                    <p className="text-text-muted mt-2">
                        Describe what you did in one sentence. Claude will extract the structured fields for you.
                    </p>
                </div>

                <QuickAdd employers={employers} action={action} />
            </div>
        </div>
    );
}
