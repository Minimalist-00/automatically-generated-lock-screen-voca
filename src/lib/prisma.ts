import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = 
  process.env.POSTGRES_PRISMA_URL || 
  process.env.VERCEL_DATABASE_URL || 
  process.env.POSTGRES_URL || 
  process.env.DATABASE_URL;

// Fix for pg-connection-string warning
const fixedConnectionString = connectionString?.replace('sslmode=require', 'sslmode=require&uselibpqcompat=true');

const prismaClientSingleton = () => {
  const pool = new Pool({ connectionString: fixedConnectionString });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = global as unknown as { prisma: PrismaClientSingleton };

export const prisma = globalForPrisma.prisma || prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
