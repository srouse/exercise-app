import { eq, and, desc } from 'drizzle-orm'
import { db } from '../client'
import { workoutSessions, exerciseRecords, restIntervals } from '../schema'
import type { WorkoutSession, SessionWithChildren } from '../../sessionTypes'

export async function listSessions(userId: string): Promise<WorkoutSession[]> {
  return db
    .select()
    .from(workoutSessions)
    .where(eq(workoutSessions.userId, userId))
    .orderBy(desc(workoutSessions.startedAt))
}

export async function getSession(
  id: string,
  userId: string,
): Promise<SessionWithChildren | null> {
  const session = await db.query.workoutSessions.findFirst({
    where: and(eq(workoutSessions.id, id), eq(workoutSessions.userId, userId)),
    with: {
      exercises: { orderBy: exerciseRecords.recordedAt },
      rests: { orderBy: restIntervals.startedAt },
    },
  })
  return session ?? null
}

export async function createSession(userId: string): Promise<WorkoutSession> {
  // Enforce one active session per user
  const active = await db
    .select({ id: workoutSessions.id })
    .from(workoutSessions)
    .where(and(eq(workoutSessions.userId, userId), eq(workoutSessions.status, 'active')))
    .limit(1)

  if (active.length > 0) {
    const err = new Error('active_session_exists') as Error & { sessionId: string }
    err.sessionId = active[0].id
    throw err
  }

  const [session] = await db
    .insert(workoutSessions)
    .values({ userId, status: 'active' })
    .returning()
  return session
}

export async function endSession(id: string, userId: string): Promise<WorkoutSession | null> {
  const [updated] = await db
    .update(workoutSessions)
    .set({ status: 'ended', endedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(workoutSessions.id, id), eq(workoutSessions.userId, userId)))
    .returning()
  return updated ?? null
}
