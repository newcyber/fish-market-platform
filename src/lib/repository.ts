import { prisma } from "@/lib/prisma";

/**
 * Shared Prisma Client.
 *
 * Seluruh Repository WAJIB menggunakan instance ini.
 * Jangan membuat PrismaClient baru.
 */
export const db = prisma;