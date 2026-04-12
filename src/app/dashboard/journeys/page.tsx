import Link from "next/link";
import { getJourneySummaries, deleteJourney } from "./actions";
import JourneyList from "@/components/Journey/JourneyList";

export const metadata = {
  title: "Manage Journeys",
};

export default async function JourneysPage() {
    const items = await getJourneySummaries();

    const deleteAction = async (id: string) => {
        'use server';
        await deleteJourney(id);
    };

    return (
        <div className="p-4 md:p-8 bg-page min-h-screen">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
                    <h1 className="text-3xl font-bold text-text-primary">Manage Journeys</h1>
                    <Link
                        href="/dashboard/journeys/new"
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors text-center whitespace-nowrap
                            focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2"
                    >
                        Add New Journey
                    </Link>
                </div>

                <JourneyList items={items} deleteAction={deleteAction} />
            </div>
        </div>
    );
}
