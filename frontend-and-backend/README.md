This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Environment Variables

This project requires a Python backend service and several environment variables to be configured.

### Required Environment Variables

#### For the Python Backend Service (Port 8000)
The Python backend service that handles droplet creation **must** have the `DIGITALOCEAN_API_TOKEN` environment variable set:

```bash
DIGITALOCEAN_API_TOKEN=your_digitalocean_api_token_here
```

**Important:** The error "Unable to authenticate you" means the Python backend doesn't have a valid `DIGITALOCEAN_API_TOKEN` set.

**To get a DigitalOcean API token:**
1. Go to https://cloud.digitalocean.com/account/api/tokens
2. Click "Generate New Token"
3. Give it a name and ensure it has **Read** and **Write** permissions
4. Copy the token (you'll only see it once)

**To set it for the Python backend:**
- **If running locally:** Set it in your Python backend's environment (`.env` file or export in terminal)
- **If deployed:** Set it in your deployment platform's environment variables for the Python backend service
- **Restart the Python backend** after setting the variable

#### For the Next.js Frontend
```bash
# Database
DATABASE_URL=your_mongodb_connection_string

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
CLERK_SECRET_KEY=your_clerk_secret

# Python Backend URL (optional, defaults to http://localhost:8000)
NEXT_PUBLIC_API_URL=http://localhost:8000

# DigitalOcean API Token (for Next.js API routes - optional if only using Python backend)
DIGITALOCEAN_API_TOKEN=your_digitalocean_api_token_here
```

Create a `.env.local` file in the root directory with these variables.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
