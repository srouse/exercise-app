import { auth0 } from '@/lib/auth0'
import { upsertUser } from '@/lib/db/queries/users'
import { getSession } from '@/lib/db/queries/sessions'
import { createRest } from '@/lib/db/queries/rests'

interface Params {
  params: Promise<{ id: string }>
}

export async function POST(req: Request, { params }: Params) {
  const { id } = await params
  const session = await auth0.getSession()
  if (!session) return Response.json({ error: 'unauthorized' }, { status: 401 })

  const user = await upsertUser(session.user.sub, session.user.email)
  const workout = await getSession(id, user.id)
  if (!workout) return Response.json({ error: 'not_found' }, { status: 404 })
  if (workout.status !== 'active') {
    return Response.json({ error: 'session_not_active' }, { status: 409 })
  }

  const body = await req.json()
  const plannedDurationMs: number = body.planned_duration_ms
  if (!plannedDurationMs || plannedDurationMs <= 0 || plannedDurationMs > 3_600_000) {
    return Response.json({ error: 'invalid_duration' }, { status: 400 })
  }

  const startedAt = body.started_at ? new Date(body.started_at) : undefined
  const rest = await createRest(id, plannedDurationMs, startedAt)
  return Response.json(rest, { status: 201 })
}
