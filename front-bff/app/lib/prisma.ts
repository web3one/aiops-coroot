import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

function normalizeConnectionString(connectionString: string): string {
    const allowInvalidTlsCert = process.env.PG_SSL_REJECT_UNAUTHORIZED !== 'true';
    if (!allowInvalidTlsCert) return connectionString;

    try {
        const url = new URL(connectionString);
        if (url.searchParams.get('sslmode') === 'require') {
            // Internal dev DB currently has an expired cert; skip cert validation.
            url.searchParams.set('sslmode', 'no-verify');
        }
        return url.toString();
    } catch {
        return connectionString;
    }
}

function createPrismaClient(): PrismaClient {
    const rawConnectionString = process.env.DATABASE_URL;
    if (!rawConnectionString) {
        throw new Error('DATABASE_URL environment variable is not set');
    }
    const connectionString = normalizeConnectionString(rawConnectionString);
    console.log('Prisma connecting to:', connectionString.replace(/:[^:@]+@/, ':***@'));

    const pool = new Pool({
        connectionString,
        ssl: { rejectUnauthorized: false },
    });

    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter });
}

const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export { prisma };
