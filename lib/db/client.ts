import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const connectionString = process.env.NETLIFY_DATABASE_URL!

// Disable prefetch for serverless (Neon pooled connections)
const sql = postgres(connectionString, { prepare: false })

export const db = drizzle(sql, { schema })
