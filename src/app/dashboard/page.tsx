"use client";

import Timeline, { TimelineItem } from "@/components/Timeline";

const timelineData: TimelineItem[] = [
  {
    year: '2020',
    title: 'Foundation',
    tag: 'Foundation',
    tagColorClass: 'bg-orange-100 text-orange-800',
    titleColorClass: 'text-orange-500',
    numberColorClass: 'text-orange-500',
    description: 'Foundation of the Borcelle company by a group of visionary entrepreneurs.',
  },
  {
    year: '2021',
    title: 'First Product',
    tag: 'First product',
    tagColorClass: 'bg-yellow-100 text-yellow-800',
    titleColorClass: 'text-yellow-500',
    numberColorClass: 'text-yellow-500',
    description: 'Launch of its first product, a revolutionary software for project management.',
  },
  {
    year: '2022',
    title: 'Expansion',
    tag: 'Expansion',
    tagColorClass: 'bg-red-100 text-red-800',
    titleColorClass: 'text-red-500',
    numberColorClass: 'text-red-500',
    description: 'International expansion with the opening of eight new branches.',
  },
  {
    year: '2023',
    title: 'Market Leader',
    tag: 'Market leader',
    tagColorClass: 'bg-pink-100 text-pink-800',
    titleColorClass: 'text-pink-500',
    numberColorClass: 'text-pink-500',
    description: 'Acquisition of a competing company, consolidating itself as a market leader.',
  },
  {
    year: '2025',
    title: 'New Product',
    tag: 'New product',
    tagColorClass: 'bg-purple-100 text-purple-800',
    titleColorClass: 'text-purple-500',
    numberColorClass: 'text-purple-500',
    description: 'Development and launch of a new innovative product for business management.',
  },
  {
    year: '2026',
    title: 'Alliance',
    tag: 'Alliance',
    tagColorClass: 'bg-blue-100 text-blue-800',
    titleColorClass: 'text-blue-500',
    numberColorClass: 'text-blue-500',
    description: 'Strategic alliance with a leading technology company in artificial intelligence.',
  },
  {
    year: '2027',
    title: 'Sustainability',
    tag: 'Sustainability',
    tagColorClass: 'bg-teal-100 text-teal-800',
    titleColorClass: 'text-teal-500',
    numberColorClass: 'text-teal-500',
    description: 'Implementation of social responsibility and sustainability policies in all its operations.',
  },
  {
    year: '2028',
    title: 'E-learning',
    tag: 'E-learning',
    tagColorClass: 'bg-green-100 text-green-800',
    titleColorClass: 'text-green-500',
    numberColorClass: 'text-green-500',
    description: 'Launch of a digital platform for online training of the entire company team.',
  },
  {
    year: '2029',
    title: 'Recognition',
    tag: 'Recognition',
    tagColorClass: 'bg-lime-100 text-lime-800',
    titleColorClass: 'text-lime-500',
    numberColorClass: 'text-lime-500',
    description: 'Recognition as one of the most innovative and successful companies in the sector.',
  },
  {
    year: '2030',
    title: 'Tenth Anniversary',
    tag: 'Tenth anniversary',
    tagColorClass: 'bg-yellow-100 text-yellow-800',
    titleColorClass: 'text-yellow-500',
    numberColorClass: 'text-yellow-500',
    description: 'Celebrating a Decade of Innovation and Commitment to Lead in the Future.',
  },
];

export default function Page() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <Timeline items={timelineData} />
    </div>
  );
}
