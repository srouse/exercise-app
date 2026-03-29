import { auth0 } from '@/lib/auth0'
import { upsertUser } from '@/lib/db/queries/users'
import { getSession } from '@/lib/db/queries/sessions'
import { endRest } from '@/lib/db/queries/rests'
import type { RestOutcome } from '@/lib/sessionTypes'

interface Params {
  params: Promise<{ id: string; rid: string }>
}

export async function PATCH(req: Request, { params }: Params) {
  const { id, rid } = await params
  const session = await auth0.getSession()
  if (!session) return Response.json({ error: 'unauthorized' }, { status: 401 })

  const user = await upsertUser(session.user.sub, session.user.email)
  const workout = await getSession(id, user.id)
  if (!workout) return Response.json({ error: 'not_found' }, { status: 404 })

  const body = await req.json()
  const outcome: RestOutcome = body.outcome
  if (outcome !== 'completed' && outcome !== 'cancelled') {
    return Response.json({ error: 'invalid_outcome' }, { status: 400 })
  }

  const endedAt = body.ended_at ? new Date(body.ended_at) : undefined
  const updated = await endRest(rid, id, outcome, endedAt)
  if (!updated) return Response.json({ error: 'not_found' }, { status: 404 })

  return Response.json(updated)
}
