import { db } from '../client'
import { exerciseRecords } from '../schema'
import type { ExerciseRecord } from '../../sessionTypes'

export async function createExercise(
  sessionId: string,
  label: string,
  recordedAt?: Date,
): Promise<ExerciseRecord> {
  const [record] = await db
    .insert(exerciseRecords)
    .values({ sessionId, label, recordedAt: recordedAt ?? new Date() })
    .returning()
  return record
}
