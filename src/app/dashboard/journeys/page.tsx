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
        <div className="p-8 bg-page min-h-screen">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-text-primary">Manage Journeys</h1>
                    <Link
                        href="/dashboard/journeys/new"
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                    >
                        Add New Journey
                    </Link>
                </div>

                <JourneyList items={items} deleteAction={deleteAction} />
            </div>
        </div>
    );
}
