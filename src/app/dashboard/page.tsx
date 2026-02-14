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
    tags: ['Computer Science', 'Algorithms', 'Java'],
    link: {
      url: 'https://example.com/degree',
      text: 'View Degree'
    }
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
    tags: ['React', 'JavaScript', 'CSS', 'Redux'],
    link: {
      url: 'https://github.com/example/project',
      text: 'View Project'
    }
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
    tags: ['System Design', 'Node.js', 'GraphQL', 'Kubernetes'],
    link: {
      url: 'https://borcelle.com',
      text: 'Company Website'
    }
  },
  {
    year: '2025',
    title: 'CTO',
    tag: 'Future Goal',
    tagColorClass: 'bg-teal-100 text-teal-800',
    titleColorClass: 'text-teal-600',
    numberColorClass: 'text-teal-600',
    description: 'Leading the technology strategy for a major tech company. Driving innovation and open source contributions.',
    icon: <Trophy />,
    tags: ['Leadership', 'Strategy', 'AI'],
  },
  {
    year: '2026',
    title: 'Tech Conference Speaker',
    tag: 'Community',
    tagColorClass: 'bg-pink-100 text-pink-800',
    titleColorClass: 'text-pink-600',
    numberColorClass: 'text-pink-600',
    description: 'giving keynotes at major conferences about software architecture and team culture.',
    icon: <GraduationCap />,
    tags: ['Public Speaking', 'DevRel'],
  },
  {
    year: '2027',
    title: 'Angel Investor',
    tag: 'Giving Back',
    tagColorClass: 'bg-yellow-100 text-yellow-800',
    titleColorClass: 'text-yellow-600',
    numberColorClass: 'text-yellow-600',
    description: 'Investing in and mentoring early-stage startups in the developer tools space.',
    icon: <Briefcase />,
    tags: ['Investing', 'Mentorship'],
  },
];

export default function Page() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <Timeline items={timelineData} />
    </div>
  );
}
