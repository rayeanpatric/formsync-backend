// vercel-db-check.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Starting database connection check...');
  console.log(`Database URL format check: Starts with postgresql://: ${process.env.DATABASE_URL?.startsWith('postgresql://')}`);
  
  try {
    // Test connection by querying users
    const userCount = await prisma.user.count();
    console.log(`Connection successful! Found ${userCount} users in the database.`);
    return { success: true, message: 'Database connection successful', userCount };
  } catch (error) {
    console.error('Database connection failed:', error);
    return { success: false, error: error.message };
  } finally {
    await prisma.$disconnect();
  }
}

// This script can be run directly or imported as a module
if (require.main === module) {
  main()
    .then(result => {
      if (result.success) {
        console.log('✅ Database check completed successfully');
        process.exit(0);
      } else {
        console.error('❌ Database check failed');
        process.exit(1);
      }
    })
    .catch(e => {
      console.error('❌ Error during database check:', e);
      process.exit(1);
    });
} else {
  module.exports = main;
}
