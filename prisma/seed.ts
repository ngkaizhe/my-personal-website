import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Cleaning up existing data...');
  await prisma.timelineItem.deleteMany();
  await prisma.icon.deleteMany();

  const timelineData = [
    {
      yearContent: '2019',
      titleContent: 'University Graduation',
      categoryText: 'Education',
      color: 'blue',
      description: 'Graduated with a degree in Computer Science. Specialized in web development and algorithms.',
      details: 'During my time at university, I focused heavily on data structures and algorithms, which laid a strong foundation for my problem-solving skills. I also led the university coding club and organized two hackathons. My final year project involved building a distributed voting system using blockchain technology.',
      techStack: ['Computer Science', 'Algorithms', 'Java'],
      linkUrl: 'https://example.com/degree',
      linkText: 'View Degree',
      iconName: 'school',
    },
    {
      yearContent: '2020',
      titleContent: 'Junior Frontend Developer',
      categoryText: 'First Job',
      color: 'green',
      description: 'Joined a tech startup as a Junior Frontend Developer. Built user interfaces and refactored legacy code.',
      details: "My first professional role was a steep learning curve. I was responsible for migrating the company's legacy jQuery codebase to React. This experience taught me the importance of component reusability and state management. I also implemented a comprehensive testing suite that reduced production bugs by 40%.",
      techStack: ['React', 'JavaScript', 'CSS', 'Redux'],
      linkUrl: 'https://github.com/example/project',
      linkText: 'View Project',
      iconName: 'briefcase',
    },
    {
      yearContent: '2022',
      titleContent: 'Promoted to Senior Developer',
      categoryText: 'Career Growth',
      color: 'purple',
      description: 'Led a team of 5 developers to deliver a critical e-commerce platform. Implemented CI/CD pipelines.',
      details: 'As a Senior Developer, I shifted my focus from just writing code to designing systems and mentoring others. I led the development of a high-traffic e-commerce platform that handled over 100k daily users. I also introduced Docker and CI/CD pipelines, which reduced deployment time from 2 hours to 15 minutes.',
      techStack: ['Next.js', 'TypeScript', 'AWS', 'Docker'],
      iconName: 'user-star',
    },
    {
      yearContent: '2024',
      titleContent: 'Full Stack Architect',
      categoryText: 'Current Role',
      color: 'orange',
      description: 'Designing scalable microservices architectures and mentoring junior developers.',
      details: "In my current role, I oversee the architectural decisions for our entire product suite. I recently redesigned our core authentication service to be microservices-based, improving scalability and reliability. I'm also heavily involved in hiring and have revamped our engineering onboarding process.",
      techStack: ['System Design', 'Node.js', 'GraphQL', 'Kubernetes'],
      linkUrl: 'https://borcelle.com',
      linkText: 'Company Website',
      iconName: 'code',
    },
    {
      yearContent: '2025',
      titleContent: 'CTO',
      categoryText: 'Future Goal',
      color: 'teal',
      description: 'Leading the technology strategy for a major tech company. Driving innovation and open source contributions.',
      details: 'My long-term goal is to become a CTO where I can shape the technical vision of a company. I want to build an engineering culture that values innovation, psychological safety, and open source contribution. I plan to continue contributing to the developer community through speaking and writing.',
      techStack: ['Leadership', 'Strategy', 'AI'],
    },
    {
      yearContent: '2026',
      titleContent: 'Tech Conference Speaker',
      categoryText: 'Community',
      color: 'pink',
      description: 'giving keynotes at major conferences about software architecture and team culture.',
      details: 'I aspire to be a regular speaker at major tech conferences like React Conf and AWS re:Invent. I want to share my experiences in building scalable systems and growing engineering teams. I believe that sharing knowledge is the best way to give back to the community that helped me grow.',
      techStack: ['Public Speaking', 'DevRel'],
      iconName: 'graduation-cap',
    },
    {
      yearContent: '2027',
      titleContent: 'Angel Investor',
      categoryText: 'Giving Back',
      color: 'yellow',
      description: 'Investing in and mentoring early-stage startups in the developer tools space.',
      details: 'Eventually, I want to use my experience and resources to help other founders succeed. I plan to focus on angel investing in the developer tools space, identifying promising startups that are solving real problems for engineers. I also want to provide mentorship to first-time technical founders.',
      techStack: ['Investing', 'Mentorship'],
      iconName: 'heart',
    },
  ];

  console.log('Seeding icons and timeline items...');

  // Ensure default icon exists
  const defaultIcon = await prisma.icon.upsert({
    where: { name: 'help-circle' },
    update: {},
    create: { name: 'help-circle' },
  });

  for (const item of timelineData) {
    const { iconName, ...rest } = item;

    // Use specific icon or fallback to default
    const targetIconName = iconName || 'help-circle';

    // Create or find the icon
    const icon = await prisma.icon.upsert({
      where: { name: targetIconName },
      update: {},
      create: { name: targetIconName },
    });

    // Create the timeline item with the relation
    await prisma.timelineItem.create({
      data: {
        ...rest,
        iconId: icon.id,
      },
    });
  }
  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
