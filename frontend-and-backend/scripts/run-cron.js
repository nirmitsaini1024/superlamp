/**
 * Self-hosted cronjob script that runs every 10 seconds
 * Run this with: node scripts/run-cron.js
 * Or use PM2: pm2 start scripts/run-cron.js --name droplet-cleanup
 */

const CRON_URL = process.env.CRON_URL || 'http://localhost:3000/api/cron/cleanup-droplets';
const INTERVAL_SECONDS = 10;

console.log(`Starting cronjob service`);
console.log(`URL: ${CRON_URL}`);
console.log(`Interval: ${INTERVAL_SECONDS} seconds`);
console.log(`Press Ctrl+C to stop\n`);

async function runCleanup() {
  const timestamp = new Date().toISOString();
  try {
    console.log(`[${timestamp}] Running cleanup...`);
    const response = await fetch(CRON_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log(`[${timestamp}] ✓ ${data.message || 'Success'}`);
      if (data.deleted > 0) {
        console.log(`[${timestamp}]   Deleted: ${data.deleted} droplet(s)`);
      }
    } else {
      console.error(`[${timestamp}] ✗ Error: ${data.error || 'Unknown error'}`);
      if (data.details) {
        console.error(`[${timestamp}]   Details: ${data.details}`);
      }
    }
  } catch (error) {
    console.error(`[${timestamp}] ✗ Failed to run cleanup:`, error.message);
  }
}

// Run immediately on start
runCleanup();

// Then run every 10 seconds
setInterval(runCleanup, INTERVAL_SECONDS * 1000);

