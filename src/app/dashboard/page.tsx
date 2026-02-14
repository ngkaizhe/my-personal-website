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
    details: 'During my time at university, I focused heavily on data structures and algorithms, which laid a strong foundation for my problem-solving skills. I also led the university coding club and organized two hackathons. My final year project involved building a distributed voting system using blockchain technology.',
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
    details: 'My first professional role was a steep learning curve. I was responsible for migrating the company\'s legacy jQuery codebase to React. This experience taught me the importance of component reusability and state management. I also implemented a comprehensive testing suite that reduced production bugs by 40%.',
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
    details: 'As a Senior Developer, I shifted my focus from just writing code to designing systems and mentoring others. I led the development of a high-traffic e-commerce platform that handled over 100k daily users. I also introduced Docker and CI/CD pipelines, which reduced deployment time from 2 hours to 15 minutes.',
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
    details: 'In my current role, I oversee the architectural decisions for our entire product suite. I recently redesigned our core authentication service to be microservices-based, improving scalability and reliability. I\'m also heavily involved in hiring and have revamped our engineering onboarding process.',
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
    details: 'My long-term goal is to become a CTO where I can shape the technical vision of a company. I want to build an engineering culture that values innovation, psychological safety, and open source contribution. I plan to continue contributing to the developer community through speaking and writing.',
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
    details: 'I aspire to be a regular speaker at major tech conferences like React Conf and AWS re:Invent. I want to share my experiences in building scalable systems and growing engineering teams. I believe that sharing knowledge is the best way to give back to the community that helped me grow.',
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
    details: 'Eventually, I want to use my experience and resources to help other founders succeed. I plan to focus on angel investing in the developer tools space, identifying promising startups that are solving real problems for engineers. I also want to provide mentorship to first-time technical founders.',
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
