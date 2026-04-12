import Link from "next/link";
import { getJourneySummaries, deleteJourney } from "./actions";
import { getBadgeClass } from "@/lib/colors";

export const metadata = {
  title: "Manage Journeys",
};

export default async function JourneysPage() {
    const items = await getJourneySummaries();

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

                <div className="bg-surface rounded-xl shadow-sm border border-border overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-surface-elevated border-b border-border-light">
                                <th className="p-4 font-semibold text-text-muted">Year</th>
                                <th className="p-4 font-semibold text-text-muted">Title</th>
                                <th className="p-4 font-semibold text-text-muted">Tag</th>
                                <th className="p-4 font-semibold text-text-muted text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-text-muted">
                                        No journey items found. Add one to get started!
                                    </td>
                                </tr>
                            ) : (
                                items.map((item) => (
                                    <tr key={item.id} className="border-b border-border-light hover:bg-surface-elevated/50">
                                        <td className="p-4 font-medium text-text-primary">{item.year}</td>
                                        <td className="p-4 text-text-secondary">{item.title}</td>
                                        <td className="p-4">
                                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getBadgeClass(item.color)}`}>
                                                {item.tag}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right space-x-3">
                                            <Link
                                                href={`/dashboard/journeys/${item.id}`}
                                                className="text-blue-600 hover:text-blue-800 font-medium"
                                            >
                                                Edit
                                            </Link>
                                            <form action={async () => {
                                                'use server';
                                                await deleteJourney(item.id);
                                            }} className="inline-block">
                                                <button
                                                    type="submit"
                                                    className="text-red-600 hover:text-red-800 font-medium"
                                                >
                                                    Delete
                                                </button>
                                            </form>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
