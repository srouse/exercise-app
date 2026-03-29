import { auth0 } from '@/lib/auth0'
import { upsertUser } from '@/lib/db/queries/users'
import { getSession } from '@/lib/db/queries/sessions'
import { createExercise } from '@/lib/db/queries/exercises'

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

  const body = await req.json()
  const label: string = body.label ?? ''
  if (!label || label.trim().length === 0) {
    return Response.json({ error: 'label_required' }, { status: 400 })
  }
  if (label.length > 200) {
    return Response.json({ error: 'label_too_long' }, { status: 400 })
  }

  const recordedAt = body.recorded_at ? new Date(body.recorded_at) : undefined
  const record = await createExercise(id, label.trim(), recordedAt)
  return Response.json(record, { status: 201 })
}
