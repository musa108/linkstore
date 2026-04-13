import { PrismaClient } from "@prisma/client";
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const prismaClientSingleton = () => {
    console.log("Initializing Prisma Client with URL:", process.env.DATABASE_URL?.replace(/:[^:]*@/, ":****@"));
    
    if (!process.env.DATABASE_URL) {
        return new PrismaClient();
    }

    let connectionString = process.env.DATABASE_URL;
    
    // Automatically upgrade sslmode=require to sslmode=verify-full to silence security warnings 
    // and maintain current security guarantees in future 'pg' driver versions.
    if (connectionString?.includes('sslmode=require')) {
        connectionString = connectionString.replace('sslmode=require', 'sslmode=verify-full');
    }

    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter } as any);
};

declare global {
    var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;
