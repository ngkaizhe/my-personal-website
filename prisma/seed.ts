import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Cleaning up existing data...');
  await prisma.entry.deleteMany();
  await prisma.employer.deleteMany();
  await prisma.icon.deleteMany();

  // Ensure default icon exists
  await prisma.icon.upsert({
    where: { name: 'help-circle' },
    update: {},
    create: { name: 'help-circle' },
  });

  console.log('Seeding employers...');

  const startup = await prisma.employer.create({
    data: {
      name: 'TechStartup Co.',
      role: 'Junior Frontend Developer',
      startDate: new Date('2020-06-01'),
      endDate: new Date('2022-03-01'),
      description: 'A small fast-growing startup migrating from jQuery to modern React.',
      color: 'green',
    },
  });

  const ecommerce = await prisma.employer.create({
    data: {
      name: 'Borcelle Commerce',
      role: 'Senior / Full Stack Architect',
      startDate: new Date('2022-04-01'),
      endDate: null,
      description: 'High-traffic e-commerce platform serving 100k+ daily users.',
      color: 'purple',
    },
  });

  const entries = [
    // ==== Pre-work: university ====
    {
      date: new Date('2019-06-15'),
      title: 'with a degree in Computer Science',
      actionVerb: 'Graduated',
      description: 'Specialized in web development and algorithms. Led the university coding club and organized two hackathons.',
      impact: null,
      details: 'Final year project built a distributed voting system using blockchain technology.',
      tag: 'Education',
      color: 'blue',
      techStack: ['Computer Science', 'Algorithms', 'Java'],
      linkUrl: 'https://example.com/degree',
      linkText: 'View Degree',
      iconName: 'school',
      employerId: null,
    },

    // ==== Startup entries ====
    {
      date: new Date('2020-06-15'),
      title: 'as Junior Frontend Developer',
      actionVerb: 'Joined',
      description: 'Onboarded into a small team responsible for the main product UI.',
      impact: null,
      details: null,
      tag: 'First Job',
      color: 'green',
      techStack: ['React', 'JavaScript', 'CSS'],
      linkUrl: null,
      linkText: null,
      iconName: 'briefcase',
      employerId: startup.id,
    },
    {
      date: new Date('2021-02-10'),
      title: 'legacy jQuery codebase to React',
      actionVerb: 'Migrated',
      description: "Drove the migration of the company's legacy frontend to React with proper component reusability.",
      impact: 'Reduced production bugs by 40% after shipping',
      details: 'Introduced a comprehensive testing suite using Jest and React Testing Library.',
      tag: 'Engineering',
      color: 'green',
      techStack: ['React', 'JavaScript', 'Jest', 'Redux'],
      linkUrl: 'https://github.com/example/project',
      linkText: 'View Project',
      iconName: 'refresh-cw',
      employerId: startup.id,
    },

    // ==== E-commerce employer entries ====
    {
      date: new Date('2022-04-01'),
      title: 'to Senior Developer',
      actionVerb: 'Promoted',
      description: 'Shifted focus from just writing code to designing systems and mentoring others.',
      impact: null,
      details: null,
      tag: 'Career Growth',
      color: 'purple',
      techStack: ['Leadership', 'Mentoring'],
      linkUrl: null,
      linkText: null,
      iconName: 'user-star',
      employerId: ecommerce.id,
    },
    {
      date: new Date('2022-09-20'),
      title: 'team of 5 to ship e-commerce platform',
      actionVerb: 'Led',
      description: 'Delivered a critical e-commerce platform end-to-end with a small cross-functional team.',
      impact: 'Handles 100k+ daily active users in production',
      details: 'Coordinated design, backend, and frontend tracks. Delivered on schedule.',
      tag: 'Career Growth',
      color: 'purple',
      techStack: ['Next.js', 'TypeScript', 'AWS'],
      linkUrl: null,
      linkText: null,
      iconName: 'rocket',
      employerId: ecommerce.id,
    },
    {
      date: new Date('2023-01-15'),
      title: 'Docker and CI/CD pipelines',
      actionVerb: 'Introduced',
      description: 'Set up automated deployment with GitHub Actions and containerized every service.',
      impact: 'Reduced deployment time from 2 hours to 15 minutes (87% reduction)',
      details: null,
      tag: 'DevOps',
      color: 'cyan',
      techStack: ['Docker', 'GitHub Actions', 'Kubernetes'],
      linkUrl: null,
      linkText: null,
      iconName: 'package',
      employerId: ecommerce.id,
    },
    {
      date: new Date('2024-03-10'),
      title: 'core authentication to microservices',
      actionVerb: 'Redesigned',
      description: 'Broke the monolithic auth service into independent microservices for scalability.',
      impact: 'Improved auth endpoint reliability from 99.5% to 99.99%',
      details: 'Coordinated rollout with zero downtime using shadow traffic.',
      tag: 'Current Role',
      color: 'orange',
      techStack: ['System Design', 'Node.js', 'GraphQL', 'Kubernetes'],
      linkUrl: 'https://borcelle.com',
      linkText: 'Company Website',
      iconName: 'code',
      employerId: ecommerce.id,
    },
    {
      date: new Date('2024-11-01'),
      title: 'engineering onboarding process',
      actionVerb: 'Revamped',
      description: 'Rebuilt the new-hire ramp up with a progressive guided path and paired mentorship.',
      impact: 'Cut new-hire time-to-first-PR from 3 weeks to 5 days',
      details: null,
      tag: 'Leadership',
      color: 'orange',
      techStack: ['Leadership', 'Process', 'Mentorship'],
      linkUrl: null,
      linkText: null,
      iconName: 'users',
      employerId: ecommerce.id,
    },
  ];

  console.log('Seeding entries...');
  for (const item of entries) {
    const { iconName, ...rest } = item;
    const iconTarget = iconName || 'help-circle';
    const icon = await prisma.icon.upsert({
      where: { name: iconTarget },
      update: {},
      create: { name: iconTarget },
    });
    await prisma.entry.create({
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
