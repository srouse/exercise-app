import { auth0 } from '@/lib/auth0'
import { upsertUser } from '@/lib/db/queries/users'
import { getSession, endSession } from '@/lib/db/queries/sessions'

interface Params {
  params: Promise<{ id: string }>
}

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params
  const session = await auth0.getSession()
  if (!session) return Response.json({ error: 'unauthorized' }, { status: 401 })

  const user = await upsertUser(session.user.sub, session.user.email)
  const workout = await getSession(id, user.id)
  if (!workout) return Response.json({ error: 'not_found' }, { status: 404 })

  return Response.json(workout)
}

export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params
  const session = await auth0.getSession()
  if (!session) return Response.json({ error: 'unauthorized' }, { status: 401 })

  const body = await req.json()
  if (body.status !== 'ended') {
    return Response.json({ error: 'invalid_status' }, { status: 400 })
  }

  const user = await upsertUser(session.user.sub, session.user.email)
  const updated = await endSession(id, user.id)
  if (!updated) return Response.json({ error: 'not_found' }, { status: 404 })

  return Response.json(updated)
}
