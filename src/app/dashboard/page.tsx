"use client";

import Timeline, { TimelineItem } from "@/components/Timeline";
import { GraduationCap, Briefcase, Code, Trophy } from 'lucide-react';

const timelineData: TimelineItem[] = [
  new TimelineItem({
    year: {
      content: '2019',
      colorClass: 'text-blue-600',
    },
    title: {
      content: 'University Graduation',
      colorClass: 'text-blue-600',
    },
    category: {
      text: 'Education',
      colorClass: 'bg-blue-100 text-blue-800',
    },
    description: 'Graduated with a degree in Computer Science. Specialized in web development and algorithms.',
    details: 'During my time at university, I focused heavily on data structures and algorithms, which laid a strong foundation for my problem-solving skills. I also led the university coding club and organized two hackathons. My final year project involved building a distributed voting system using blockchain technology.',
    icon: <GraduationCap />,
    techStack: ['Computer Science', 'Algorithms', 'Java'],
    link: {
      url: 'https://example.com/degree',
      text: 'View Degree'
    }
  }),
  new TimelineItem({
    year: {
      content: '2020',
      colorClass: 'text-green-600',
    },
    title: {
      content: 'Junior Frontend Developer',
      colorClass: 'text-green-600',
    },
    category: {
      text: 'First Job',
      colorClass: 'bg-green-100 text-green-800',
    },
    description: 'Joined a tech startup as a Junior Frontend Developer. Built user interfaces and refactored legacy code.',
    details: 'My first professional role was a steep learning curve. I was responsible for migrating the company\'s legacy jQuery codebase to React. This experience taught me the importance of component reusability and state management. I also implemented a comprehensive testing suite that reduced production bugs by 40%.',
    icon: <Briefcase />,
    techStack: ['React', 'JavaScript', 'CSS', 'Redux'],
    link: {
      url: 'https://github.com/example/project',
      text: 'View Project'
    }
  }),
  new TimelineItem({
    year: {
      content: '2022',
      colorClass: 'text-purple-600',
    },
    title: {
      content: 'Promoted to Senior Developer',
      colorClass: 'text-purple-600',
    },
    category: {
      text: 'Career Growth',
      colorClass: 'bg-purple-100 text-purple-800',
    },
    description: 'Led a team of 5 developers to deliver a critical e-commerce platform. Implemented CI/CD pipelines.',
    details: 'As a Senior Developer, I shifted my focus from just writing code to designing systems and mentoring others. I led the development of a high-traffic e-commerce platform that handled over 100k daily users. I also introduced Docker and CI/CD pipelines, which reduced deployment time from 2 hours to 15 minutes.',
    icon: <Trophy />,
    techStack: ['Next.js', 'TypeScript', 'AWS', 'Docker']
  }),
  new TimelineItem({
    year: {
      content: '2024',
      colorClass: 'text-orange-600',
    },
    title: {
      content: 'Full Stack Architect',
      colorClass: 'text-orange-600',
    },
    category: {
      text: 'Current Role',
      colorClass: 'bg-orange-100 text-orange-800',
    },
    description: 'Designing scalable microservices architectures and mentoring junior developers.',
    details: 'In my current role, I oversee the architectural decisions for our entire product suite. I recently redesigned our core authentication service to be microservices-based, improving scalability and reliability. I\'m also heavily involved in hiring and have revamped our engineering onboarding process.',
    icon: <Code />,
    techStack: ['System Design', 'Node.js', 'GraphQL', 'Kubernetes'],
    link: {
      url: 'https://borcelle.com',
      text: 'Company Website'
    }
  }),
  new TimelineItem({
    year: {
      content: '2025',
      colorClass: 'text-teal-600',
    },
    title: {
      content: 'CTO',
      colorClass: 'text-teal-600',
    },
    category: {
      text: 'Future Goal',
      colorClass: 'bg-teal-100 text-teal-800',
    },
    description: 'Leading the technology strategy for a major tech company. Driving innovation and open source contributions.',
    details: 'My long-term goal is to become a CTO where I can shape the technical vision of a company. I want to build an engineering culture that values innovation, psychological safety, and open source contribution. I plan to continue contributing to the developer community through speaking and writing.',
    icon: <Trophy />,
    techStack: ['Leadership', 'Strategy', 'AI'],
  }),
  new TimelineItem({
    year: {
      content: '2026',
      colorClass: 'text-pink-600',
    },
    title: {
      content: 'Tech Conference Speaker',
      colorClass: 'text-pink-600',
    },
    category: {
      text: 'Community',
      colorClass: 'bg-pink-100 text-pink-800',
    },
    description: 'giving keynotes at major conferences about software architecture and team culture.',
    details: 'I aspire to be a regular speaker at major tech conferences like React Conf and AWS re:Invent. I want to share my experiences in building scalable systems and growing engineering teams. I believe that sharing knowledge is the best way to give back to the community that helped me grow.',
    icon: <GraduationCap />,
    techStack: ['Public Speaking', 'DevRel'],
  }),
  new TimelineItem({
    year: {
      content: '2027',
      colorClass: 'text-yellow-600',
    },
    title: {
      content: 'Angel Investor',
      colorClass: 'text-yellow-600',
    },
    category: {
      text: 'Giving Back',
      colorClass: 'bg-yellow-100 text-yellow-800',
    },
    description: 'Investing in and mentoring early-stage startups in the developer tools space.',
    details: 'Eventually, I want to use my experience and resources to help other founders succeed. I plan to focus on angel investing in the developer tools space, identifying promising startups that are solving real problems for engineers. I also want to provide mentorship to first-time technical founders.',
    icon: <Briefcase />,
    techStack: ['Investing', 'Mentorship'],
  }),
];

export default function Page() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <Timeline items={timelineData} />
    </div>
  );
}
