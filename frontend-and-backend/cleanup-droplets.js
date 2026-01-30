const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function cleanupDroplets() {
  try {
    console.log('Cleaning up old droplets with invalid userId format...')
    
    // Delete all droplets that have userId starting with 'user_' (Clerk IDs)
    const result = await prisma.droplet.deleteMany({
      where: {
        userId: {
          startsWith: 'user_'
        }
      }
    })
    
    console.log(`Deleted ${result.count} old droplets`)
    console.log('Cleanup completed successfully!')
  } catch (error) {
    console.error('Error during cleanup:', error)
  } finally {
    await prisma.$disconnect()
  }
}

cleanupDroplets()
