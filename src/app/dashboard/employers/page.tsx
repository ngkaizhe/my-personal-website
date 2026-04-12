import Link from "next/link";
import { getEmployers, deleteEmployer } from "./actions";
import EmployerList from "@/components/Employer/EmployerList";

export const metadata = {
    title: "Manage Employers",
};

export default async function EmployersPage() {
    const items = await getEmployers();

    const deleteAction = async (id: string) => {
        'use server';
        await deleteEmployer(id);
    };

    return (
        <div className="p-4 md:p-8 bg-page min-h-screen">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-text-primary">Employers</h1>
                        <p className="text-text-muted mt-2">Jobs, clients, or projects that group your entries.</p>
                    </div>
                    <Link
                        href="/dashboard/employers/new"
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors text-center whitespace-nowrap
                            focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2"
                    >
                        Add Employer
                    </Link>
                </div>

                <EmployerList items={items} deleteAction={deleteAction} />
            </div>
        </div>
    );
}
