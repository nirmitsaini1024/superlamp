# Cronjob Setup

## Running the Cronjob Every 10 Seconds

Vercel Cron doesn't support intervals less than 1 minute. To run the cleanup every 10 seconds, you have two options:

### Option 1: Self-Hosted Script (Recommended for Development)

Run the Node.js script that calls the API every 10 seconds:

```bash
# Set the API URL (defaults to localhost:3000)
export CRON_URL=http://localhost:3000/api/cron/cleanup-droplets

# Run the cron script
npm run cron
```

Or use PM2 to keep it running:

```bash
pm2 start scripts/run-cron.js --name droplet-cleanup
pm2 save
pm2 startup
```

### Option 2: External Cron Service (Recommended for Production)

Use an external service like:
- **cron-job.org** (free): https://cron-job.org
- **EasyCron**: https://www.easycron.com
- **Cronitor**: https://cronitor.io

Configure it to call:
```
https://your-domain.com/api/cron/cleanup-droplets
```
Every 10 seconds (or as frequently as the service allows).

### Option 3: Vercel Cron (1 minute minimum)

The `vercel.json` is configured to run every minute. This is the minimum interval Vercel supports.

## Logging

All cronjob runs are logged with `[CRONJOB]` prefix. Check your server logs to see:
- When the cronjob runs
- How many expired droplets were found
- Which droplets were deleted
- Any errors that occurred

## Testing

You can manually trigger the cronjob by calling:
```bash
curl http://localhost:3000/api/cron/cleanup-droplets
```

Or visit the URL in your browser when running locally.

