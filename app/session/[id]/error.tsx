'use client'

import Link from 'next/link'
import styles from './error.module.css'

export default function SessionError() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Session not found</h1>
      <p className={styles.body}>This session doesn&apos;t exist or you don&apos;t have access to it.</p>
      <Link href="/" className={styles.home}>← Back to Workouts</Link>
    </div>
  )
}
