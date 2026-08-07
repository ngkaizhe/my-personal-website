import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
}

export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
        // Query logging is dev-only: in production it's noise, a perf tax, and
        // leaks user data (WHERE params) into the platform logs.
        log: process.env.NODE_ENV === 'development' ? ['query'] : ['error'],
    })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
