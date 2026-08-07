import { PrismaClient } from '@/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
}

// Prisma 7 requires an explicit driver adapter — the client no longer opens
// connections from DATABASE_URL by itself. PrismaPg wraps node-postgres.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })

export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
        adapter,
        // Query logging is dev-only: in production it's noise, a perf tax, and
        // leaks user data (WHERE params) into the platform logs.
        log: process.env.NODE_ENV === 'development' ? ['query'] : ['error'],
    })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
