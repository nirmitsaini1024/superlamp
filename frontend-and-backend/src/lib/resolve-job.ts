import { prisma } from '@/lib/prisma'

/**
 * Resolve job id (droplet ID or droplet name) to droplet and numeric dropletId.
 * Used by jobs config, logs POST (no auth), and logs stream (with userId for auth).
 */
export async function resolveJobToDropletId(
  jobId: string,
  options?: { userId?: string }
): Promise<{ dropletId: number; droplet: { userId: string } } | null> {
  const parsed = parseInt(jobId, 10)
  const byId = !Number.isNaN(parsed)

  let droplet: { dropletId: number; userId: string } | null = null

  if (byId) {
    droplet = await prisma.droplet.findUnique({
      where: { dropletId: parsed },
      select: { dropletId: true, userId: true },
    })
  }

  if (!droplet) {
    const found = await prisma.droplet.findFirst({
      where: {
        dropletName: jobId,
        ...(options?.userId ? { userId: options.userId } : {}),
      },
      select: { dropletId: true, userId: true },
    })
    droplet = found
  }

  if (droplet && options?.userId && droplet.userId !== options.userId) {
    return null
  }

  if (!droplet) return null
  return { dropletId: droplet.dropletId, droplet }
}
