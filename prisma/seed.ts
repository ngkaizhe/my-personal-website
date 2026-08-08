import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
// Same helper the write path uses, so seeded tagSlug values can't drift from
// the ones the app generates.
import { tagToSlug } from '../src/lib/slug';

// `prisma db seed` inherits the env that prisma.config.ts loaded (.env.local).
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Cleaning up existing data...');
  // Cascade from User wipes Experience + Entry + Account + Session via onDelete: Cascade.
  await prisma.user.deleteMany();
  await prisma.icon.deleteMany();

  // Ensure default icon exists
  await prisma.icon.upsert({
    where: { name: 'help-circle' },
    update: {},
    create: { name: 'help-circle' },
  });

  console.log('Seeding demo user...');

  const demoUser = await prisma.user.create({
    data: {
      name: 'Demo User',
      email: 'demo@example.com',
      username: 'demo',
      displayName: 'Demo Person',
      bio: 'Software engineer building things. This site is my work-log + résumé generator — flick through the timeline to see what I have shipped.',
      resumeSummaryEn: 'Senior full-stack architect with 5+ years shipping e-commerce platforms — led a cross-functional team of five from zero to checkout, redesigned core auth into microservices (99.5% → 99.99% availability), and cut deploy time 87% with Docker + CI/CD.',
      resumeSummaryZh: '資深全端架構師，5+ 年電商平台經驗——帶領五人跨職能團隊從零做到交付，將核心驗證系統重構為微服務（可用度 99.5% → 99.99%），並以 Docker + CI/CD 將部署時間縮短 87%。',
    },
  });

  console.log('Seeding experiences...');

  // Each experience seeds with an English translation + a Chinese translation
  // so the demo profile looks right under both locales out of the box. The
  // sourceHash is deliberately left null on seed rows — the Translate-staleness
  // tracker doesn't apply to hand-authored seed data.
  const university = await prisma.experience.create({
    data: {
      userId: demoUser.id,
      type: 'EDUCATION',
      primaryLocale: 'en',
      startDate: new Date('2015-09-01'),
      endDate: new Date('2019-06-30'),
      color: 'blue',
      translations: {
        create: [
          {
            locale: 'en',
            organization: 'State University',
            role: 'BSc Computer Science',
            description: 'Web development and algorithms focus. Led the coding club; organized two hackathons.',
          },
          {
            locale: 'zh-TW',
            organization: '州立大學',
            role: '資訊工程學士',
            description: '主修網頁開發與演算法。擔任程式社社長,主辦過兩屆黑客松。',
          },
        ],
      },
    },
  });

  const startup = await prisma.experience.create({
    data: {
      userId: demoUser.id,
      type: 'JOB',
      primaryLocale: 'en',
      startDate: new Date('2020-06-01'),
      endDate: new Date('2022-03-01'),
      color: 'green',
      translations: {
        create: [
          {
            locale: 'en',
            organization: 'TechStartup Co.',
            role: 'Junior Frontend Developer',
            description: 'A small fast-growing startup migrating from jQuery to modern React.',
          },
          {
            locale: 'zh-TW',
            organization: '新創科技公司',
            role: '初階前端工程師',
            description: '小型快速成長的新創,正從 jQuery 遷移到現代 React。',
          },
        ],
      },
    },
  });

  const ecommerce = await prisma.experience.create({
    data: {
      userId: demoUser.id,
      type: 'JOB',
      primaryLocale: 'en',
      startDate: new Date('2022-04-01'),
      endDate: null,
      color: 'purple',
      translations: {
        create: [
          {
            locale: 'en',
            organization: 'Borcelle Commerce',
            role: 'Senior / Full Stack Architect',
            description: 'High-traffic e-commerce platform serving 100k+ daily users.',
          },
          {
            locale: 'zh-TW',
            organization: 'Borcelle 電商',
            role: '資深／全端架構師',
            description: '高流量電商平台,日活躍使用者超過 10 萬。',
          },
        ],
      },
    },
  });

  const entries: Array<{
    date: Date;
    color: string;
    featured: boolean;
    techStack: string[];
    linkUrl: string | null;
    linkText: string | null;
    iconName: string;
    experienceId: string;
    tagSlug: string;
    en: {
      title: string;
      actionVerb: string | null;
      description: string;
      impact: string | null;
      details: string | null;
      tag: string;
    };
    zh: {
      title: string;
      actionVerb: string | null;
      description: string;
      impact: string | null;
      details: string | null;
      tag: string;
    };
  }> = [
    // ==== Pre-work: university ====
    {
      date: new Date('2019-06-15'),
      color: 'blue',
      featured: true,
      techStack: ['Computer Science', 'Algorithms', 'Java'],
      linkUrl: 'https://example.com/degree',
      linkText: 'View Degree',
      iconName: 'school',
      experienceId: university.id,
      tagSlug: tagToSlug('Education'),
      en: {
        title: 'with a degree in Computer Science',
        actionVerb: 'Graduated',
        description: 'Specialized in web development and algorithms. Led the university coding club and organized two hackathons.',
        impact: null,
        details: 'Final year project built a distributed voting system using blockchain technology.',
        tag: 'Education',
      },
      zh: {
        title: '資訊工程學位',
        actionVerb: '取得',
        description: '主修網頁開發與演算法,擔任校園程式社社長並主辦過兩屆黑客松。',
        impact: null,
        details: '畢業專題使用區塊鏈技術建立了分散式投票系統。',
        tag: '學歷',
      },
    },

    // ==== Startup entries ====
    {
      date: new Date('2020-06-15'),
      color: 'green',
      featured: false,
      techStack: ['React', 'JavaScript', 'CSS'],
      linkUrl: null,
      linkText: null,
      iconName: 'briefcase',
      experienceId: startup.id,
      tagSlug: tagToSlug('First Job'),
      en: {
        title: 'as Junior Frontend Developer',
        actionVerb: 'Joined',
        description: 'Onboarded into a small team responsible for the main product UI.',
        impact: null,
        details: null,
        tag: 'First Job',
      },
      zh: {
        title: '初階前端工程師',
        actionVerb: '加入',
        description: '加入負責主產品 UI 的小型團隊。',
        impact: null,
        details: null,
        tag: '第一份工作',
      },
    },
    {
      date: new Date('2021-02-10'),
      color: 'green',
      featured: true,
      techStack: ['React', 'JavaScript', 'Jest', 'Redux'],
      linkUrl: 'https://github.com/example/project',
      linkText: 'View Project',
      iconName: 'refresh-cw',
      experienceId: startup.id,
      tagSlug: tagToSlug('Engineering'),
      en: {
        title: 'legacy jQuery codebase to React',
        actionVerb: 'Migrated',
        description: "Drove the migration of the company's legacy frontend to React with proper component reusability.",
        impact: 'Reduced production bugs by 40% after shipping',
        details: 'Introduced a comprehensive testing suite using Jest and React Testing Library.',
        tag: 'Engineering',
      },
      zh: {
        title: '舊 jQuery 程式庫到 React',
        actionVerb: '遷移',
        description: '主導將公司舊有的 jQuery 前端遷移到 React,並建立可重用的元件架構。',
        impact: '上線後線上 bug 降低 40%',
        details: '導入 Jest 與 React Testing Library 的完整測試套件。',
        tag: '工程',
      },
    },

    // ==== E-commerce experience entries ====
    {
      date: new Date('2022-04-01'),
      color: 'purple',
      featured: false,
      techStack: ['Leadership', 'Mentoring'],
      linkUrl: null,
      linkText: null,
      iconName: 'user-star',
      experienceId: ecommerce.id,
      tagSlug: tagToSlug('Career Growth'),
      en: {
        title: 'to Senior Developer',
        actionVerb: 'Promoted',
        description: 'Shifted focus from just writing code to designing systems and mentoring others.',
        impact: null,
        details: null,
        tag: 'Career Growth',
      },
      zh: {
        title: '為資深工程師',
        actionVerb: '晉升',
        description: '從單純寫程式轉向系統設計與指導他人。',
        impact: null,
        details: null,
        tag: '職涯成長',
      },
    },
    {
      date: new Date('2022-09-20'),
      color: 'purple',
      featured: true,
      techStack: ['Next.js', 'TypeScript', 'AWS'],
      linkUrl: null,
      linkText: null,
      iconName: 'rocket',
      experienceId: ecommerce.id,
      tagSlug: tagToSlug('Career Growth'),
      en: {
        title: 'team of 5 to ship e-commerce platform',
        actionVerb: 'Led',
        description: 'Delivered a critical e-commerce platform end-to-end with a small cross-functional team.',
        impact: 'Handles 100k+ daily active users in production',
        details: 'Coordinated design, backend, and frontend tracks. Delivered on schedule.',
        tag: 'Career Growth',
      },
      zh: {
        title: '5 人團隊推出電商平台',
        actionVerb: '帶領',
        description: '帶領跨職能小團隊端到端交付關鍵的電商平台。',
        impact: '線上日活躍使用者超過 10 萬',
        details: '協調設計、後端與前端三軌,如期交付。',
        tag: '職涯成長',
      },
    },
    {
      date: new Date('2023-01-15'),
      color: 'cyan',
      featured: true,
      techStack: ['Docker', 'GitHub Actions', 'Kubernetes'],
      linkUrl: null,
      linkText: null,
      iconName: 'package',
      experienceId: ecommerce.id,
      tagSlug: tagToSlug('DevOps'),
      en: {
        title: 'Docker and CI/CD pipelines',
        actionVerb: 'Introduced',
        description: 'Set up automated deployment with GitHub Actions and containerized every service.',
        impact: 'Reduced deployment time from 2 hours to 15 minutes (87% reduction)',
        details: null,
        tag: 'DevOps',
      },
      zh: {
        title: 'Docker 與 CI/CD 流程',
        actionVerb: '導入',
        description: '用 GitHub Actions 建立自動化部署,並把所有服務容器化。',
        impact: '部署時間從 2 小時縮到 15 分鐘 (87% 減少)',
        details: null,
        tag: 'DevOps',
      },
    },
    {
      date: new Date('2024-03-10'),
      color: 'orange',
      featured: true,
      techStack: ['System Design', 'Node.js', 'GraphQL', 'Kubernetes'],
      linkUrl: 'https://borcelle.com',
      linkText: 'Company Website',
      iconName: 'code',
      experienceId: ecommerce.id,
      tagSlug: tagToSlug('Current Role'),
      en: {
        title: 'core authentication to microservices',
        actionVerb: 'Redesigned',
        description: 'Broke the monolithic auth service into independent microservices for scalability.',
        impact: 'Improved auth endpoint reliability from 99.5% to 99.99%',
        details: 'Coordinated rollout with zero downtime using shadow traffic.',
        tag: 'Current Role',
      },
      zh: {
        title: '核心驗證系統為微服務',
        actionVerb: '重新設計',
        description: '把單體式的驗證服務拆成獨立的微服務,提升擴展性。',
        impact: '驗證 endpoint 可用度從 99.5% 提升到 99.99%',
        details: '使用 shadow traffic 達成零停機切換。',
        tag: '目前職務',
      },
    },
    {
      date: new Date('2024-11-01'),
      color: 'orange',
      featured: true,
      techStack: ['Leadership', 'Process', 'Mentorship'],
      linkUrl: null,
      linkText: null,
      iconName: 'users',
      experienceId: ecommerce.id,
      tagSlug: tagToSlug('Leadership'),
      en: {
        title: 'engineering onboarding process',
        actionVerb: 'Revamped',
        description: 'Rebuilt the new-hire ramp up with a progressive guided path and paired mentorship.',
        impact: 'Cut new-hire time-to-first-PR from 3 weeks to 5 days',
        details: null,
        tag: 'Leadership',
      },
      zh: {
        title: '工程團隊的新人入職流程',
        actionVerb: '改造',
        description: '重新設計新人 ramp-up,改採漸進式引導路徑加配對導師制。',
        impact: '新人從入職到第一次送 PR 的時間從 3 週縮到 5 天',
        details: null,
        tag: '領導',
      },
    },
  ];

  console.log('Seeding entries...');
  for (const item of entries) {
    const icon = await prisma.icon.upsert({
      where: { name: item.iconName },
      update: {},
      create: { name: item.iconName },
    });
    await prisma.entry.create({
      data: {
        date: item.date,
        primaryLocale: 'en',
        featured: item.featured,
        tagSlug: item.tagSlug,
        color: item.color,
        techStack: item.techStack,
        linkUrl: item.linkUrl,
        linkText: item.linkText,
        iconId: icon.id,
        experienceId: item.experienceId,
        userId: demoUser.id,
        translations: {
          create: [
            { locale: 'en', ...item.en },
            { locale: 'zh-TW', ...item.zh },
          ],
        },
      },
    });
  }

  console.log('Seeding complete.');
  console.log(`  Demo user: id=${demoUser.id}, username=demo, email=demo@example.com`);
  console.log(`  Public profile URL: /@demo`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
