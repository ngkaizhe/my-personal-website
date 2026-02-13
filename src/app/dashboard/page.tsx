"use client";

import Timeline, { TimelineItem } from "@/components/Timeline";
import { GraduationCap, Briefcase, Code, Trophy } from 'lucide-react';

const timelineData: TimelineItem[] = [
  {
    year: '2019',
    title: 'University Graduation',
    tag: 'Education',
    tagColorClass: 'bg-blue-100 text-blue-800',
    titleColorClass: 'text-blue-600',
    numberColorClass: 'text-blue-600',
    description: 'Graduated with a degree in Computer Science. Specialized in web development and algorithms.',
    icon: <GraduationCap />,
    tags: ['Computer Science', 'Algorithms', 'Java']
  },
  {
    year: '2020',
    title: 'Junior Frontend Developer',
    tag: 'First Job',
    tagColorClass: 'bg-green-100 text-green-800',
    titleColorClass: 'text-green-600',
    numberColorClass: 'text-green-600',
    description: 'Joined a tech startup as a Junior Frontend Developer. Built user interfaces and refactored legacy code.',
    icon: <Briefcase />,
    tags: ['React', 'JavaScript', 'CSS', 'Redux']
  },
  {
    year: '2022',
    title: 'Promoted to Senior Developer',
    tag: 'Career Growth',
    tagColorClass: 'bg-purple-100 text-purple-800',
    titleColorClass: 'text-purple-600',
    numberColorClass: 'text-purple-600',
    description: 'Led a team of 5 developers to deliver a critical e-commerce platform. Implemented CI/CD pipelines.',
    icon: <Trophy />,
    tags: ['Next.js', 'TypeScript', 'AWS', 'Docker']
  },
  {
    year: '2024',
    title: 'Full Stack Architect',
    tag: 'Current Role',
    tagColorClass: 'bg-orange-100 text-orange-800',
    titleColorClass: 'text-orange-600',
    numberColorClass: 'text-orange-600',
    description: 'Designing scalable microservices architectures and mentoring junior developers.',
    icon: <Code />,
    tags: ['System Design', 'Node.js', 'GraphQL', 'Kubernetes']
  },
];

export default function Page() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <Timeline items={timelineData} />
    </div>
  );
}
