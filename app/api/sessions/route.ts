import { auth0 } from '@/lib/auth0'
import { upsertUser } from '@/lib/db/queries/users'
import { listSessions, createSession } from '@/lib/db/queries/sessions'

export async function GET() {
  const session = await auth0.getSession()
  if (!session) return Response.json({ error: 'unauthorized' }, { status: 401 })

  const user = await upsertUser(session.user.sub, session.user.email)
  const sessions = await listSessions(user.id)
  return Response.json(sessions)
}

export async function POST() {
  const session = await auth0.getSession()
  if (!session) return Response.json({ error: 'unauthorized' }, { status: 401 })

  const user = await upsertUser(session.user.sub, session.user.email)

  try {
    const workout = await createSession(user.id)
    return Response.json(workout, { status: 201 })
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'active_session_exists') {
      const e = err as Error & { sessionId: string }
      return Response.json(
        { error: 'active_session_exists', sessionId: e.sessionId },
        { status: 409 },
      )
    }
    throw err
  }
}
