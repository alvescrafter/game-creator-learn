const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Ensure database connection
prisma.$connect()
  .then(() => {
    console.log('Connected to PostgreSQL database.');
  })
  .catch((error) => {
    console.error('Error connecting to database:', error.message);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

module.exports = { prisma };