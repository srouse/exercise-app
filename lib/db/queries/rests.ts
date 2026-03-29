import { eq, and } from 'drizzle-orm'
import { db } from '../client'
import { restIntervals } from '../schema'
import type { RestInterval, RestOutcome } from '../../sessionTypes'

export async function createRest(
  sessionId: string,
  plannedDurationMs: number,
  startedAt?: Date,
): Promise<RestInterval> {
  const [rest] = await db
    .insert(restIntervals)
    .values({ sessionId, plannedDurationMs, startedAt: startedAt ?? new Date() })
    .returning()
  return rest
}

export async function endRest(
  id: string,
  sessionId: string,
  outcome: RestOutcome,
  endedAt?: Date,
): Promise<RestInterval | null> {
  const [updated] = await db
    .update(restIntervals)
    .set({ outcome, endedAt: endedAt ?? new Date() })
    .where(and(eq(restIntervals.id, id), eq(restIntervals.sessionId, sessionId)))
    .returning()
  return updated ?? null
}
