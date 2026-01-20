const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient({
    log: ['error', 'warn'],
});

// Handle shutdown
process.on('beforeExit', async () => {
    await prisma.$disconnect();
    logger.info('Prisma client disconnected');
});

module.exports = prisma;
