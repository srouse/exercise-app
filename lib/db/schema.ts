import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  auth0Sub: text('auth0_sub').notNull().unique(),
  email: text('email'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const workoutSessions = pgTable('workout_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  status: text('status').notNull().default('active'), // 'active' | 'ended'
  startedAt: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
  endedAt: timestamp('ended_at', { withTimezone: true }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const exerciseRecords = pgTable('exercise_records', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionId: uuid('session_id')
    .notNull()
    .references(() => workoutSessions.id, { onDelete: 'cascade' }),
  label: text('label').notNull(),
  recordedAt: timestamp('recorded_at', { withTimezone: true }).defaultNow().notNull(),
})

export const restIntervals = pgTable('rest_intervals', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionId: uuid('session_id')
    .notNull()
    .references(() => workoutSessions.id, { onDelete: 'cascade' }),
  plannedDurationMs: integer('planned_duration_ms').notNull(),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull(),
  endedAt: timestamp('ended_at', { withTimezone: true }),
  outcome: text('outcome'), // 'completed' | 'cancelled'
})

// Relations for eager loading
export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(workoutSessions),
}))

export const workoutSessionsRelations = relations(workoutSessions, ({ one, many }) => ({
  user: one(users, { fields: [workoutSessions.userId], references: [users.id] }),
  exercises: many(exerciseRecords),
  rests: many(restIntervals),
}))

export const exerciseRecordsRelations = relations(exerciseRecords, ({ one }) => ({
  session: one(workoutSessions, { fields: [exerciseRecords.sessionId], references: [workoutSessions.id] }),
}))

export const restIntervalsRelations = relations(restIntervals, ({ one }) => ({
  session: one(workoutSessions, { fields: [restIntervals.sessionId], references: [workoutSessions.id] }),
}))
