'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export interface JourneyFormItem {
    yearContent: string;
    yearColor: string;
    titleContent: string;
    titleColor: string;
    categoryText: string;
    categoryColor: string;
    description: string;
    details: string;
    techStack: string[];
    linkUrl: string;
    linkText: string;
    iconName: string;
}

export default function JourneyForm({ item, action }: { item: JourneyFormItem; action: (formData: FormData) => Promise<void> }) {
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);
    const [techStack, setTechStack] = useState<string[]>(item.techStack);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSubmitting(true);
        const formData = new FormData(e.currentTarget);
        techStack.forEach(t => formData.append('techStack', t));

        try {
            await action(formData);
        } catch (error) {
            console.error('Failed to save journey:', error);
            setSubmitting(false);
        }
    };

    const addTech = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const val = e.currentTarget.value.trim();
            if (val && !techStack.includes(val)) {
                setTechStack([...techStack, val]);
                e.currentTarget.value = '';
            }
        }
    };

    const removeTech = (t: string) => {
        setTechStack(techStack.filter(v => v !== t));
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-xl shadow-sm border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Year Content (e.g., 2024)</label>
                    <input name="yearContent" defaultValue={item.yearContent} required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="2024" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Year Color (e.g., text-blue-600)</label>
                    <input name="yearColor" defaultValue={item.yearColor} required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="text-blue-600" />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Title Content (e.g., Senior Developer)</label>
                    <input name="titleContent" defaultValue={item.titleContent} required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Senior Developer" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Title Color (e.g., text-blue-600)</label>
                    <input name="titleColor" defaultValue={item.titleColor} required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="text-blue-600" />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category Text (e.g., Work)</label>
                    <input name="categoryText" defaultValue={item.categoryText} required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Work" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category Color (e.g., bg-blue-100 text-blue-800)</label>
                    <input name="categoryColor" defaultValue={item.categoryColor} required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="bg-blue-100 text-blue-800" />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Icon Name (Lucide string, e.g., briefcase)</label>
                    <input name="iconName" defaultValue={item.iconName} required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="briefcase" />
                    <p className="text-xs text-gray-500 mt-1">Check <a href="https://lucide.dev/icons" target="_blank" rel="noreferrer" className="text-blue-600 underline">lucide.dev</a> for icon names.</p>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Short Description</label>
                <textarea name="description" defaultValue={item.description} required rows={2} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Brief summary of the milestone..."></textarea>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Details (Optional - supports full markdown/long text)</label>
                <textarea name="details" defaultValue={item.details} rows={4} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Detailed explanation..."></textarea>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tech Stack (Press Enter to add)</label>
                <div className="flex flex-wrap gap-2 mb-3">
                    {techStack.map(t => (
                        <span key={t} className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm flex items-center">
                            {t}
                            <button type="button" onClick={() => removeTech(t)} className="ml-2 text-gray-500 hover:text-red-500 font-bold">&times;</button>
                        </span>
                    ))}
                </div>
                <input type="text" onKeyDown={addTech} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Add a technology..." />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Link URL (Optional)</label>
                    <input type="url" name="linkUrl" defaultValue={item.linkUrl} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="https://example.com" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Link Text (Optional)</label>
                    <input name="linkText" defaultValue={item.linkText} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="View Project" />
                </div>
            </div>

            <div className="flex justify-end space-x-4 pt-6 border-t">
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="px-6 py-2 border rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50"
                >
                    {submitting ? 'Saving...' : 'Save Journey'}
                </button>
            </div>
        </form>
    );
}
