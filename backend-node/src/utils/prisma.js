/**
 * Prisma Client Singleton
 * Prevents multiple instances in development
 */

const { normalizeEnvironment } = require('./env');
normalizeEnvironment();

const { PrismaClient } = require('@prisma/client');

const globalForPrisma = global;

const prisma = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

module.exports = prisma;
