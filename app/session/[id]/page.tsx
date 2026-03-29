import { notFound, redirect } from 'next/navigation'
import { auth0 } from '@/lib/auth0'
import { upsertUser } from '@/lib/db/queries/users'
import { getSession } from '@/lib/db/queries/sessions'
import SessionDetail from '@/components/SessionDetail'
import SessionView from '@/components/SessionView'

interface Props {
  params: Promise<{ id: string }>
}

export default async function SessionPage({ params }: Props) {
  const { id } = await params
  const authSession = await auth0.getSession()
  if (!authSession) redirect('/auth/login')

  const user = await upsertUser(authSession.user.sub, authSession.user.email)
  const workout = await getSession(id, user.id)

  if (!workout) notFound()

  if (workout.status === 'active') {
    return <SessionView session={workout} />
  }

  return <SessionDetail session={workout} />
}
