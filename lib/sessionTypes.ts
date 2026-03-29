import type { InferSelectModel } from 'drizzle-orm'
import type { users, workoutSessions, exerciseRecords, restIntervals } from './db/schema'

export type User = InferSelectModel<typeof users>
export type WorkoutSession = InferSelectModel<typeof workoutSessions>
export type ExerciseRecord = InferSelectModel<typeof exerciseRecords>
export type RestInterval = InferSelectModel<typeof restIntervals>

export type SessionStatus = 'active' | 'ended'
export type RestOutcome = 'completed' | 'cancelled'

export type SessionWithChildren = WorkoutSession & {
  exercises: ExerciseRecord[]
  rests: RestInterval[]
}
