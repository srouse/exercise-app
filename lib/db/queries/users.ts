import { db } from '../client'
import { users } from '../schema'
import type { User } from '../../sessionTypes'

export async function upsertUser(auth0Sub: string, email?: string): Promise<User> {
  const [user] = await db
    .insert(users)
    .values({ auth0Sub, email })
    .onConflictDoUpdate({
      target: users.auth0Sub,
      set: { email },
    })
    .returning()
  return user
}
