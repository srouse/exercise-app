import { redirect } from 'next/navigation'
import { auth0 } from '@/lib/auth0'
import { upsertUser } from '@/lib/db/queries/users'
import { listSessions } from '@/lib/db/queries/sessions'
import SessionList from '@/components/SessionList'

export default async function HomePage() {
  const session = await auth0.getSession()
  if (!session) redirect('/auth/login')

  const user = await upsertUser(session.user.sub, session.user.email)
  const sessions = await listSessions(user.id)

  return <SessionList sessions={sessions} />
}
